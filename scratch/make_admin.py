import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def make_admin(email, brand, role):
    # Try loading from .env
    from dotenv import load_dotenv
    from pathlib import Path
    
    # Load backend/.env if it exists
    dotenv_path = Path(__file__).parent.parent / 'backend' / '.env'
    load_dotenv(dotenv_path)
    
    # Get configuration from env
    url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "lee_vaakki_dhaba")
    
    if not url:
        print("Error: MONGO_URL not found in environment or backend/.env file.")
        print("Please pull the env variables using 'vercel env pull' or run it with MONGO_URL env set.")
        sys.exit(1)
        
    print(f"Connecting to database '{db_name}'...")
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    # Find user
    user = await db.users.find_one({"email": email})
    if user:
        result = await db.users.update_one(
            {"email": email},
            {"$set": {f"roles.{brand}": role}}
        )
        print(f"Success: User {email} updated (roles.{brand}: {role})!")
    else:
        print(f"User with email '{email}' does not exist in collection yet.")
        print(f"Creating a new user record for '{email}' with {brand} role '{role}'...")
        import uuid
        from datetime import datetime, timezone
        new_user = {
            "id": str(uuid.uuid4()),
            "name": email.split("@")[0],
            "email": email,
            "phone": "",
            "is_admin": False,
            "roles": {brand: role},
            "addresses": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        print(f"Success: Created new admin user document for {email}!")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python make_admin.py <email> <brand> <role>")
        print("Example: python make_admin.py admin@leevaakki.com cafe admin")
        sys.exit(1)
    email = sys.argv[1].strip()
    brand = sys.argv[2].strip()
    role = sys.argv[3].strip()
    asyncio.run(make_admin(email, brand, role))
