import { useMemo, useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Calendar,
  XCircle,
  PackageCheck,
  ShieldCheck,
  PhoneCall,
  UserCheck,
  Sparkles,
  FileText,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { fetchOrderDeliveryTimeline, updateOrderStatus } from "../lib/store";
import InvoiceModal from "../components/InvoiceModal";
import "../customer.css";

export default function Orders({ orders = [], setOrders, refreshData }) {
  const [activeTab, setActiveTab] = useState("all");
  const [liveOrdersMap, setLiveOrdersMap] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Real-Time Polling & Live Timeline Sync
  useEffect(() => {
    const fetchAllTimeline = async () => {
      if (!orders || orders.length === 0) return;
      const map = {};
      await Promise.all(
        orders.map(async (o) => {
          try {
            const data = await fetchOrderDeliveryTimeline(o.id);
            if (data) map[o.id] = data;
          } catch (e) {
            // Silently ignore timeline fetch errors
          }
        })
      );
      setLiveOrdersMap((prev) => ({ ...prev, ...map }));
    };

    fetchAllTimeline();
    const interval = setInterval(fetchAllTimeline, 4000);
    return () => clearInterval(interval);
  }, [orders]);

  // Server-Sent Events (SSE) Real-Time Listener
  useEffect(() => {
    let eventSource;
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
        : "http://localhost:4000";
      eventSource = new EventSource(`${apiBase}/api/delivery/events`);

      eventSource.onmessage = async (e) => {
        try {
          const eventData = JSON.parse(e.data);
          const { type, payload } = eventData;
          if (["DELIVERY_STATUS_CHANGED", "ORDER_ACCEPTED", "ORDER_ASSIGNED", "NEW_ORDER_PLACED"].includes(type)) {
            const orderId = payload.orderId;
            if (orderId) {
              const liveData = await fetchOrderDeliveryTimeline(orderId);
              setLiveOrdersMap((prev) => ({ ...prev, [orderId]: liveData }));
              if (refreshData) refreshData();
            }
          }
        } catch (err) {
          console.warn("SSE parse error:", err);
        }
      };
    } catch (e) {
      console.warn("SSE connection error:", e);
    }

    return () => {
      eventSource?.close();
    };
  }, [refreshData]);

  const filterStatus = (tab) => {
    if (tab === "all") return orders;
    return orders.filter((o) => {
      const liveStatus = liveOrdersMap[o.id]?.deliveryStatus || o.deliveryStatus || o.status || "";
      const s = liveStatus.toLowerCase();
      if (tab === "processing") return s === "processing" || s === "order_placed" || s === "confirmed";
      if (tab === "out") return s === "out_for_delivery" || s === "out for delivery" || s === "picked_up" || s === "accepted";
      if (tab === "delivered") return s === "delivered";
      if (tab === "cancelled") return s === "cancelled";
      return true;
    });
  };

  const displayedOrders = useMemo(() => filterStatus(activeTab), [orders, activeTab, liveOrdersMap]);

  return (
    <div className="customer-page">
      <div className="customer-container">
        
        {/* Header */}
        <div className="section-header-wrap">
          <div>
            <h1 className="page-title">My Orders & Live Delivery Tracking</h1>
            <p className="page-subtitle">Track ongoing package deliveries with live moving scooter animation.</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 28 }}>
          {[
            { id: "all", label: "All Orders", count: orders.length },
            { id: "processing", label: "Processing", count: orders.filter((o) => ["processing", "order_placed", "confirmed"].includes((liveOrdersMap[o.id]?.deliveryStatus || o.deliveryStatus || o.status || "").toLowerCase())).length },
            { id: "out", label: "In Transit", count: orders.filter((o) => ["accepted", "picked_up", "out_for_delivery", "out for delivery"].includes((liveOrdersMap[o.id]?.deliveryStatus || o.deliveryStatus || o.status || "").toLowerCase())).length },
            { id: "delivered", label: "Delivered", count: orders.filter((o) => (liveOrdersMap[o.id]?.deliveryStatus || o.deliveryStatus || o.status || "").toLowerCase() === "delivered").length },
            { id: "cancelled", label: "Cancelled", count: orders.filter((o) => (liveOrdersMap[o.id]?.deliveryStatus || o.deliveryStatus || o.status || "").toLowerCase() === "cancelled").length },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 999,
                  border: active ? "1.5px solid #087EA4" : "1px solid #E2E8F0",
                  background: active ? "#E0F2FE" : "#FFFFFF",
                  color: active ? "#087EA4" : "#64748B",
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {displayedOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0" }}>
            <Package size={48} color="#087EA4" style={{ marginBottom: 12, opacity: 0.4 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>No Orders Found</h3>
            <p style={{ fontSize: 13.5, color: "#64748B" }}>You don't have any orders under this category.</p>
          </div>
        ) : (
          displayedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              liveTimeline={liveOrdersMap[order.id]}
              onOpenInvoice={setSelectedInvoice}
              setOrders={setOrders}
              refreshData={refreshData}
            />
          ))
        )}

        {selectedInvoice && (
          <InvoiceModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
        )}
      </div>
    </div>
  );
}

