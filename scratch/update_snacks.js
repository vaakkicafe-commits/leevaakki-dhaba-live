const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.js', 'utf-8');

if (!content.substring(0, 1000).includes('Heart')) {
    content = content.replace(/(import \{.*?)(\} from "lucide-react";)/, '\, Heart\');
}

const newSnacks = // --- Snacks Data & Component ---
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
            <div key={item.id} style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: "12px", padding: "0.75rem", position: "relative", border: "1px solid #f0f0f0" }}>
              {/* Product Image and Add Button */}
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <Heart size={18} style={{ position: "absolute", top: "0.25rem", right: "0.25rem", color: "#e91e63", cursor: "pointer" }} />
                <div style={{ padding: "0.5rem", background: "#f8f9fa", borderRadius: "8px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
                  <img src={item.image_url} alt={item.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", mixBlendMode: "multiply", borderRadius: "4px" }} />
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
};;

content = content.replace(/\/\/ --- Snacks Data & Component ---[\s\S]*?};\n/, newSnacks + '\n');
fs.writeFileSync('frontend/src/App.js', content, 'utf-8');
console.log('App.js updated via Node!');
