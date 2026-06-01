import urllib.request
import urllib.error

urls = [
    "https://api.leevaakkidhaba.com/api/health",
    "https://api.leevaakkidhaba.com/health",
    "https://backend.leevaakkidhaba.com/api/health",
    "https://backend.leevaakkidhaba.com/health"
]

print("Checking potential api domains...")
for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            print(f"URL: {url}")
            print(f"STATUS: {response.getcode()}")
            print(f"RESPONSE: {response.read().decode('utf-8')[:200]}")
    except urllib.error.HTTPError as e:
        print(f"URL: {url}")
        print(f"HTTP ERROR STATUS: {e.code}")
    except Exception as e:
        print(f"URL: {url}")
        print(f"GENERAL ERROR: {e}")
    print("-" * 40)
