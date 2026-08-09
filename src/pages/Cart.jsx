import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  retryOrderPayment,
  applyCoupon,
  fetchPaymentConfig,
} from "../lib/store";
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
  PackageCheck,
  AlertCircle,
  Tag,
  FileText,
  RotateCcw,
  ChevronRight,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import InvoiceModal from "../components/InvoiceModal";
import "../customer.css";

const PAYMENT_OPTIONS = [
  { id: "upi", label: "UPI Instant Pay", desc: "Google Pay, PhonePe, Paytm, BHIM, Custom UPI ID", icon: Smartphone, tag: "Instant 0% Fee", color: "#087EA4" },
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay, Maestro", icon: CreditCard, tag: "256-Bit SSL", color: "#7C3AED" },
  { id: "netbanking", label: "Net Banking", desc: "HDFC, ICICI, SBI, Axis, Kotak & All Indian Banks", icon: Building2, tag: "Fast & Secure", color: "#059669" },
  { id: "wallet", label: "Wallets", desc: "Paytm Wallet, Amazon Pay, PhonePe Wallet", icon: Wallet, tag: "Cashback Eligible", color: "#D97706" },
  { id: "cod", label: "Cash on Delivery (COD)", desc: "Pay cash or UPI upon delivery", icon: Coins, tag: "Pay at Doorstep", color: "#475569" },
];

