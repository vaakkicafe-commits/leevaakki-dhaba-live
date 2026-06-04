from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import json
import asyncio
import hmac
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# WebSocket connections for real-time notifications
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

app = FastAPI(title="Lee Vaakki Dhaba API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    created_at: str

class AddressCreate(BaseModel):
    label: str = "Home"
    address_line: str
    landmark: Optional[str] = None
    city: str
    pincode: str
    is_default: bool = False

class Address(AddressCreate):
    id: str

class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    image_url: str
    is_veg: bool = True
    is_available: bool = True
    is_bestseller: bool = False
    tags: List[str] = []
    customizations: List[dict] = []

class CartItem(BaseModel):
    menu_item_id: str
    quantity: int = 1
    customizations: List[str] = []
    special_instructions: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[CartItem]
    order_type: str = "delivery"  # delivery, takeaway, dine-in
    address_id: Optional[str] = None
    payment_method: str = "cod"  # cod, online, upi
    coupon_code: Optional[str] = None
    special_instructions: Optional[str] = None
    customer_phone: Optional[str] = None  # For WhatsApp notifications
    channel: str = "OWN_DHABA"  # OWN_DHABA, OWN_CAFE, SWIGGY, ZOMATO, DINE_IN
    source_order_id: Optional[str] = None  # Third-party platform order ID

class OrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percentage"  # percentage, fixed
    discount_value: float
    min_order_value: float = 0
    max_discount: Optional[float] = None
    valid_from: str
    valid_until: str
    usage_limit: int = 100
    is_active: bool = True

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, is_admin: bool = False, roles: dict = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "is_admin": is_admin,
        "roles": roles or {},
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_firebase_token(token: str) -> Optional[dict]:
    try:
        # Decode without verifying signature to check issuer and audience first.
        # This keeps the app lightweight and avoids network certificate lookup latency.
        unverified = jwt.decode(token, options={"verify_signature": False})
        iss = unverified.get("iss", "")
        aud = unverified.get("aud", "")
        
        # Verify it matches our Firebase project ID
        firebase_project_id = "lee-vaakki-pvt-ltd-33e4e"
        if iss == f"https://securetoken.google.com/{firebase_project_id}" and aud == firebase_project_id:
            return unverified
    except Exception as e:
        logger.warning(f"Failed to parse Firebase token: {e}")
    return None

async def get_user_from_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        # Fallback to Firebase ID token decoding
        firebase_payload = verify_firebase_token(token)
        if firebase_payload:
            email = firebase_payload.get("email")
            if email:
                user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
                if not user:
                    # Create user dynamically in MongoDB if they don't exist yet
                    user = {
                        "id": firebase_payload.get("user_id") or firebase_payload.get("sub") or str(uuid.uuid4()),
                        "name": firebase_payload.get("name", email.split("@")[0]),
                        "email": email,
                        "phone": "",
                        "is_admin": False,
                        "roles": {},
                        "addresses": [],
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.users.insert_one(user)
                    # Remove Mongo generated _id and password before returning
                    user.pop("_id", None)
                    user.pop("password", None)
                return user
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional)):
    token = None
    if credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get("token")
        
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    return await get_user_from_token(token)

async def get_admin_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional)):
    token = None
    if credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get("token")
        
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    user = await get_user_from_token(token)
    
    is_legacy_admin = user.get("is_admin", False)
    roles = user.get("roles", {})
    
    has_any_admin_role = is_legacy_admin or any(role in ["admin", "employee"] for role in roles.values())
    
    if not has_any_admin_role:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "password": hash_password(user.password),
        "is_admin": False,
        "roles": {},
        "addresses": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["email"], False, {})
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user.get("is_admin", False), user.get("roles", {}))
    return {"token": token, "user": {k: v for k, v in user.items() if k not in ["password", "_id"]}}

@api_router.get("/auth/google/login")
async def google_login():
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "your-google-client-id.apps.googleusercontent.com")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=openid%20email%20profile"
        f"&prompt=select_account"
    )
    return RedirectResponse(auth_url)

