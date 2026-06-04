import sys
from pymongo import MongoClient

MONGO_URL = "mongodb+srv://lee-vaakki-app:vasi%401300@leevaakki-prod.z8qast3.mongodb.net/?appName=leevaakki-prod"
DB_NAME = "lee_vaakki_dhaba"

def grant_admin(email: str):
    print("Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=8000)
    db = client[DB_NAME]

    user = db.users.find_one({"email": email})
    if user:
        db.users.update_one({"email": email}, {"$set": {"is_admin": True}})
        updated = db.users.find_one({"email": email})
        print("SUCCESS: {} is_admin = {}".format(email, updated.get("is_admin")))
    else:
        import uuid
        from datetime import datetime, timezone
        new_user = {
            "id": str(uuid.uuid4()),
            "name": email.split("@")[0],
            "email": email,
            "phone": "",
            "is_admin": True,
            "addresses": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db.users.insert_one(new_user)
        print("SUCCESS: Created new admin user for {}".format(email))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python grant_admin.py <email>")
        sys.exit(1)
    grant_admin(sys.argv[1].strip())
