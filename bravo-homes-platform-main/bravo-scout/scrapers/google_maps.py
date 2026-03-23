"""
scrapers/google_maps.py — Scraper de Reviews do Google Maps

Monitora reviews de concorrentes (empresas de remodeling em Atlanta).
Estratégia: encontrar clientes insatisfeitos (1-3 estrelas) que podem
precisar de outro contractor para resolver o problema.
"""

import httpx
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import uuid
import json
import re


# Concorrentes de remodeling em Atlanta Metro para monitorar reviews
COMPETITORS = [
    {"query": "bathroom remodeling Atlanta GA", "name": "Bathroom Remodelers ATL"},
    {"query": "kitchen remodeling Marietta GA", "name": "Kitchen Remodelers Marietta"},
    {"query": "home renovation Atlanta GA", "name": "Home Renovators ATL"},
    {"query": "deck builder Atlanta GA", "name": "Deck Builders ATL"},
    {"query": "general contractor Alpharetta GA", "name": "Contractors Alpharetta"},
    {"query": "home remodeling Roswell GA", "name": "Remodelers Roswell"},
    {"query": "flooring contractor Atlanta GA", "name": "Flooring ATL"},
    {"query": "painting contractor Atlanta GA", "name": "Painters ATL"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

# Keywords that indicate a dissatisfied customer who might need a new contractor
NEGATIVE_KEYWORDS = [
    "terrible", "worst", "never again", "rip off", "scam", "horrible",
    "unfinished", "abandoned", "didn't finish", "didn't show", "ghosted",
    "poor quality", "overcharged", "damaged", "ruined", "incompetent",
    "still waiting", "never completed", "looking for another", "need new",
    "recommend someone else", "don't use", "avoid", "unprofessional",
    "sloppy", "took forever", "way too long", "still broken", "made it worse",
]


async def scrape_google_maps() -> list[dict]:
    """
    Busca reviews negativos de empresas de remodeling no Google Maps.
    Encontra clientes insatisfeitos que podem precisar de outro contractor.
    """
    leads = []

    async with httpx.AsyncClient(timeout=20.0, headers=HEADERS, follow_redirects=True) as client:
        for competitor in COMPETITORS:
            try:
                # Search Google Maps via web search
                search_url = "https://www.google.com/search"
                params = {
                    "q": f"{competitor['query']} reviews",
                    "tbm": "lcl",  # Local search
                    "hl": "en",
                }
                
                response = await client.get(search_url, params=params)
                
                if response.status_code != 200:
                    print(f"⚠️ Google Maps {competitor['name']}: HTTP {response.status_code}")
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                
                # Find review snippets in search results
                review_elements = soup.find_all("span", class_="review-snippet") or \
                                  soup.find_all("div", {"data-review-id": True}) or \
                                  soup.find_all("span", string=re.compile(r"(terrible|worst|horrible|poor|bad|awful)", re.I))
                
                # Also search for review text in general
                all_text_blocks = soup.find_all(["span", "div"])
                
                count = 0
                for elem in all_text_blocks:
                    text = elem.get_text(strip=True)
                    if len(text) < 30 or len(text) > 500:
                        continue
                    
                    # Check if this looks like a negative review
                    text_lower = text.lower()
                    has_negative = any(kw in text_lower for kw in NEGATIVE_KEYWORDS)
                    has_remodel = any(kw in text_lower for kw in [
                        "remodel", "renovation", "contractor", "kitchen", "bathroom",
                        "deck", "floor", "paint", "repair", "install", "build"
                    ])
                    
                    if has_negative and has_remodel:
                        lead = {
                            "lead_id": str(uuid.uuid4()),
                            "fonte": "google_maps_reviews",
                            "grupo_ou_pagina": competitor["name"],
                            "texto_original": f"[Negative Review] {text[:400]}",
                            "nome_autor": "Unknown (Google Reviewer)",
                            "post_url": f"https://google.com/search?q={competitor['query'].replace(' ', '+')}+reviews",
                            "data_post": datetime.now().isoformat(),
                            "timestamp_captura": datetime.now().isoformat(),
                            "tipo": "review_negativo_concorrente",
                        }
                        leads.append(lead)
                        count += 1
                        if count >= 5:  # Max 5 per competitor
                            break

                print(f"✅ Google Maps {competitor['name']}: {count} reviews negativos encontrados")

            except Exception as e:
                print(f"❌ Erro Google Maps {competitor['name']}: {e}")

    return leads