function getStatusPill(status) {
  const s = (status || "").toLowerCase();
  if (s === "delivered") return { bg: "#DCFCE7", color: "#16A34A", icon: <CheckCircle2 size={14} />, label: "Delivered Successfully" };
  if (s === "out_for_delivery" || s === "out for delivery") return { bg: "#FFEDD5", color: "#C2410C", icon: <Truck size={14} />, label: "Out for Delivery" };
  if (s === "picked_up") return { bg: "#FEF3C7", color: "#D97706", icon: <PackageCheck size={14} />, label: "Picked Up from Pharmacy" };
  if (s === "accepted" || s === "assigned") return { bg: "#E0E7FF", color: "#3730A3", icon: <UserCheck size={14} />, label: "Accepted by Delivery Boy" };
  if (s === "cancelled") return { bg: "#FEE2E2", color: "#DC2626", icon: <XCircle size={14} />, label: "Cancelled" };
  return { bg: "#E0F2FE", color: "#0369A1", icon: <Clock size={14} />, label: "Order Placed (Open Pool)" };
}

function getTimelinePercent(status) {
  const s = (status || "").toLowerCase();
  if (s === "delivered") return 100;
  if (s === "out_for_delivery" || s === "out for delivery") return 80;
  if (s === "picked_up") return 60;
  if (s === "accepted" || s === "assigned") return 40;
  if (s === "confirmed") return 20;
  if (s === "cancelled") return 0;
  return 5;
}

