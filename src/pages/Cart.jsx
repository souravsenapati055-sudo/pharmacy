import { useMemo, useRef, useState } from "react";
import { createOrder } from "../lib/store";
import {
  ShoppingBag,
  Trash2,
  MapPin,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import "../customer.css";

const PAYMENT_OPTIONS = [
  { value: "cod", label: "Cash on Delivery", icon: "💵" },
  { value: "upi", label: "UPI Instant Pay", icon: "📱" },
  { value: "card", label: "Credit / Debit Card", icon: "💳" },
];

const ADDRESSES = [
  { id: 1, label: "Home Address", details: "45/A Park Street, Sector 5, City" },
  { id: 2, label: "Office Address", details: "Tech Park Tower B, 4th Floor, City" },
];

export default function Cart({
  cart = [],
  setCart,
  setOrders,
  orders,
  deliveryPeople,
  setDeliveryPeople,
  addToCart,
  medicines,
  setMedicines,
}) {
  const [selectedAddress, setSelectedAddress] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const logRef = useRef(null);

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: (item.qty || 1) - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const totalMRP = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0),
    [cart]
  );
  const totalDiscount = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * ((item.discount || item.discount_percent || 0) / 100) * (item.qty || 1), 0),
    [cart]
  );
  const deliveryFee = cart.length > 0 ? 7 : 0;
  const totalAmount = totalMRP - totalDiscount + deliveryFee;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    if (!currentUser.id) {
      setStatusMessage("Please sign in again before placing an order.");
      return;
    }
    setPlacingOrder(true);
    setStatusMessage("");
    try {
      const response = await createOrder({
        userId: currentUser.id,
        items: cart.map((item) => ({ id: item.id, qty: item.qty || 1 })),
        paymentMethod,
        address: ADDRESSES.find((a) => a.id === selectedAddress),
      });
      setOrders((prev) => [response.order, ...prev]);
      setDeliveryPeople((prev) =>
        prev.map((p) =>
          p.name === response.order.deliveryPartner
            ? { ...p, activeOrders: (p.activeOrders || 0) + 1 }
            : p
        )
      );
      setMedicines((prev) =>
        prev.map((med) => {
          const ci = cart.find((i) => i.id === med.id);
          return ci ? { ...med, stock: med.stock - (ci.qty || 1) } : med;
        })
      );
      setCart([]);
      localStorage.setItem("cart", JSON.stringify([]));
      setStatusMessage(response.message);
      logRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="customer-page">
      <div className="customer-container">
        
        {/* Header */}
        <div className="section-header-wrap">
          <div>
            <h1 className="page-title">Shopping Cart & Checkout</h1>
            <p className="page-subtitle">Review items, delivery address, and proceed to secure checkout.</p>
          </div>
        </div>

        {/* Checkout Progress Stepper (Section 9) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 24px", marginBottom: 32 }} className="checkout-progress-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 700, color: "#087EA4" }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#087EA4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>1</span>
            Cart Review
          </div>
          <div style={{ height: 1, flex: 1, background: "#E2E8F0", margin: "0 16px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 700, color: "#087EA4" }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#087EA4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>2</span>
            Delivery Address
          </div>
          <div style={{ height: 1, flex: 1, background: "#E2E8F0", margin: "0 16px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 700, color: "#087EA4" }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#087EA4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>3</span>
            Payment Method
          </div>
        </div>

        {/* Cart Grid Layout */}
        <div className="cart-grid-layout">
          
          {/* LEFT: Cart Items & Address */}
          <div>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 24px", background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0" }}>
                <ShoppingBag size={48} color="#087EA4" style={{ marginBottom: 12, opacity: 0.4 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>Your Cart is Empty</h3>
                <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20 }}>Explore our certified medicines and add items to your cart.</p>
                <a href="/inventory" className="btn-primary-action" style={{ display: "inline-flex" }}>
                  Browse Medicines
                </a>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  Items in Cart ({cart.length})
                </div>

                {cart.map((item) => {
                  const discountPct = item.discount || item.discount_percent || 0;
                  const discountedPrice = discountPct > 0 ? item.price * (1 - discountPct / 100) : item.price;

                  return (
                    <div key={item.id} className="cart-item-row">
                      <img
                        className="cart-item-img-thumb"
                        src={item.image || "https://placehold.co/80x80/e0f2fe/087ea4?text=PharmaCare"}
                        alt={item.name}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.name}</div>
                        <div style={{ fontSize: 12.5, color: "#087EA4", fontWeight: 600, marginTop: 2 }}>{item.category}</div>
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>₹{discountedPrice.toFixed(0)}</span>
                          {discountPct > 0 && <span style={{ fontSize: 12, color: "#94A3B8", textDecoration: "line-through" }}>₹{item.price}</span>}
                        </div>
                      </div>

                      <div className="cart-qty-control">
                        <button className="cart-qty-btn" onClick={() => removeFromCart(item.id)}><Minus size={14} /></button>
                        <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty || 1}</span>
                        <button className="cart-qty-btn" onClick={() => addToCart(item)}><Plus size={14} /></button>
                      </div>

                      <button
                        style={{ border: "none", background: "none", color: "#DC2626", cursor: "pointer", padding: 6 }}
                        onClick={() => setCart((prev) => prev.filter((i) => i.id !== item.id))}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}

                {/* Delivery Address Selector */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24, marginTop: 24 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <MapPin size={18} color="#087EA4" /> Select Delivery Address
                  </div>
                  <select
                    className="ai-input-box"
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(Number(e.target.value))}
                  >
                    {ADDRESSES.map((a) => (
                      <option key={a.id} value={a.id}>{a.label}: {a.details}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Sticky Summary */}
          <div>
            <div className="sticky-order-summary" ref={logRef}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 16px 0" }}>Order Summary</h3>

              <div className="summary-line-item">
                <span>Items Subtotal</span>
                <span>₹{totalMRP.toFixed(0)}</span>
              </div>

              <div className="summary-line-item" style={{ color: "#16A34A", fontWeight: 600 }}>
                <span>Discount Savings</span>
                <span>− ₹{totalDiscount.toFixed(0)}</span>
              </div>

              <div className="summary-line-item">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>

              <div className="summary-line-item total">
                <span>Total Amount</span>
                <span>₹{totalAmount.toFixed(0)}</span>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <CreditCard size={16} /> Select Payment Method
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 14px",
                        borderRadius: 8,
                        border: paymentMethod === opt.value ? "1.5px solid #087EA4" : "1px solid #E2E8F0",
                        background: paymentMethod === opt.value ? "#F0FDFA" : "#FFFFFF",
                        cursor: cart.length === 0 ? "not-allowed" : "pointer",
                        fontSize: 13.5,
                        fontWeight: 600
                      }}
                      onClick={() => cart.length > 0 && setPaymentMethod(opt.value)}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value)}
                        disabled={cart.length === 0}
                      />
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {statusMessage && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#DCFCE7", color: "#16A34A", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
                  ✅ {statusMessage}
                </div>
              )}

              <button
                className="btn-primary-action"
                style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
                onClick={placeOrder}
                disabled={cart.length === 0 || placingOrder}
              >
                {placingOrder ? "Processing Order..." : `Proceed to Checkout (₹${totalAmount.toFixed(0)})`}
                {!placingOrder && <ArrowRight size={16} />}
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "#64748B", marginTop: 14, textAlign: "center" }}>
                <ShieldCheck size={16} color="#0F766E" /> Encrypted 256-bit Secure Checkout
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
