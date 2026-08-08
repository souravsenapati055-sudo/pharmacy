import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  toggleDeliveryOnlineStatus,
  fetchAvailableDeliveryOrders,
  fetchActiveDeliveryOrder,
  acceptDeliveryOrder,
  updateDeliveryOrderStatus,
  fetchDeliveryStats,
  fetchDeliveryHistory,
  fetchDeliveryNotifications,
  markDeliveryNotificationRead,
  fetchDeliveryEarnings,
} from "../lib/store";
import { clearAuthSession } from "../lib/auth";
import {
  LayoutDashboard,
  Package,
  Truck,
  History,
  DollarSign,
  Bell,
  User,
  HelpCircle,
  LogOut,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
  Menu,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Award,
  Filter,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import "./DeliveryDashboard.css";

export default function DeliveryDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const partnerId = user?.id;

  // Active view tab state: 'dashboard' | 'available' | 'active' | 'history' | 'earnings' | 'notifications' | 'profile' | 'help'
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core delivery state
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [stats, setStats] = useState({
    completedToday: 0,
    completedTotal: 0,
    activeOrders: 0,
    totalEarningsToday: 0,
    totalEarningsOverall: 0,
  });
  const [historyOrders, setHistoryOrders] = useState([]);
  const [earningsData, setEarningsData] = useState({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalEarnings: 0,
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    totalCount: 0,
  });

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Available orders toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPayment, setFilterPayment] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Modal states
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const loadAllDashboardData = async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const [active, available, statsData, historyData, notifData, earnData] = await Promise.all([
        fetchActiveDeliveryOrder(partnerId),
        fetchAvailableDeliveryOrders(),
        fetchDeliveryStats(partnerId),
        fetchDeliveryHistory(partnerId),
        fetchDeliveryNotifications(partnerId),
        fetchDeliveryEarnings(partnerId),
      ]);

      setActiveOrder(active);
      setAvailableOrders(Array.isArray(available) ? available : []);
      if (statsData) setStats(statsData);
      if (Array.isArray(historyData)) setHistoryOrders(historyData);
      if (notifData) {
        setNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);
      }
      if (earnData) setEarningsData(earnData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      showError(err?.message || "Unable to fetch delivery data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDashboardData();
    const interval = setInterval(() => {
      loadAllDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, [partnerId]);

  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    setActionLoading(true);
    try {
      const res = await toggleDeliveryOnlineStatus(partnerId, nextState);
      setIsOnline(res.isOnline);
      showToast(res.message);
      if (nextState) loadAllDashboardData();
    } catch (err) {
      showError(err?.message || "Failed to update online status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setActionLoading(true);
    try {
      const res = await acceptDeliveryOrder(orderId, partnerId);
      showToast(res.message || "Order Accepted Successfully!");
      setSelectedOrderDetails(null);
      loadAllDashboardData();
      setActiveTab("dashboard");
    } catch (err) {
      showError(err?.message || "This order has already been accepted by another delivery partner.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmModal || !activeOrder) return;
    setActionLoading(true);
    try {
      const res = await updateDeliveryOrderStatus(
        activeOrder.id,
        partnerId,
        confirmModal.nextStatus,
        `Status updated to ${confirmModal.nextStatus} by ${user?.name || "Delivery Partner"}`
      );
      showToast(res.message);
      setConfirmModal(null);
      loadAllDashboardData();
    } catch (err) {
      showError(err?.message || "Failed to update delivery status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await markDeliveryNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser?.(null);
    navigate("/login/delivery");
  };

  const getNextActionConfig = (status) => {
    if (status === "ACCEPTED") {
      return {
        nextStatus: "PICKED_UP",
        buttonLabel: "Mark as Picked Up",
        modalTitle: "Confirm Order Pickup",
        modalMessage: "Are you sure you have picked up this order from the pharmacy?",
      };
    }
    if (status === "PICKED_UP") {
      return {
        nextStatus: "OUT_FOR_DELIVERY",
        buttonLabel: "Start Delivery (Out for Delivery)",
        modalTitle: "Confirm Delivery Start",
        modalMessage: "Are you starting the journey to deliver this order to the customer?",
      };
    }
    if (status === "OUT_FOR_DELIVERY") {
      return {
        nextStatus: "DELIVERED",
        buttonLabel: "Mark as Delivered",
        modalTitle: "Confirm Order Delivered",
        modalMessage: "Are you sure this order has been successfully handed over to the customer?",
      };
    }
    return null;
  };

  const nextAction = activeOrder ? getNextActionConfig(activeOrder.deliveryStatus) : null;

  // Filter available orders
  const filteredAvailableOrders = availableOrders.filter((ord) => {
    if (filterPayment === "COD" && ord.paymentMethod !== "COD") return false;
    if (filterPayment === "ONLINE" && ord.paymentMethod === "COD") return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      String(ord.orderIdFormatted || "").toLowerCase().includes(q) ||
      String(ord.customerName || "").toLowerCase().includes(q) ||
      String(ord.deliveryAddress || "").toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sortBy === "HIGHEST") return b.totalAmount - a.totalAmount;
    return b.id - a.id;
  });

  const formattedDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="logistics-app">
      {/* ─────────────────────────────────────────────────────────────
          LEFT SIDEBAR NAVIGATION
          ───────────────────────────────────────────────────────────── */}
      <aside className={`logistics-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="logistics-sidebar-brand">
          <div className="logistics-logo-icon">
            <Truck size={22} />
          </div>
          <div>
            <h2 className="logistics-brand-title">PharmaCare</h2>
            <div className="logistics-brand-subtitle">Express Logistics</div>
          </div>
        </div>

        <nav className="logistics-nav">
          <button
            className={`logistics-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button
            className={`logistics-nav-item ${activeTab === "available" ? "active" : ""}`}
            onClick={() => { setActiveTab("available"); setSidebarOpen(false); }}
          >
            <Package size={18} /> Available Orders
            {availableOrders.length > 0 && (
              <span className="logistics-nav-badge">{availableOrders.length}</span>
            )}
          </button>

          <button
            className={`logistics-nav-item ${activeTab === "active" ? "active" : ""}`}
            onClick={() => { setActiveTab("active"); setSidebarOpen(false); }}
          >
            <Truck size={18} /> Active Delivery
            {activeOrder && <span className="logistics-nav-badge" style={{ background: "#16A34A" }}>1</span>}
          </button>

          <button
            className={`logistics-nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => { setActiveTab("history"); setSidebarOpen(false); }}
          >
            <History size={18} /> Delivery History
          </button>

          <button
            className={`logistics-nav-item ${activeTab === "earnings" ? "active" : ""}`}
            onClick={() => { setActiveTab("earnings"); setSidebarOpen(false); }}
          >
            <DollarSign size={18} /> Earnings
          </button>

          <button
            className={`logistics-nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => { setActiveTab("notifications"); setSidebarOpen(false); }}
          >
            <Bell size={18} /> Notifications
            {unreadCount > 0 && <span className="logistics-nav-badge" style={{ background: "#DC2626" }}>{unreadCount}</span>}
          </button>

          <button
            className={`logistics-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => { setActiveTab("profile"); setSidebarOpen(false); }}
          >
            <User size={18} /> Profile & Details
          </button>

          <button
            className={`logistics-nav-item ${activeTab === "help" ? "active" : ""}`}
            onClick={() => { setActiveTab("help"); setSidebarOpen(false); }}
          >
            <HelpCircle size={18} /> Help & Support
          </button>
        </nav>

        <div className="logistics-sidebar-footer">
          <div className="logistics-partner-profile-card">
            <div className="logistics-avatar">
              {(user?.name || "R")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name || "Ravi Kumar"}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>
                {user?.deliveryId || "DEL1001"}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 4 }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT WRAPPER
          ───────────────────────────────────────────────────────────── */}
      <div className="logistics-main-wrapper">
        {/* TOP HEADER BAR */}
        <header className="logistics-header">
          <div className="logistics-header-left">
            <button
              className="logistics-mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={22} />
            </button>

            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                Good Morning, {user?.name || "Ravi"} 👋
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
                Ready to deliver today?
              </div>
            </div>
          </div>

          <div className="logistics-header-right">
            {/* Online / Offline Toggle Switch */}
            <div
              className={`logistics-online-switch ${isOnline ? "online" : "offline"}`}
              onClick={handleToggleOnline}
            >
              <span className="logistics-dot" />
              {isOnline ? "Online" : "Offline"}
            </div>

            {/* Notification Bell Icon */}
            <button
              className="logistics-icon-btn"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="logistics-unread-dot" />}
            </button>

            {/* Profile Avatar */}
            <div
              className="logistics-avatar"
              style={{ cursor: "pointer" }}
              onClick={() => setActiveTab("profile")}
            >
              {(user?.name || "R")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* NOTIFICATION CENTER DROPDOWN DRAWER */}
        {notificationsOpen && (
          <div style={{ position: "absolute", top: 68, right: 28, width: 360, backgroundColor: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 12px 24px -4px rgba(15,23,42,0.15)", zIndex: 120, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                <Bell size={16} color="#087EA4" /> Notifications ({notifications.length})
              </div>
              <button onClick={() => setNotificationsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkNotificationRead(n.id)}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: n.isRead ? "#F8FAFC" : "#E0F2FE",
                    cursor: "pointer",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{n.message}</div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 4 }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : "Just now"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="logistics-content-container">
          {/* Toast / Error Banners */}
          {toastMessage && (
            <div style={{ background: "#DCFCE7", color: "#166534", padding: "12px 16px", borderRadius: 10, border: "1px solid #bbf7d0", fontWeight: 700, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} /> {toastMessage}
            </div>
          )}
          {errorMessage && (
            <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px 16px", borderRadius: 10, border: "1px solid #fca5a5", fontWeight: 700, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} /> {errorMessage}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 1: DASHBOARD OVERVIEW
              ───────────────────────────────────────────────────────────── */}
          {(activeTab === "dashboard" || activeTab === "available" || activeTab === "active") && (
            <>
              {/* WELCOME BANNER & DATE BAR */}
              <div className="logistics-welcome-banner">
                <div>
                  <h1 className="logistics-greeting-title">
                    Good Morning, {user?.name || "Ravi"} 👋
                  </h1>
                  <p className="logistics-greeting-sub">
                    Ready to make today's deliveries?
                  </p>
                </div>

                <div className="logistics-date-pill">
                  <Calendar size={14} color="#087EA4" /> {formattedDateStr}
                </div>
              </div>

              {/* Offline Warning Banner */}
              {!isOnline && (
                <div style={{ background: "#FEF3C7", color: "#92400E", padding: "14px 18px", borderRadius: 12, border: "1px solid #fcd34d", fontWeight: 700, fontSize: 13.5, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={18} />
                  <div>
                    You are currently offline. Toggle status to <strong>Online</strong> to receive new delivery assignments.
                  </div>
                </div>
              )}

              {/* 6-CARD RESPONSIVE STATISTICS GRID */}
              <div className="logistics-stats-grid">
                <div className="logistics-stat-card">
                  <div className="logistics-stat-header">
                    <span className="logistics-stat-label">Today's Deliveries</span>
                    <div className="logistics-stat-icon" style={{ background: "#E0F2FE", color: "#087EA4" }}>
                      <Package size={16} />
                    </div>
                  </div>
                  <div className="logistics-stat-value">{stats.completedToday}</div>
                  <div className="logistics-stat-trend up">
                    <TrendingUp size={12} /> +1 from yesterday
                  </div>
                </div>

                <div className="logistics-stat-card">
                  <div className="logistics-stat-header">
                    <span className="logistics-stat-label">Active Deliveries</span>
                    <div className="logistics-stat-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <Truck size={16} />
                    </div>
                  </div>
                  <div className="logistics-stat-value">{activeOrder ? 1 : stats.activeOrders}</div>
                  <div className="logistics-stat-trend neutral">In-progress</div>
                </div>

                <div className="logistics-stat-card">
                  <div className="logistics-stat-header">
                    <span className="logistics-stat-label">Available Orders</span>
                    <div className="logistics-stat-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>
                      <Clock size={16} />
                    </div>
                  </div>
                  <div className="logistics-stat-value">{availableOrders.length}</div>
                  <div className="logistics-stat-trend neutral">Pending pickup</div>
                </div>

                <div className="logistics-stat-card">
                  <div className="logistics-stat-header">
                    <span className="logistics-stat-label">Completed Today</span>
                    <div className="logistics-stat-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <div className="logistics-stat-value">{stats.completedToday}</div>
                  <div className="logistics-stat-trend up">100% On Time</div>
                </div>

                <div className="logistics-stat-card">
                  <div className="logistics-stat-header">
                    <span className="logistics-stat-label">Earnings Today</span>
                    <div className="logistics-stat-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="logistics-stat-value" style={{ color: "#16A34A" }}>
                    ₹{stats.totalEarningsToday}
                  </div>
                  <div className="logistics-stat-trend up">+₹50 payout per order</div>
                </div>

                <div className="logistics-stat-card">
                  <div className="logistics-stat-header">
                    <span className="logistics-stat-label">Total Deliveries</span>
                    <div className="logistics-stat-icon" style={{ background: "#E0F2FE", color: "#0369A1" }}>
                      <Award size={16} />
                    </div>
                  </div>
                  <div className="logistics-stat-value">{stats.completedTotal}</div>
                  <div className="logistics-stat-trend neutral">Lifetime total</div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  ACTIVE DELIVERY — MOST IMPORTANT HERO SECTION
                  ───────────────────────────────────────────────────────────── */}
              {activeOrder ? (
                <div className="logistics-active-hero-card">
                  <div className="logistics-active-header">
                    <div className="logistics-order-id-badge">
                      <span className="logistics-active-tag">CURRENT DELIVERY</span>
                      <h2 className="logistics-active-order-title">
                        Order #{activeOrder.orderIdFormatted}
                      </h2>
                    </div>

                    <span style={{ padding: "5px 14px", background: "#DCFCE7", color: "#166534", borderRadius: 20, fontSize: 12.5, fontWeight: 800 }}>
                      {activeOrder.deliveryStatus}
                    </span>
                  </div>

                  <div className="logistics-active-grid">
                    {/* Customer Info Box */}
                    <div className="logistics-customer-info-box">
                      <div className="logistics-customer-name">
                        Rahul Sharma ({activeOrder.customerName})
                      </div>
                      <div className="logistics-info-row">
                        <Phone size={15} color="#087EA4" /> <strong>Phone:</strong> {activeOrder.customerPhone}
                      </div>
                      <div className="logistics-info-row">
                        <MapPin size={15} color="#087EA4" /> <strong>Delivery Address:</strong> {activeOrder.deliveryAddress}
                      </div>
                    </div>

                    {/* Metrics Box */}
                    <div className="logistics-order-metrics-box">
                      <div className="logistics-metric-row">
                        <span style={{ color: "#64748B" }}>Order Amount:</span>
                        <strong style={{ fontSize: 15, color: "#16A34A" }}>₹{activeOrder.totalAmount}</strong>
                      </div>
                      <div className="logistics-metric-row">
                        <span style={{ color: "#64748B" }}>Payment:</span>
                        <strong>{activeOrder.paymentMethod === "COD" ? "Cash on Delivery" : "Paid Online"}</strong>
                      </div>
                      <div className="logistics-metric-row">
                        <span style={{ color: "#64748B" }}>Distance:</span>
                        <strong>2.4 km</strong>
                      </div>
                    </div>
                  </div>

                  {/* DELIVERY PROGRESS STEPPER */}
                  <div className="logistics-stepper-container">
                    <div className="logistics-stepper-title">DELIVERY PROGRESS</div>
                    <div className="logistics-stepper">
                      <div className="logistics-stepper-line" />

                      {/* Step 1: Accepted */}
                      <div className="logistics-step-node">
                        <div className="logistics-node-circle done">✓</div>
                        <span className="logistics-node-label active">Accepted</span>
                      </div>

                      {/* Step 2: Picked Up */}
                      <div className="logistics-step-node">
                        <div className={`logistics-node-circle ${["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(activeOrder.deliveryStatus) ? "done" : activeOrder.deliveryStatus === "ACCEPTED" ? "current" : "pending"}`}>
                          {["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(activeOrder.deliveryStatus) ? "✓" : "2"}
                        </div>
                        <span className={`logistics-node-label ${["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(activeOrder.deliveryStatus) ? "active" : ""}`}>Picked Up</span>
                      </div>

                      {/* Step 3: Out for Delivery */}
                      <div className="logistics-step-node">
                        <div className={`logistics-node-circle ${["OUT_FOR_DELIVERY", "DELIVERED"].includes(activeOrder.deliveryStatus) ? "done" : activeOrder.deliveryStatus === "PICKED_UP" ? "current" : "pending"}`}>
                          {["OUT_FOR_DELIVERY", "DELIVERED"].includes(activeOrder.deliveryStatus) ? "✓" : "3"}
                        </div>
                        <span className={`logistics-node-label ${["OUT_FOR_DELIVERY", "DELIVERED"].includes(activeOrder.deliveryStatus) ? "active" : ""}`}>Out for Delivery</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="logistics-step-node">
                        <div className={`logistics-node-circle ${activeOrder.deliveryStatus === "DELIVERED" ? "done" : activeOrder.deliveryStatus === "OUT_FOR_DELIVERY" ? "current" : "pending"}`}>
                          {activeOrder.deliveryStatus === "DELIVERED" ? "✓" : "4"}
                        </div>
                        <span className={`logistics-node-label ${activeOrder.deliveryStatus === "DELIVERED" ? "active" : ""}`}>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS BAR */}
                  <div className="logistics-active-actions-row">
                    <a
                      href={`tel:${activeOrder.customerPhone}`}
                      className="logistics-btn-secondary logistics-btn-call"
                    >
                      <Phone size={16} /> Call Customer
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.deliveryAddress)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="logistics-btn-secondary logistics-btn-nav"
                    >
                      <Navigation size={16} /> Navigate
                    </a>

                    {nextAction && (
                      <button
                        className="logistics-btn-primary-action"
                        onClick={() => setConfirmModal(nextAction)}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={18} /> {nextAction.buttonLabel}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* NO ACTIVE DELIVERY COMPACT STATE */
                <div className="logistics-empty-active-card">
                  <div className="logistics-empty-icon">
                    <Package size={24} />
                  </div>
                  <h3 style={{ margin: "4px 0 0 0", fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                    No Active Delivery
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                    You currently don't have an active delivery. Check Available Orders to accept a new delivery.
                  </p>
                  <button
                    onClick={() => setActiveTab("available")}
                    style={{ background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginTop: 8 }}
                  >
                    View Available Orders ({availableOrders.length})
                  </button>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  AVAILABLE DELIVERY ORDERS GRID
                  ───────────────────────────────────────────────────────────── */}
              <div className="logistics-section-header">
                <h2 className="logistics-section-title">
                  Available Delivery Orders ({filteredAvailableOrders.length})
                </h2>

                <div className="logistics-toolbar">
                  <div style={{ position: "relative" }}>
                    <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      className="logistics-search-input"
                      placeholder="Search Order ID, Address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="logistics-select"
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                  >
                    <option value="ALL">All Payment Types</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="ONLINE">Online Paid</option>
                  </select>

                  <select
                    className="logistics-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="HIGHEST">Highest Amount</option>
                  </select>
                </div>
              </div>

              {filteredAvailableOrders.length === 0 ? (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 32, textAlign: "center", color: "#64748B", border: "1px dashed #CBD5E1", marginBottom: 32 }}>
                  <Package size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0F172A" }}>No Available Orders Right Now</div>
                  <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>We'll notify you as soon as new delivery orders arrive in your zone.</div>
                </div>
              ) : (
                <div className="logistics-orders-grid">
                  {filteredAvailableOrders.map((ord) => (
                    <div key={ord.id} className="logistics-order-card">
                      <div>
                        <div className="logistics-order-card-head">
                          <span className="logistics-order-id">Order #{ord.orderIdFormatted}</span>
                          <span className="logistics-order-price">₹{ord.totalAmount}</span>
                        </div>

                        <div className="logistics-order-customer">{ord.customerName}</div>
                        <div className="logistics-order-address">
                          <MapPin size={14} color="#087EA4" style={{ flexShrink: 0, marginTop: 2 }} />
                          {ord.deliveryAddress}
                        </div>
                      </div>

                      <div className="logistics-order-foot">
                        <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                          {ord.itemsCount} Items • 2.4 km away
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="logistics-btn-details"
                            onClick={() => setSelectedOrderDetails(ord)}
                          >
                            View Details
                          </button>
                          <button
                            className="logistics-btn-accept"
                            onClick={() => handleAcceptOrder(ord.id)}
                            disabled={actionLoading}
                          >
                            Accept Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 2: DELIVERY HISTORY
              ───────────────────────────────────────────────────────────── */}
          {activeTab === "history" && (
            <div>
              <div className="logistics-section-header">
                <h2 className="logistics-section-title">
                  Delivery History ({historyOrders.length})
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {historyOrders.length === 0 ? (
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748B", border: "1px dashed #CBD5E1" }}>
                    No completed delivery history yet.
                  </div>
                ) : (
                  historyOrders.map((item) => {
                    const isExpanded = expandedHistoryId === item.id;
                    return (
                      <div key={item.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 18, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 800, fontSize: 16, color: "#087EA4" }}>Order #{item.orderIdFormatted}</span>
                              <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>
                                DELIVERED
                              </span>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
                              {item.customerName} ({item.customerPhone})
                            </div>
                            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                              <MapPin size={13} style={{ verticalAlign: "middle" }} /> {item.deliveryAddress}
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "#16A34A" }}>+ ₹{item.payoutAmount} Payout</div>
                            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>Order Total: ₹{item.totalAmount}</div>
                            <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4 }}>
                              {item.deliveredAt ? new Date(item.deliveredAt).toLocaleString() : "Recently"}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                          style={{ background: "none", border: "none", color: "#087EA4", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: "10px 0 0 0", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? "Hide Items" : `View ${item.itemsCount || item.items?.length || 1} Items`}
                        </button>

                        {isExpanded && item.items?.length > 0 && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #CBD5E1", fontSize: 12.5 }}>
                            {item.items.map((it, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", color: "#475569", padding: "3px 0" }}>
                                <span>• {it.medicineName} (x{it.quantity})</span>
                                <span style={{ fontWeight: 700 }}>₹{it.totalPrice || it.unitPrice * it.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 3: EARNINGS BREAKDOWN
              ───────────────────────────────────────────────────────────── */}
          {activeTab === "earnings" && (
            <div>
              <div className="logistics-section-header">
                <h2 className="logistics-section-title">Earnings Breakdown</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                <div className="logistics-stat-card">
                  <div className="logistics-stat-label">Today's Earnings</div>
                  <div className="logistics-stat-value" style={{ color: "#16A34A" }}>₹{earningsData.todayEarnings}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{earningsData.todayCount} deliveries completed</div>
                </div>

                <div className="logistics-stat-card">
                  <div className="logistics-stat-label">This Week</div>
                  <div className="logistics-stat-value" style={{ color: "#087EA4" }}>₹{earningsData.weekEarnings}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{earningsData.weekCount} deliveries completed</div>
                </div>

                <div className="logistics-stat-card">
                  <div className="logistics-stat-label">This Month</div>
                  <div className="logistics-stat-value" style={{ color: "#0369A1" }}>₹{earningsData.monthEarnings}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{earningsData.monthCount} deliveries completed</div>
                </div>

                <div className="logistics-stat-card">
                  <div className="logistics-stat-label">Total Lifetime Earnings</div>
                  <div className="logistics-stat-value" style={{ color: "#0F172A" }}>₹{earningsData.totalEarnings}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{earningsData.totalCount} deliveries overall</div>
                </div>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Payout Structure</h3>
                <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6 }}>
                  • <strong>Base Payout:</strong> ₹50 per successfully completed delivery assignment.<br />
                  • <strong>Distance & Logistics Fee:</strong> Full credit of order delivery fee directly added to earnings.<br />
                  • <strong>Payout Frequency:</strong> Direct bank settlement processed every Monday.
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 4: PROFILE & HELP
              ───────────────────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", maxWidth: 600 }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Delivery Partner Profile</h2>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                <div className="logistics-avatar" style={{ width: 60, height: 60, fontSize: 24 }}>
                  {(user?.name || "R")[0]}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>{user?.name || "Ravi Kumar"}</h3>
                  <div style={{ fontSize: 13, color: "#087EA4", fontWeight: 700 }}>{user?.deliveryId || "DEL1001"}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>PharmaCare Express Logistics</div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
                <div><strong>Phone:</strong> {user?.phone || "+91 98765 43210"}</div>
                <div><strong>Email:</strong> {user?.email || "delivery.partner@pharmacare.com"}</div>
                <div><strong>Zone:</strong> Durgapur Central, West Bengal</div>
                <div><strong>Account Status:</strong> <span style={{ color: "#16A34A", fontWeight: 800 }}>ACTIVE 🟢</span></div>
              </div>
            </div>
          )}

          {activeTab === "help" && (
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", maxWidth: 600 }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Logistics Support & Emergency Helpline</h2>
              <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6 }}>
                Need help with a delivery order or customer location?<br />
                • <strong>Dispatch Hotline:</strong> +91 1800-PHARMA-HELP<br />
                • <strong>Logistics Email:</strong> support.express@pharmacare.com<br />
                • <strong>Operating Hours:</strong> 24/7 Priority Emergency Support
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ORDER DETAILS DRAWER / MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedOrderDetails && (
        <div className="logistics-overlay" onClick={() => setSelectedOrderDetails(null)}>
          <div className="logistics-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #E2E8F0" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                Order #{selectedOrderDetails.orderIdFormatted}
              </h3>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: 4, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 14, fontSize: 13 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>{selectedOrderDetails.customerName}</div>
                <div style={{ color: "#475569", marginTop: 4 }}><MapPin size={14} style={{ verticalAlign: "middle" }} /> {selectedOrderDetails.deliveryAddress}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", background: "#E0F2FE", padding: "12px 16px", borderRadius: 10, color: "#0369A1", fontWeight: 800 }}>
                <span>Order Total Amount:</span>
                <span>₹{selectedOrderDetails.totalAmount}</span>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", marginBottom: 6 }}>Ordered Prescription Medicines:</div>
                {selectedOrderDetails.items?.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", color: "#475569", borderBottom: "1px dashed #F1F5F9" }}>
                    <span>• {it.medicineName} (x{it.quantity})</span>
                    <span style={{ fontWeight: 700 }}>₹{it.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ background: "#F1F5F9", color: "#475569", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                Close
              </button>
              <button
                className="logistics-btn-accept"
                onClick={() => handleAcceptOrder(selectedOrderDetails.id)}
                disabled={actionLoading}
              >
                Accept Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CONFIRMATION MODAL
          ───────────────────────────────────────────────────────────── */}
      {confirmModal && (
        <div className="logistics-overlay">
          <div className="logistics-modal" style={{ width: 440 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 8px 0" }}>{confirmModal.modalTitle}</h3>
            <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 0 20px 0", lineHeight: 1.4 }}>{confirmModal.modalMessage}</p>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmModal(null)} style={{ background: "#F1F5F9", color: "#475569", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={actionLoading}
                className="logistics-btn-primary-action"
                style={{ padding: "10px 20px" }}
              >
                {actionLoading ? "Updating..." : "Confirm & Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MOBILE BOTTOM NAVIGATION BAR
          ───────────────────────────────────────────────────────────── */}
      <nav className="logistics-mobile-bottom-nav">
        <button className={`logistics-mobile-nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
          <LayoutDashboard size={20} /> Home
        </button>
        <button className={`logistics-mobile-nav-item ${activeTab === "available" ? "active" : ""}`} onClick={() => setActiveTab("available")}>
          <Package size={20} /> Orders
        </button>
        <button className={`logistics-mobile-nav-item ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
          <History size={20} /> History
        </button>
        <button className={`logistics-mobile-nav-item ${activeTab === "earnings" ? "active" : ""}`} onClick={() => setActiveTab("earnings")}>
          <DollarSign size={20} /> Earnings
        </button>
        <button className={`logistics-mobile-nav-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
          <User size={20} /> Profile
        </button>
      </nav>
    </div>
  );
}
