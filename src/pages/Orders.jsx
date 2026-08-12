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
// ANIMATED SCOOTER VECTOR ICON COMPONENT
// ─────────────────────────────────────────────
function DeliveryScooterIcon({ isMoving, isCancelled }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {/* Headlight Cone */}
      {isMoving && !isCancelled && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: -22,
            width: 24,
            height: 16,
            background: "linear-gradient(90deg, rgba(253,224,71,0.85) 0%, rgba(253,224,71,0) 100%)",
            clipPath: "polygon(0 35%, 100% 0, 100% 100%, 0 65%)",
            zIndex: 1,
            animation: "scooterBeam 0.6s ease-in-out infinite alternate"
          }}
        />
      )}

      {/* Speed Trails */}
      {isMoving && !isCancelled && (
        <div style={{ position: "absolute", top: 16, left: -18, display: "flex", flexDirection: "column", gap: 3, zIndex: 1 }}>
          <div style={{ width: 14, height: 2, background: "#087EA4", borderRadius: 2, opacity: 0.8, animation: "trailDash 0.35s linear infinite" }} />
          <div style={{ width: 18, height: 2.5, background: "#10B981", borderRadius: 2, opacity: 0.9, animation: "trailDash 0.3s linear infinite 0.1s" }} />
          <div style={{ width: 10, height: 2, background: "#087EA4", borderRadius: 2, opacity: 0.7, animation: "trailDash 0.4s linear infinite 0.15s" }} />
        </div>
      )}

      {/* Scooter Body Vector SVG */}
      <svg
        width="44"
        height="38"
        viewBox="0 0 54 48"
        fill="none"
        style={{
          filter: isCancelled ? "grayscale(1)" : "drop-shadow(0 4px 10px rgba(8,126,164,0.4))",
          animation: isMoving && !isCancelled ? "scooterRide 0.35s ease-in-out infinite alternate" : "none"
        }}
      >
        {/* Delivery Cargo Box */}
        <rect x="2" y="10" width="16" height="18" rx="3" fill="#087EA4" stroke="#0369A1" strokeWidth="1.5" />
        <path d="M 7 19 L 13 19 M 10 16 L 10 22" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

        {/* Chassis Frame */}
        <path d="M 16 26 L 24 26 L 33 16 L 42 16" stroke="#087EA4" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 22 26 L 36 34 L 44 34" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />

        {/* Steering */}
        <path d="M 40 16 L 42 8 L 46 8" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 42 12 L 47 6" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

        {/* Seat Cushion */}
        <path d="M 18 20 Q 24 18 28 22" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />

        {/* Wheels */}
        <g style={{ transformOrigin: "12px 36px", animation: isMoving && !isCancelled ? "wheelSpin 0.3s linear infinite" : "none" }}>
          <circle cx="12" cy="36" r="8" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
          <circle cx="12" cy="36" r="3" fill="#94A3B8" />
        </g>
        <g style={{ transformOrigin: "42px 36px", animation: isMoving && !isCancelled ? "wheelSpin 0.3s linear infinite" : "none" }}>
          <circle cx="42" cy="36" r="8" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
          <circle cx="42" cy="36" r="3" fill="#94A3B8" />
        </g>
      </svg>
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
    { label: "Placed", percent: 0 },
    { label: "Confirmed", percent: 20 },
    { label: "Accepted", percent: 40 },
    { label: "Picked Up", percent: 60 },
    { label: "Out for Delivery", percent: 80 },
    { label: "Delivered", percent: 100 },
  ];

  // Resolve Partner Info
  const livePartner = liveTimeline?.deliveryPartner;
  const fallbackPartnerName = typeof order.deliveryPartner === "string" ? order.deliveryPartner : order.deliveryPartnerName;
  const partnerName = livePartner?.name || (typeof order.deliveryPartner === "object" ? order.deliveryPartner?.name : fallbackPartnerName);
  const partnerPhone = livePartner?.phone || order.deliveryPartnerPhone || (typeof order.deliveryPartner === "object" ? order.deliveryPartner?.phone : null);
  const partnerId = livePartner?.deliveryId || (order.delivery_partner_id ? `DEL${1000 + Number(order.delivery_partner_id)}` : null);

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
    <div className="order-card-container" style={{ marginBottom: 28, background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
            Order #PC-{order.id}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 700, background: bg, color, padding: "4px 12px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, background: "#F8FAFC", padding: "16px 20px", borderRadius: 12, marginBottom: 24, border: "1px solid #E2E8F0" }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Purchased Items</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
            {items.map((i) => i.name || i.medicine_name || "Medicine").join(", ") || order.medicine || "Pharmaceutical Products"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Delivery Destination</div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={14} color="#087EA4" />
            {order.address?.details || order.address_details || "Registered Address"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Delivery Partner</div>
          {isAssigned ? (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                <UserCheck size={15} color="#16A34A" />
                {partnerName} {partnerId ? `(${partnerId})` : ""}
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
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Total Amount</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
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
          INTERACTIVE ANIMATED DELIVERY SCOOTER TRACK
         ───────────────────────────────────────────── */}
      <div style={{ background: "#F1F5F9", borderRadius: 16, padding: "24px 28px 20px 28px", border: "1px solid #E2E8F0", position: "relative" }}>
        
        {/* Status Tooltip Header above Scooter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#087EA4", background: "#E0F2FE", padding: "3px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Live Delivery Scooter Radar
            </span>
            <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 600 }}>
              {isDelivered ? "Delivered at doorstep 🎉" : isCancelled ? "Order cancelled by customer" : isMoving ? `Delivery boy ${partnerName || "courier"} is on route! 🛵` : "Order being processed at pharmacy warehouse"}
            </span>
          </div>
          {isMoving && !isCancelled && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#D97706", background: "#FEF3C7", padding: "3px 10px", borderRadius: 6 }}>
              ETA ~12 mins
            </span>
          )}
        </div>

        {/* Road Track Container */}
        <div style={{ position: "relative", height: 68, marginTop: 10, display: "flex", alignItems: "center" }}>
          
          {/* Base Road Surface Line */}
          <div style={{ position: "absolute", left: 0, right: 0, height: 8, background: "#CBD5E1", borderRadius: 999, overflow: "hidden" }}>
            {/* Progress Fill Bar */}
            <div
              style={{
                height: "100%",
                width: isCancelled ? "0%" : `${percent}%`,
                background: isDelivered ? "#16A34A" : "linear-gradient(90deg, #087EA4 0%, #10B981 100%)",
                borderRadius: 999,
                transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            />
          </div>

          {/* Dotted Road Lane Markers */}
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, borderTop: "2px dashed #FFFFFF", opacity: 0.6, pointerEvents: "none" }} />

          {/* Moving Delivery Scooter Container */}
          {!isCancelled && (
            <div
              style={{
                position: "absolute",
                left: `calc(${percent}% - 22px)`,
                top: -12,
                zIndex: 10,
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
          <div style={{ position: "absolute", left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5, padding: "0 2px" }}>
            {timelineSteps.map((s, idx) => {
              const isReached = !isCancelled && percent >= s.percent;
              const isCurrent = !isCancelled && percent === s.percent;
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: isReached ? (s.percent === 100 ? "#16A34A" : "#087EA4") : "#FFFFFF",
                      border: `3px solid ${isReached ? (s.percent === 100 ? "#16A34A" : "#087EA4") : "#94A3B8"}`,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                      boxShadow: isCurrent ? "0 0 0 4px rgba(8,126,164,0.25)" : "none",
                      transition: "all 0.3s ease"
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
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "0 2px" }}>
          {timelineSteps.map((s, idx) => {
            const isReached = !isCancelled && percent >= s.percent;
            return (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  fontWeight: isReached ? 800 : 500,
                  color: isReached ? "#0F172A" : "#94A3B8",
                  textAlign: "center",
                  width: 60
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
        @keyframes scooterRide {
          from { transform: translateY(0px); }
          to { transform: translateY(-3px); }
        }
        @keyframes scooterBeam {
          from { opacity: 0.6; transform: scaleX(0.9); }
          to { opacity: 1; transform: scaleX(1.1); }
        }
        @keyframes trailDash {
          from { transform: translateX(0); opacity: 0.8; }
          to { transform: translateX(-12px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
