import React, { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import "@/components/AdminDashboard.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, User, MapPin, Clock, Phone, ChevronRight, Plus, Minus, Trash2, X, Check, Search, Star, Flame, Leaf, Menu as MenuIcon, Home, Package, LogOut, Settings, Utensils, ChefHat, Croissant, Gift, Coffee, IceCream2, Download, Smartphone, Heart } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import { auth, googleProvider } from "@/firebase";
import { signInWithPopup } from "firebase/auth";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

// ─── Online Ordering Context ───────────────────────────────────────────────
const OnlineOrderingContext = createContext({ onlineOrderingOpen: true, setOnlineOrderingOpen: () => {} });
export const useOnlineOrdering = () => useContext(OnlineOrderingContext);

const FALLBACK_MENU_ITEMS = [
  { id: "starter_1", name: "Paneer Tikka", description: "Marinated cottage cheese cubes grilled to perfection in tandoor", price: 320, category: "Starters", image_url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=800", is_veg: true, is_bestseller: true, is_available: true, tags: ["Bestseller", "Tandoor"], customizations: [] },
  { id: "starter_2", name: "Chicken Tikka", description: "Tender chicken pieces marinated in spices and grilled", price: 380, category: "Starters", image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800", is_veg: false, is_bestseller: true, is_available: true, tags: ["Bestseller", "Tandoor"], customizations: [] },
  { id: "starter_3", name: "Aloo Tikki", description: "Crispy potato patties served with chutneys", price: 180, category: "Starters", image_url: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: ["Street Food"], customizations: [] },
  { id: "starter_4", name: "Fish Amritsari", description: "Crispy fried fish with Amritsari spices", price: 420, category: "Starters", image_url: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800", is_veg: false, is_bestseller: false, is_available: true, tags: ["Fried", "Spicy"], customizations: [] },
  { id: "main_1", name: "Butter Chicken", description: "Tender chicken in a rich, creamy tomato gravy with butter", price: 450, category: "Mains", image_url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800", is_veg: false, is_bestseller: true, is_available: true, tags: ["Bestseller", "Creamy"], customizations: [] },
  { id: "main_2", name: "Dal Makhani", description: "12-hour slow cooked black lentils with cream and butter", price: 280, category: "Mains", image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800", is_veg: true, is_bestseller: true, is_available: true, tags: ["Bestseller", "Slow Cooked"], customizations: [] },
  { id: "main_3", name: "Kadai Paneer", description: "Cottage cheese cooked with bell peppers in kadai masala", price: 320, category: "Mains", image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: ["Spicy", "Paneer"], customizations: [] },
  { id: "main_4", name: "Rogan Josh", description: "Kashmiri style slow-cooked lamb in aromatic spices", price: 520, category: "Mains", image_url: "https://images.unsplash.com/photo-1545247181-516773cae754?q=80&w=800", is_veg: false, is_bestseller: false, is_available: true, tags: ["Kashmiri", "Premium"], customizations: [] },
  { id: "main_5", name: "Palak Paneer", description: "Cottage cheese cubes in creamy spinach gravy", price: 290, category: "Mains", image_url: "https://images.unsplash.com/photo-1618449840665-9ed506d73a34?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: ["Healthy", "Creamy"], customizations: [] },
  { id: "main_6", name: "Chicken Biryani", description: "Fragrant basmati rice layered with spiced chicken", price: 380, category: "Mains", image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800", is_veg: false, is_bestseller: true, is_available: true, tags: ["Bestseller", "Rice"], customizations: [] },
  { id: "bread_1", name: "Butter Naan", description: "Soft leavened bread brushed with butter", price: 60, category: "Breads", image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800", is_veg: true, is_bestseller: true, is_available: true, tags: [], customizations: [] },
  { id: "bread_2", name: "Garlic Naan", description: "Naan topped with garlic and coriander", price: 80, category: "Breads", image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: [], customizations: [] },
  { id: "bread_3", name: "Laccha Paratha", description: "Layered whole wheat bread", price: 70, category: "Breads", image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: [], customizations: [] },
  { id: "bread_4", name: "Stuffed Kulcha", description: "Naan stuffed with spiced potatoes or paneer", price: 100, category: "Breads", image_url: "https://images.unsplash.com/photo-1574653853027-5d65dd32e2cd?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: ["Stuffed"], customizations: [] },
  { id: "combo_1", name: "Veg Thali", description: "Dal, Paneer, Sabzi, Rice, 2 Rotis, Raita, Salad, Sweet", price: 350, category: "Combos", image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800", is_veg: true, is_bestseller: true, is_available: true, tags: ["Value", "Complete Meal"], customizations: [] },
  { id: "combo_2", name: "Non-Veg Thali", description: "Chicken Curry, Dal, Rice, 2 Rotis, Raita, Salad, Sweet", price: 450, category: "Combos", image_url: "https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=800", is_veg: false, is_bestseller: true, is_available: true, tags: ["Value", "Complete Meal"], customizations: [] },
  { id: "combo_3", name: "Biryani Combo", description: "Chicken Biryani with Raita and Salan", price: 420, category: "Combos", image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800", is_veg: false, is_bestseller: false, is_available: true, tags: ["Rice", "Combo"], customizations: [] },
  { id: "bev_1", name: "Masala Chai", description: "Traditional Indian spiced tea", price: 50, category: "Beverages", image_url: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: [], customizations: [] },
  { id: "bev_2", name: "Lassi", description: "Sweet or salted yogurt drink", price: 80, category: "Beverages", image_url: "https://images.unsplash.com/photo-1626201850760-208b18b474ff?q=80&w=800", is_veg: true, is_bestseller: true, is_available: true, tags: [], customizations: [] },
  { id: "bev_3", name: "Fresh Lime Soda", description: "Refreshing lime with soda, sweet or salted", price: 60, category: "Beverages", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: [], customizations: [] },
  { id: "dessert_1", name: "Gulab Jamun", description: "Deep fried milk dumplings in sugar syrup (2 pcs)", price: 100, category: "Desserts", image_url: "https://images.unsplash.com/photo-1666190077072-ee1489e7cd5b?q=80&w=800", is_veg: true, is_bestseller: true, is_available: true, tags: [], customizations: [] },
  { id: "dessert_2", name: "Kulfi", description: "Traditional Indian ice cream with pistachios", price: 120, category: "Desserts", image_url: "https://images.unsplash.com/photo-1623073284788-0d846f75e329?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: [], customizations: [] },
  { id: "dessert_3", name: "Kheer", description: "Creamy rice pudding with cardamom and nuts", price: 110, category: "Desserts", image_url: "https://images.unsplash.com/photo-1631452180539-96aca7d48617?q=80&w=800", is_veg: true, is_bestseller: false, is_available: true, tags: [], customizations: [] }
];


// PWA Install Prompt
const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show prompt after 30 seconds on the site
      setTimeout(() => setShowPrompt(true), 30000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setInstallPrompt(null);
  };

  if (!showPrompt || !installPrompt) return null;

  return (
    <div className="install-prompt" data-testid="install-prompt">
      <div className="install-content">
        <Smartphone size={24} />
        <div className="install-text">
          <strong>Install Lee Vaakki App</strong>
          <span>Quick access, works offline!</span>
        </div>
      </div>
      <div className="install-actions">
        <button className="install-btn" onClick={handleInstall}>
          <Download size={16} /> Install
        </button>
        <button className="dismiss-btn" onClick={() => setShowPrompt(false)}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem("token"); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, phone, password) => {
    const res = await axios.post(`${API}/auth/register`, { name, email, phone, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const loginWithGoogle = async () => {
    try {
      // Use Firebase signInWithPopup — works from any authorized domain
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseIdToken = await result.user.getIdToken();

      // The backend accepts Firebase ID tokens directly as Bearer tokens,
      // so we don't need to exchange it for a JWT.
      const newToken = firebaseIdToken;
      localStorage.setItem("token", newToken);
      setToken(newToken);

      const meRes = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${newToken}` } });
      setUser(meRes.data);
      return meRes.data;
    } catch (err) {
      console.error("loginWithGoogle Error:", err);
      if (err.response) {
        throw new Error(`Backend Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loginWithGoogle, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Cart Context
const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (menuItem, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.menu_item.id === menuItem.id);
      if (existing) {
        return prev.map(i => i.menu_item.id === menuItem.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { menu_item: menuItem, quantity }];
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.menu_item.id !== itemId));
    } else {
      setItems(prev => prev.map(i => i.menu_item.id === itemId ? { ...i, quantity } : i));
    }
  };

  const removeItem = (itemId) => setItems(prev => prev.filter(i => i.menu_item.id !== itemId));
  const clearCart = () => setItems([]);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.menu_item.price * i.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

// ─── Admin Drawer (Dhaba Online Ordering Toggle) ──────────────────────────
const AdminDrawer = ({ onClose, token }) => {
  const { onlineOrderingOpen, setOnlineOrderingOpen } = useOnlineOrdering();
  const [saving, setSaving] = useState(false);

  const toggle = async (val) => {
    setSaving(true);
    try {
      const res = await axios.post(
        `${API}/admin/online-ordering`,
        { open: val, brand: "dhaba" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOnlineOrderingOpen(res.data.onlineOrderingOpen);
    } catch (e) {
      alert("Failed to update: " + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: "320px",
      background: "#FFFDF9", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
      zIndex: 3000, display: "flex", flexDirection: "column", borderLeft: "1px solid #f0ebe0"
    }}>
      <div style={{ padding: "20px", borderBottom: "1px solid #f0ebe0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🍛</span>
          <strong style={{ fontSize: "16px", color: "#1A1A1A" }}>Dhaba Admin</strong>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "50%" }}>
          <X size={20} color="#666" />
        </button>
      </div>

      <div style={{ padding: "24px", flex: 1 }}>
        <p style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Online Ordering</p>
        <div style={{
          background: onlineOrderingOpen ? "#E8F5E9" : "#FFEBEE",
          border: `2px solid ${onlineOrderingOpen ? "#4CAF50" : "#EF5350"}`,
          borderRadius: "12px", padding: "16px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontWeight: 700, color: onlineOrderingOpen ? "#2E7D32" : "#C62828", fontSize: "15px" }}>
              {onlineOrderingOpen ? "OPEN" : "CLOSED"}
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>Dhaba online orders</div>
          </div>
          <button
            onClick={() => toggle(!onlineOrderingOpen)}
            disabled={saving}
            style={{
              background: onlineOrderingOpen ? "#4CAF50" : "#EF5350",
              color: "white", border: "none", borderRadius: "20px",
              padding: "8px 18px", fontWeight: 700, fontSize: "13px",
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              transition: "all 0.2s"
            }}
          >
            {saving ? "..." : (onlineOrderingOpen ? "Turn OFF" : "Turn ON")}
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#888", marginTop: "12px", lineHeight: 1.5 }}>
          When OFF: customers cannot add items or checkout on the Dhaba site.
        </p>
      </div>
    </div>
  );
};

// Components
const Navbar = () => {
  const { user, logout, token } = useAuth();
  const { itemCount } = useCart();
  const { onlineOrderingOpen } = useOnlineOrdering();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" data-testid="logo">
          <span className="logo-icon">🍛</span>
          <span className="logo-text">Lee Vaakki Dhaba</span>
        </Link>

        <div className="navbar-links">
          <Link to="/menu" className="nav-link" data-testid="menu-link">Menu</Link>
          <Link to="/snacks" className="nav-link" data-testid="snacks-link">Snacks</Link>
          <Link to="/track" className="nav-link" data-testid="track-link">Track Order</Link>
        </div>

        <div className="navbar-actions">
          {/* Online ordering status badge */}
          <span style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px",
            padding: "4px 8px", borderRadius: "12px",
            background: onlineOrderingOpen ? "#E8F5E9" : "#FFEBEE",
            color: onlineOrderingOpen ? "#2E7D32" : "#C62828",
            border: `1px solid ${onlineOrderingOpen ? "#A5D6A7" : "#EF9A9A"}`,
            whiteSpace: "nowrap"
          }}>
            {onlineOrderingOpen ? "🟢 OPEN" : "🔴 CLOSED"}
          </span>

          <button className="cart-btn" onClick={() => navigate("/cart")} data-testid="cart-btn">
            <ShoppingCart size={22} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>

          {/* Admin gear — only for authorized dhaba admins */}
          {(user?.roles?.dhaba === 'admin' || user?.roles?.dhaba === 'employee') && (
            <button
              onClick={() => setAdminOpen(true)}
              title="Admin Panel"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "6px", borderRadius: "50%", color: "#555",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#f0f0f0"}
              onMouseOut={e => e.currentTarget.style.background = "none"}
            >
              <Settings size={20} />
            </button>
          )}

          {user ? (
            <div className="user-menu">
              <button className="user-btn" onClick={() => setMenuOpen(!menuOpen)} data-testid="user-menu-btn">
                <User size={22} />
                <span className="user-name">{user.name.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <div className="dropdown-menu">
                  <Link to="/orders" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    <Package size={18} /> My Orders
                  </Link>
                  {(user.roles?.dhaba === 'admin' || user.roles?.dhaba === 'employee') && (
                    <div className="dropdown-item" onClick={() => { setAdminOpen(true); setMenuOpen(false); }} style={{ cursor: "pointer" }}>
                      <Settings size={18} /> Admin Panel
                    </div>
                  )}
                  <button className="dropdown-item logout" onClick={() => { logout(); setMenuOpen(false); }}>
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-btn" onClick={() => navigate("/login")} data-testid="login-btn">Login</button>
          )}
        </div>
      </div>
    </nav>

    {/* Admin drawer overlay */}
    {adminOpen && (
      <>
        <div onClick={() => setAdminOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 2999, backdropFilter: "blur(2px)"
        }} />
        <AdminDrawer onClose={() => setAdminOpen(false)} token={token} />
      </>
    )}
    </>
  );
};

const Footer = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    axios.get(`${API}/settings`).then(res => setSettings(res.data)).catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>{settings?.restaurant_name || "Lee Vaakki Dhaba"}</h4>
          <p>{settings?.tagline || "Authentic North Indian Cuisine since 1985"}</p>
          <div className="footer-contact">
            <p><Phone size={16} /> {settings?.phone || "+91 98765 43210"}</p>
            <p><MapPin size={16} /> {settings?.address_line || "NH-44, Near Murthal"}, {settings?.city || "Haryana"}</p>
            <p><Clock size={16} /> {settings?.opening_hours || "Open 24 Hours"}</p>
          </div>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <Link to="/menu">Menu</Link>
          <Link to="/track">Track Order</Link>
          <Link to="/about">About Us</Link>
        </div>
        <div className="footer-section">
          <h4>Legal</h4>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Refund Policy</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 {settings?.restaurant_name || "Lee Vaakki Dhaba"}. All rights reserved.</p>
      </div>
    </footer>
  );
};

// --- Snacks Data & Component ---
const SNACK_ITEMS = [
  {
    id: "snack_alu_bhujia",
    name: "Haldiram's Aloo Bhujia",
    description: "Crispy potato sev with tangy masala.",
    price: 33,
    original_price: 45,
    discount: "26% OFF",
    weight: "1 pack (200 g)",
    tag: "Bestseller",
    rating: "4.8(90k)",
    image_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=400",
  },
  {
    id: "snack_masala_chips",
    name: "Lays India's Magic Masala",
    description: "Classic chips with chatpata masala.",
    price: 27,
    original_price: 60,
    discount: "33 OFF",
    weight: "1 pack (82 g or 88 g)",
    tag: "Chatpata Masala",
    rating: "4.8(90k)",
    image_url: "https://images.unsplash.com/photo-1566478989037-e924e5efa0f7?q=80&w=400",
  },
  {
    id: "snack_khatta_meetha",
    name: "Khatta Meetha Mixture",
    description: "Sweet and sour traditional Indian snack mixture.",
    price: 31,
    original_price: 60,
    discount: "29 OFF",
    weight: "1 pack (70 g)",
    tag: "Sweet & Salty",
    rating: "4.6(5k)",
    image_url: "https://images.unsplash.com/photo-1605333396914-2c70fb907311?q=80&w=400",
  },
  {
    id: "snack_mathri",
    name: "Punjabi Mathri",
    description: "Flaky, savory crackers spiced with ajwain.",
    price: 33,
    original_price: 60,
    discount: "27 OFF",
    weight: "1 pack (65 g)",
    tag: "Crispy",
    rating: "4.7(12k)",
    image_url: "https://images.unsplash.com/photo-1596450514735-a50e18987b28?q=80&w=400",
  }
];

const SnacksPage = () => {
  const { addItem, items, itemCount, subtotal } = useCart();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem 0.5rem", minHeight: "80vh", paddingBottom: "100px", background: "#f8f9fa" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ChevronRight size={24} style={{ transform: "rotate(180deg)", cursor: "pointer" }} onClick={() => navigate(-1)} />
          <h1 style={{ fontSize: "1.25rem", fontWeight: "700", margin: 0, color: "#1A1A1A" }}>Snacks</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Heart size={20} />
          <Search size={20} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {SNACK_ITEMS.map((item) => {
          const cartItem = items.find(i => i.menu_item.id === item.id);
          const quantity = cartItem?.quantity || 0;

          return (
            <div key={item.id} className="snack-item-card" style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: "12px", padding: "0.75rem", position: "relative", border: "1px solid #f0f0f0", transition: "all 0.3s ease" }}>
              {/* Product Image and Add Button */}
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <Heart size={18} style={{ position: "absolute", top: "0.25rem", right: "0.25rem", color: "#e91e63", cursor: "pointer" }} />
                <div style={{ padding: "0.5rem", background: "#f8f9fa", borderRadius: "8px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem", overflow: "hidden" }}>
                  <img className="snack-item-image" src={item.image_url} alt={item.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", mixBlendMode: "multiply", borderRadius: "4px", transition: "transform 0.3s ease" }} />
                </div>
                
                <div style={{ position: "absolute", bottom: "-0.5rem", right: "0.5rem" }}>
                  {quantity === 0 ? (
                    <button
                      onClick={() => addItem({ ...item, category: "snacks" }, 1)}
                      style={{ background: "#fff", color: "#e91e63", border: "1px solid #e91e63", borderRadius: "8px", padding: "4px 16px", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                    >
                      ADD
                    </button>
                  ) : (
                    <div style={{ background: "#e91e63", color: "#fff", borderRadius: "8px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", fontWeight: "700", boxShadow: "0 2px 4px rgba(233,30,99,0.3)" }}>
                      <span onClick={() => addItem({ ...item, category: "snacks" }, -1)} style={{ cursor: "pointer", padding: "0 4px" }}>-</span>
                      <span>{quantity}</span>
                      <span onClick={() => addItem({ ...item, category: "snacks" }, 1)} style={{ cursor: "pointer", padding: "0 4px" }}>+</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price and Discount */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.25rem" }}>
                <div style={{ background: "#2E7D32", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "700" }}>₹{item.price}</div>
                <span style={{ color: "#9e9e9e", textDecoration: "line-through", fontSize: "0.8rem" }}>₹{item.original_price}</span>
              </div>
              <div style={{ color: "#2E7D32", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.5rem" }}>{item.discount}</div>

              {/* Title and Weight */}
              <h2 style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "0.25rem", lineHeight: "1.2" }}>{item.name}</h2>
              <span style={{ fontSize: "0.75rem", color: "#757575", marginBottom: "0.5rem", display: "block" }}>{item.weight}</span>

              {/* Tag and Rating */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "auto" }}>
                <span style={{ background: "#e0f7fa", color: "#00838f", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", alignSelf: "flex-start", fontWeight: "600" }}>{item.tag}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#2E7D32", fontSize: "0.75rem", fontWeight: "600", marginTop: "0.25rem" }}>
                  <Star size={12} fill="#2E7D32" /> {item.rating}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Bottom Bar */}
      {itemCount > 0 && (
        <div 
          onClick={() => navigate("/cart")}
          style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", background: "#e91e63", color: "white", padding: "12px 16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "92%", maxWidth: "560px", boxShadow: "0 4px 12px rgba(233, 30, 99, 0.4)", zIndex: 1000, cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><ShoppingCart size={20} /></div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>{itemCount} item{itemCount > 1 ? "s" : ""}</span>
              <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>Shop for ₹{Math.max(0, 497 - subtotal)} more</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "700", fontSize: "0.9rem" }}>
            View Cart <ChevronRight size={18} />
          </div>
        </div>
      )}
    </div>
  );
};

// Pages
const HomePage = () => {
  const [bestsellers, setBestsellers] = useState([]);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/menu`)
      .then(res => {
        setBestsellers(res.data.items.filter(i => i.is_bestseller).slice(0, 6));
      })
      .catch(err => {
        console.warn("Failed to fetch menu from API, using fallback data", err);
        setBestsellers(FALLBACK_MENU_ITEMS.filter(i => i.is_bestseller).slice(0, 6));
      });
  }, []);

  const categories = [
    { name: "Starters", icon: Flame, color: "#FF6B35" },
    { name: "Mains", icon: ChefHat, color: "#2E7D32" },
    { name: "Breads", icon: Croissant, color: "#D4A574" },
    { name: "Combos", icon: Gift, color: "#E53935" },
    { name: "Beverages", icon: Coffee, color: "#8D6E63" },
    { name: "Desserts", icon: IceCream2, color: "#EC407A" },
  ];

  return (
    <div className="home-page" data-testid="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Authentic North Indian Flavors</h1>
          <p>Experience the legendary taste of Punjab at Lee Vaakki Dhaba</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate("/menu")} data-testid="order-now-btn">
              Order Now
            </button>
            <button className="btn-secondary" onClick={() => navigate("/track")} data-testid="track-order-btn">
              Track Order
            </button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat"><span>35+</span><p>Years Legacy</p></div>
          <div className="stat"><span>50K+</span><p>Happy Customers</p></div>
          <div className="stat"><span>4.5</span><p>Rating ⭐</p></div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="promo-banner">
        <div className="promo-content">
          <span className="promo-tag">FIRST ORDER</span>
          <h3>Get 20% OFF</h3>
          <p>Use code: <strong>WELCOME20</strong></p>
        </div>
      </section>

      {/* Ordering Channels Section */}
      <section className="ordering-channels-section" style={{
        maxWidth: "1200px",
        margin: "40px auto",
        padding: "0 20px"
      }}>
        <div className="ordering-channels-card" style={{
          background: "#FFFDF9",
          border: "1px dashed #FF6B3550",
          borderRadius: "16px",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
        }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#2E7D32", fontWeight: "700", fontSize: "14px", letterSpacing: "1px", textTransform: "uppercase" }}>ONLINE ORDERING</span>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1A1A1A", marginTop: "8px", marginBottom: "8px" }}>How would you like to order today?</h2>
            <p style={{ color: "#666", fontSize: "15px", maxWidth: "600px", margin: "0 auto" }}>
              Get our authentic tandoori and traditional Punjabi dishes delivered to your doorstep. Order directly for best prices and flat discounts!
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
            <button 
              onClick={() => navigate("/menu")} 
              className="btn-primary" 
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "16px 32px",
                fontSize: "16px",
                fontWeight: "700",
                background: "#2E7D32",
                color: "white",
                border: "none",
                borderRadius: "30px",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(46, 125, 50, 0.2)",
                transition: "all 0.3s ease",
                textAlign: "center"
              }}
            >
              Order Directly from Lee Vaakki Dhaba
            </button>

            <div style={{
              width: "100%",
              maxWidth: "400px",
              borderTop: "1px solid #eee",
              paddingTop: "20px",
              textAlign: "center"
            }}>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "12px", fontWeight: "600" }}>
                Soon you can also order from:
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => alert("Online orders via Swiggy coming soon for Lee Vaakki Dhaba!")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "#f5f5f5",
                    color: "#999",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "1px solid #e0e0e0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#FC8019",
                    opacity: 0.6
                  }} />
                  Swiggy (Coming Soon)
                </button>
                <button
                  type="button"
                  onClick={() => alert("Online orders via Zomato coming soon for Lee Vaakki Dhaba!")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "#f5f5f5",
                    color: "#999",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "1px solid #e0e0e0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#CB202D",
                    opacity: 0.6
                  }} />
                  Zomato (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <h2>What's on your mind?</h2>
        <div className="categories-grid">
          {categories.map(cat => {
            const IconComponent = cat.icon;
            return (
              <div key={cat.name} className="category-card" onClick={() => navigate(`/menu?category=${cat.name}`)} style={{ "--cat-color": cat.color }}>
                <div className="cat-icon-wrapper" style={{ background: `${cat.color}15`, border: `2px solid ${cat.color}30` }}>
                  <IconComponent size={32} color={cat.color} strokeWidth={1.5} />
                </div>
                <span className="cat-name">{cat.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bestsellers-section">
        <div className="section-header">
          <h2><Flame size={24} className="fire-icon" /> Bestsellers</h2>
          <button className="view-all" onClick={() => navigate("/menu")}>View All <ChevronRight size={18} /></button>
        </div>
        <div className="items-grid">
          {bestsellers.map(item => (
            <MenuItemCard key={item.id} item={item} onImageClick={setQuickViewItem} />
          ))}
        </div>
      </section>
      {quickViewItem && <QuickViewModal item={quickViewItem} onClose={() => setQuickViewItem(null)} />}

      {/* App Download / Features */}
      <section className="features-section">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🚀</span>
            <h4>Fast Delivery</h4>
            <p>Get your food delivered in 30-45 minutes</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👨‍🍳</span>
            <h4>Expert Chefs</h4>
            <p>Traditional recipes by experienced tandoor masters</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🌿</span>
            <h4>Fresh Ingredients</h4>
            <p>Farm-fresh vegetables and quality meat</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💯</span>
            <h4>Hygiene First</h4>
            <p>FSSAI certified kitchen with top hygiene standards</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const MenuItemCard = ({ item, onImageClick }) => {
  const { addItem, items, updateQuantity } = useCart();
  const { onlineOrderingOpen } = useOnlineOrdering();
  const cartItem = items.find(i => i.menu_item.id === item.id);
  const quantity = cartItem?.quantity || 0;

  // Vibration feedback
  const vibrate = (pattern = 50) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const handleAdd = () => {
    if (!onlineOrderingOpen) return;
    vibrate(50);
    addItem(item, 1);
  };

  const handleIncrease = () => {
    vibrate(30);
    updateQuantity(item.id, quantity + 1);
  };

  const handleDecrease = () => {
    vibrate(quantity === 1 ? [30, 50, 30] : 30);
    updateQuantity(item.id, quantity - 1);
  };

  return (
    <div className="menu-item-card" data-testid={`menu-item-${item.id}`}>
      <div className="item-image" onClick={() => onImageClick?.(item)}>
        <img src={item.image_url} alt={item.name} loading="lazy" />
        {item.is_bestseller && <span className="bestseller-tag"><Flame size={12} /> Bestseller</span>}
        <span className={`veg-tag ${item.is_veg ? "veg" : "non-veg"}`}>
          {item.is_veg ? <Leaf size={12} /> : "●"}
        </span>
        <div className="image-tap-hint">Tap for details</div>
      </div>
      <div className="item-details">
        <h4>{item.name}</h4>
        <p className="item-desc">{item.description}</p>
        <div className="item-footer">
          <span className="item-price">₹{item.price}</span>
          {!onlineOrderingOpen ? (
            <button className="add-btn" disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>
              Closed
            </button>
          ) : quantity === 0 ? (
            <button className="add-btn" onClick={handleAdd} data-testid={`add-${item.id}`}>
              <Plus size={16} /> Add
            </button>
          ) : (
            <div className="qty-controls" data-testid={`qty-${item.id}`}>
              <button className="qty-btn minus" onClick={handleDecrease}>
                <Minus size={16} />
              </button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn plus" onClick={handleIncrease}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Swiggy-style Quick View Bottom Sheet
const QuickViewModal = ({ item, onClose }) => {
  const { addItem, items, updateQuantity } = useCart();
  const cartItem = items.find(i => i.menu_item.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const vibrate = (pattern = 50) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  const handleAdd = () => {
    vibrate(50);
    addItem(item, 1);
  };

  const handleIncrease = () => {
    vibrate(30);
    updateQuantity(item.id, quantity + 1);
  };

  const handleDecrease = () => {
    vibrate(quantity === 1 ? [30, 50, 30] : 30);
    updateQuantity(item.id, quantity - 1);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="qv-overlay" onClick={onClose} data-testid="quick-view-overlay">
      <div className="qv-sheet" onClick={e => e.stopPropagation()} data-testid="quick-view-modal">
        <div className="qv-handle" />
        <button className="qv-close" onClick={onClose} data-testid="quick-view-close"><X size={20} /></button>
        <div className="qv-img-wrap">
          <img src={item.image_url} alt={item.name} />
          <div className="qv-badges">
            <span className={`qv-veg-badge ${item.is_veg ? "veg" : "non-veg"}`}>
              {item.is_veg ? <><Leaf size={12} /> Veg</> : <><span className="nv-dot">●</span> Non-Veg</>}
            </span>
            {item.is_bestseller && <span className="qv-best-badge"><Flame size={12} /> Bestseller</span>}
          </div>
        </div>
        <div className="qv-body">
          <h3 className="qv-name">{item.name}</h3>
          <p className="qv-desc">{item.description}</p>
          <div className="qv-footer">
            <span className="qv-price">₹{item.price}</span>
            {quantity === 0 ? (
              <button className="qv-add-btn" onClick={handleAdd} data-testid="quick-view-add-btn">
                ADD
              </button>
            ) : (
              <div className="qv-qty" data-testid="quick-view-qty">
                <button onClick={handleDecrease}><Minus size={16} /></button>
                <span>{quantity}</span>
                <button onClick={handleIncrease}><Plus size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickViewItem, setQuickViewItem] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);
  }, [location]);

  useEffect(() => {
    axios.get(`${API}/menu`)
      .then(res => {
        setItems(res.data.items);
        const cats = [...new Set(res.data.items.map(i => i.category))];
        setCategories(["All", ...cats]);
      })
      .catch(err => {
        console.warn("Failed to fetch menu from API, using fallback data", err);
        setItems(FALLBACK_MENU_ITEMS);
        const cats = [...new Set(FALLBACK_MENU_ITEMS.map(i => i.category))];
        setCategories(["All", ...cats]);
      });
  }, []);

  const filteredItems = items.filter(item => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (vegOnly && !item.is_veg) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="menu-page" data-testid="menu-page">
      <div className="menu-header">
        <h1>Our Menu</h1>
        <div className="menu-controls">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search dishes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} data-testid="search-input" />
          </div>
          <label className="veg-toggle">
            <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)} data-testid="veg-toggle" />
            <span className="toggle-label"><Leaf size={14} /> Veg Only</span>
          </label>
        </div>
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button key={cat} className={`cat-tab ${selectedCategory === cat ? "active" : ""}`} onClick={() => setSelectedCategory(cat)} data-testid={`cat-${cat}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => <MenuItemCard key={item.id} item={item} onImageClick={setQuickViewItem} />)
        ) : (
          <div className="no-items">No items found</div>
        )}
      </div>
      {quickViewItem && <QuickViewModal item={quickViewItem} onClose={() => setQuickViewItem(null)} />}
    </div>
  );
};

const GoogleLoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err) {
      if (err.message !== "Closed by user" && err.message !== "Popup blocked" && !err.message.includes("popup-closed-by-user") && !err.message.includes("popup-blocked")) {
        setError(`Login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#FFFDF9",
        borderRadius: "20px",
        padding: "36px",
        maxWidth: "420px",
        width: "90%",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
        position: "relative",
        textAlign: "center",
        border: "1px solid rgba(255, 107, 53, 0.1)"
      }}>
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#888",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
            borderRadius: "50%",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#f0f0f0"}
          onMouseOut={(e) => e.currentTarget.style.background = "none"}
        >
          <X size={20} />
        </button>

        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🍛</div>
        <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#1A1A1A", marginBottom: "10px" }}>Sign in with Google</h3>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5", marginBottom: "24px" }}>
          To complete your order and pay securely, please sign in with your Google account.
        </p>

        {error && (
          <div style={{
            background: "#FFEBEE",
            color: "#C62828",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "16px",
            textAlign: "left"
          }}>
            {error}
          </div>
        )}

        <button 
          type="button" 
          disabled={loading}
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid #dadce0",
            borderRadius: "30px",
            background: "white",
            color: "#3c4043",
            fontSize: "15px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "#f8f9fa"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.04)"; }}
        >
          {loading ? (
            <span style={{ fontSize: "14px", color: "#666" }}>Connecting...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.72v2.24h2.9c1.7-1.57 2.7-3.88 2.7-6.59z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.59-5.05-3.73H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
                <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2 0 7.57 0 9s.35 2.8 1 4l2.95-2.3z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.43 0 9 0 5.5 0 2.43 2.11.95 5.04l2.95 2.3c.71-2.14 2.7-3.76 5.05-3.76z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div style={{ marginTop: "16px", fontSize: "11px", color: "#999" }}>
          By continuing, you agree to our Terms and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { onlineOrderingOpen } = useOnlineOrdering();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const deliveryFee = 40;
  const tax = subtotal * 0.05;
  const total = subtotal - discount + tax + deliveryFee;

  const applyCoupon = async () => {
    try {
      const res = await axios.post(`${API}/coupons/validate?code=${couponCode}&subtotal=${subtotal}`);
      setDiscount(res.data.discount);
      setCouponError("");
    } catch (err) {
      setCouponError(err.response?.data?.detail || "Invalid coupon");
      setDiscount(0);
    }
  };

  const proceedToCheckout = () => {
    if (!onlineOrderingOpen) return;
    if (!user) {
      setShowLoginModal(true);
    } else {
      navigate("/checkout");
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-cart" data-testid="empty-cart">
        <ShoppingCart size={80} />
        <h2>Your cart is empty</h2>
        <p>Add some delicious items to get started!</p>
        <button className="btn-primary" onClick={() => navigate("/menu")}>Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="cart-page" data-testid="cart-page">
      <div className="cart-header">
        <h1>Your Cart</h1>
        <button className="clear-btn" onClick={clearCart}><Trash2 size={16} /> Clear All</button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {items.map(({ menu_item, quantity }) => (
            <div key={menu_item.id} className="cart-item" data-testid={`cart-item-${menu_item.id}`}>
              <img src={menu_item.image_url} alt={menu_item.name} />
              <div className="cart-item-details">
                <h4>{menu_item.name}</h4>
                <p className="item-price">₹{menu_item.price} each</p>
              </div>
              <div className="quantity-controls">
                <button onClick={() => { navigator.vibrate?.(quantity === 1 ? [30, 50, 30] : 30); updateQuantity(menu_item.id, quantity - 1); }}><Minus size={16} /></button>
                <span>{quantity}</span>
                <button onClick={() => { navigator.vibrate?.(30); updateQuantity(menu_item.id, quantity + 1); }}><Plus size={16} /></button>
              </div>
              <span className="item-total">₹{menu_item.price * quantity}</span>
              <button className="remove-btn" onClick={() => { navigator.vibrate?.([50, 30, 50]); removeItem(menu_item.id); }}><X size={18} /></button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          
          <div className="coupon-section">
            <input type="text" placeholder="Enter coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value)} data-testid="coupon-input" />
            <button onClick={applyCoupon} data-testid="apply-coupon-btn">Apply</button>
            {couponError && <p className="coupon-error">{couponError}</p>}
            {discount > 0 && <p className="coupon-success">Coupon applied! -₹{discount.toFixed(0)}</p>}
          </div>

          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
          {discount > 0 && <div className="summary-row discount"><span>Discount</span><span>-₹{discount.toFixed(0)}</span></div>}
          <div className="summary-row"><span>Tax (5%)</span><span>₹{tax.toFixed(0)}</span></div>
          <div className="summary-row"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
          <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(0)}</span></div>

          {!onlineOrderingOpen && (
            <div style={{
              background: "#FFEBEE", color: "#C62828", borderRadius: "8px",
              padding: "10px 14px", fontSize: "13px", marginBottom: "12px",
              border: "1px solid #EF9A9A", textAlign: "center", fontWeight: 600
            }}>
              🔴 We are closed for online orders right now.
            </div>
          )}
          <button
            className="checkout-btn"
            onClick={proceedToCheckout}
            disabled={!onlineOrderingOpen}
            data-testid="checkout-btn"
            style={{ opacity: onlineOrderingOpen ? 1 : 0.5, cursor: onlineOrderingOpen ? "pointer" : "not-allowed" }}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
      <GoogleLoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onSuccess={() => {
          setShowLoginModal(false);
          navigate("/checkout");
        }} 
      />
    </div>
  );
};

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.phone, formData.password);
      }
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page" data-testid="login-page">
      <div className="auth-card">
        <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
        <p>{isLogin ? "Login to continue ordering" : "Join Lee Vaakki family"}</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required data-testid="name-input" />
              <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required data-testid="phone-input" />
            </>
          )}
          <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required data-testid="email-input" />
          <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required data-testid="password-input" />
          <button type="submit" className="btn-primary" disabled={loading} data-testid="submit-btn">
            {loading ? "Please wait..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <div className="auth-separator" style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "#888", fontSize: "14px" }}>
          <div style={{ flex: 1, height: "1px", background: "#eee" }}></div>
          <span style={{ padding: "0 10px" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#eee" }}></div>
        </div>

        <button 
          type="button" 
          onClick={async () => {
            setError("");
            try {
              await loginWithGoogle();
              navigate(redirect);
            } catch (err) {
              if (err.message !== "Closed by user" && err.message !== "Popup blocked" && !err.message.includes("popup-closed-by-user") && !err.message.includes("popup-blocked")) {
                setError(`Login failed: ${err.message}`);
              }
            }
          }}
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #dadce0",
            borderRadius: "8px",
            background: "white",
            color: "#3c4043",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            outline: "none"
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "#f8f9fa"; e.currentTarget.style.borderColor = "#d2d4d7"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#dadce0"; }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.72v2.24h2.9c1.7-1.57 2.7-3.88 2.7-6.59z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.59-5.05-3.73H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5H.95C.35 6.2 0 7.57 0 9s.35 2.8 1 4l2.95-2.3z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.43 0 9 0 5.5 0 2.43 2.11.95 5.04l2.95 2.3c.71-2.14 2.7-3.76 5.05-3.76z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Register" : "Login"}</button>
        </p>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const { onlineOrderingOpen } = useOnlineOrdering();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", address_line: "", landmark: "", city: "", pincode: "" });
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    if (token) {
      axios.get(`${API}/addresses`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setAddresses(res.data.addresses);
          const defaultAddr = res.data.addresses.find(a => a.is_default);
          if (defaultAddr) setSelectedAddress(defaultAddr.id);
        });
    }
  }, [token]);

  const addAddress = async () => {
    const res = await axios.post(`${API}/addresses`, newAddress, { headers: { Authorization: `Bearer ${token}` } });
    setAddresses([...addresses, res.data]);
    setSelectedAddress(res.data.id);
    setShowAddAddress(false);
    setNewAddress({ label: "Home", address_line: "", landmark: "", city: "", pincode: "" });
  };

  const loadRazorpayScript = () => new Promise(resolve => {
    if (document.getElementById("razorpay-checkout-js")) return resolve(true);
    const s = document.createElement("script");
    s.id = "razorpay-checkout-js";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const placeOrder = async () => {
    if (!onlineOrderingOpen) {
      alert("Online ordering is currently closed. Please try again later.");
      return;
    }
    if (orderType === "delivery" && !selectedAddress) {
      alert("Please select a delivery address");
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        items: items.map(i => ({ menu_item_id: i.menu_item.id, quantity: i.quantity })),
        order_type: orderType,
        address_id: orderType === "delivery" ? selectedAddress : null,
        payment_method: paymentMethod,
        coupon_code: couponCode || null,
        customer_phone: user?.phone,
        brand: "dhaba"
      };
      const res = await axios.post(`${API}/orders`, orderData, { headers: { Authorization: `Bearer ${token}` } });

      if (paymentMethod === "razorpay") {
        // Create Razorpay order on backend
        const rzpRes = await axios.post(
          `${API}/payments/razorpay/create?order_id=${res.data.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error("Razorpay SDK failed to load");

        const options = {
          key: rzpRes.data.key_id,
          amount: rzpRes.data.amount,
          currency: rzpRes.data.currency || "INR",
          name: "Lee Vaakki Dhaba",
          description: `Order #${res.data.order_number}`,
          image: "https://leevaakkicafe.com/favicon.ico",
          order_id: rzpRes.data.razorpay_order_id,
          handler: async (response) => {
            // Verify payment on backend
            try {
              await axios.post(
                `${API}/payments/razorpay/verify`,
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: res.data.id
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } catch (e) {
              console.error("Payment verification error", e);
            }
            clearCart();
            navigate(`/order-success/${res.data.order_number}`);
          },
          prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
          theme: { color: "#FF6B35" },
          modal: {
            ondismiss: () => {
              setLoading(false);
              alert("Payment cancelled. Your order has been placed — please complete payment.");
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
        return;
      }

      if (paymentMethod === "upi") {
        try {
          const upiRes = await axios.post(`${API}/payments/upi/create?order_id=${res.data.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
          const upiLink = document.createElement('a');
          upiLink.href = upiRes.data.upi_url;
          upiLink.click();
        } catch (upiErr) {
          console.log("UPI redirect failed, proceeding to success page");
        }
      }

      clearCart();
      navigate(`/order-success/${res.data.order_number}`);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to place order");
    }
    setLoading(false);
  };

  const deliveryFee = orderType === "delivery" ? 40 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + tax + deliveryFee;

  return (
    <div className="checkout-page" data-testid="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-content">
        <div className="checkout-form">
          {/* Order Type */}
          <section className="checkout-section">
            <h3>Order Type</h3>
            <div className="order-type-options">
              {["delivery", "takeaway", "dine-in"].map(type => (
                <button key={type} className={`type-btn ${orderType === type ? "active" : ""}`} onClick={() => setOrderType(type)} data-testid={`type-${type}`}>
                  {type === "delivery" && "🚚 Delivery"}
                  {type === "takeaway" && "🏃 Takeaway"}
                  {type === "dine-in" && "🍽️ Dine-in"}
                </button>
              ))}
            </div>
          </section>

          {/* Delivery Address */}
          {orderType === "delivery" && (
            <section className="checkout-section">
              <h3>Delivery Address</h3>
              <div className="addresses-list">
                {addresses.map(addr => (
                  <div key={addr.id} className={`address-card ${selectedAddress === addr.id ? "selected" : ""}`} onClick={() => setSelectedAddress(addr.id)}>
                    <span className="addr-label">{addr.label}</span>
                    <p>{addr.address_line}</p>
                    <p>{addr.city} - {addr.pincode}</p>
                  </div>
                ))}
                <button className="add-address-btn" onClick={() => setShowAddAddress(true)}>+ Add New Address</button>
              </div>

              {showAddAddress && (
                <div className="add-address-form">
                  <select value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}>
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>
                  <input placeholder="Address Line" value={newAddress.address_line} onChange={e => setNewAddress({ ...newAddress, address_line: e.target.value })} />
                  <input placeholder="Landmark (optional)" value={newAddress.landmark} onChange={e => setNewAddress({ ...newAddress, landmark: e.target.value })} />
                  <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                  <input placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                  <div className="form-actions">
                    <button onClick={() => setShowAddAddress(false)}>Cancel</button>
                    <button className="btn-primary" onClick={addAddress}>Save Address</button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Payment Method */}
          <section className="checkout-section">
            <h3>Payment Method</h3>
            <div className="payment-options">
              <label className={paymentMethod === "razorpay" ? "selected" : ""}>
                <input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"} onChange={e => setPaymentMethod(e.target.value)} />
                💳 Pay Online (Card / UPI / Netbanking)
              </label>
              <label className={paymentMethod === "cod" ? "selected" : ""}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={e => setPaymentMethod(e.target.value)} />
                💵 Cash on Delivery
              </label>
            </div>
            {paymentMethod === "razorpay" && (
              <div className="upi-info">
                <p>💡 Secure payment powered by Razorpay — Card, UPI, Netbanking all supported</p>
              </div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="order-items">
            {items.map(({ menu_item, quantity }) => (
              <div key={menu_item.id} className="order-item">
                <span>{menu_item.name} x{quantity}</span>
                <span>₹{menu_item.price * quantity}</span>
              </div>
            ))}
          </div>
          <div className="summary-totals">
            <div className="summary-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className="summary-row"><span>Tax (5%)</span><span>₹{tax.toFixed(0)}</span></div>
            {orderType === "delivery" && <div className="summary-row"><span>Delivery</span><span>₹{deliveryFee}</span></div>}
            <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
          </div>
          {!onlineOrderingOpen && (
            <div style={{
              background: "#FFEBEE", color: "#C62828", borderRadius: "8px",
              padding: "10px 14px", fontSize: "13px", marginBottom: "12px",
              border: "1px solid #EF9A9A", textAlign: "center", fontWeight: 600
            }}>
              🔴 We are closed for online orders right now.
            </div>
          )}
          <button
            className="place-order-btn"
            onClick={placeOrder}
            disabled={loading || !onlineOrderingOpen}
            data-testid="place-order-btn"
            style={{ opacity: (loading || !onlineOrderingOpen) ? 0.5 : 1 }}
          >
            {loading ? "Processing..." : `Place Order • ₹${total.toFixed(0)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderSuccessPage = () => {
  const { order_number } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Fetch order details for WhatsApp message
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } });
          const order = res.data.orders.find(o => o.order_number === order_number);
          if (order) setOrderDetails(order);
        }
      } catch (err) {
        console.error("Failed to fetch order details");
      }
    };
    fetchOrder();
  }, [order_number]);

  const sendWhatsAppConfirmation = () => {
    if (!orderDetails || !user?.phone) return;
    
    let message = `🍛 *Lee Vaakki Dhaba*\n\n`;
    message += `✅ *Order Confirmed!*\n\n`;
    message += `📋 *Order #${orderDetails.order_number}*\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;
    
    message += `*Items:*\n`;
    orderDetails.items?.forEach(item => {
      message += `• ${item.menu_item?.name} × ${item.quantity} - ₹${item.item_total?.toFixed(0)}\n`;
    });
    
    message += `\n━━━━━━━━━━━━━━━\n`;
    message += `*Total: ₹${orderDetails.total?.toFixed(0)}*\n\n`;
    
    message += `📍 *${orderDetails.order_type === 'delivery' ? 'Delivery' : orderDetails.order_type}*\n`;
    if (orderDetails.delivery_address) {
      message += `${orderDetails.delivery_address.address_line}, ${orderDetails.delivery_address.city}\n\n`;
    }
    
    message += `⏱️ Estimated time: ${orderDetails.estimated_time} mins\n\n`;
    message += `Track your order:\n`;
    message += `${window.location.origin}/track?order=${orderDetails.order_number}\n\n`;
    message += `Thank you for ordering! 🙏`;
    
    const encodedMessage = encodeURIComponent(message);
    const phone = user.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="success-page" data-testid="order-success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p>Your order number is</p>
        <h2 className="order-number">{order_number}</h2>
        <p>You can track your order using this number</p>
        <div className="success-actions">
          <button className="btn-primary" onClick={() => navigate(`/track?order=${order_number}`)}>Track Order</button>
          <button className="btn-secondary" onClick={() => navigate("/menu")}>Order More</button>
        </div>
        {orderDetails && (
          <button className="whatsapp-btn" onClick={sendWhatsAppConfirmation}>
            📱 Get WhatsApp Confirmation
          </button>
        )}
      </div>
    </div>
  );
};

const TrackOrderPage = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderNum = params.get("order");
    if (orderNum) {
      setOrderNumber(orderNum);
      trackOrder(orderNum);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const trackOrder = async (num) => {
    const orderNum = num || orderNumber;
    if (!orderNum) return;
    try {
      const res = await axios.get(`${API}/orders/track/${orderNum}`);
      setOrder(res.data);
      setError("");
    } catch (err) {
      setError("Order not found");
      setOrder(null);
    }
  };

  const statusSteps = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];
  const statusLabels = {
    placed: "Order Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered"
  };

  const currentStep = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="track-page" data-testid="track-page">
      <h1>Track Your Order</h1>

      <div className="track-search">
        <input type="text" placeholder="Enter Order Number (e.g., LVD000001)" value={orderNumber} onChange={e => setOrderNumber(e.target.value.toUpperCase())} data-testid="track-input" />
        <button onClick={() => trackOrder()} data-testid="track-btn">Track</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {order && (
        <div className="order-tracking">
          <div className="order-info">
            <h2>Order #{order.order_number}</h2>
            <p>Estimated Time: {order.estimated_time} mins</p>
            <p>Order Type: {order.order_type}</p>
          </div>

          <div className="tracking-timeline">
            {statusSteps.slice(0, order.order_type === "dine-in" ? 4 : 6).map((step, index) => (
              <div key={step} className={`timeline-step ${index <= currentStep ? "completed" : ""} ${index === currentStep ? "current" : ""}`}>
                <div className="step-dot">{index <= currentStep ? <Check size={14} /> : index + 1}</div>
                <span className="step-label">{statusLabels[step]}</span>
              </div>
            ))}
          </div>

          <div className="status-history">
            <h4>Status Updates</h4>
            {order.status_history.map((entry, i) => (
              <div key={i} className="history-item">
                <span className="history-status">{statusLabels[entry.status] || entry.status}</span>
                <span className="history-time">{new Date(entry.timestamp).toLocaleString()}</span>
                {entry.notes && <p className="history-notes">{entry.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setOrders(res.data.orders));
    }
  }, [token]);

  const statusColors = {
    placed: "#FFA726",
    confirmed: "#42A5F5",
    preparing: "#AB47BC",
    ready: "#66BB6A",
    out_for_delivery: "#26C6DA",
    delivered: "#4CAF50",
    cancelled: "#EF5350"
  };

  return (
    <div className="orders-page" data-testid="orders-page">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="no-orders">
          <Package size={60} />
          <p>No orders yet</p>
          <button className="btn-primary" onClick={() => navigate("/menu")}>Start Ordering</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card" data-testid={`order-${order.order_number}`}>
              <div className="order-header">
                <span className="order-num">#{order.order_number}</span>
                <span className="order-status" style={{ background: statusColors[order.status] }}>{order.status}</span>
              </div>
              <div className="order-items-preview">
                {order.items.slice(0, 2).map((item, i) => (
                  <span key={i}>{item.menu_item.name} x{item.quantity}</span>
                ))}
                {order.items.length > 2 && <span>+{order.items.length - 2} more</span>}
              </div>
              <div className="order-footer">
                <span className="order-total">₹{order.total.toFixed(0)}</span>
                <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                <button onClick={() => navigate(`/track?order=${order.order_number}`)}>Track</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Import useParams
import { useParams } from "react-router-dom";

// Admin Page Wrapper
const AdminPage = () => {
  const { user, token, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 70px)' }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  return <AdminDashboard user={user} token={token} />;
};

function App() {
  const [onlineOrderingOpen, setOnlineOrderingOpen] = useState(true);

  useEffect(() => {
    axios.get(`${API}/config/online-ordering?brand=dhaba`)
      .then(res => setOnlineOrderingOpen(res.data.onlineOrderingOpen))
      .catch(() => {});
  }, []);

  return (
    <OnlineOrderingContext.Provider value={{ onlineOrderingOpen, setOnlineOrderingOpen }}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="App">
              <InstallPrompt />
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/snacks" element={<SnacksPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-success/:order_number" element={<OrderSuccessPage />} />
                  <Route path="/track" element={<TrackOrderPage />} />
                  <Route path="/orders" element={<MyOrdersPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </OnlineOrderingContext.Provider>
  );
}

export default App;