// ─────────────────────────────────────────────
// REALISTIC HIGH-DETAIL DELIVERY SCOOTER COMPONENT
// ─────────────────────────────────────────────
function DeliveryScooterIcon({ isMoving, isCancelled }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* Live Driver Floating Tooltip / ETA Bubble */}
      {isMoving && !isCancelled && (
        <div
          style={{
            position: "absolute",
            top: -36,
            background: "linear-gradient(135deg, #087EA4 0%, #0369A1 100%)",
            color: "#FFFFFF",
            fontSize: 10.5,
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: 999,
            boxShadow: "0 6px 16px rgba(8,126,164,0.45)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 5,
            border: "1px solid rgba(255,255,255,0.25)",
            animation: "tooltipFloat 1.8s ease-in-out infinite alternate"
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block", boxShadow: "0 0 8px #4ADE80" }} />
          Live GPS Speed: 34 km/h
        </div>
      )}

      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        
        {/* Dual LED Headlight Cone Beam */}
        {isMoving && !isCancelled && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: -32,
              width: 38,
              height: 22,
              background: "linear-gradient(90deg, rgba(253,224,71,0.95) 0%, rgba(254,240,138,0.5) 40%, rgba(254,240,138,0) 100%)",
              clipPath: "polygon(0 30%, 100% 0, 100% 100%, 0 70%)",
              zIndex: 2,
              pointerEvents: "none",
              animation: "scooterBeam 0.5s ease-in-out infinite alternate"
            }}
          />
        )}

        {/* Dynamic Exhaust Smoke Puffs */}
        {isMoving && !isCancelled && (
          <div style={{ position: "absolute", bottom: 12, left: -22, zIndex: 1, pointerEvents: "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(226,232,240,0.7)", animation: "puffSmoke 0.6s ease-out infinite" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(203,213,225,0.5)", animation: "puffSmoke 0.6s ease-out infinite 0.2s" }} />
          </div>
        )}

        {/* Speed Wind Neon Lines */}
        {isMoving && !isCancelled && (
          <div style={{ position: "absolute", top: 14, left: -26, display: "flex", flexDirection: "column", gap: 4, zIndex: 1, pointerEvents: "none" }}>
            <div style={{ width: 22, height: 2, background: "#38BDF8", borderRadius: 2, opacity: 0.9, animation: "trailDash 0.3s linear infinite" }} />
            <div style={{ width: 28, height: 2.5, background: "#34D399", borderRadius: 2, opacity: 0.95, animation: "trailDash 0.25s linear infinite 0.08s" }} />
            <div style={{ width: 16, height: 2, background: "#38BDF8", borderRadius: 2, opacity: 0.85, animation: "trailDash 0.35s linear infinite 0.15s" }} />
          </div>
        )}

        {/* High-Detail Realistic Scooter Vector SVG */}
        <svg
          width="62"
          height="52"
          viewBox="0 0 68 56"
          fill="none"
          style={{
            filter: isCancelled ? "grayscale(1) opacity(0.7)" : "drop-shadow(0 8px 18px rgba(8,126,164,0.45))",
            animation: isMoving && !isCancelled ? "scooterVibrate 0.3s ease-in-out infinite alternate" : "none"
          }}
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="50%" stopColor="#087EA4" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>

          {/* PharmaCare Rear Delivery Box */}
          <rect x="2" y="12" width="20" height="22" rx="4" fill="url(#bodyGrad)" stroke="#0284C7" strokeWidth="1.5" />
          <rect x="5" y="15" width="14" height="16" rx="2" fill="#FFFFFF" opacity="0.15" />
          <circle cx="12" cy="23" r="6" fill="#FFFFFF" />
          <path d="M 12 19 L 12 27 M 8 23 L 16 23" stroke="#087EA4" strokeWidth="2.5" strokeLinecap="round" />

          {/* Scooter Frame Chassis */}
          <path d="M 22 34 L 32 34 L 44 20 L 56 20" stroke="url(#bodyGrad)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 28 34 L 46 42 L 56 42" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />

          {/* Floorboard Base */}
          <rect x="28" y="32" width="18" height="4" rx="2" fill="#334155" />

          {/* Front Shield & Headlight Shield */}
          <path d="M 44 20 L 52 10 L 58 10 C 60 10 62 12 62 14 L 56 30 Z" fill="url(#bodyGrad)" stroke="#0284C7" strokeWidth="1" />
          <circle cx="56" cy="14" r="3.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />

          {/* Handlebar & Rearview Mirrors */}
          <path d="M 50 10 L 54 2 L 58 2" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="58" cy="2" r="2" fill="#94A3B8" />

          {/* Rider Body & Helmet */}
          <path d="M 24 24 Q 30 14 36 18 Q 42 22 46 16" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Driver Jacket */}
          <path d="M 26 24 C 30 18 36 18 42 24" fill="#087EA4" opacity="0.9" />
          {/* Helmet */}
          <circle cx="34" cy="10" r="6" fill="url(#helmetGrad)" stroke="#38BDF8" strokeWidth="1.2" />
          {/* Visor Glare */}
          <path d="M 36 9 C 38 9 39 11 39 12 C 37 12 36 11 36 9 Z" fill="#38BDF8" />

          {/* Double Rear Shock Absorber */}
          <line x1="22" y1="36" x2="16" y2="44" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />

          {/* Realistic Multi-Spoke Alloy Wheels */}
          {/* Rear Wheel */}
          <g style={{ transformOrigin: "16px 44px", animation: isMoving && !isCancelled ? "wheelSpin 0.25s linear infinite" : "none" }}>
            <circle cx="16" cy="44" r="9" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
            <circle cx="16" cy="44" r="4.5" fill="url(#metalGrad)" />
            <line x1="16" y1="35" x2="16" y2="53" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="7" y1="44" x2="25" y2="44" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="10" y1="38" x2="22" y2="50" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="10" y1="50" x2="22" y2="38" stroke="#CBD5E1" strokeWidth="1" />
          </g>

          {/* Front Wheel */}
          <g style={{ transformOrigin: "54px 44px", animation: isMoving && !isCancelled ? "wheelSpin 0.25s linear infinite" : "none" }}>
            <circle cx="54" cy="44" r="9" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
            <circle cx="54" cy="44" r="4.5" fill="url(#metalGrad)" />
            <line x1="54" y1="35" x2="54" y2="53" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="45" y1="44" x2="63" y2="44" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="48" y1="38" x2="60" y2="50" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="48" y1="50" x2="60" y2="38" stroke="#CBD5E1" strokeWidth="1" />
          </g>
        </svg>

        {/* Dynamic Ground Shadow */}
        <div
          style={{
            position: "absolute",
            bottom: -6,
            left: 6,
            right: 6,
            height: 6,
            background: "rgba(15,23,42,0.6)",
            borderRadius: "50%",
            filter: "blur(3px)",
            animation: isMoving && !isCancelled ? "shadowBounce 0.3s ease-in-out infinite alternate" : "none"
          }}
        />
      </div>
    </div>
  );
}

