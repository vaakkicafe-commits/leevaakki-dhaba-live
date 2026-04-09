import React, { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import "@/components/AdminDashboard.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, User, MapPin, Clock, Phone, ChevronRight, Plus, Minus, Trash2, X, Check, Search, Star, Flame, Leaf, Menu as MenuIcon, Home, Package, LogOut, Settings, Utensils, ChefHat, Croissant, Gift, Coffee, IceCream2, Download, Smartphone } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
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

// Components
const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" data-testid="logo">
          <span className="logo-icon">🍛</span>
          <span className="logo-text">Lee Vaakki</span>
        </Link>

        <div className="navbar-links">
          <Link to="/menu" className="nav-link" data-testid="menu-link">Menu</Link>
          <Link to="/track" className="nav-link" data-testid="track-link">Track Order</Link>
        </div>

        <div className="navbar-actions">
          <button className="cart-btn" onClick={() => navigate("/cart")} data-testid="cart-btn">
            <ShoppingCart size={22} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>

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
                  {user.is_admin && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                      <Settings size={18} /> Admin Panel
                    </Link>
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

// Pages
const HomePage = () => {
  const [bestsellers, setBestsellers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/menu`).then(res => {
      setBestsellers(res.data.items.filter(i => i.is_bestseller).slice(0, 6));
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
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

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

const MenuItemCard = ({ item }) => {
  const { addItem, items, updateQuantity } = useCart();
  const cartItem = items.find(i => i.menu_item.id === item.id);
  const quantity = cartItem?.quantity || 0;

  // Vibration feedback
  const vibrate = (pattern = 50) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
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
    vibrate(quantity === 1 ? [30, 50, 30] : 30); // Double vibrate when removing
    updateQuantity(item.id, quantity - 1);
  };

  return (
    <div className="menu-item-card" data-testid={`menu-item-${item.id}`}>
      <div className="item-image">
        <img src={item.image_url} alt={item.name} loading="lazy" />
        {item.is_bestseller && <span className="bestseller-tag"><Flame size={12} /> Bestseller</span>}
        <span className={`veg-tag ${item.is_veg ? "veg" : "non-veg"}`}>
          {item.is_veg ? <Leaf size={12} /> : "●"}
        </span>
      </div>
      <div className="item-details">
        <h4>{item.name}</h4>
        <p className="item-desc">{item.description}</p>
        <div className="item-footer">
          <span className="item-price">₹{item.price}</span>
          {quantity === 0 ? (
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

const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);
  }, [location]);

  useEffect(() => {
    axios.get(`${API}/menu`).then(res => {
      setItems(res.data.items);
      const cats = [...new Set(res.data.items.map(i => i.category))];
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
          filteredItems.map(item => <MenuItemCard key={item.id} item={item} />)
        ) : (
          <div className="no-items">No items found</div>
        )}
      </div>
    </div>
  );
};

const CartPage = () => {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

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
    if (!user) {
      navigate("/login?redirect=/checkout");
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

          <button className="checkout-btn" onClick={proceedToCheckout} data-testid="checkout-btn">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
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
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("cod");
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

  const placeOrder = async () => {
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
        customer_phone: user?.phone
      };
      const res = await axios.post(`${API}/orders`, orderData, { headers: { Authorization: `Bearer ${token}` } });
      
      // If UPI payment selected, get UPI URL and open
      if (paymentMethod === "upi") {
        try {
          const upiRes = await axios.post(`${API}/payments/upi/create?order_id=${res.data.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
          // Try to open UPI intent
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
              <label className={paymentMethod === "cod" ? "selected" : ""}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={e => setPaymentMethod(e.target.value)} />
                💵 Cash on Delivery
              </label>
              <label className={paymentMethod === "upi" ? "selected" : ""}>
                <input type="radio" name="payment" value="upi" checked={paymentMethod === "upi"} onChange={e => setPaymentMethod(e.target.value)} />
                📱 Pay via UPI
              </label>
            </div>
            {paymentMethod === "upi" && (
              <div className="upi-info">
                <p>💡 After placing order, you'll be redirected to your UPI app to complete payment</p>
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
          <button className="place-order-btn" onClick={placeOrder} disabled={loading} data-testid="place-order-btn">
            {loading ? "Placing Order..." : `Place Order • ₹${total.toFixed(0)}`}
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
  return (
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
  );
}

export default App;
