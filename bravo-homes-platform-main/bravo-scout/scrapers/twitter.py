"""
scrapers/twitter.py — Scraper de Twitter/X

Monitora tweets de pessoas em Atlanta procurando serviços de
home remodeling. Usa instâncias Nitter (proxy público do Twitter)
para buscar sem API key.
"""

import httpx
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import uuid


# Buscas no Twitter sobre home remodeling em Atlanta
TWITTER_SEARCHES = [
    {
        "query": "need bathroom remodel Atlanta",
        "name": "Twitter - Bathroom Remodel ATL",
    },
    {
        "query": "looking for contractor Atlanta GA",
        "name": "Twitter - Contractor ATL",
    },
    {
        "query": "kitchen renovation Atlanta",
        "name": "Twitter - Kitchen Renovation ATL",
    },
    {
        "query": "need deck built Atlanta",
        "name": "Twitter - Deck Builder ATL",
    },
    {
        "query": "home remodel Marietta Georgia",
        "name": "Twitter - Remodel Marietta",
    },
    {
        "query": "recommend contractor Atlanta",
        "name": "Twitter - Recommend Contractor ATL",
    },
    {
        "query": "who does bathroom remodel near Atlanta",
        "name": "Twitter - Who Does Remodel ATL",
    },
    {
        "query": "fixer upper Atlanta GA contractor",
        "name": "Twitter - Fixer Upper ATL",
    },
]

# Nitter instances (public Twitter frontends — rotate if one goes down)
NITTER_INSTANCES = [
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.woodland.cafe",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


async def _try_nitter_search(client: httpx.AsyncClient, query: str, instance: str) -> list[dict]:
    """Try to search on a specific Nitter instance"""
    results = []
    try:
        url = f"{instance}/search"
        params = {"f": "tweets", "q": query}
        
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        tweets = soup.find_all("div", class_="timeline-item") or soup.find_all("div", class_="tweet-body")

        for tweet in tweets[:10]:
            # Get tweet text
            content_elem = tweet.find("div", class_="tweet-content") or tweet.find("p")
            if not content_elem:
                continue
            
            text = content_elem.get_text(strip=True)
            if len(text) < 15:
                continue

            # Get author
            author_elem = tweet.find("a", class_="username") or tweet.find("a", class_="fullname")
            author = author_elem.get_text(strip=True) if author_elem else "Unknown"

            # Get date
            date_elem = tweet.find("span", class_="tweet-date") or tweet.find("time")
            date_str = date_elem.get("title", "") if date_elem else ""

            # Get tweet link
            link_elem = tweet.find("a", class_="tweet-link") or tweet.find("a", href=lambda h: h and "/status/" in str(h))
            tweet_url = f"{instance}{link_elem['href']}" if link_elem and link_elem.get('href') else ""

            results.append({
                "text": text[:400],
                "author": author.replace("@", ""),
                "date": date_str,
                "url": tweet_url.replace(instance, "https://twitter.com") if tweet_url else "",
            })

    except Exception:
        pass
    
    return results


async def scrape_twitter() -> list[dict]:
    """
    Busca tweets recentes sobre home remodeling em Atlanta.
    Usa instâncias Nitter como proxy público do Twitter.
    """
    leads = []

    async with httpx.AsyncClient(timeout=20.0, headers=HEADERS, follow_redirects=True) as client:
        # Find a working Nitter instance
        working_instance = None
        for instance in NITTER_INSTANCES:
            try:
                resp = await client.get(f"{instance}/", timeout=5.0)
                if resp.status_code == 200:
                    working_instance = instance
                    print(f"✅ Nitter instance ativa: {instance}")
                    break
            except Exception:
                continue
        
        if not working_instance:
            # Fallback: use syndication.twitter.com (public embed API)
            print("⚠️ Nenhuma instância Nitter disponível. Usando fallback...")
            for search in TWITTER_SEARCHES:
                try:
                    # Twitter syndication search (limited but works without auth)
                    url = "https://syndication.twitter.com/srv/timeline-profile/screen-name/search"
                    params = {"q": search["query"]}
                    response = await client.get(url, params=params)
                    
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, "html.parser")
                        texts = soup.find_all("p", class_="timeline-Tweet-text")
                        
                        for t in texts[:5]:
                            lead = {
                                "lead_id": str(uuid.uuid4()),
                                "fonte": "twitter",
                                "grupo_ou_pagina": search["name"],
                                "texto_original": t.get_text(strip=True)[:400],
                                "nome_autor": "Unknown",
                                "post_url": "",
                                "data_post": datetime.now().isoformat(),
                                "timestamp_captura": datetime.now().isoformat(),
                            }
                            leads.append(lead)
                except Exception as e:
                    print(f"❌ Erro Twitter fallback {search['name']}: {e}")
            return leads

        # Use working Nitter instance
        for search in TWITTER_SEARCHES:
            try:
                results = await _try_nitter_search(client, search["query"], working_instance)
                
                for r in results:
                    lead = {
                        "lead_id": str(uuid.uuid4()),
                        "fonte": "twitter",
                        "grupo_ou_pagina": search["name"],
                        "texto_original": r["text"],
                        "nome_autor": r["author"],
                        "post_url": r["url"],
                        "data_post": r["date"] or datetime.now().isoformat(),
                        "timestamp_captura": datetime.now().isoformat(),
                    }
                    leads.append(lead)

                print(f"✅ Twitter {search['name']}: {len(results)} tweets encontrados")

            except Exception as e:
                print(f"❌ Erro Twitter {search['name']}: {e}")

    return leads
