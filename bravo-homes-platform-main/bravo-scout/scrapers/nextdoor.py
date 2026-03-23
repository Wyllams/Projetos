"""
scrapers/nextdoor.py — Scraper de Nextdoor (via Google Index)

Nextdoor não tem API pública e bloqueia scrapers diretos.
Estratégia: buscar posts indexados pelo Google com site:nextdoor.com
para encontrar pessoas pedindo recomendações de contractors em Atlanta.
"""

import httpx
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import uuid
import re


# Buscas que captam posts de Nextdoor indexados pelo Google
NEXTDOOR_SEARCHES = [
    {
        "query": 'site:nextdoor.com "Atlanta" "contractor" OR "remodel" OR "renovation"',
        "name": "Nextdoor - Contractor ATL",
    },
    {
        "query": 'site:nextdoor.com "Marietta" "bathroom" OR "kitchen" OR "remodel"',
        "name": "Nextdoor - Remodel Marietta",
    },
    {
        "query": 'site:nextdoor.com "Atlanta" "recommend" "contractor" OR "handyman"',
        "name": "Nextdoor - Recommend Contractor",
    },
    {
        "query": 'site:nextdoor.com "Alpharetta" OR "Roswell" "remodel" OR "renovation"',
        "name": "Nextdoor - North Atlanta",
    },
    {
        "query": 'site:nextdoor.com "Atlanta" "deck" OR "patio" OR "flooring"',
        "name": "Nextdoor - Deck/Patio ATL",
    },
    {
        "query": 'site:nextdoor.com "Kennesaw" OR "Smyrna" "contractor" OR "remodel"',
        "name": "Nextdoor - West Atlanta",
    },
    {
        "query": 'site:nextdoor.com "Atlanta" "need help" OR "looking for" "home"',
        "name": "Nextdoor - Need Help ATL",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


async def scrape_nextdoor() -> list[dict]:
    """
    Busca posts de Nextdoor indexados pelo Google.
    Pega recomendações de contractors e pedidos de serviço em Atlanta.
    """
    leads = []

    async with httpx.AsyncClient(timeout=20.0, headers=HEADERS, follow_redirects=True) as client:
        for search in NEXTDOOR_SEARCHES:
            try:
                # Google search for Nextdoor posts
                url = "https://www.google.com/search"
                params = {
                    "q": search["query"],
                    "tbs": "qdr:w",  # Last week
                    "hl": "en",
                    "num": 15,
                }
                
                response = await client.get(url, params=params)
                
                if response.status_code != 200:
                    print(f"⚠️ Nextdoor {search['name']}: HTTP {response.status_code}")
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                
                # Find Google search results
                results = soup.find_all("div", class_="g") or soup.find_all("div", {"data-sokoban-container": True})
                
                count = 0
                for result in results[:10]:
                    # Get title
                    title_elem = result.find("h3")
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)
                    
                    # Get snippet
                    snippet_elem = result.find("span", class_="st") or \
                                   result.find("div", class_="VwiC3b") or \
                                   result.find("div", {"data-sncf": True})
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                    
                    # Get URL
                    link_elem = result.find("a", href=True)
                    url_text = link_elem["href"] if link_elem else ""
                    
                    # Only process nextdoor.com results
                    if "nextdoor.com" not in url_text.lower() and "nextdoor" not in title.lower():
                        continue
                    
                    full_text = f"{title} {snippet}".strip()
                    if len(full_text) < 20:
                        continue

                    lead = {
                        "lead_id": str(uuid.uuid4()),
                        "fonte": "nextdoor",
                        "grupo_ou_pagina": search["name"],
                        "texto_original": full_text[:500],
                        "nome_autor": "Nextdoor User",
                        "post_url": url_text,
                        "data_post": datetime.now().isoformat(),
                        "timestamp_captura": datetime.now().isoformat(),
                    }
                    leads.append(lead)
                    count += 1

                print(f"✅ Nextdoor {search['name']}: {count} posts encontrados")

            except Exception as e:
                print(f"❌ Erro Nextdoor {search['name']}: {e}")

    return leads