@api_router.get("/auth/google/callback")
async def google_callback(code: str, state: Optional[str] = None):
    import requests
    
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
    
    # 1. Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    try:
        response = requests.post(token_url, data=token_data)
        if response.status_code != 200:
            logger.error(f"Google token exchange failed: {response.text}")
            raise HTTPException(status_code=400, detail="Failed to retrieve token from Google")
        
        tokens = response.json()
        id_token_jwt = tokens.get("id_token")
        if not id_token_jwt:
            raise HTTPException(status_code=400, detail="No ID token returned by Google")
            
        # 2. Decode user identity from ID token
        payload = jwt.decode(id_token_jwt, options={"verify_signature": False})
        email = payload.get("email")
        name = payload.get("name", email.split("@")[0] if email else "Google User")
        
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")
            
        # 3. Find or create the user in MongoDB
        user = await db.users.find_one({"email": email})
        if not user:
            user = {
                "id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "phone": "",  # Google does not provide phone by default
                "password": hash_password(str(uuid.uuid4())),
                "is_admin": False,
                "roles": {},
                "addresses": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user)
            
        if user and "_id" in user:
            user.pop("_id")
        if user and "password" in user:
            user.pop("password")
            
        # 4. Generate local session JWT
        token = create_token(user["id"], user["email"], user.get("is_admin", False), user.get("roles", {}))
        frontend_origin = os.environ.get("FRONTEND_URL", "*")
        
        # 5. Build HTMLResponse with JS script to postMessage and close popup
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Successful</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f7f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }}
                .container {{
                    text-align: center;
                    padding: 32px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    max-width: 400px;
                }}
                .spinner {{
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #6F4E37;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }}
                @keyframes spin {{
                    0% {{ transform: rotate(0deg); }}
                    100% {{ transform: rotate(360deg); }}
                }}
                h2 {{ color: #1a1a1a; margin-bottom: 8px; font-weight: 600; }}
                p {{ color: #666; font-size: 14px; margin: 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="spinner"></div>
                <h2>Signing you in...</h2>
                <p>Completing secure Google login. This popup window will close automatically.</p>
            </div>
            <script>
                setTimeout(function() {{
                    try {{
                        window.opener.postMessage({{ 
                            type: "google-login-success", 
                            token: "{token}" 
                        }}, "{frontend_origin}");
                    }} catch (e) {{
                        console.error("Popup: Failed to postMessage to opener:", e);
                    }}
                    window.close();
                }}, 800);
            </script>
        </body>
        </html>
        """
        response = HTMLResponse(content=html_content, status_code=200)
        response.set_cookie(
            key="token", 
            value=token, 
            httponly=True, 
            secure=True, 
            samesite="none", 
            max_age=JWT_EXPIRATION_HOURS * 3600
        )
        return response
    except Exception as e:
        logger.error(f"Error during Google callback handling: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    return user

# ============== MENU ROUTES ==============

@api_router.get("/menu")
async def get_menu():
    items = await db.menu_items.find({"is_available": True}, {"_id": 0}).to_list(100)
    return {"items": items}

@api_router.get("/menu/categories")
async def get_categories():
    categories = await db.menu_items.distinct("category")
    return {"categories": categories}

@api_router.get("/menu/category/{category}")
async def get_menu_by_category(category: str):
    items = await db.menu_items.find({"category": category, "is_available": True}, {"_id": 0}).to_list(50)
    return {"items": items}

@api_router.get("/menu/{item_id}")
async def get_menu_item(item_id: str):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

# ============== ADDRESS ROUTES ==============

@api_router.post("/addresses")
async def add_address(address: AddressCreate, user = Depends(get_current_user)):
    address_doc = {
        "id": str(uuid.uuid4()),
        **address.model_dump()
    }
    if address.is_default:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"addresses.$[].is_default": False}}
        )
    await db.users.update_one(
        {"id": user["id"]},
        {"$push": {"addresses": address_doc}}
    )
    return address_doc

@api_router.get("/addresses")
async def get_addresses(user = Depends(get_current_user)):
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0, "addresses": 1})
    return {"addresses": user_data.get("addresses", [])}

@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, user = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$pull": {"addresses": {"id": address_id}}}
    )
    return {"message": "Address deleted"}

# ============== ORDER ROUTES ==============

async def _create_order_doc(order: OrderCreate, user, channel: str, source_order_id: Optional[str] = None):
    # Check if online ordering is open for customer-facing channels (brand-aware)
    if channel in ["OWN_DHABA", "OWN_CAFE"]:
        brand = "dhaba" if channel == "OWN_DHABA" else "cafe"
        config_doc = await db.config.find_one({"key": "online_ordering", "brand": brand})
        # Fall back to legacy doc without brand field for backwards compatibility
        if not config_doc:
            config_doc = await db.config.find_one({"key": "online_ordering", "brand": {"$exists": False}})
        is_open = config_doc.get("value", True) if config_doc else True
        if not is_open:
            raise HTTPException(
                status_code=400, 
                detail=f"Online ordering is currently closed for {brand}. We are not accepting orders at this moment."
            )

    # Calculate order total - batch query for menu items
    items_details = []
    subtotal = 0
    
    # Batch fetch all menu items in one query (fixes N+1 issue)
    menu_item_ids = [item.menu_item_id for item in order.items]
    menu_items_cursor = db.menu_items.find({"id": {"$in": menu_item_ids}}, {"_id": 0})
    menu_items_list = await menu_items_cursor.to_list(None)
    menu_items_dict = {item["id"]: item for item in menu_items_list}
    
    for cart_item in order.items:
        menu_item = menu_items_dict.get(cart_item.menu_item_id)
        if not menu_item:
            raise HTTPException(status_code=400, detail=f"Menu item {cart_item.menu_item_id} not found")
        
        item_total = menu_item["price"] * cart_item.quantity
        subtotal += item_total
        items_details.append({
            "menu_item": menu_item,
            "quantity": cart_item.quantity,
            "customizations": cart_item.customizations,
            "special_instructions": cart_item.special_instructions,
            "item_total": item_total
        })
    
    # Apply coupon if provided
    discount = 0
    if order.coupon_code:
        coupon = await db.coupons.find_one({"code": order.coupon_code.upper(), "is_active": True})
        if coupon and subtotal >= coupon.get("min_order_value", 0):
            if coupon["discount_type"] == "percentage":
                discount = subtotal * (coupon["discount_value"] / 100)
                if coupon.get("max_discount"):
                    discount = min(discount, coupon["max_discount"])
            else:
                discount = coupon["discount_value"]
    
    # Calculate taxes and delivery
    delivery_fee = 40 if order.order_type == "delivery" else 0
    tax = subtotal * 0.05
    total = subtotal - discount + tax + delivery_fee
    
    # Get delivery address
    delivery_address = None
    if order.order_type == "delivery" and order.address_id:
        user_data = await db.users.find_one({"id": user["id"]})
        for addr in user_data.get("addresses", []):
            if addr["id"] == order.address_id:
                delivery_address = addr
                break
    
    # Generate order number
    order_count = await db.orders.count_documents({})
    order_number = f"LVD{str(order_count + 1).zfill(6)}"
    
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": order_number,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_phone": user["phone"],
        "items": items_details,
        "subtotal": subtotal,
        "discount": discount,
        "coupon_code": order.coupon_code,
        "tax": tax,
        "delivery_fee": delivery_fee,
        "total": total,
        "order_type": order.order_type,
        "delivery_address": delivery_address,
        "payment_method": order.payment_method,
        "payment_status": "pending" if source_order_id else "placed",
        "special_instructions": order.special_instructions,
        "status": "placed",
        "channel": channel,
        "source_order_id": source_order_id,
        "status_history": [
            {"status": "placed", "timestamp": datetime.now(timezone.utc).isoformat(), "notes": "Order placed successfully"}
        ],
        "estimated_time": 30 if order.order_type == "takeaway" else 45,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    del order_doc["_id"]
    
    # Broadcast new order notification to admin
    await manager.broadcast({
        "type": "new_order",
        "order": {
            "order_number": order_doc["order_number"],
            "user_name": order_doc["user_name"],
            "total": order_doc["total"],
            "items_count": len(order_doc["items"]),
            "order_type": order_doc["order_type"],
            "channel": order_doc["channel"],
            "created_at": order_doc["created_at"]
        }
    })
    
    return order_doc

@api_router.post("/orders")
async def create_order(order: OrderCreate, user = Depends(get_current_user)):
    return await _create_order_doc(order, user, order.channel or "OWN_DHABA", order.source_order_id)

def _create_razorpay_order(amount_paise: int, receipt_id: str) -> str:
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret:
        logger.warning("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables are not set. Using simulated order ID.")
        return f"order_rzp_{uuid.uuid4().hex[:12]}"
        
    try:
        import requests
        res = requests.post(
            "https://api.razorpay.com/v1/orders",
            auth=(key_id, key_secret),
            json={
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt_id
            },
            timeout=10
        )
        if res.status_code == 200:
            return res.json().get("id")
        else:
            logger.error(f"Razorpay API order creation failed (status={res.status_code}): {res.text}")
    except Exception as e:
        logger.error(f"Error calling Razorpay API: {e}")
        
    return f"order_rzp_{uuid.uuid4().hex[:12]}"

@api_router.post("/orders/own/dhaba")
async def create_own_dhaba_order(order: OrderCreate, user = Depends(get_current_user)):
    order_doc = await _create_order_doc(order, user, "OWN_DHABA", "PENDING_RZP")
    amount_paise = int(order_doc["total"] * 100)
    
    razorpay_order_id = _create_razorpay_order(amount_paise, order_doc["id"])
    await db.orders.update_one({"id": order_doc["id"]}, {"$set": {"source_order_id": razorpay_order_id}})
    
    return {
        "order_id": razorpay_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "local_order_id": order_doc["id"]
    }

@api_router.post("/orders/own/cafe")
async def create_own_cafe_order(order: OrderCreate, user = Depends(get_current_user)):
    order_doc = await _create_order_doc(order, user, "OWN_CAFE", "PENDING_RZP")
    amount_paise = int(order_doc["total"] * 100)
    
    razorpay_order_id = _create_razorpay_order(amount_paise, order_doc["id"])
    await db.orders.update_one({"id": order_doc["id"]}, {"$set": {"source_order_id": razorpay_order_id}})
    
    return {
        "order_id": razorpay_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "local_order_id": order_doc["id"]
    }

@api_router.get("/orders")
async def get_user_orders(user = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"orders": orders}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/orders/track/{order_number}")
async def track_order(order_number: str):
    order = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "order_number": order["order_number"],
        "status": order["status"],
        "status_history": order["status_history"],
        "estimated_time": order["estimated_time"],
        "order_type": order["order_type"],
        "created_at": order["created_at"]
    }

# ============== COUPON ROUTES ==============

@api_router.post("/coupons/validate")
async def validate_coupon(code: str, subtotal: float):
    coupon = await db.coupons.find_one({"code": code.upper(), "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    now = datetime.now(timezone.utc).isoformat()
    if now < coupon["valid_from"] or now > coupon["valid_until"]:
        raise HTTPException(status_code=400, detail="Coupon expired or not yet valid")
    
    if subtotal < coupon.get("min_order_value", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order value ₹{coupon['min_order_value']} required")
    
    if coupon["discount_type"] == "percentage":
        discount = subtotal * (coupon["discount_value"] / 100)
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    else:
        discount = coupon["discount_value"]
    
    return {"valid": True, "discount": discount, "coupon": coupon}

# ============== ADMIN ROUTES ==============

@api_router.post("/admin/menu")
async def add_menu_item(item: MenuItem, admin = Depends(get_admin_user)):
    item_doc = item.model_dump()
    await db.menu_items.insert_one(item_doc)
    return {"message": "Item added", "item": item_doc}

@api_router.put("/admin/menu/{item_id}")
async def update_menu_item(item_id: str, item: MenuItem, admin = Depends(get_admin_user)):
    result = await db.menu_items.update_one({"id": item_id}, {"$set": item.model_dump()})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item updated"}

@api_router.delete("/admin/menu/{item_id}")
async def delete_menu_item(item_id: str, admin = Depends(get_admin_user)):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

@api_router.get("/admin/orders")
async def get_all_orders(status: Optional[str] = None, channel: Optional[str] = None, brand: Optional[str] = None, admin = Depends(get_admin_user)):
    if brand:
        is_legacy_admin = admin.get("is_admin", False)
        brand_role = admin.get("roles", {}).get(brand)
        if not is_legacy_admin and brand_role not in ["admin", "employee"]:
            raise HTTPException(status_code=403, detail=f"Admin access required for brand: {brand}")
            
    query = {}
    if status:
        query["status"] = status
    if channel:
        query["channel"] = channel
    elif brand:
        query["channel"] = f"OWN_{brand.upper()}"
        
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, update: OrderStatusUpdate, admin = Depends(get_admin_user)):
    status_entry = {
        "status": update.status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes": update.notes
    }
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"status": update.status, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"status_history": status_entry}
        }
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Status updated"}

@api_router.get("/admin/coupons")
async def get_all_coupons(admin = Depends(get_admin_user)):
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(100)
    return {"coupons": coupons}

@api_router.post("/admin/coupons")
async def create_coupon(coupon: CouponCreate, admin = Depends(get_admin_user)):
    coupon_doc = {
        "id": str(uuid.uuid4()),
        **coupon.model_dump(),
        "code": coupon.code.upper(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.coupons.insert_one(coupon_doc)
    return {"message": "Coupon created", "coupon": coupon_doc}

@api_router.get("/admin/stats")
async def get_stats(brand: Optional[str] = None, admin = Depends(get_admin_user)):
    if brand:
        is_legacy_admin = admin.get("is_admin", False)
        brand_role = admin.get("roles", {}).get(brand)
        if not is_legacy_admin and brand_role not in ["admin", "employee"]:
            raise HTTPException(status_code=403, detail=f"Admin access required for brand: {brand}")

    query = {}
    if brand:
        query["channel"] = f"OWN_{brand.upper()}"

    total_orders = await db.orders.count_documents(query)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
    today_query = {**query, "created_at": {"$gte": today_start}}
    today_orders = await db.orders.count_documents(today_query)
    
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    if query:
        pipeline.insert(0, {"$match": query})
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    pending_query = {**query, "status": {"$in": ["placed", "confirmed", "preparing"]}}
    pending_orders = await db.orders.count_documents(pending_query)
    total_users = await db.users.count_documents({})
    
    return {
        "total_orders": total_orders,
        "today_orders": today_orders,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "total_users": total_users
    }

# ============== SEED DATA ==============

async def _seed_database_if_empty():
    """Core seed logic, callable from startup or API."""
    existing = await db.menu_items.count_documents({})
    if existing > 0:
        return {"message": "Database already seeded", "seeded": False}

    menu_items = [
        # Starters
        {"id": "starter_1", "name": "Paneer Tikka", "description": "Marinated cottage cheese cubes grilled to perfection in tandoor", "price": 320, "category": "Starters", "image_url": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": ["Bestseller", "Tandoor"], "customizations": []},
        {"id": "starter_2", "name": "Chicken Tikka", "description": "Tender chicken pieces marinated in spices and grilled", "price": 380, "category": "Starters", "image_url": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800", "is_veg": False, "is_bestseller": True, "is_available": True, "tags": ["Bestseller", "Tandoor"], "customizations": []},
        {"id": "starter_3", "name": "Aloo Tikki", "description": "Crispy potato patties served with chutneys", "price": 180, "category": "Starters", "image_url": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": ["Street Food"], "customizations": []},
        {"id": "starter_4", "name": "Fish Amritsari", "description": "Crispy fried fish with Amritsari spices", "price": 420, "category": "Starters", "image_url": "https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800", "is_veg": False, "is_bestseller": False, "is_available": True, "tags": ["Fried", "Spicy"], "customizations": []},
        # Mains
        {"id": "main_1", "name": "Butter Chicken", "description": "Tender chicken in a rich, creamy tomato gravy with butter", "price": 450, "category": "Mains", "image_url": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800", "is_veg": False, "is_bestseller": True, "is_available": True, "tags": ["Bestseller", "Creamy"], "customizations": []},
        {"id": "main_2", "name": "Dal Makhani", "description": "12-hour slow cooked black lentils with cream and butter", "price": 280, "category": "Mains", "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": ["Bestseller", "Slow Cooked"], "customizations": []},
        {"id": "main_3", "name": "Kadai Paneer", "description": "Cottage cheese cooked with bell peppers in kadai masala", "price": 320, "category": "Mains", "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": ["Spicy", "Paneer"], "customizations": []},
        {"id": "main_4", "name": "Rogan Josh", "description": "Kashmiri style slow-cooked lamb in aromatic spices", "price": 520, "category": "Mains", "image_url": "https://images.unsplash.com/photo-1545247181-516773cae754?q=80&w=800", "is_veg": False, "is_bestseller": False, "is_available": True, "tags": ["Kashmiri", "Premium"], "customizations": []},
        {"id": "main_5", "name": "Palak Paneer", "description": "Cottage cheese cubes in creamy spinach gravy", "price": 290, "category": "Mains", "image_url": "https://images.unsplash.com/photo-1618449840665-9ed506d73a34?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": ["Healthy", "Creamy"], "customizations": []},
        {"id": "main_6", "name": "Chicken Biryani", "description": "Fragrant basmati rice layered with spiced chicken", "price": 380, "category": "Mains", "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800", "is_veg": False, "is_bestseller": True, "is_available": True, "tags": ["Bestseller", "Rice"], "customizations": []},
        # Breads
        {"id": "bread_1", "name": "Butter Naan", "description": "Soft leavened bread brushed with butter", "price": 60, "category": "Breads", "image_url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": [], "customizations": []},
        {"id": "bread_2", "name": "Garlic Naan", "description": "Naan topped with garlic and coriander", "price": 80, "category": "Breads", "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": [], "customizations": []},
        {"id": "bread_3", "name": "Laccha Paratha", "description": "Layered whole wheat bread", "price": 70, "category": "Breads", "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": [], "customizations": []},
        {"id": "bread_4", "name": "Stuffed Kulcha", "description": "Naan stuffed with spiced potatoes or paneer", "price": 100, "category": "Breads", "image_url": "https://images.unsplash.com/photo-1574653853027-5d65dd32e2cd?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": ["Stuffed"], "customizations": []},
        # Combos
        {"id": "combo_1", "name": "Veg Thali", "description": "Dal, Paneer, Sabzi, Rice, 2 Rotis, Raita, Salad, Sweet", "price": 350, "category": "Combos", "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": ["Value", "Complete Meal"], "customizations": []},
        {"id": "combo_2", "name": "Non-Veg Thali", "description": "Chicken Curry, Dal, Rice, 2 Rotis, Raita, Salad, Sweet", "price": 450, "category": "Combos", "image_url": "https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=800", "is_veg": False, "is_bestseller": True, "is_available": True, "tags": ["Value", "Complete Meal"], "customizations": []},
        {"id": "combo_3", "name": "Biryani Combo", "description": "Chicken Biryani with Raita and Salan", "price": 420, "category": "Combos", "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800", "is_veg": False, "is_bestseller": False, "is_available": True, "tags": ["Rice", "Combo"], "customizations": []},
        # Beverages
        {"id": "bev_1", "name": "Masala Chai", "description": "Traditional Indian spiced tea", "price": 50, "category": "Beverages", "image_url": "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": [], "customizations": []},
        {"id": "bev_2", "name": "Lassi", "description": "Sweet or salted yogurt drink", "price": 80, "category": "Beverages", "image_url": "https://images.unsplash.com/photo-1626201850760-208b18b474ff?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": [], "customizations": []},
        {"id": "bev_3", "name": "Fresh Lime Soda", "description": "Refreshing lime with soda, sweet or salted", "price": 60, "category": "Beverages", "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": [], "customizations": []},
        # Desserts
        {"id": "dessert_1", "name": "Gulab Jamun", "description": "Deep fried milk dumplings in sugar syrup (2 pcs)", "price": 100, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1666190077072-ee1489e7cd5b?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": [], "customizations": []},
        {"id": "dessert_2", "name": "Kulfi", "description": "Traditional Indian ice cream with pistachios", "price": 120, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1623073284788-0d846f75e329?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": [], "customizations": []},
        {"id": "dessert_3", "name": "Kheer", "description": "Creamy rice pudding with cardamom and nuts", "price": 110, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1631452180539-96aca7d48617?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": [], "customizations": []},
        # Cafe Items
        {"id": "cafe_1", "name": "Premium Espresso", "description": "Rich, dark espresso shot pulled from freshly ground Arabica beans", "price": 160, "category": "Coffee", "image_url": "https://images.unsplash.com/photo-1510707577719-094119f7cc54?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": ["Signature", "Hot"], "customizations": []},
        {"id": "cafe_2", "name": "Classic Cappuccino", "description": "Smooth espresso blended with steamed milk and topped with rich foam", "price": 190, "category": "Coffee", "image_url": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": ["Best Seller"], "customizations": []},
        {"id": "cafe_3", "name": "Salted Caramel Latte", "description": "Espresso shot with rich milk, sweet caramel syrup, and a touch of sea salt", "price": 220, "category": "Coffee", "image_url": "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": ["Sweet", "Cold Option"], "customizations": []},
        {"id": "cafe_4", "name": "Artisan Butter Croissant", "description": "Flaky, layered French pastry baked fresh with premium European butter", "price": 130, "category": "Pastries", "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": ["Freshly Baked"], "customizations": []},
        {"id": "cafe_5", "name": "Blueberry Cheesecake", "description": "Creamy New York style cheesecake topped with rich, tart blueberry compote", "price": 260, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800", "is_veg": True, "is_bestseller": True, "is_available": True, "tags": ["Premium"], "customizations": []},
        {"id": "cafe_6", "name": "Matcha Green Tea Latte", "description": "Pure Japanese ceremonial matcha whisked with velvety steamed milk", "price": 240, "category": "Teas", "image_url": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800", "is_veg": True, "is_bestseller": False, "is_available": True, "tags": ["Organic", "Healthy"], "customizations": []},
    ]

    await db.menu_items.insert_many(menu_items)

    # Create admin user
    existing_admin = await db.users.find_one({"email": "admin@leevaakki.com"})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": "admin@leevaakki.com",
            "phone": "9876543210",
            "password": hash_password("admin123"),
            "is_admin": True,
            "addresses": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)

    # Create sample coupons
    coupons = [
        {"id": str(uuid.uuid4()), "code": "WELCOME20", "discount_type": "percentage", "discount_value": 20, "min_order_value": 300, "max_discount": 100, "valid_from": "2024-01-01T00:00:00Z", "valid_until": "2026-12-31T23:59:59Z", "usage_limit": 1000, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "FLAT50", "discount_type": "fixed", "discount_value": 50, "min_order_value": 500, "max_discount": None, "valid_from": "2024-01-01T00:00:00Z", "valid_until": "2026-12-31T23:59:59Z", "usage_limit": 500, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.coupons.insert_many(coupons)

    return {"message": "Database seeded successfully", "seeded": True}


@api_router.post("/seed")
async def seed_database():
    return await _seed_database_if_empty()

# ============== SETTINGS ROUTES ==============

class RestaurantSettings(BaseModel):
    restaurant_name: str = "Lee Vaakki Dhaba"
    tagline: str = "Authentic North Indian Cuisine"
    phone: str = "+91 98765 43210"
    whatsapp: str = "919876543210"
    email: str = "info@leevaakkidhaba.com"
    address_line: str = "NH-44, Near Murthal"
    city: str = "Sonipat"
    state: str = "Haryana"
    pincode: str = "131001"
    opening_hours: str = "Open 24 Hours"
    upi_id: str = "leevaakkidhaba@upi"
    google_maps_url: str = "https://maps.google.com/?q=Lee+Vaakki+Dhaba+Murthal"
    facebook_url: str = ""
    instagram_url: str = ""
    delivery_radius_km: int = 10
    min_order_amount: float = 200
    delivery_fee: float = 40

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"type": "restaurant"}, {"_id": 0})
    if not settings:
        # Return defaults
        return RestaurantSettings().model_dump()
    return settings

@api_router.put("/admin/settings")
async def update_settings(settings: RestaurantSettings, admin = Depends(get_admin_user)):
    settings_doc = {
        "type": "restaurant",
        **settings.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.settings.update_one(
        {"type": "restaurant"},
        {"$set": settings_doc},
        upsert=True
    )
    return {"message": "Settings updated successfully"}

class OnlineOrderingToggle(BaseModel):
    open: bool
    brand: str = "cafe"  # "cafe" or "dhaba"

@api_router.get("/config/online-ordering")
async def get_online_ordering(brand: str = "cafe"):
    doc = await db.config.find_one({"key": "online_ordering", "brand": brand})
    val = doc.get("value", True) if doc else True
    return {"onlineOrderingOpen": val}

@api_router.post("/admin/online-ordering")
async def toggle_online_ordering(payload: OnlineOrderingToggle, user = Depends(get_admin_user)):
    is_legacy_admin = user.get("is_admin", False)
    brand_role = user.get("roles", {}).get(payload.brand)
    if not is_legacy_admin and brand_role not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail=f"Admin access required for brand: {payload.brand}")

    await db.config.update_one(
        {"key": "online_ordering", "brand": payload.brand},
        {"$set": {"value": payload.open, "brand": payload.brand}},
        upsert=True
    )
    # Broadcast configuration update to connected admins/WS clients
    await manager.broadcast({
        "type": "config_update",
        "brand": payload.brand,
        "onlineOrderingOpen": payload.open
    })
    return {"onlineOrderingOpen": payload.open, "brand": payload.brand}

@api_router.get("/")
async def root():
    return {"message": "Lee Vaakki Dhaba API", "version": "1.0.0"}

# WebSocket endpoint for real-time notifications
@app.websocket("/ws/admin")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back or handle commands
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# UPI Payment endpoint
@api_router.post("/payments/upi/create")
async def create_upi_payment(order_id: str, user = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Restaurant UPI ID - replace with actual
    upi_id = os.environ.get('RESTAURANT_UPI_ID', 'leevaakkidhaba@upi')
    amount = order["total"]
    order_number = order["order_number"]
    
    # Generate UPI Intent URL
    upi_url = f"upi://pay?pa={upi_id}&pn=Lee%20Vaakki%20Dhaba&am={amount}&cu=INR&tn=Order%20{order_number}"
    
    return {
        "upi_url": upi_url,
        "upi_id": upi_id,
        "amount": amount,
        "order_number": order_number
    }

@api_router.post("/payments/confirm")
async def confirm_payment(order_id: str, transaction_id: str, user = Depends(get_current_user)):
    result = await db.orders.update_one(
        {"id": order_id, "user_id": user["id"]},
        {
            "$set": {
                "payment_status": "paid",
                "payment_transaction_id": transaction_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Payment confirmed"}

class ThirdPartyOrder(BaseModel):
    items: List[CartItem]
    order_type: str = "delivery"
    channel: str  # SWIGGY, ZOMATO
    source_order_id: str
    customer_name: str
    customer_phone: str
    customer_address: Optional[str] = None
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    delivery_fee: float = 0.0
    total: float
    special_instructions: Optional[str] = None

@api_router.post("/orders/webhook/third-party")
async def ingest_third_party_order(order: ThirdPartyOrder):
    # Check if duplicate order
    existing = await db.orders.find_one({"source_order_id": order.source_order_id, "channel": order.channel})
    if existing:
        return {"status": "ignored", "reason": "duplicate"}
        
    # Generate order number prefixed by channel
    prefix = "SWG" if order.channel == "SWIGGY" else "ZMT"
    order_count = await db.orders.count_documents({"channel": order.channel})
    order_number = f"{prefix}{str(order_count + 1).zfill(6)}"
    
    # Resolve items details
    items_details = []
    menu_item_ids = [item.menu_item_id for item in order.items]
    menu_items_cursor = db.menu_items.find({"id": {"$in": menu_item_ids}}, {"_id": 0})
    menu_items_list = await menu_items_cursor.to_list(None)
    menu_items_dict = {item["id"]: item for item in menu_items_list}
    
    for cart_item in order.items:
        menu_item = menu_items_dict.get(cart_item.menu_item_id)
        if not menu_item:
            menu_item = {
                "id": cart_item.menu_item_id,
                "name": f"External Item ({cart_item.menu_item_id})",
                "price": 0.0,
                "category": "Third-Party",
                "image_url": ""
            }
        items_details.append({
            "menu_item": menu_item,
            "quantity": cart_item.quantity,
            "customizations": cart_item.customizations,
            "special_instructions": cart_item.special_instructions,
            "item_total": menu_item.get("price", 0.0) * cart_item.quantity
        })
        
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": order_number,
        "user_id": "third_party",
        "user_name": order.customer_name,
        "user_phone": order.customer_phone,
        "items": items_details,
        "subtotal": order.subtotal,
        "discount": order.discount,
        "coupon_code": None,
        "tax": order.tax,
        "delivery_fee": order.delivery_fee,
        "total": order.total,
        "order_type": order.order_type,
        "delivery_address": {"address_line": order.customer_address} if order.customer_address else None,
        "payment_method": "online",
        "payment_status": "paid",
        "special_instructions": order.special_instructions,
        "status": "placed",
        "channel": order.channel,
        "source_order_id": order.source_order_id,
        "status_history": [
            {"status": "placed", "timestamp": datetime.now(timezone.utc).isoformat(), "notes": f"Order ingested from {order.channel}"}
        ],
        "estimated_time": 45,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    del order_doc["_id"]
    
    # Broadcast new order notification to admin
    await manager.broadcast({
        "type": "new_order",
        "order": {
            "order_number": order_doc["order_number"],
            "user_name": order_doc["user_name"],
            "total": order_doc["total"],
            "items_count": len(order_doc["items"]),
            "order_type": order_doc["order_type"],
            "channel": order_doc["channel"],
            "created_at": order_doc["created_at"]
        }
    })
    
    return {"status": "ok", "order_number": order_number}

async def send_whatsapp_order_notification(order: dict):
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_FROM_NUMBER")
    
    phone = order.get("user_phone") or order.get("customer_phone")
    if not phone:
        logger.warning(f"No phone number found for order {order.get('order_number')}. Skipping notification.")
        return
        
    items_str = ", ".join([f"{i['menu_item']['name']} (x{i['quantity']})" for i in order.get("items", [])])
    msg_body = (
        f"Hello {order.get('user_name', 'Customer')}! Your order {order.get('order_number')} has been confirmed. "
        f"Items: {items_str}. Total: INR {order.get('total')}. "
        f"Thank you for ordering with Vaakki Cafe!"
    )
    
    if account_sid and auth_token and from_number:
        try:
            import requests
            to_number = phone.strip()
            if from_number.startswith("whatsapp:"):
                clean_phone = to_number.replace("+", "").replace(" ", "").replace("whatsapp:", "")
                if len(clean_phone) == 10:
                    clean_phone = "91" + clean_phone
                to_formatted = f"whatsapp:+{clean_phone}"
            else:
                clean_phone = to_number.replace("+", "").replace(" ", "")
                if len(clean_phone) == 10:
                    clean_phone = "91" + clean_phone
                to_formatted = f"+{clean_phone}"
                
            res = requests.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
                auth=(account_sid, auth_token),
                data={
                    "To": to_formatted,
                    "From": from_number,
                    "Body": msg_body
                },
                timeout=10
            )
            if res.status_code in [200, 201]:
                logger.info(f"Twilio notification sent successfully to {to_formatted}.")
            else:
                logger.error(f"Twilio notification failed with status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error calling Twilio API to send notification: {e}")
    else:
        logger.info(f"[SIMULATED NOTIFICATION] Phone: {phone} | From: {from_number or 'MOCK'} | Body: {msg_body}")

async def _process_successful_payment(order: dict, transaction_id: str, notes: str):
    if order.get("payment_status") == "paid":
        logger.info(f"Order {order['order_number']} is already marked as paid. Skipping duplicate processing.")
        return
        
    await db.orders.update_one(
        {"id": order["id"]},
        {
            "$set": {
                "payment_status": "paid",
                "payment_transaction_id": transaction_id,
                "status": "placed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "status_history": {
                    "status": "placed",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "notes": notes
                }
            }
        }
    )
    
    await manager.broadcast({
        "type": "payment_captured",
        "order_number": order["order_number"],
        "total": order["total"]
    })
    
    updated_order = await db.orders.find_one({"id": order["id"]})
    if updated_order:
        await send_whatsapp_order_notification(updated_order)

class PaymentVerify(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    local_order_id: str

@api_router.post("/payments/verify")
async def verify_payment(payload: PaymentVerify, user = Depends(get_current_user)):
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    if key_secret:
        msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
        expected = hmac.new(
            key_secret.encode('utf-8'),
            msg.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected, payload.razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid signature")
            
    order = await db.orders.find_one({"id": payload.local_order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    await _process_successful_payment(
        order, 
        payload.razorpay_payment_id, 
        f"Payment verified via checkout signature. Txn ID: {payload.razorpay_payment_id}"
    )
    
    return {"status": "ok"}

@api_router.post("/payments/razorpay/webhook")
async def razorpay_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    
    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET")
    if webhook_secret and signature:
        expected_sig = hmac.new(
            webhook_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
            
    try:
        payload = json.loads(body.decode('utf-8'))
        event = payload.get("event")
        
        if event == "payment.captured":
            payment_entity = payload["payload"]["payment"]["entity"]
            razorpay_order_id = payment_entity.get("order_id")
            transaction_id = payment_entity.get("id")
            
            if razorpay_order_id:
                order = await db.orders.find_one({"source_order_id": razorpay_order_id})
                if order:
                    await _process_successful_payment(
                        order, 
                        transaction_id, 
                        f"Payment captured via Razorpay Webhook. Txn ID: {transaction_id}"
                    )
    except Exception as e:
        logger.warning(f"Error processing Razorpay webhook: {e}")
        
    return {"status": "ok"}

app.include_router(api_router)

# CORS fix: allow_credentials=True cannot be combined with allow_origins=['*']
# Must specify explicit origins when using credentials
_cors_origins = os.environ.get('CORS_ORIGINS', '').split(',')
_cors_origins = [o.strip() for o in _cors_origins if o.strip()]
if not _cors_origins or _cors_origins == ['*']:
    _cors_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://leevaakkidhaba.com",
        "https://leevaakkicafe.com",
        "https://leevaakki.com",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for deployment platform
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_db_init():
    """Auto-seed database on startup if empty (for fresh production deployments)."""
    try:
        result = await _seed_database_if_empty()
        if result.get("seeded"):
            logger.info("Database auto-seeded on startup.")
        else:
            logger.info("Database already seeded. Skipping.")
    except Exception as e:
        logger.warning(f"Auto-seed on startup failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Trigger hot reload of backend server in Comet

