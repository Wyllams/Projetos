"""
scrapers/facebook_groups.py — Scraper de Grupos Públicos do Facebook

Monitora grupos públicos de Atlanta/GA buscando posts sobre
home remodeling, renovação, contractors, etc.
Usa a Graph API pública (posts públicos de grupos abertos).
"""

import httpx
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import uuid


# Grupos públicos de Atlanta focados em home improvement
# Usamos busca via mobile site (mbasic) para grupos públicos
FACEBOOK_SEARCHES = [
    {
        "query": "bathroom remodel Atlanta",
        "name": "FB Search - Bathroom Remodel Atlanta",
    },
    {
        "query": "kitchen remodel Atlanta GA",
        "name": "FB Search - Kitchen Remodel Atlanta",
    },
    {
        "query": "home renovation contractor Atlanta",
        "name": "FB Search - Home Renovation Atlanta",
    },
    {
        "query": "deck repair Atlanta Georgia",
        "name": "FB Search - Deck Repair Atlanta",
    },
    {
        "query": "need contractor Marietta GA",
        "name": "FB Search - Contractor Marietta",
    },
    {
        "query": "home remodel Alpharetta Roswell",
        "name": "FB Search - Remodel North Atlanta",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


async def scrape_facebook_groups() -> list[dict]:
    """
    Busca posts públicos do Facebook sobre home remodeling em Atlanta.
    Usa busca pública do Facebook (sem login necessário para posts públicos).
    """
    leads = []

    async with httpx.AsyncClient(timeout=20.0, headers=HEADERS, follow_redirects=True) as client:
        for search in FACEBOOK_SEARCHES:
            try:
                # Busca pública via mbasic.facebook.com
                url = "https://mbasic.facebook.com/search/posts/"
                params = {"q": search["query"], "filters": "eyJyZWNlbnRfcG9zdHM6MCI6IntcIm5hbWVcIjpcInJlY2VudF9wb3N0c1wiLFwiYXJnc1wiOlwiXCJ9In0="}
                
                response = await client.get(url, params=params)
                
                if response.status_code != 200:
                    print(f"⚠️ Facebook {search['name']}: HTTP {response.status_code}")
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                
                # Parse posts from search results
                articles = soup.find_all("div", {"role": "article"}) or soup.find_all("div", class_="story_body_container")
                
                if not articles:
                    # Fallback: try finding any post-like content
                    articles = soup.find_all("div", {"data-ft": True})

                count = 0
                for article in articles[:15]:  # Limit 15 per search
                    text_elem = article.find("p") or article.find("div", class_="")
                    if not text_elem:
                        continue
                    
                    text = text_elem.get_text(strip=True)
                    if len(text) < 20:
                        continue
                    
                    # Try to find the author
                    author_elem = article.find("strong") or article.find("h3")
                    author = author_elem.get_text(strip=True) if author_elem else "Unknown"
                    
                    # Try to find the link
                    link_elem = article.find("a", href=True)
                    post_url = f"https://facebook.com{link_elem['href']}" if link_elem else ""

                    lead = {
                        "lead_id": str(uuid.uuid4()),
                        "fonte": "facebook_groups",
                        "grupo_ou_pagina": search["name"],
                        "texto_original": text[:500],
                        "nome_autor": author,
                        "post_url": post_url,
                        "data_post": datetime.now().isoformat(),
                        "timestamp_captura": datetime.now().isoformat(),
                    }
                    leads.append(lead)
                    count += 1

                print(f"✅ Facebook {search['name']}: {count} posts encontrados")

            except Exception as e:
                print(f"❌ Erro Facebook {search['name']}: {e}")

    return leads
