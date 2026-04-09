import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, Package, UtensilsCrossed, Ticket, Users, TrendingUp, 
  Clock, CheckCircle, Truck, ChefHat, XCircle, Eye, Edit, Trash2, Plus,
  IndianRupee, ShoppingBag, ArrowUp, ArrowDown, RefreshCw, Search,
  Filter, MoreVertical, X, Save, Leaf, Image, Bell, Volume2, VolumeX
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

// Notification sound
const playNotificationSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRYAQKnY5pF3BRxFsu/ujWQDAEnN/fWDSwAAS///+3Y6AABO//z7cioAAFT/+vVuGgAAWv/27WoSAABf/+/oZQsAAGT/5+RfBQAAaf/d3loAAABu/9TYVAIAAHP/y9JPBQAAZ//F0EoIAABb/8HOSREAAFD/wMdEGgAAR/+9xT8jAAA//7rDOiwAADj/t8E1NQAAMv+0vzA+AAAr/7G9K0cAACb/r7smUQAAIf+tuhxbAAAd/6y5F2UAAB3/q7gRbwAAHv+quAt5AAAf/6m3BoMAACD/qLYAjQAAIf+otZeXAAAi/6e0');
  audio.play().catch(() => {});
};

const AdminDashboard = ({ user, token }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wsRef = useRef(null);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const ws = new WebSocket(`${WS_URL}/ws/admin`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      // Send ping every 30 seconds to keep alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 30000);
      ws.pingInterval = pingInterval;
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_order') {
        // Play notification sound
        if (soundEnabled) {
          playNotificationSound();
        }
        // Add to notifications
        setNotifications(prev => [{
          id: Date.now(),
          ...data.order,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]);
        // Refresh data
        fetchData();
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      if (ws.pingInterval) clearInterval(ws.pingInterval);
      setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current = ws;
  }, [soundEnabled]);

  useEffect(() => {
    // Wait for auth to be checked
    if (user === null && token) {
      // Still loading user
      return;
    }
    setAuthChecked(true);
    
    if (!user?.is_admin) {
      navigate("/login?redirect=/admin");
      return;
    }
    fetchData();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        if (wsRef.current.pingInterval) clearInterval(wsRef.current.pingInterval);
        wsRef.current.close();
      }
    };
  }, [user, token, navigate, connectWebSocket]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, menuRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/menu`)
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data.orders);
      setMenuItems(menuRes.data.items);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
    setLoading(false);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "coupons", label: "Coupons", icon: Ticket },
  ];

  if (!authChecked || loading) {
    return (
      <div className="admin-loading">
        <RefreshCw className="spin" size={40} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user?.is_admin) {
    return null; // Will redirect
  }

  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      {/* Notification Toast */}
      {notifications.length > 0 && (
        <div className="notification-toast">
          <div className="toast-header">
            <Bell size={18} />
            <span>New Order!</span>
            <button onClick={() => setNotifications([])}><X size={16} /></button>
          </div>
          <div className="toast-body">
            <strong>#{notifications[0].order_number}</strong>
            <p>{notifications[0].user_name} - ₹{notifications[0].total?.toFixed(0)}</p>
            <p>{notifications[0].items_count} items • {notifications[0].order_type}</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span>🍛</span>
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`admin-tab-${tab.id}`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
                {tab.id === "orders" && stats?.pending_orders > 0 && (
                  <span className="nav-badge">{stats.pending_orders}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="admin-user">
          <div className="user-avatar">{user?.name?.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="header-actions">
            <button 
              className={`sound-toggle ${soundEnabled ? 'on' : 'off'}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button className="refresh-btn" onClick={fetchData}>
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === "overview" && <OverviewTab stats={stats} orders={orders} />}
          {activeTab === "orders" && <OrdersTab orders={orders} token={token} onUpdate={fetchData} />}
          {activeTab === "menu" && <MenuTab menuItems={menuItems} token={token} onUpdate={fetchData} />}
          {activeTab === "coupons" && <CouponsTab token={token} />}
        </div>
      </main>
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ stats, orders }) => {
  const recentOrders = orders?.slice(0, 5) || [];
  
  const statCards = [
    { label: "Total Orders", value: stats?.total_orders || 0, icon: ShoppingBag, color: "#2E7D32", trend: "+12%" },
    { label: "Today's Orders", value: stats?.today_orders || 0, icon: Package, color: "#FF6B35", trend: "+8%" },
    { label: "Total Revenue", value: `₹${(stats?.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: "#1976D2", trend: "+15%" },
    { label: "Pending Orders", value: stats?.pending_orders || 0, icon: Clock, color: "#E53935", trend: "-3%" },
  ];

  return (
    <div className="overview-tab">
      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const isPositive = stat.trend.startsWith("+");
          return (
            <div key={i} className="stat-card" style={{ "--card-color": stat.color }}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className={`stat-trend ${isPositive ? "up" : "down"}`}>
                {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {stat.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="recent-orders-section">
        <h3>Recent Orders</h3>
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td className="order-num">{order.order_number}</td>
                  <td>{order.user_name}</td>
                  <td>{order.items?.length} items</td>
                  <td className="order-total">₹{order.total?.toFixed(0)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="order-time">{new Date(order.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="status-distribution">
        <h3>Order Status</h3>
        <div className="status-cards">
          {["placed", "confirmed", "preparing", "ready", "delivered"].map(status => {
            const count = orders?.filter(o => o.status === status).length || 0;
            return (
              <div key={status} className="status-card">
                <StatusBadge status={status} />
                <span className="status-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Orders Tab
const OrdersTab = ({ orders, token, onUpdate }) => {
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status === filter);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await axios.put(
        `${API}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
      setSelectedOrder(null);
    } catch (err) {
      alert("Failed to update status");
    }
    setUpdating(false);
  };

  const statusFlow = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

  return (
    <div className="orders-tab">
      {/* Filters */}
      <div className="orders-filters">
        <div className="filter-tabs">
          {["all", "placed", "confirmed", "preparing", "ready", "delivered"].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? "active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "All Orders" : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="count">
                {status === "all" ? orders.length : orders.filter(o => o.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list-admin">
        {filteredOrders.map(order => (
          <div key={order.id} className="order-card-admin" data-testid={`admin-order-${order.order_number}`}>
            <div className="order-header-admin">
              <div className="order-id">
                <span className="order-number">#{order.order_number}</span>
                <span className="order-type-badge">{order.order_type}</span>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="order-body">
              <div className="order-customer">
                <strong>{order.user_name}</strong>
                <span>{order.user_phone}</span>
              </div>
              <div className="order-items-list">
                {order.items?.map((item, i) => (
                  <span key={i} className="order-item-tag">
                    {item.menu_item?.name} × {item.quantity}
                  </span>
                ))}
              </div>
              {order.delivery_address && (
                <div className="order-address">
                  📍 {order.delivery_address.address_line}, {order.delivery_address.city}
                </div>
              )}
            </div>

            <div className="order-footer-admin">
              <div className="order-meta">
                <span className="order-total-admin">₹{order.total?.toFixed(0)}</span>
                <span className="order-time-admin">{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <div className="order-actions">
                <button className="action-btn view" onClick={() => setSelectedOrder(order)}>
                  <Eye size={16} /> View
                </button>
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <button 
                    className="action-btn update"
                    onClick={() => {
                      const currentIdx = statusFlow.indexOf(order.status);
                      if (currentIdx < statusFlow.length - 1) {
                        updateStatus(order.id, statusFlow[currentIdx + 1]);
                      }
                    }}
                    disabled={updating}
                  >
                    <CheckCircle size={16} /> Next Status
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{selectedOrder.order_number}</h3>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> {selectedOrder.user_name}</p>
                <p><strong>Phone:</strong> {selectedOrder.user_phone}</p>
                <p><strong>Order Type:</strong> {selectedOrder.order_type}</p>
                {selectedOrder.delivery_address && (
                  <p><strong>Address:</strong> {selectedOrder.delivery_address.address_line}, {selectedOrder.delivery_address.city} - {selectedOrder.delivery_address.pincode}</p>
                )}
              </div>
              <div className="detail-section">
                <h4>Order Items</h4>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="detail-item">
                    <span>{item.menu_item?.name} × {item.quantity}</span>
                    <span>₹{item.item_total?.toFixed(0)}</span>
                  </div>
                ))}
                <div className="detail-totals">
                  <div className="detail-item"><span>Subtotal</span><span>₹{selectedOrder.subtotal?.toFixed(0)}</span></div>
                  {selectedOrder.discount > 0 && <div className="detail-item discount"><span>Discount</span><span>-₹{selectedOrder.discount?.toFixed(0)}</span></div>}
                  <div className="detail-item"><span>Tax</span><span>₹{selectedOrder.tax?.toFixed(0)}</span></div>
                  <div className="detail-item"><span>Delivery</span><span>₹{selectedOrder.delivery_fee?.toFixed(0)}</span></div>
                  <div className="detail-item total"><span>Total</span><span>₹{selectedOrder.total?.toFixed(0)}</span></div>
                </div>
              </div>
              <div className="detail-section">
                <h4>Update Status</h4>
                <div className="status-buttons">
                  {statusFlow.map(status => (
                    <button
                      key={status}
                      className={`status-btn ${selectedOrder.status === status ? "current" : ""}`}
                      onClick={() => updateStatus(selectedOrder.id, status)}
                      disabled={updating || selectedOrder.status === status}
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Menu Tab
const MenuTab = ({ menuItems, token, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", category: "Starters",
    image_url: "", is_veg: true, is_bestseller: false, is_available: true
  });
  const [saving, setSaving] = useState(false);

  const categories = ["Starters", "Mains", "Breads", "Combos", "Beverages", "Desserts"];

  const openForm = (item = null) => {
    if (item) {
      setFormData({ ...item, price: item.price.toString() });
      setEditItem(item);
    } else {
      setFormData({
        name: "", description: "", price: "", category: "Starters",
        image_url: "", is_veg: true, is_bestseller: false, is_available: true
      });
      setEditItem(null);
    }
    setShowForm(true);
  };

  const saveItem = async () => {
    if (!formData.name || !formData.price) {
      alert("Name and price are required");
      return;
    }
    setSaving(true);
    try {
      const data = { ...formData, price: parseFloat(formData.price), tags: [] };
      if (editItem) {
        await axios.put(`${API}/admin/menu/${editItem.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/admin/menu`, data, { headers: { Authorization: `Bearer ${token}` } });
      }
      onUpdate();
      setShowForm(false);
    } catch (err) {
      alert("Failed to save item");
    }
    setSaving(false);
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`${API}/admin/menu/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      onUpdate();
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  return (
    <div className="menu-tab-admin">
      <div className="menu-header-admin">
        <p>{menuItems.length} items in menu</p>
        <button className="add-btn" onClick={() => openForm()} data-testid="add-menu-item-btn">
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="menu-grid-admin">
        {menuItems.map(item => (
          <div key={item.id} className="menu-card-admin" data-testid={`menu-card-${item.id}`}>
            <div className="menu-card-image">
              <img src={item.image_url} alt={item.name} />
              <div className="menu-card-badges">
                {item.is_veg ? <span className="badge veg"><Leaf size={12} /> Veg</span> : <span className="badge non-veg">Non-Veg</span>}
                {item.is_bestseller && <span className="badge bestseller">Bestseller</span>}
                {!item.is_available && <span className="badge unavailable">Unavailable</span>}
              </div>
            </div>
            <div className="menu-card-body">
              <h4>{item.name}</h4>
              <p className="menu-card-desc">{item.description}</p>
              <div className="menu-card-footer">
                <span className="menu-card-price">₹{item.price}</span>
                <span className="menu-card-category">{item.category}</span>
              </div>
            </div>
            <div className="menu-card-actions">
              <button className="edit-btn" onClick={() => openForm(item)}><Edit size={16} /></button>
              <button className="delete-btn" onClick={() => deleteItem(item.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? "Edit Menu Item" : "Add Menu Item"}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Item name" />
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Price in ₹" />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Item description" rows={3} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input type="text" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="form-group checkboxes">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={formData.is_veg} onChange={e => setFormData({ ...formData, is_veg: e.target.checked })} />
                    Vegetarian
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={formData.is_bestseller} onChange={e => setFormData({ ...formData, is_bestseller: e.target.checked })} />
                    Bestseller
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={formData.is_available} onChange={e => setFormData({ ...formData, is_available: e.target.checked })} />
                    Available
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="save-btn" onClick={saveItem} disabled={saving}>
                <Save size={16} /> {saving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Coupons Tab
const CouponsTab = ({ token }) => {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "", discount_type: "percentage", discount_value: "",
    min_order_value: "0", max_discount: "", valid_from: "", valid_until: "", is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API}/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } });
      setCoupons(res.data.coupons || []);
    } catch (err) {
      // Coupons endpoint might not exist, use empty array
      setCoupons([]);
    }
  };

  const saveCoupon = async () => {
    if (!formData.code || !formData.discount_value) {
      alert("Code and discount value are required");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_order_value: parseFloat(formData.min_order_value || 0),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        valid_from: formData.valid_from || new Date().toISOString(),
        valid_until: formData.valid_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
      await axios.post(`${API}/admin/coupons`, data, { headers: { Authorization: `Bearer ${token}` } });
      fetchCoupons();
      setShowForm(false);
      setFormData({
        code: "", discount_type: "percentage", discount_value: "",
        min_order_value: "0", max_discount: "", valid_from: "", valid_until: "", is_active: true
      });
    } catch (err) {
      alert("Failed to create coupon");
    }
    setSaving(false);
  };

  return (
    <div className="coupons-tab">
      <div className="coupons-header">
        <p>{coupons.length} active coupons</p>
        <button className="add-btn" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      <div className="coupons-grid">
        {coupons.map(coupon => (
          <div key={coupon.id} className="coupon-card">
            <div className="coupon-code">{coupon.code}</div>
            <div className="coupon-discount">
              {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
            </div>
            <div className="coupon-details">
              <span>Min order: ₹{coupon.min_order_value}</span>
              {coupon.max_discount && <span>Max discount: ₹{coupon.max_discount}</span>}
            </div>
            <div className={`coupon-status ${coupon.is_active ? "active" : "inactive"}`}>
              {coupon.is_active ? "Active" : "Inactive"}
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Coupon</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g., SAVE20" />
                </div>
                <div className="form-group">
                  <label>Discount Type</label>
                  <select value={formData.discount_type} onChange={e => setFormData({ ...formData, discount_type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input type="number" value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: e.target.value })} placeholder={formData.discount_type === "percentage" ? "e.g., 20" : "e.g., 100"} />
                </div>
                <div className="form-group">
                  <label>Min Order Value</label>
                  <input type="number" value={formData.min_order_value} onChange={e => setFormData({ ...formData, min_order_value: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Max Discount (for %)</label>
                  <input type="number" value={formData.max_discount} onChange={e => setFormData({ ...formData, max_discount: e.target.value })} placeholder="Optional" />
                </div>
                <div className="form-group checkboxes">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="save-btn" onClick={saveCoupon} disabled={saving}>
                <Save size={16} /> {saving ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    placed: { color: "#FFA726", icon: Clock, label: "Placed" },
    confirmed: { color: "#42A5F5", icon: CheckCircle, label: "Confirmed" },
    preparing: { color: "#AB47BC", icon: ChefHat, label: "Preparing" },
    ready: { color: "#66BB6A", icon: Package, label: "Ready" },
    out_for_delivery: { color: "#26C6DA", icon: Truck, label: "Out for Delivery" },
    delivered: { color: "#4CAF50", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "#EF5350", icon: XCircle, label: "Cancelled" }
  };

  const config = statusConfig[status] || statusConfig.placed;
  const Icon = config.icon;

  return (
    <span className="status-badge" style={{ background: `${config.color}20`, color: config.color }}>
      <Icon size={14} /> {config.label}
    </span>
  );
};

export default AdminDashboard;
