"""
Live E2E verification for Dhaba:
1. Check brand-aware config endpoint (cafe vs dhaba independent)
2. Toggle Dhaba OFF → verify → toggle ON → verify
3. Confirm Cafe flag is unaffected
"""
import sys
import json
import urllib.request
import urllib.error
import uuid
import hmac
import hashlib
import time

MONGO_URL = "mongodb+srv://lee-vaakki-app:vasi%401300@leevaakki-prod.z8qast3.mongodb.net/?appName=leevaakki-prod"
DB_NAME = "lee_vaakki_dhaba"
API = "https://leevaakki-dhaba-live-pf3j.vercel.app/api"

def get(path):
    req = urllib.request.Request(f"{API}{path}", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def post(path, body, token=None):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def get_admin_token():
    from pymongo import MongoClient
    import jwt, datetime
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=8000)
    db = client[DB_NAME]
    user = db.users.find_one({"email": "vaakkicafe@gmail.com"})
    if not user:
        raise RuntimeError("Admin user not found")
    secret = db.config.find_one({"key": "jwt_secret"})
    if not secret:
        raise RuntimeError("JWT secret not found in DB")
    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "is_admin": True,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    return jwt.encode(payload, secret["value"], algorithm="HS256")

print("=" * 55)
print("  Dhaba Live E2E Verification")
print("=" * 55)

# Step 1: Get admin token
print("\n[1] Getting admin JWT from Atlas...")
token = get_admin_token()
print("    OK - token generated")

# Step 2: Check initial Dhaba status
print("\n[2] GET /api/config/online-ordering?brand=dhaba")
r = get("/config/online-ordering?brand=dhaba")
dhaba_initial = r["onlineOrderingOpen"]
print(f"    Dhaba onlineOrderingOpen = {dhaba_initial}")

# Step 3: Check Cafe status (should be independent)
print("\n[3] GET /api/config/online-ordering?brand=cafe")
r = get("/config/online-ordering?brand=cafe")
cafe_status = r["onlineOrderingOpen"]
print(f"    Cafe  onlineOrderingOpen = {cafe_status}")

# Step 4: Toggle Dhaba OFF
print("\n[4] POST /api/admin/online-ordering  {open: false, brand: dhaba}")
r = post("/admin/online-ordering", {"open": False, "brand": "dhaba"}, token)
assert r["onlineOrderingOpen"] == False, f"Expected False, got {r}"
assert r.get("brand") == "dhaba", f"Expected brand=dhaba, got {r}"
print(f"    Dhaba toggled OFF - brand={r['brand']}")

# Step 5: Verify Dhaba is OFF
print("\n[5] Verify Dhaba is OFF")
r = get("/config/online-ordering?brand=dhaba")
assert r["onlineOrderingOpen"] == False
print(f"    Dhaba onlineOrderingOpen = {r['onlineOrderingOpen']}  OK")

# Step 6: Verify Cafe is UNCHANGED
print("\n[6] Verify Cafe is UNCHANGED")
r = get("/config/online-ordering?brand=cafe")
assert r["onlineOrderingOpen"] == cafe_status, f"Cafe status changed! Expected {cafe_status}, got {r['onlineOrderingOpen']}"
print(f"    Cafe  onlineOrderingOpen = {r['onlineOrderingOpen']}  OK (unchanged)")

# Step 7: Toggle Dhaba back ON
print("\n[7] POST /api/admin/online-ordering  {open: true, brand: dhaba}")
r = post("/admin/online-ordering", {"open": True, "brand": "dhaba"}, token)
assert r["onlineOrderingOpen"] == True
print(f"    Dhaba toggled ON - brand={r['brand']}")

# Step 8: Final verify
print("\n[8] Final verification")
r = get("/config/online-ordering?brand=dhaba")
assert r["onlineOrderingOpen"] == True
print(f"    Dhaba onlineOrderingOpen = {r['onlineOrderingOpen']}  OK")

print("\n" + "=" * 55)
print("  ALL STEPS PASSED - Dhaba E2E verified!")
print("=" * 55)