function OrderCard({ order, liveTimeline, onOpenInvoice, setOrders, refreshData }) {
  const [isCancelling, setIsCancelling] = useState(false);

  const currentStatus = liveTimeline?.deliveryStatus || order.deliveryStatus || order.status || "ORDER_PLACED";
  const { bg, color, icon, label } = getStatusPill(currentStatus);
  const items = order.items || [];
  const percent = getTimelinePercent(currentStatus);

  const isCancelled = (currentStatus || "").toLowerCase() === "cancelled";
  const isDelivered = (currentStatus || "").toLowerCase() === "delivered";
  const isMoving = ["accepted", "assigned", "picked_up", "out_for_delivery", "out for delivery"].includes((currentStatus || "").toLowerCase());
  const canCancel = !isDelivered && !isCancelled && !["picked_up", "out_for_delivery", "out for delivery"].includes((currentStatus || "").toLowerCase());

  const timelineSteps = [
    { label: "Pharmacy Hub", percent: 0 },
    { label: "Order Confirmed", percent: 20 },
    { label: "Partner Assigned", percent: 40 },
    { label: "Picked Up", percent: 60 },
    { label: "Highway Express", percent: 80 },
    { label: "Doorstep Delivered", percent: 100 },
  ];

  // Resolve Partner Info
  const livePartner = liveTimeline?.deliveryPartner;
  const fallbackPartnerName = typeof order.deliveryPartner === "string" ? order.deliveryPartner : order.deliveryPartnerName;
  const partnerName = livePartner?.name || (typeof order.deliveryPartner === "object" ? order.deliveryPartner?.name : fallbackPartnerName);
  const partnerPhone = livePartner?.phone || order.deliveryPartnerPhone || (typeof order.deliveryPartner === "object" ? order.deliveryPartner?.phone : null);
  const partnerId = livePartner?.deliveryId || (order.delivery_partner_id ? `DEL${1000 + Number(order.delivery_partner_id)}` : "DEL-9921");

  const isAssigned = Boolean(partnerName && partnerName !== "Unassigned" && partnerName !== "undefined");

  const handleCancelClick = async () => {
    if (!window.confirm(`Are you sure you want to cancel Order #PC-${order.id}? Medicine stock will automatically be refunded to database inventory.`)) {
      return;
    }

    setIsCancelling(true);
    try {
      await updateOrderStatus(order.id, "Cancelled");
      if (setOrders) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: "Cancelled", deliveryStatus: "CANCELLED" } : o))
        );
      }
      if (refreshData) await refreshData();
      alert(`Order #PC-${order.id} cancelled. Item stock has been updated in database.`);
    } catch (err) {
      alert(err.message || "Unable to cancel order right now.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="order-card-container" style={{ marginBottom: 32, background: "#FFFFFF", borderRadius: 20, border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 10px 30px rgba(15,23,42,0.06)" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
            Order #PC-{order.id}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, background: bg, color, padding: "5px 14px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
            {icon} {label}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={14} />
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
          </div>

          {/* Customer Cancel Button */}
          {canCancel && (
            <button
              onClick={handleCancelClick}
              disabled={isCancelling}
              style={{
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FCA5A5",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isCancelling ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
            >
              <RotateCcw size={13} /> {isCancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      </div>

      {/* Items Summary & Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, background: "#F8FAFC", padding: "18px 22px", borderRadius: 14, marginBottom: 24, border: "1px solid #E2E8F0" }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.03em" }}>Purchased Items</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
            {items.map((i) => i.name || i.medicine_name || "Medicine").join(", ") || order.medicine || "Pharmaceutical Products"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.03em" }}>Delivery Destination</div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={14} color="#087EA4" />
            {order.address?.details || order.address_details || "Registered Address"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.03em" }}>Delivery Partner</div>
          {isAssigned ? (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                <UserCheck size={15} color="#16A34A" />
                {partnerName} <span style={{ fontSize: 11, background: "#E0F2FE", color: "#0369A1", padding: "1px 6px", borderRadius: 4 }}>{partnerId}</span>
              </div>
              {partnerPhone && (
                <a href={`tel:${partnerPhone}`} style={{ fontSize: 12, fontWeight: 600, color: "#087EA4", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                  <PhoneCall size={12} /> {partnerPhone}
                </a>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "#D97706", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} /> Assigning nearest delivery boy...
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.03em" }}>Total Amount</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
            ₹{order.total || order.totalPrice}
          </div>
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => onOpenInvoice && onOpenInvoice(order)}
              style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, padding: "4px 10px", fontSize: 11.5, fontWeight: 700, color: "#087EA4", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <FileText size={13} /> View Receipt
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          ULTRA-BEAUTIFUL DARK GLASSMORPHISM ROAD TRACK
         ───────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderRadius: 18,
          padding: "24px 28px 22px 28px",
          border: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
          boxShadow: "0 14px 36px rgba(15,23,42,0.25)",
          overflow: "hidden"
        }}
      >
        {/* Subtle Map Grid Backdrop Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(56, 189, 248, 0.15) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            pointerEvents: "none"
          }}
        />

        {/* Status Tooltip Header above Scooter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, position: "relative", zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#38BDF8", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "4px 12px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              📡 Live GPS Track Radar
            </span>
            <span style={{ fontSize: 13, color: "#F1F5F9", fontWeight: 700 }}>
              {isDelivered ? "Delivered at doorstep 🎉" : isCancelled ? "Order cancelled by customer" : isMoving ? `Delivery partner ${partnerName || "courier"} is navigating live to your address! 🛵` : "Order being packed at central pharmacy warehouse"}
            </span>
          </div>

          {isMoving && !isCancelled && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", padding: "4px 14px", borderRadius: 999 }}>
              <Clock size={13} color="#FBBF24" />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "#FBBF24" }}>
                ETA ~14 Mins
              </span>
            </div>
          )}
        </div>

        {/* Realistic Road Track Runway */}
        <div style={{ position: "relative", height: 80, marginTop: 14, display: "flex", alignItems: "center" }}>
          
          {/* Base Road Asphalt Surface */}
          <div style={{ position: "absolute", left: 0, right: 0, height: 12, background: "#334155", borderRadius: 999, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)", overflow: "hidden" }}>
            {/* Glowing Neon Progress Fill */}
            <div
              style={{
                height: "100%",
                width: isCancelled ? "0%" : `${percent}%`,
                background: isDelivered ? "#22C55E" : "linear-gradient(90deg, #38BDF8 0%, #34D399 100%)",
                borderRadius: 999,
                boxShadow: isDelivered ? "0 0 16px #22C55E" : "0 0 16px #38BDF8",
                transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            />
          </div>

          {/* Dotted Road Lane Divider Lines */}
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, borderTop: "2px dashed rgba(255,255,255,0.4)", pointerEvents: "none", animation: isMoving && !isCancelled ? "laneMove 0.8s linear infinite" : "none" }} />

          {/* Moving Delivery Scooter Container */}
          {!isCancelled && (
            <div
              style={{
                position: "absolute",
                left: `calc(${percent}% - 31px)`,
                top: -18,
                zIndex: 20,
                transition: "left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <DeliveryScooterIcon isMoving={isMoving} isCancelled={isCancelled} />
            </div>
          )}

          {/* Milestone Nodes */}
          <div style={{ position: "absolute", left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, padding: "0 2px" }}>
            {timelineSteps.map((s, idx) => {
              const isReached = !isCancelled && percent >= s.percent;
              const isCurrent = !isCancelled && percent === s.percent;
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  
                  {/* Active Beacon Ring Glow */}
                  {isCurrent && (
                    <div
                      style={{
                        position: "absolute",
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        border: "2px solid #38BDF8",
                        animation: "beaconRing 1.5s ease-out infinite",
                        pointerEvents: "none"
                      }}
                    />
                  )}

                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: isReached ? (s.percent === 100 ? "#22C55E" : "#38BDF8") : "#1E293B",
                      border: `3px solid ${isReached ? (s.percent === 100 ? "#4ADE80" : "#7DD3FC") : "#475569"}`,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      boxShadow: isReached ? "0 0 14px rgba(56,189,248,0.6)" : "none",
                      transition: "all 0.4s ease"
                    }}
                  >
                    {isReached ? "✓" : idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Labels Row */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, padding: "0 2px", position: "relative", zIndex: 5 }}>
          {timelineSteps.map((s, idx) => {
            const isReached = !isCancelled && percent >= s.percent;
            return (
              <span
                key={idx}
                style={{
                  fontSize: 11.5,
                  fontWeight: isReached ? 800 : 500,
                  color: isReached ? "#F8FAFC" : "#64748B",
                  textAlign: "center",
                  width: 72
                }}
              >
                {s.label}
              </span>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scooterVibrate {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2.5px) rotate(-0.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes scooterBeam {
          from { opacity: 0.7; transform: scaleX(0.9); }
          to { opacity: 1; transform: scaleX(1.1); }
        }
        @keyframes shadowBounce {
          0% { transform: scaleX(0.9); opacity: 0.5; }
          100% { transform: scaleX(1.1); opacity: 0.8; }
        }
        @keyframes trailDash {
          from { transform: translateX(0); opacity: 0.95; }
          to { transform: translateX(-18px); opacity: 0; }
        }
        @keyframes puffSmoke {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0.8; }
          100% { transform: translate(-14px, -8px) scale(1.4); opacity: 0; }
        }
        @keyframes beaconRing {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes tooltipFloat {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-4px); }
        }
        @keyframes laneMove {
          from { background-position: 0 0; }
          to { background-position: -30px 0; }
        }
      `}</style>
    </div>
  );
}
