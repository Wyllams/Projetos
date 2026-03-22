"""Quick check: fetch all leads columns"""
import httpx, os, json
from dotenv import load_dotenv
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
headers = {"apikey": key, "Authorization": f"Bearer {key}"}

# Get all leads to see columns
r = httpx.get(f"{url}/rest/v1/leads?limit=1&select=*", headers=headers)
print(f"Status: {r.status_code}")
data = r.json()
if data:
    print("Columns:", list(data[0].keys()))
else:
    # Try inserting with minimal
    print("No leads found. Trying minimal insert...")
    r2 = httpx.post(f"{url}/rest/v1/leads", json={"service": "test"}, headers={**headers, "Prefer": "return=representation", "Content-Type": "application/json"})
    print(f"Insert status: {r2.status_code}")
    print(f"Insert response: {r2.text[:500]}")
