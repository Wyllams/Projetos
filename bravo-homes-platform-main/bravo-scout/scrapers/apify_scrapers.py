"""
scrapers/apify_scrapers.py — Scrapers via Apify Platform

Usa a plataforma Apify para rodar scrapers reais com IPs residenciais.
Abordagem assíncrona: dispara os actors e busca resultados depois.

Actors usados:
- Google Maps: compass/crawler-google-places (1 busca, 2 places, 3 reviews)

Requer: APIFY_API_TOKEN no .env
"""

import httpx
import os
import uuid
from datetime import datetime
import asyncio
import json


APIFY_TOKEN = os.getenv("APIFY_API_TOKEN", "")
APIFY_BASE = "https://api.apify.com/v2"


# Keywords negativos para detectar clientes insatisfeitos
NEGATIVE_KEYWORDS = [
    "terrible", "worst", "never again", "rip off", "scam", "horrible",
    "unfinished", "abandoned", "didn't finish", "didn't show", "ghosted",
    "poor quality", "overcharged", "damaged", "ruined", "incompetent",
    "still waiting", "never completed", "don't use", "avoid",
    "unprofessional", "sloppy", "took forever", "nightmare",
    "disappointed", "regret", "warning", "beware", "stay away",
]


async def _run_actor_async(actor_id: str, run_input: dict, max_wait: int = 180) -> list[dict]:
    """
    Roda um Actor da Apify: inicia, aguarda conclusão, busca resultados.
    max_wait: tempo máximo de espera em segundos.
    """
    if not APIFY_TOKEN:
        print(f"  ⚠️ Apify: APIFY_API_TOKEN não configurado")
        return []

    headers = {
        "Authorization": f"Bearer {APIFY_TOKEN}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
        # 1. Iniciar o actor
        start_url = f"{APIFY_BASE}/acts/{actor_id}/runs"
        try:
            start_resp = await client.post(start_url, json=run_input)
            if start_resp.status_code not in (200, 201):
                print(f"  ❌ Apify start {actor_id}: HTTP {start_resp.status_code}")
                print(f"     {start_resp.text[:200]}")
                return []
            
            run_data = start_resp.json().get("data", {})
            run_id = run_data.get("id", "")
            dataset_id = run_data.get("defaultDatasetId", "")
            
            if not run_id:
                print(f"  ❌ Apify: No run ID returned")
                return []
            
            print(f"  🚀 Apify {actor_id}: Run {run_id} iniciado")

        except Exception as e:
            print(f"  ❌ Apify start error: {type(e).__name__}: {e}")
            return []

        # 2. Aguardar conclusão (polling)
        poll_url = f"{APIFY_BASE}/actor-runs/{run_id}"
        elapsed = 0
        poll_interval = 5

        while elapsed < max_wait:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

            try:
                poll_resp = await client.get(poll_url)
                if poll_resp.status_code != 200:
                    continue
                
                status = poll_resp.json().get("data", {}).get("status", "")
                
                if status == "SUCCEEDED":
                    print(f"  ✅ Apify {actor_id}: Concluído em {elapsed}s")
                    break
                elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
                    print(f"  ❌ Apify {actor_id}: Status = {status}")
                    return []
                else:
                    if elapsed % 15 == 0:
                        print(f"  ⏳ Apify {actor_id}: Status = {status} ({elapsed}s)")

            except Exception:
                continue
        else:
            print(f"  ⚠️ Apify {actor_id}: Timeout após {max_wait}s")
            return []

        # 3. Buscar resultados do dataset
        if not dataset_id:
            return []

        items_url = f"{APIFY_BASE}/datasets/{dataset_id}/items?format=json"
        try:
            items_resp = await client.get(items_url)
            if items_resp.status_code == 200:
                data = items_resp.json()
                if isinstance(data, list):
                    return data
        except Exception as e:
            print(f"  ❌ Apify fetch items: {type(e).__name__}: {e}")

    return []


# ============================================================
# GOOGLE MAPS REVIEWS — Reviews negativas de concorrentes
# ============================================================
async def scrape_google_maps_apify() -> list[dict]:
    """
    Busca reviews negativas de concorrentes de remodeling em Atlanta.
    Roda 1 busca de cada vez para economizar créditos.
    """
    leads = []

    # Rodar apenas 1 busca por scan para economizar créditos ($5 free)
    search_terms = [
        "bathroom remodeling Atlanta GA",
        "kitchen remodeling Atlanta GA",
        "home renovation Atlanta GA",
        "general contractor Atlanta GA",
    ]

    # Rotacionar: usar o scan number para selecionar o termo
    # Isso distribui os créditos ao longo do tempo
    scan_index = int(datetime.now().timestamp()) % len(search_terms)
    current_term = search_terms[scan_index]

    run_input = {
        "searchStringsArray": [current_term],
        "maxPlacesPerSearch": 2,
        "maxReviews": 3,
        "reviewsSort": "newest",
        "language": "en",
        "scrapeReviewerName": True,
        "scrapeReviewerUrl": False,
        "scrapeResponseFromOwnerText": False,
    }

    print(f"  🔍 Google Maps Apify: '{current_term}' (rotate index {scan_index})")
    items = await _run_actor_async("compass/crawler-google-places", run_input, max_wait=180)

    for place in items:
        place_name = place.get("title", "Unknown Business")
        reviews = place.get("reviews", [])
        place_url = place.get("url", "")

        for review in reviews:
            rating = review.get("stars", 5)
            text = review.get("text", "") or review.get("reviewBody", "")
            reviewer = review.get("name", "") or review.get("reviewerName", "Unknown")

            if rating > 3 or len(str(text)) < 20:
                continue

            text_lower = str(text).lower()
            has_negative = any(kw in text_lower for kw in NEGATIVE_KEYWORDS)

            lead = {
                "lead_id": str(uuid.uuid4()),
                "fonte": "google_maps_reviews",
                "grupo_ou_pagina": f"Google Maps: {place_name}",
                "texto_original": f"[{rating}★] {str(text)[:400]}",
                "nome_autor": str(reviewer).split()[0] if reviewer else "Unknown",
                "post_url": place_url,
                "data_post": review.get("publishedAtDate", datetime.now().isoformat()),
                "tipo": "review_negativo_concorrente",
                "rating": rating,
                "score": 9 if has_negative else 6,
                "timestamp_captura": datetime.now().isoformat(),
            }
            leads.append(lead)

    print(f"  📦 Google Maps: {len(leads)} reviews negativas de {len(items)} places")
    return leads
