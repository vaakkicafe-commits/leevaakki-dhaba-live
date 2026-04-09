from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
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

def create_token(user_id: str, email: str, is_admin: bool = False) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

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
        "addresses": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["email"])
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user.get("is_admin", False))
    return {"token": token, "user": {k: v for k, v in user.items() if k not in ["password", "_id"]}}

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

@api_router.post("/orders")
async def create_order(order: OrderCreate, user = Depends(get_current_user)):
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
        "payment_status": "pending",
        "special_instructions": order.special_instructions,
        "status": "placed",
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
            "created_at": order_doc["created_at"]
        }
    })
    
    return order_doc

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
async def get_all_orders(status: Optional[str] = None, admin = Depends(get_admin_user)):
    query = {}
    if status:
        query["status"] = status
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
async def get_stats(admin = Depends(get_admin_user)):
    total_orders = await db.orders.count_documents({})
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
    today_orders = await db.orders.count_documents({"created_at": {"$gte": today_start}})
    
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    pending_orders = await db.orders.count_documents({"status": {"$in": ["placed", "confirmed", "preparing"]}})
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

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