const INITIAL_ADDRESSES = [
  { id: 1, label: "Home", name: "Sourav Senapati", phone: "9876543210", pincode: "700091", details: "45/A Park Street, Sector 5, Salt Lake, Kolkata, West Bengal" },
  { id: 2, label: "Office", name: "Sourav Senapati", phone: "9876543210", pincode: "700091", details: "Tech Park Tower B, 4th Floor, Sector 5, Kolkata, West Bengal" },
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

  // Checkout Stepper State (1: Cart, 2: Address, 3: Payment, 4: Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Address Management
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: "Home", name: "", phone: "", pincode: "", details: "", city: "Kolkata", state: "West Bengal" });
  const [pincodeCheck, setPincodeCheck] = useState("700091");
  const [pincodeStatus, setPincodeStatus] = useState({ checked: true, serviceable: true, message: "Express 2-Hour Delivery Available!" });

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiVpa, setUpiVpa] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [selectedWallet, setSelectedWallet] = useState("Paytm Wallet");

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  // Payment Processing & Gateway Execution States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState("Initiating Secure Gateway Checkout...");
  const [confirmedOrderResult, setConfirmedOrderResult] = useState(null); // Success screen state
  const [failedOrderResult, setFailedOrderResult] = useState(null); // Failure/Retry state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || {};
  }, [addresses, selectedAddressId]);

  // Quantity Handler
  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = (item.qty || 1) + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Pricing Calculations
  const subtotalMRP = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0),
    [cart]
  );

  const productDiscountTotal = useMemo(
    () => cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * ((Number(item.discount || item.discount_percent) || 0) / 100)) * (item.qty || 1), 0),
    [cart]
  );

  const discountedItemsTotal = subtotalMRP - productDiscountTotal;

  const couponDiscountTotal = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Number(appliedCoupon.discountAmount || 0);
  }, [appliedCoupon]);

  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (appliedCoupon?.freeDelivery) return 0;
    return discountedItemsTotal >= 500 ? 0 : 15;
  }, [cart, discountedItemsTotal, appliedCoupon]);

  const codFee = paymentMethod === "cod" ? 15 : 0;
  const estimatedTax = Number(((discountedItemsTotal - couponDiscountTotal) * 0.05).toFixed(2));
  const finalPayableAmount = Math.max(0, Number((discountedItemsTotal - couponDiscountTotal + deliveryFee + codFee).toFixed(2)));

  // Handle Coupon Apply
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    if (!couponCodeInput.trim()) return;

    try {
      const res = await applyCoupon(couponCodeInput.trim(), discountedItemsTotal);
      setAppliedCoupon(res);
      setCouponCodeInput("");
    } catch (err) {
      setCouponError(err.message || "Invalid coupon code.");
      setAppliedCoupon(null);
    }
  };

  // Handle Pincode Check
  const handleCheckPincode = () => {
    if (!pincodeCheck || pincodeCheck.length !== 6) {
      setPincodeStatus({ checked: true, serviceable: false, message: "Please enter a valid 6-digit Pincode." });
      return;
    }
    setPincodeStatus({ checked: true, serviceable: true, message: `Pincode ${pincodeCheck}: Express Delivery Available!` });
  };

  // Handle Add Address Submit
  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.phone || !newAddr.pincode || !newAddr.details) return;

    const newId = Date.now();
    const created = { ...newAddr, id: newId };
    setAddresses((prev) => [...prev, created]);
    setSelectedAddressId(newId);
    setShowAddAddressModal(false);
    setNewAddr({ label: "Home", name: "", phone: "", pincode: "", details: "", city: "Kolkata", state: "West Bengal" });
  };

  // ─────────────────────────────────────────────
  // PLACE ORDER & EXECUTE RAZORPAY GATEWAY CHECKOUT
  // ─────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    if (!currentUser.id) {
      alert("Please sign in before completing checkout.");
      navigate("/login/customer");
      return;
    }

    setIsProcessing(true);
    setProcessingStatusText("Creating your order on PharmaCare server...");
    setFailedOrderResult(null);

    try {
      // Step 1: Create Order on Backend Server
      const orderPayload = {
        userId: currentUser.id,
        items: cart.map((item) => ({ id: item.id, qty: item.qty || 1 })),
        paymentMethod,
        address: selectedAddress,
        notes: `Coupon: ${appliedCoupon?.code || "None"} | Tax: ₹${estimatedTax}`,
      };

      const serverOrderRes = await createOrder(orderPayload);
      const createdOrder = serverOrderRes.order;

      // Handle Cash on Delivery (COD)
      if (paymentMethod === "cod") {
        setProcessingStatusText("Confirming Cash on Delivery Order...");
        await new Promise((r) => setTimeout(r, 1000));

        // Update local app state
        setOrders((prev) => [createdOrder, ...(prev || [])]);
        setCart([]);
        localStorage.setItem("cart", JSON.stringify([]));

        setConfirmedOrderResult({
          ...createdOrder,
          transactionId: `COD-PHARMA-${createdOrder.id}`,
          paymentStatus: "COD Pending",
        });
        setIsProcessing(false);
        return;
      }

      // Step 2: Online Payment -> Initialize Razorpay Order via Backend API
      setProcessingStatusText("Initializing Secure Razorpay Payment Gateway...");
      const razorpayOrderData = await createRazorpayOrder({
        orderId: createdOrder.id,
        amount: finalPayableAmount,
        userId: currentUser.id,
        paymentMethod,
      });

      // Step 3: Launch Razorpay Checkout Popup Modal
      setProcessingStatusText("Opening Payment Gateway...");

      const options = {
        key: razorpayOrderData.keyId,
        amount: razorpayOrderData.amount,
        currency: razorpayOrderData.currency || "INR",
        name: "PharmaCare Health",
        description: `Order #${createdOrder.id} Payment`,
        order_id: razorpayOrderData.razorpayOrderId.startsWith("order_sim_") ? undefined : razorpayOrderData.razorpayOrderId,
        prefill: {
          name: currentUser.name || selectedAddress.name,
          email: currentUser.email || "customer@pharmacare.com",
          contact: currentUser.phone || selectedAddress.phone,
        },
        theme: {
          color: "#087EA4",
        },
        handler: async (response) => {
          // Razorpay payment captured -> Verify signature server-side
          setIsProcessing(true);
          setProcessingStatusText("Verifying Payment Signature Server-Side...");

          try {
            const verifyRes = await verifyRazorpayPayment({
              orderId: createdOrder.id,
              razorpay_order_id: response.razorpay_order_id || razorpayOrderData.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_sim_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || "sig_sim_valid",
              paymentMethod,
              userId: currentUser.id,
              details: { upiVpa, selectedBank, selectedWallet },
            });

            // Verification Success!
            setOrders((prev) => [{ ...createdOrder, status: "Confirmed", paymentStatus: "paid" }, ...(prev || [])]);
            setCart([]);
            localStorage.setItem("cart", JSON.stringify([]));

            setConfirmedOrderResult({
              ...createdOrder,
              status: "Confirmed",
              paymentStatus: "paid",
              transactionId: verifyRes.transactionId || response.razorpay_payment_id || `PAY-${createdOrder.id}`,
            });
          } catch (verifyErr) {
            console.error("Signature verification failed:", verifyErr);
            setFailedOrderResult({
              orderId: createdOrder.id,
              reason: verifyErr.message || "Payment verification signature mismatch.",
              amount: finalPayableAmount,
            });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.warn("User closed payment gateway popup");
            setIsProcessing(false);
            setFailedOrderResult({
              orderId: createdOrder.id,
              reason: "Payment cancelled by user.",
              amount: finalPayableAmount,
            });
          },
        },
      };

      // Handle Sandbox Simulation if Razorpay SDK popup is bypassed in dev mode
      if (razorpayOrderData.isSandbox || typeof window.Razorpay === "undefined") {
        setProcessingStatusText("Simulating Secure Sandbox Payment Gateway Verification...");
        await new Promise((r) => setTimeout(r, 1500));

        // Auto trigger verification in sandbox
        const verifyRes = await verifyRazorpayPayment({
          orderId: createdOrder.id,
          razorpay_order_id: razorpayOrderData.razorpayOrderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: "sig_sim_valid",
          paymentMethod,
          userId: currentUser.id,
        });

        setOrders((prev) => [{ ...createdOrder, status: "Confirmed", paymentStatus: "paid" }, ...(prev || [])]);
        setCart([]);
        localStorage.setItem("cart", JSON.stringify([]));

        setConfirmedOrderResult({
          ...createdOrder,
          status: "Confirmed",
          paymentStatus: "paid",
          transactionId: verifyRes.transactionId || `PAY-SIM-${createdOrder.id}`,
        });
        setIsProcessing(false);
        return;
      }

      // Open Razorpay SDK Checkout Modal
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setIsProcessing(false);
        setFailedOrderResult({
          orderId: createdOrder.id,
          reason: resp.error?.description || "Payment failed at gateway.",
          amount: finalPayableAmount,
        });
      });
      rzp.open();
    } catch (err) {
      console.error("Payment placement error:", err);
      setIsProcessing(false);
      setFailedOrderResult({
        orderId: "New",
        reason: err.message || "Unable to initiate payment.",
        amount: finalPayableAmount,
      });
    }
  };

  // Retry Failed Payment
  const handleRetryPayment = async (newMethod = paymentMethod) => {
    if (!failedOrderResult?.orderId || failedOrderResult.orderId === "New") {
      setFailedOrderResult(null);
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    setIsProcessing(true);
    setProcessingStatusText("Retrying Payment for Order #" + failedOrderResult.orderId + "...");

    try {
      const retryRes = await retryOrderPayment({
        orderId: failedOrderResult.orderId,
        paymentMethod: newMethod,
        userId: currentUser.id,
      });

      if (newMethod === "cod") {
        setCart([]);
        localStorage.setItem("cart", JSON.stringify([]));
        setConfirmedOrderResult({
          id: failedOrderResult.orderId,
          status: "Confirmed",
          paymentStatus: "COD Pending",
          total: failedOrderResult.amount,
          transactionId: `COD-RETRY-${failedOrderResult.orderId}`,
        });
        setFailedOrderResult(null);
        setIsProcessing(false);
        return;
      }

      // Re-trigger Razorpay
      const options = {
        key: retryRes.keyId,
        amount: retryRes.amount,
        currency: retryRes.currency || "INR",
        name: "PharmaCare Health",
        description: `Retry Payment Order #${failedOrderResult.orderId}`,
        order_id: retryRes.razorpayOrderId.startsWith("order_sim_") ? undefined : retryRes.razorpayOrderId,
        handler: async (resp) => {
          setIsProcessing(true);
          const verifyRes = await verifyRazorpayPayment({
            orderId: failedOrderResult.orderId,
            razorpay_order_id: resp.razorpay_order_id || retryRes.razorpayOrderId,
            razorpay_payment_id: resp.razorpay_payment_id || `pay_retry_${Date.now()}`,
            razorpay_signature: resp.razorpay_signature || "sig_sim_valid",
            paymentMethod: newMethod,
            userId: currentUser.id,
          });

          setCart([]);
          localStorage.setItem("cart", JSON.stringify([]));
          setConfirmedOrderResult({
            id: failedOrderResult.orderId,
            status: "Confirmed",
            paymentStatus: "paid",
            total: failedOrderResult.amount,
            transactionId: verifyRes.transactionId || `PAY-RETRY-${failedOrderResult.orderId}`,
          });
          setFailedOrderResult(null);
          setIsProcessing(false);
        },
      };

      if (retryRes.isSandbox || typeof window.Razorpay === "undefined") {
        const verifyRes = await verifyRazorpayPayment({
          orderId: failedOrderResult.orderId,
          razorpay_order_id: retryRes.razorpayOrderId,
          razorpay_payment_id: `pay_retry_${Date.now()}`,
          razorpay_signature: "sig_sim_valid",
          paymentMethod: newMethod,
          userId: currentUser.id,
        });

        setCart([]);
        localStorage.setItem("cart", JSON.stringify([]));
        setConfirmedOrderResult({
          id: failedOrderResult.orderId,
          status: "Confirmed",
          paymentStatus: "paid",
          total: failedOrderResult.amount,
          transactionId: verifyRes.transactionId || `PAY-RETRY-${failedOrderResult.orderId}`,
        });
        setFailedOrderResult(null);
        setIsProcessing(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Retry failed:", err);
      setIsProcessing(false);
      setFailedOrderResult((prev) => ({ ...prev, reason: err.message || "Retry payment failed." }));
    }
  };

  // ─────────────────────────────────────────────
  // SUCCESS SCREEN COMPONENT
  // ─────────────────────────────────────────────
  if (confirmedOrderResult) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#F8FAFC" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E2E8F0", padding: 40, width: "100%", maxWidth: 540, textAlign: "center", boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.1)" }}>
          <div style={{ width: 72, height: 72, background: "#DCFCE7", color: "#166534", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <CheckCircle size={44} />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: "0 0 8px 0" }}>
            Payment Verified & Order Confirmed!
          </h2>
          <p style={{ fontSize: 13.5, color: "#64748B", margin: 0 }}>
            Thank you for ordering with PharmaCare Health. Your medicines are being prepared for express delivery.
          </p>

          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, margin: "24px 0", textAlign: "left", fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#64748B" }}>Order Reference:</span>
              <strong style={{ color: "#087EA4" }}>#{confirmedOrderResult.id}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#64748B" }}>Gateway Transaction ID:</span>
              <strong style={{ fontFamily: "monospace", color: "#0F172A" }}>{confirmedOrderResult.transactionId}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#64748B" }}>Payment Status:</span>
              <strong style={{ color: "#166534" }}>{confirmedOrderResult.paymentStatus || "PAID"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Estimated Delivery:</span>
              <strong style={{ color: "#0F172A" }}>Today within 2 Hours</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowInvoiceModal(true)}
              style={{ flex: 1, padding: "12px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", color: "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <FileText size={16} /> View Tax Invoice
            </button>
            <button
              onClick={() => navigate("/orders")}
              style={{ flex: 1, padding: "12px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}
            >
              Track My Order
            </button>
          </div>
        </div>

        {showInvoiceModal && (
          <InvoiceModal order={confirmedOrderResult} onClose={() => setShowInvoiceModal(false)} />
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // FAILURE & RETRY SCREEN COMPONENT
  // ─────────────────────────────────────────────
  if (failedOrderResult) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#F8FAFC" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #FCA5A5", padding: 40, width: "100%", maxWidth: 520, textAlign: "center", boxShadow: "0 20px 40px -15px rgba(220, 38, 38, 0.12)" }}>
          <div style={{ width: 72, height: 72, background: "#FEE2E2", color: "#DC2626", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <AlertTriangle size={44} />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#991B1B", margin: "0 0 8px 0" }}>
            Payment Unsuccessful
          </h2>
          <p style={{ fontSize: 13.5, color: "#7F1D1D", margin: 0, fontWeight: 600 }}>
            {failedOrderResult.reason || "The gateway could not authorize your transaction."}
          </p>

          <div style={{ background: "#FFF5F5", border: "1px solid #FECDD3", borderRadius: 12, padding: 16, margin: "24px 0", textAlign: "left", fontSize: 13 }}>
            <div style={{ color: "#991B1B", fontWeight: 700, marginBottom: 4 }}>Preserved Order Details:</div>
            <div style={{ color: "#475569" }}>Order ID: #{failedOrderResult.orderId}</div>
            <div style={{ color: "#475569" }}>Payable Amount: ₹{failedOrderResult.amount}</div>
            <div style={{ color: "#166534", fontSize: 12, marginTop: 6, fontWeight: 600 }}>
              Your cart items and delivery address are safe. No duplicate order was created.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => handleRetryPayment(paymentMethod)}
              style={{ width: "100%", padding: "13px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <RotateCcw size={18} /> Retry Payment Now
            </button>

            <button
              onClick={() => handleRetryPayment("cod")}
              style={{ width: "100%", padding: "12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", color: "#334155" }}
            >
              Switch to Cash on Delivery (COD)
            </button>

            <button
              onClick={() => setFailedOrderResult(null)}
              style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", marginTop: 4, textDecoration: "underline" }}
            >
              Back to Checkout Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // EMPTY CART SCREEN
  // ─────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div style={{ minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#F0F9FF", color: "#087EA4", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <ShoppingBag size={40} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px 0" }}>Your Cart is Empty</h2>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>Explore our wide range of medicines and healthcare essentials.</p>
          <button
            onClick={() => navigate("/inventory")}
            style={{ padding: "12px 28px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer" }}
          >
            Browse Medicines
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MAIN FLIPKART-STYLE CHECKOUT INTERFACE
  // ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "24px 16px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* PROCESSING OVERLAY */}
      {isProcessing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF" }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "32px 40px", textAlign: "center", color: "#0F172A", maxWidth: 400, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div className="spinner" style={{ width: 44, height: 44, border: "4px solid #E2E8F0", borderTopColor: "#087EA4", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px 0", color: "#0F172A" }}>Securing Payment</h3>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>{processingStatusText}</p>
            <div style={{ marginTop: 20, fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <ShieldCheck size={14} color="#166534" /> 256-Bit SSL Encrypted Transaction
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        
        {/* CHECKOUT STEPPER HEADER */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: "16px 28px", marginBottom: 24, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            {[
              { num: 1, title: "Cart Summary" },
              { num: 2, title: "Delivery Address" },
              { num: 3, title: "Payment Method" },
              { num: 4, title: "Order Review" },
            ].map((step, idx) => {
              const active = currentStep === step.num;
              const completed = currentStep > step.num;
              return (
                <React.Fragment key={step.num}>
                  <div
                    onClick={() => completed && setCurrentStep(step.num)}
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: completed ? "pointer" : "default" }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: completed ? "#166534" : active ? "#087EA4" : "#F1F5F9",
                        color: completed || active ? "#FFFFFF" : "#64748B",
                        fontWeight: 800,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {completed ? <Check size={16} /> : step.num}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: active ? 800 : completed ? 700 : 500, color: active ? "#0F172A" : completed ? "#166534" : "#64748B" }}>
                      {step.title}
                    </span>
                  </div>
                  {idx < 3 && <ChevronRight size={18} color="#CBD5E1" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* TWO COLUMN GRID LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }} className="cart-checkout-grid">
          
          {/* LEFT COLUMN: STEP CONTENT */}
          <div>
            
            {/* STEP 1: CART ITEMS LIST */}
            {currentStep === 1 && (
              <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: 24, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", margin: "0 0 20px 0" }}>
                  Items in your Cart ({cart.reduce((s, i) => s + (i.qty || 1), 0)})
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: 16, padding: "16px", borderRadius: 12, border: "1px solid #F1F5F9", background: "#FAFBFD", alignItems: "center" }}>
                      <img
                        src={item.image_url || "https://placehold.co/100x100/e0f2fe/0ea5e9?text=Medicine"}
                        alt={item.name}
                        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid #E2E8F0" }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#087EA4", textTransform: "uppercase" }}>{item.category}</span>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "2px 0 4px 0" }}>{item.name}</h4>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                          ₹{((Number(item.price) || 0) * (1 - (Number(item.discount || item.discount_percent) || 0) / 100)).toFixed(2)}
                          {(item.discount > 0 || item.discount_percent > 0) && (
                            <span style={{ fontSize: 12, color: "#94A3B8", textDecoration: "line-through", marginLeft: 8, fontWeight: 500 }}>
                              ₹{item.price}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: "4px 8px" }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><Minus size={14} /></button>
                        <span style={{ fontWeight: 800, fontSize: 14, minWidth: 20, textAlign: "center" }}>{item.qty || 1}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><Plus size={14} /></button>
                      </div>

                      <button onClick={() => removeFromCart(item.id)} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, textAlign: "right" }}>
                  <button
                    onClick={() => setCurrentStep(2)}
                    style={{ padding: "13px 28px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    Select Delivery Address <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DELIVERY ADDRESS */}
            {currentStep === 2 && (
              <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: 24, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", margin: 0 }}>Select Delivery Address</h2>
                  <button
                    onClick={() => setShowAddAddressModal(true)}
                    style={{ background: "#F0F9FF", color: "#087EA4", border: "1px solid #BAE6FD", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Plus size={15} /> Add New Address
                  </button>
                </div>

                {/* Pincode Check Bar */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <MapPin size={20} color="#087EA4" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Check Pincode Serviceability:</span>
                  <div style={{ display: "flex", gap: 8, flex: 1 }}>
                    <input
                      type="text"
                      maxLength="6"
                      value={pincodeCheck}
                      onChange={(e) => setPincodeCheck(e.target.value.replace(/\D/g, ""))}
                      style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, width: 110 }}
                    />
                    <button onClick={handleCheckPincode} style={{ padding: "6px 12px", background: "#334155", color: "#FFFFFF", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Check</button>
                  </div>
                  {pincodeStatus.checked && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: pincodeStatus.serviceable ? "#166534" : "#DC2626" }}>
                      {pincodeStatus.message}
                    </span>
                  )}
                </div>

                {/* Saved Address Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          border: isSelected ? "2px solid #087EA4" : "1px solid #E2E8F0",
                          background: isSelected ? "#F0F9FF" : "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          gap: 14,
                          alignItems: "flex-start",
                        }}
                      >
                        <input type="radio" checked={isSelected} onChange={() => setSelectedAddressId(addr.id)} style={{ marginTop: 4 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, background: "#E0F2FE", color: "#087EA4", padding: "2px 8px", borderRadius: 4 }}>
                              {addr.label}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{addr.name}</span>
                            <span style={{ fontSize: 12, color: "#64748B" }}>({addr.phone})</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.4 }}>{addr.details}</p>
                          <span style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4, display: "inline-block" }}>Pincode: {addr.pincode}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setCurrentStep(1)} style={{ padding: "12px 20px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", color: "#475569" }}>
                    Back
                  </button>
                  <button onClick={() => setCurrentStep(3)} style={{ padding: "12px 24px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Proceed to Payment <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD SELECTION */}
            {currentStep === 3 && (
              <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: 24, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", margin: "0 0 6px 0" }}>Choose Payment Method</h2>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px 0" }}>All transactions are processed through 256-bit SSL encrypted Razorpay gateway</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {PAYMENT_OPTIONS.map((opt) => {
                    const isSelected = paymentMethod === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id)}
                        style={{
                          padding: 18,
                          borderRadius: 14,
                          border: isSelected ? `2px solid ${opt.color}` : "1px solid #E2E8F0",
                          background: isSelected ? "#FAFBFD" : "#FFFFFF",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <input type="radio" checked={isSelected} onChange={() => setPaymentMethod(opt.id)} />
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F1F5F9", color: opt.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <IconComp size={22} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{opt.label}</span>
                              <span style={{ fontSize: 10, fontWeight: 800, background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 4 }}>
                                {opt.tag}
                              </span>
                            </div>
                            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748B" }}>{opt.desc}</p>
                          </div>
                        </div>

                        {/* SUB-INPUTS FOR SELECTED METHOD */}
                        {isSelected && opt.id === "upi" && (
                          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E2E8F0", paddingLeft: 54 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>Enter UPI ID / VPA (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. mobile@upi or username@gpay"
                              value={upiVpa}
                              onChange={(e) => setUpiVpa(e.target.value)}
                              style={{ width: "100%", maxWidth: 320, padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }}
                            />
                          </div>
                        )}

                        {isSelected && opt.id === "netbanking" && (
                          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E2E8F0", paddingLeft: 54 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>Select Preferred Bank</label>
                            <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }}>
                              <option value="HDFC">HDFC Bank</option>
                              <option value="ICICI">ICICI Bank</option>
                              <option value="SBI">State Bank of India</option>
                              <option value="AXIS">Axis Bank</option>
                              <option value="KOTAK">Kotak Mahindra Bank</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setCurrentStep(2)} style={{ padding: "12px 20px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", color: "#475569" }}>
                    Back
                  </button>
                  <button onClick={() => setCurrentStep(4)} style={{ padding: "12px 24px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Review & Place Order <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: ORDER REVIEW & PAY */}
            {currentStep === 4 && (
              <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: 24, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", margin: "0 0 16px 0" }}>Final Order Review</h2>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>Deliver To:</span>
                    <button onClick={() => setCurrentStep(2)} style={{ background: "none", border: "none", color: "#087EA4", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Change</button>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{selectedAddress.name} ({selectedAddress.phone})</div>
                  <div style={{ fontSize: 12.5, color: "#475569", marginTop: 2 }}>{selectedAddress.details}</div>
                </div>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>Payment Option:</span>
                    <button onClick={() => setCurrentStep(3)} style={{ background: "none", border: "none", color: "#087EA4", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Change</button>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", textTransform: "uppercase" }}>{paymentMethod}</div>
                  <div style={{ fontSize: 12, color: "#166534", marginTop: 2, fontWeight: 600 }}>Secured by Razorpay Official API</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setCurrentStep(3)} style={{ padding: "12px 20px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", color: "#475569" }}>
                    Back
                  </button>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    style={{ padding: "14px 32px", background: "#166534", color: "#FFFFFF", border: "none", borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 12px rgba(22, 101, 52, 0.25)" }}
                  >
                    Pay Now ₹{finalPayableAmount.toFixed(2)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PRICE DETAILS BREAKDOWN */}
          <div style={{ position: "sticky", top: 24 }}>
            
            {/* COUPON CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Tag size={18} color="#087EA4" />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Coupons & Offers</span>
              </div>

              {appliedCoupon ? (
                <div style={{ background: "#DCFCE7", border: "1px dashed #166534", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 900, color: "#166534", fontSize: 13 }}>{appliedCoupon.code} APPLIED</span>
                    <div style={{ fontSize: 11.5, color: "#15803D" }}>{appliedCoupon.description}</div>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} style={{ background: "none", border: "none", color: "#DC2626", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. PHARMA10)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5, fontWeight: 700 }}
                  />
                  <button type="submit" style={{ padding: "8px 14px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>Apply</button>
                </form>
              )}
              {couponError && <div style={{ color: "#DC2626", fontSize: 11.5, marginTop: 6, fontWeight: 600 }}>{couponError}</div>}
            </div>

            {/* PRICE SUMMARY CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: 20, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: "#64748B", textTransform: "uppercase", margin: "0 0 16px 0", letterSpacing: 0.5 }}>
                Price Details
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, color: "#334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Price ({cart.reduce((s, i) => s + (i.qty || 1), 0)} items)</span>
                  <span>₹{subtotalMRP.toFixed(2)}</span>
                </div>

                {productDiscountTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#166534" }}>
                    <span>Product Discount</span>
                    <span>-₹{productDiscountTotal.toFixed(2)}</span>
                  </div>
                )}

                {couponDiscountTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#166534" }}>
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscountTotal.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Express Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <span style={{ color: "#166534", fontWeight: 700 }}>FREE</span> : `₹${deliveryFee}`}</span>
                </div>

                {codFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>COD Handling Fee</span>
                    <span>₹{codFee}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: 12 }}>
                  <span>Estimated Tax (5% GST)</span>
                  <span>₹{estimatedTax}</span>
                </div>

                <div style={{ borderTop: "2px dashed #E2E8F0", marginTop: 10, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900, color: "#0F172A" }}>
                  <span>Total Amount</span>
                  <span style={{ color: "#087EA4" }}>₹{finalPayableAmount.toFixed(2)}</span>
                </div>
              </div>

              {(productDiscountTotal > 0 || couponDiscountTotal > 0) && (
                <div style={{ marginTop: 14, background: "#DCFCE7", color: "#166534", padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 800, textAlign: "center" }}>
                  You will save ₹{(productDiscountTotal + couponDiscountTotal).toFixed(2)} on this order!
                </div>
              )}

              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B", justifyContent: "center" }}>
                <ShieldCheck size={14} color="#166534" /> 100% Genuine Medicines & Safe Payment
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ADD NEW ADDRESS MODAL */}
      {showAddAddressModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", margin: 0 }}>Add New Delivery Address</h3>
              <button onClick={() => setShowAddAddressModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddAddressSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder="Full Name" value={newAddr.name} onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })} required style={{ padding: "10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }} />
              <input type="text" placeholder="Mobile Number" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} required style={{ padding: "10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }} />
              <input type="text" placeholder="Pincode" maxLength="6" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} required style={{ padding: "10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }} />
              <textarea placeholder="House / Flat No., Road, Landmark" value={newAddr.details} onChange={(e) => setNewAddr({ ...newAddr, details: e.target.value })} required rows="3" style={{ padding: "10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, resize: "none" }} />
              
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowAddAddressModal(false)} style={{ flex: 1, padding: 10, background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 8, fontWeight: 700 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: 10, background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 8, fontWeight: 800 }}>Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
