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
  FileText
} from "lucide-react";
import { fetchOrderDeliveryTimeline } from "../lib/store";
import InvoiceModal from "../components/InvoiceModal";
import "../customer.css";

export default function Orders({ orders = [] }) {
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
  }, []);

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
            <p className="page-subtitle">Track ongoing package deliveries with real-time delivery boy updates.</p>
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
            <OrderCard key={order.id} order={order} liveTimeline={liveOrdersMap[order.id]} onOpenInvoice={setSelectedInvoice} />
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

function getTimelineIndex(status) {
  const s = (status || "").toLowerCase();
  if (s === "delivered") return 6;
  if (s === "out_for_delivery" || s === "out for delivery") return 5;
  if (s === "picked_up") return 4;
  if (s === "accepted" || s === "assigned") return 3;
  if (s === "confirmed") return 2;
  return 1;
}

function OrderCard({ order, liveTimeline, onOpenInvoice }) {
  const currentStatus = liveTimeline?.deliveryStatus || order.deliveryStatus || order.status || "ORDER_PLACED";
  const { bg, color, icon, label } = getStatusPill(currentStatus);
  const items = order.items || [];
  const currentStepIndex = getTimelineIndex(currentStatus);

  const timelineSteps = [
    { label: "Placed", step: 1 },
    { label: "Confirmed", step: 2 },
    { label: "Accepted", step: 3 },
    { label: "Picked Up", step: 4 },
    { label: "Out for Delivery", step: 5 },
    { label: "Delivered", step: 6 },
  ];

  // Resolve Partner Info
  const livePartner = liveTimeline?.deliveryPartner;
  const fallbackPartnerName = typeof order.deliveryPartner === "string" ? order.deliveryPartner : order.deliveryPartnerName;
  const partnerName = livePartner?.name || (typeof order.deliveryPartner === "object" ? order.deliveryPartner?.name : fallbackPartnerName);
  const partnerPhone = livePartner?.phone || order.deliveryPartnerPhone || (typeof order.deliveryPartner === "object" ? order.deliveryPartner?.phone : null);
  const partnerId = livePartner?.deliveryId || (order.delivery_partner_id ? `DEL${1000 + Number(order.delivery_partner_id)}` : null);

  const isAssigned = Boolean(partnerName && partnerName !== "Unassigned" && partnerName !== "undefined");

  return (
    <div className="order-card-container" style={{ marginBottom: 24 }}>
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

        <div style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={14} />
          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
        </div>
      </div>

      {/* Items Summary & Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, background: "#F8FAFC", padding: "16px 20px", borderRadius: 12, marginBottom: 16, border: "1px solid #E2E8F0" }}>
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

      {/* Real-time 6-Node Timeline Tracker */}
      <div className="timeline-stepper">
        {timelineSteps.map((s) => {
          const isCompleted = currentStepIndex >= s.step;
          const isActive = currentStepIndex === s.step;
          return (
            <div key={s.step} className={`timeline-step${isActive ? " active" : ""}${isCompleted ? " completed" : ""}`}>
              <div className="timeline-node">
                {isCompleted ? <CheckCircle2 size={16} /> : s.step}
              </div>
              <div className="timeline-label">{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
