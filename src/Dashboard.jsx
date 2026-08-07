import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchAdminDashboard, updateOrderStatus } from "./lib/store";

export default function UltraDashboard({ deliveryPeople = [], setDeliveryPeople, orders = [], setOrders }) {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [adminPhoto, setAdminPhoto] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem("adminProfile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      if (profile.fullName) setAdminName(profile.fullName.split(" ")[0]);
      if (profile.profilePhoto) setAdminPhoto(profile.profilePhoto);
    }

    const currentUser = localStorage.getItem("user");
    if (currentUser) {
      const user = JSON.parse(currentUser);
      if (!adminName && user.name) setAdminName(user.name.split(" ")[0]);
      if (!adminPhoto && user.profilePhoto) setAdminPhoto(user.profilePhoto);
    }
  }, [adminName, adminPhoto]);

  useEffect(() => {
    let ignore = false;
    async function loadDashboard() {
      setLoading(true);
      try {
        const data = await fetchAdminDashboard();
        if (!ignore) setDashboardData(data);
      } catch (error) {
        console.error("Dashboard load failed:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadDashboard();
    return () => { ignore = true; };
  }, [setOrders]);

  const salesData = dashboardData?.salesData || [];
  const medicineData = dashboardData?.medicineData || [];
  const recentOrders = useMemo(() => dashboardData?.recentOrders || orders || [], [dashboardData, orders]);
  const filteredOrders = useMemo(
    () =>
      recentOrders.filter((order) =>
        `${order.customerName} ${order.medicine} ${order.deliveryPartner || ""} ${order.id}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [recentOrders, search]
  );

  const deliverySummary = dashboardData?.deliverySummary || {
    totalPartners: deliveryPeople.length,
    activeOrders: orders.filter((o) => o.status?.toLowerCase() !== "delivered").length,
    completedDeliveries: deliveryPeople.reduce((sum, p) => sum + (p.orders || 0), 0),
  };

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      const response = await updateOrderStatus(orderId, status);
      const updatedOrder = response.order;
      setOrders?.((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      setDashboardData((prev) =>
        prev ? { ...prev, recentOrders: prev.recentOrders.map((o) => (o.id === orderId ? updatedOrder : o)) } : prev
      );
      if (updatedOrder.deliveryPartner) {
        setDeliveryPeople?.((prev) =>
          prev.map((partner) =>
            partner.name === updatedOrder.deliveryPartner
              ? {
                  ...partner,
                  activeOrders: status === "Delivered" ? Math.max((partner.activeOrders || 1) - 1, 0) : partner.activeOrders,
                  orders: status === "Delivered" ? (partner.orders || 0) + 1 : partner.orders,
                }
              : partner
          )
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(value || 0);

  const getStatusClass = (status) => {
    const s = status?.toLowerCase().replace(/\s/g, "-");
    return `status-badge status-${s}`;
  };

  const todaySales = (recentOrders || [])
    .filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const activeDeliveries = (recentOrders || []).filter((o) => o.status === "Out for Delivery").length;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="wrapper">
      {/* Mobile sidebar toggle */}
      <button className="sidebar-toggle" onClick={() => setSidebarOpen((p) => !p)} aria-label="Toggle sidebar">
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="logo">
            <span className="logo-icon">💊</span>
            PharmaCare
          </h2>
        </div>

        <nav className="sidebar-nav">
          <p className="section">MAIN MENU</p>
          <button className="active" onClick={closeSidebar}>
            📊 Dashboard
          </button>
          <button onClick={() => { navigate("/delivery-team"); closeSidebar(); }}>
            🚚 Delivery Team
          </button>
          <button onClick={() => { navigate("/admin/analytics"); closeSidebar(); }}>
            📈 Analytics
          </button>
          <button onClick={() => { navigate("/admin/alerts"); closeSidebar(); }}>
            🔔 Alerts
          </button>
          <button onClick={() => { navigate("/admin/ai-recommendations"); closeSidebar(); }}>
            🤖 AI Insights
          </button>
          <button onClick={() => { navigate("/admin/generate-report"); closeSidebar(); }}>
            📄 Reports
          </button>

          <p className="section">INVENTORY</p>
          <button onClick={() => { navigate("/restock"); closeSidebar(); }}>
            📦 Restock
          </button>
          <button onClick={() => { navigate("/emergency-order"); closeSidebar(); }}>
            🚨 Emergency Order
          </button>
          <button onClick={() => { navigate("/bulk-discount"); closeSidebar(); }}>
            🏷️ Bulk Discount
          </button>
          <button onClick={() => { navigate("/order-from-seller"); closeSidebar(); }}>
            🛒 Order from Seller
          </button>
        </nav>

        <div className="profile-card">
          <p>Complete Admin Profile</p>
          <button onClick={() => { navigate("/profile"); closeSidebar(); }}>
            ✅ Verify Identity
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Top Bar */}
        <div className="topbar">
          <input
            className="search"
            placeholder="🔍 Search orders, customer, delivery partner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="topbar-right">
            {adminPhoto && (
              <img src={adminPhoto} alt={adminName} className="admin-avatar" />
            )}
            {adminName && (
              <span className="admin-name-label">Hi, {adminName} 👋</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="main-body">
          {/* Delivery Overview Banner */}
          <div className="delivery-overview">
            <div>
              <h3>Delivery Team Overview</h3>
              <p className="delivery-overview-subtitle">Live status of all delivery operations</p>
            </div>
            <div className="delivery-metrics">
              <div className="metric-item">
                <span className="metric-value">{deliverySummary.totalPartners}</span>
                <span className="metric-label">Partners</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{deliverySummary.activeOrders}</span>
                <span className="metric-label">Active Orders</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{deliverySummary.completedDeliveries}</span>
                <span className="metric-label">Completed</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ fontSize: 18, color: "#a78bfa" }}>{adminName || "Admin"}</span>
                <span className="metric-label">Admin</span>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="cards">
            <div className="card green">
              <span className="card-icon">💰</span>
              <p>Today's Sales</p>
              <h2>{formatCurrency(todaySales)}</h2>
            </div>
            <div className="card teal">
              <span className="card-icon">🏷️</span>
              <p>Available Categories</p>
              <h2>{dashboardData?.stats?.totalCategories || 0}</h2>
            </div>
            <div className="card pink">
              <span className="card-icon">⚠️</span>
              <p>Low Stock Medicines</p>
              <h2>{dashboardData?.stats?.lowStockCount || 0}</h2>
            </div>
            <div className="card purple">
              <span className="card-icon">🚚</span>
              <p>Active Deliveries</p>
              <h2>{activeDeliveries}</h2>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-skeleton" style={{ height: 260, borderRadius: 16 }} />
              <div className="loading-skeleton" style={{ height: 200, borderRadius: 16 }} />
              <p style={{ color: "#475569", fontSize: 14, textAlign: "center" }}>Loading dashboard data…</p>
            </div>
          ) : (
            <>
              {/* Charts */}
              <div className="graph-section">
                <div className="graph-card">
                  <h3>📈 Sales Trend</h3>
                  <div className="scroll-container">
                    <div style={{ width: Math.max(salesData.length * 80, 400) }}>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="month" interval={0} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0" }}
                            labelStyle={{ color: "#94a3b8" }}
                          />
                          <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: "#0ea5e9", r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="graph-card">
                  <h3>💊 Top Medicines by Units Sold</h3>
                  <div className="scroll-container">
                    <div style={{ width: Math.max(medicineData.length * 100, 400) }}>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={medicineData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="name" interval={0} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0" }}
                            labelStyle={{ color: "#94a3b8" }}
                          />
                          <Bar dataKey="qty" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="table-card">
                <h3>📋 Recent Orders</h3>
                <div className="scroll-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Delivery Partner</th>
                        <th>Status</th>
                        <th>Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#475569" }}>
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td style={{ color: "#7dd3fc", fontWeight: 600 }}>#{order.id}</td>
                            <td style={{ color: "#e2e8f0", fontWeight: 500 }}>{order.customerName}</td>
                            <td>{order.medicine}</td>
                            <td style={{ color: "#4ade80", fontWeight: 600 }}>{formatCurrency(order.totalPrice || order.total)}</td>
                            <td>
                              <span style={{ display: "inline-block" }}>
                                {order.paymentMethod?.toUpperCase()} /{" "}
                                <span style={{ color: order.paymentStatus === "paid" ? "#4ade80" : "#fbbf24" }}>
                                  {order.paymentStatus}
                                </span>
                              </span>
                            </td>
                            <td>{order.deliveryPartner || <span style={{ color: "#475569" }}>Unassigned</span>}</td>
                            <td>
                              <span className={getStatusClass(order.status)}>{order.status}</span>
                            </td>
                            <td>
                              <select
                                value={order.status}
                                onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                              >
                                <option>Processing</option>
                                <option>Out for Delivery</option>
                                <option>Delivered</option>
                                <option>Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
