import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  QrCode,
  Smartphone,
  Building2,
  Wallet,
  Coins,
  CheckCircle2,
  Clock,
  Lock,
  X,
  Copy,
  Sparkles,
  PackageCheck
} from "lucide-react";
import "../customer.css";

const PAYMENT_OPTIONS = [
  { value: "upi", label: "UPI Instant Pay (GPay, PhonePe, Paytm)", icon: "📱", tag: "Fastest" },
  { value: "card", label: "Credit / Debit Card", icon: "💳", tag: "Secure 3D" },
  { value: "netbanking", label: "Net Banking (All Indian Banks)", icon: "🏦", tag: "Instant" },
  { value: "wallet", label: "Wallets (Paytm, Amazon Pay)", icon: "👛", tag: "Cashback" },
  { value: "cod", label: "Cash on Delivery (COD)", icon: "💵", tag: "Verified" },
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
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const logRef = useRef(null);

  // Payment Gateway Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState("select"); // 'select' | 'processing' | 'success'
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

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

  // Open Payment Modal
  const handleStartCheckout = () => {
    if (cart.length === 0) return;
    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    if (!currentUser.id) {
      setStatusMessage("Please sign in again before placing an order.");
      return;
    }
    setShowPaymentModal(true);
    setPaymentStep("select");
  };

  // Submit Payment Gateway Transaction
  const handleProcessPayment = async () => {
    setPaymentStep("processing");
    const currentUser = JSON.parse(localStorage.getItem("user")) || {};

    try {
      // Simulate gateway processing delay for realism
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = await createOrder({
        userId: currentUser.id,
        items: cart.map((item) => ({ id: item.id, qty: item.qty || 1 })),
        paymentMethod,
        address: ADDRESSES.find((a) => a.id === selectedAddress),
      });

      // Update Local App State
      setOrders((prev) => [response.order, ...(prev || [])]);
      setDeliveryPeople((prev) =>
        (prev || []).map((p) =>
          p.name === response.order?.deliveryPartner
            ? { ...p, activeOrders: (p.activeOrders || 0) + 1 }
            : p
        )
      );
      setMedicines((prev) =>
        (prev || []).map((med) => {
          const ci = cart.find((i) => i.id === med.id);
          return ci ? { ...med, stock: med.stock - (ci.qty || 1) } : med;
        })
      );

      // Clear Cart
      setCart([]);
      localStorage.setItem("cart", JSON.stringify([]));

      setConfirmedOrder(response.order);
      setPaymentStep("success");
    } catch (error) {
      console.error("Checkout Payment Error:", error);
      setStatusMessage(error.message || "Payment failed. Please try again.");
      setShowPaymentModal(false);
      setPaymentStep("select");
    }
  };

  // Redirect Customer to Customer My Orders Page (/orders)
  const handleGoToOrders = () => {
    setShowPaymentModal(false);
    navigate("/orders");
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText("pharmacare@upi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="customer-page">
      <div className="customer-container">
        
        {/* Header */}
        <div className="section-header-wrap">
          <div>
            <h1 className="page-title">Shopping Cart & Secure Checkout</h1>
            <p className="page-subtitle">Review items, select delivery address, and pay via instant gateway.</p>
          </div>
        </div>

        {/* Checkout Progress Stepper */}
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
            Instant Payment
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
                <button onClick={() => navigate("/inventory")} className="btn-primary-action" style={{ display: "inline-flex" }}>
                  Browse Medicines
                </button>
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
                  <CreditCard size={16} /> Select Payment Option
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "11px 14px",
                        borderRadius: 10,
                        border: paymentMethod === opt.value ? "1.5px solid #087EA4" : "1px solid #E2E8F0",
                        background: paymentMethod === opt.value ? "#F0FDFA" : "#FFFFFF",
                        cursor: cart.length === 0 ? "not-allowed" : "pointer",
                        fontSize: 13.5,
                        fontWeight: 600
                      }}
                      onClick={() => cart.length > 0 && setPaymentMethod(opt.value)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === opt.value}
                          onChange={() => setPaymentMethod(opt.value)}
                          disabled={cart.length === 0}
                        />
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#E0F2FE", color: "#0369A1", padding: "2px 6px", borderRadius: 4 }}>
                        {opt.tag}
                      </span>
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
                onClick={handleStartCheckout}
                disabled={cart.length === 0 || placingOrder}
              >
                Proceed to Payment (₹{totalAmount.toFixed(0)})
                <ArrowRight size={16} />
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "#64748B", marginTop: 14, textAlign: "center" }}>
                <ShieldCheck size={16} color="#0F766E" /> Encrypted 256-bit Secure Gateway
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ===== COMMERCIAL PAYMENT GATEWAY MODAL ===== */}
      {showPaymentModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 20, maxWidth: 540, width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", overflow: "hidden", animation: "modalPop 0.2s ease-out" }}>
            
            {/* Header */}
            <div style={{ padding: "20px 24px", background: "#0F172A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#087EA4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={18} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>PharmaCare Pay Gateway</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#94A3B8" }}>256-Bit SSL Encrypted Checkout</p>
                </div>
              </div>

              {paymentStep !== "processing" && (
                <button onClick={() => setShowPaymentModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              
              {/* STEP 1: PAYMENT METHOD FORM */}
              {paymentStep === "select" && (
                <div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Payable Amount</span>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>₹{totalAmount.toFixed(0)}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#087EA4", background: "#E0F2FE", padding: "4px 10px", borderRadius: 6 }}>
                      {paymentMethod.toUpperCase()} Method
                    </span>
                  </div>

                  {/* UPI Form */}
                  {paymentMethod === "upi" && (
                    <div>
                      <div style={{ textAlign: "center", padding: 16, background: "#F0F9FF", border: "1px dashed #087EA4", borderRadius: 12, marginBottom: 16 }}>
                        <QrCode size={90} color="#087EA4" style={{ margin: "0 auto 8px" }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Scan QR code or Pay to UPI ID</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}>
                          <code style={{ background: "#FFFFFF", padding: "4px 10px", borderRadius: 6, border: "1px solid #BAE6FD", fontSize: 13, fontWeight: 800, color: "#0369A1" }}>
                            pharmacare@upi
                          </code>
                          <button onClick={copyUpiId} style={{ background: "none", border: "none", color: "#087EA4", cursor: "pointer" }}>
                            {copiedUpi ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Or enter your UPI VPA ID</label>
                        <input
                          type="text"
                          placeholder="e.g. mobileNumber@upi / username@okaxis"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, outline: "none" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Card Form */}
                  {paymentMethod === "card" && (
                    <div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="Name as on Card"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13 }}
                        />
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13 }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>CVV Code</label>
                          <input
                            type="password"
                            placeholder="123"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Banking Form */}
                  {paymentMethod === "netbanking" && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>Select Bank</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5 }}
                      >
                        <option value="HDFC">HDFC Bank</option>
                        <option value="SBI">State Bank of India (SBI)</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="AXIS">Axis Bank</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}

                  {/* COD Form */}
                  {paymentMethod === "cod" && (
                    <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", padding: 16, borderRadius: 12, marginBottom: 16, textAlign: "center" }}>
                      <Coins size={36} color="#B45309" style={{ margin: "0 auto 6px" }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#B45309" }}>Cash on Delivery</div>
                      <div style={{ fontSize: 12, color: "#78350F", marginTop: 4 }}>Pay ₹{totalAmount.toFixed(0)} cash directly to our delivery executive upon arrival.</div>
                    </div>
                  )}

                  <button
                    onClick={handleProcessPayment}
                    style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #087EA4 0%, #0284C7 100%)", color: "#FFF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(8, 126, 164, 0.3)" }}
                  >
                    <Lock size={16} /> Pay ₹{totalAmount.toFixed(0)} Securely
                  </button>
                </div>
              )}

              {/* STEP 2: PROCESSING ANIMATION */}
              {paymentStep === "processing" && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid #E0F2FE", borderTop: "4px solid #087EA4", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
                  <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Authorizing Payment</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Connecting securely with your bank. Please do not close or refresh this window...</p>
                </div>
              )}

              {/* STEP 3: SUCCESS & REDIRECT TO CUSTOMER MY ORDERS (/orders) */}
              {paymentStep === "success" && (
                <div style={{ textAlign: "center", padding: "20px 10px" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Order Confirmed & Paid! 🎉</h3>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748B" }}>Your order has been routed to our nearest pharmacy branch for dispatch.</p>

                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 8, borderBottom: "1px solid #E2E8F0", marginBottom: 8 }}>
                      <span style={{ color: "#64748B" }}>Order ID:</span>
                      <strong style={{ color: "#087EA4" }}>#ORD-{confirmedOrder?.id || Date.now().toString().slice(-5)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 8, borderBottom: "1px solid #E2E8F0", marginBottom: 8 }}>
                      <span style={{ color: "#64748B" }}>Amount Paid:</span>
                      <strong style={{ color: "#16A34A" }}>₹{totalAmount.toFixed(0)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748B" }}>Est. Delivery Time:</span>
                      <strong>30 Minutes Express</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleGoToOrders}
                    style={{ width: "100%", padding: "13px", background: "#087EA4", color: "#FFF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <PackageCheck size={18} /> Track My Order (Go to My Orders)
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
