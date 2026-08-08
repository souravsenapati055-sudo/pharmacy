import React, { useState, useEffect } from "react";
import {
  fetchAdminDeliveryOverview,
  fetchAdminDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartnerStatus,
  resetDeliveryPartnerPassword,
  deleteDeliveryPartner,
  assignDeliveryOrder,
  autoAssignDeliveryOrder,
  fetchAdminDeliveryAnalytics,
  fetchAvailableDeliveryOrders,
} from "../lib/store";
import {
  Truck,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  Lock,
  RotateCcw,
  Trash2,
  Activity,
  BarChart3,
  FileText,
  MapPin,
  X,
  UserCheck,
  Zap,
  Phone,
  Mail,
  Shield,
  KeyRound,
  ShoppingBag,
} from "lucide-react";
import "./AdminDeliveryManagement.css";

export default function AdminDeliveryManagement() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "team" | "orders" | "live" | "analytics" | "reports"
  const [overview, setOverview] = useState({
    totalPartners: 0,
    onlinePartners: 0,
    offlinePartners: 0,
    activeDeliveries: 0,
    pendingDeliveries: 0,
    completedToday: 0,
    cancelledDeliveries: 0,
  });
  const [partners, setPartners] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [analytics, setAnalytics] = useState({ statusDistribution: [], dailyDeliveries: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [addPartnerModal, setAddPartnerModal] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    delivery_id: "",
    password: "",
    confirmPassword: "",
  });

  const [assignModal, setAssignModal] = useState(null); // order object
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  const [resetPwdModal, setResetPwdModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const [partnerDetailModal, setPartnerDetailModal] = useState(null);

  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovData, partnersData, availableData, analyticsData] = await Promise.all([
        fetchAdminDeliveryOverview(),
        fetchAdminDeliveryPartners(),
        fetchAvailableDeliveryOrders(),
        fetchAdminDeliveryAnalytics(),
      ]);
      setOverview(ovData || {});
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setAvailableOrders(Array.isArray(availableData) ? availableData : []);
      setAnalytics(analyticsData || { statusDistribution: [], dailyDeliveries: [] });
    } catch (err) {
      console.error("Failed to load delivery management data:", err);
      showError(err?.message || "Failed to load delivery management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateId = () => {
    const randomNum = 1001 + Math.floor(Math.random() * 8999);
    setPartnerForm((prev) => ({ ...prev, delivery_id: `DEL${randomNum}` }));
  };

  const handleCreatePartnerSubmit = async (e) => {
    e.preventDefault();
    if (partnerForm.password !== partnerForm.confirmPassword) {
      showError("Passwords do not match!");
      return;
    }
    setActionLoading(true);
    try {
      const res = await createDeliveryPartner({
        name: partnerForm.name,
        phone: partnerForm.phone,
        email: partnerForm.email,
        address: partnerForm.address,
        delivery_id: partnerForm.delivery_id || undefined,
        password: partnerForm.password,
      });
      showToast(res.message);
      setAddPartnerModal(false);
      setPartnerForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        delivery_id: "",
        password: "",
        confirmPassword: "",
      });
      loadData();
    } catch (err) {
      showError(err?.message || "Failed to create delivery partner.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignModal || !selectedPartnerId) return;
    setActionLoading(true);
    try {
      const res = await assignDeliveryOrder(assignModal.id, selectedPartnerId);
      showToast(res.message);
      setAssignModal(null);
      setSelectedPartnerId("");
      loadData();
    } catch (err) {
      showError(err?.message || "Failed to assign order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoAssign = async (orderId) => {
    setActionLoading(true);
    try {
      const res = await autoAssignDeliveryOrder(orderId);
      showToast(res.message);
      loadData();
    } catch (err) {
      showError(err?.message || "Failed to auto-assign order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (partner, newStatus) => {
    setActionLoading(true);
    try {
      const res = await updateDeliveryPartnerStatus(partner.id, newStatus);
      showToast(res.message);
      loadData();
    } catch (err) {
      showError(err?.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetPwdModal || !newPassword) return;
    setActionLoading(true);
    try {
      const res = await resetDeliveryPartnerPassword(resetPwdModal.id, newPassword);
      showToast(res.message);
      setResetPwdModal(null);
      setNewPassword("");
    } catch (err) {
      showError(err?.message || "Failed to reset password.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePartner = async (partner) => {
    if (!window.confirm(`Are you sure you want to permanently delete delivery partner ${partner.name} (${partner.deliveryId})?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await deleteDeliveryPartner(partner.id);
      showToast(res.message);
      loadData();
    } catch (err) {
      showError(err?.message || "Failed to delete partner.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPartners = partners.filter((p) => {
    if (statusFilter === "online" && !p.isOnline) return false;
    if (statusFilter === "offline" && p.isOnline) return false;
    if (statusFilter === "suspended" && p.status !== "SUSPENDED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = String(p.name || "").toLowerCase().includes(q);
      const matchId = String(p.deliveryId || "").toLowerCase().includes(q);
      const matchPhone = String(p.phone || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="adm-delivery-container">
      {/* Header Section */}
      <div className="adm-del-header">
        <div>
          <h1 className="adm-del-title">
            <Truck size={28} color="#087EA4" /> Delivery Management Portal
          </h1>
          <p className="adm-del-subtitle">
            Manage delivery partners, order assignments, real-time tracking, and delivery performance.
          </p>
        </div>
        <button className="adm-del-btn-primary" onClick={() => setAddPartnerModal(true)}>
          <Plus size={18} /> Add Delivery Partner
        </button>
      </div>

      {/* Toast Messages */}
      {toastMessage && (
        <div style={{ background: "#DCFCE7", color: "#166534", padding: "12px 18px", borderRadius: 10, border: "1px solid #bbf7d0", fontWeight: 700, fontSize: 13.5, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <UserCheck size={18} /> {toastMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px 18px", borderRadius: 10, border: "1px solid #fca5a5", fontWeight: 700, fontSize: 13.5, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      {/* Summary Stats Grid */}
      <div className="adm-del-stats-grid">
        <div className="adm-del-stat-card">
          <div className="adm-del-stat-icon" style={{ background: "#E0F2FE", color: "#0284C7" }}>
            <Users size={22} />
          </div>
          <div>
            <div className="adm-del-stat-val">{overview.totalPartners || 0}</div>
            <div className="adm-del-stat-label">Total Partners</div>
          </div>
        </div>

        <div className="adm-del-stat-card">
          <div className="adm-del-stat-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
            <Activity size={22} />
          </div>
          <div>
            <div className="adm-del-stat-val">{overview.onlinePartners || 0}</div>
            <div className="adm-del-stat-label">Online Now</div>
          </div>
        </div>

        <div className="adm-del-stat-card">
          <div className="adm-del-stat-icon" style={{ background: "#F1F5F9", color: "#64748B" }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="adm-del-stat-val">{overview.offlinePartners || 0}</div>
            <div className="adm-del-stat-label">Offline Partners</div>
          </div>
        </div>

        <div className="adm-del-stat-card">
          <div className="adm-del-stat-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>
            <Truck size={22} />
          </div>
          <div>
            <div className="adm-del-stat-val">{overview.activeDeliveries || 0}</div>
            <div className="adm-del-stat-label">Active Deliveries</div>
          </div>
        </div>

        <div className="adm-del-stat-card">
          <div className="adm-del-stat-icon" style={{ background: "#FFEDD5", color: "#C2410C" }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="adm-del-stat-val">{overview.pendingDeliveries || 0}</div>
            <div className="adm-del-stat-label">Pending Orders</div>
          </div>
        </div>

        <div className="adm-del-stat-card">
          <div className="adm-del-stat-icon" style={{ background: "#F3E8FF", color: "#9333EA" }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="adm-del-stat-val">{overview.completedToday || 0}</div>
            <div className="adm-del-stat-label">Completed Today</div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="adm-del-card">
        {/* Navigation Tabs */}
        <div className="adm-del-toolbar">
          <div className="adm-del-tabs">
            <button className={`adm-del-tab-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
              <Activity size={16} /> Overview
            </button>
            <button className={`adm-del-tab-btn ${activeTab === "team" ? "active" : ""}`} onClick={() => setActiveTab("team")}>
              <Users size={16} /> Delivery Team ({partners.length})
            </button>
            <button className={`adm-del-tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
              <ShoppingBag size={16} /> Available Orders ({availableOrders.length})
            </button>
            <button className={`adm-del-tab-btn ${activeTab === "live" ? "active" : ""}`} onClick={() => setActiveTab("live")}>
              <MapPin size={16} /> Live Tracking
            </button>
            <button className={`adm-del-tab-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
              <BarChart3 size={16} /> Analytics
            </button>
          </div>

          {activeTab === "team" && (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ position: "relative", width: 240 }}>
                <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search name, DEL ID, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, fontWeight: 600 }}>
                <option value="all">All Status</option>
                <option value="online">Online Only</option>
                <option value="offline">Offline Only</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: 14 }}>Loading delivery management data...</div>
        ) : (
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 16px 0" }}>Active Delivery Partners Overview</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {partners.map((partner) => (
                    <div key={partner.id} style={{ background: "#F8FAFC", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: "#0F172A" }}>{partner.name}</div>
                          <span className="adm-del-id-badge">{partner.deliveryId}</span>
                        </div>
                        <span className={`adm-del-online-badge ${partner.isOnline ? "online" : "offline"}`}>
                          ● {partner.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#475569", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div><Phone size={13} style={{ verticalAlign: "middle" }} /> {partner.phone}</div>
                        <div><MapPin size={13} style={{ verticalAlign: "middle" }} /> {partner.address}</div>
                        <div style={{ marginTop: 8, fontWeight: 700, color: "#087EA4" }}>
                          Active Orders: {partner.activeOrders} • Completed: {partner.completedDeliveries} ({partner.successRate}% Success)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEAM TAB */}
            {activeTab === "team" && (
              <div className="adm-del-table-container">
                <table className="adm-del-table">
                  <thead>
                    <tr>
                      <th>Delivery Partner</th>
                      <th>Delivery ID</th>
                      <th>Phone / Email</th>
                      <th>Online Status</th>
                      <th>Active Orders</th>
                      <th>Completed</th>
                      <th>Success Rate</th>
                      <th>Account Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                          No delivery partners match the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPartners.map((partner) => (
                        <tr key={partner.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: "#0F172A" }}>{partner.name}</div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>{partner.address}</div>
                          </td>
                          <td>
                            <span className="adm-del-id-badge">{partner.deliveryId}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: 12.5, color: "#334155" }}>{partner.phone}</div>
                            <div style={{ fontSize: 11.5, color: "#64748B" }}>{partner.email}</div>
                          </td>
                          <td>
                            <span className={`adm-del-online-badge ${partner.isOnline ? "online" : "offline"}`}>
                              ● {partner.isOnline ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: "#0369A1" }}>{partner.activeOrders} Active</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{partner.completedDeliveries}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "#16A34A" }}>{partner.successRate}%</div>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 800, color: partner.status === "ACTIVE" ? "#16A34A" : "#DC2626" }}>
                              {partner.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button title="View Profile" onClick={() => setPartnerDetailModal(partner)} style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                                <Eye size={14} />
                              </button>
                              <button title="Reset Password" onClick={() => setResetPwdModal(partner)} style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                                <KeyRound size={14} color="#D97706" />
                              </button>
                              {partner.status === "ACTIVE" ? (
                                <button title="Suspend Account" onClick={() => handleToggleStatus(partner, "SUSPENDED")} style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                                  <Lock size={14} color="#DC2626" />
                                </button>
                              ) : (
                                <button title="Activate Account" onClick={() => handleToggleStatus(partner, "ACTIVE")} style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                                  <UserCheck size={14} color="#16A34A" />
                                </button>
                              )}
                              <button title="Delete Partner" onClick={() => handleDeletePartner(partner)} style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                                <Trash2 size={14} color="#DC2626" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 16px 0" }}>Unassigned Delivery Orders</h3>
                {availableOrders.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: "#64748B", background: "#F8FAFC", borderRadius: 12 }}>
                    No pending unassigned delivery orders. All orders are currently assigned or completed!
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {availableOrders.map((ord) => (
                      <div key={ord.id} style={{ background: "#FFFFFF", borderRadius: 14, padding: 18, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: "#087EA4" }}>{ord.orderIdFormatted}</span>
                          <span className="adm-del-status-pill adm-del-status-placed">{ord.deliveryStatus}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{ord.customerName} ({ord.customerPhone})</div>
                        <div style={{ fontSize: 12.5, color: "#475569", margin: "4px 0 10px 0" }}>{ord.deliveryAddress}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#16A34A", marginBottom: 14 }}>
                          ₹{ord.totalAmount.toLocaleString()} • {ord.itemsCount} Items • {ord.paymentMethod}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => {
                              setAssignModal(ord);
                              setSelectedPartnerId("");
                            }}
                            style={{ flex: 1, background: "#087EA4", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}
                          >
                            Assign Partner
                          </button>
                          <button
                            onClick={() => handleAutoAssign(ord.id)}
                            style={{ background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD", padding: "8px 12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <Zap size={14} /> Auto
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LIVE TRACKING TAB */}
            {activeTab === "live" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 16px 0" }}>Live Delivery Partner Monitoring</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {partners.map((partner) => (
                    <div key={partner.id} style={{ background: "#F8FAFC", padding: 18, borderRadius: 14, border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontWeight: 800, color: "#0F172A" }}>{partner.name} ({partner.deliveryId})</div>
                        <span className={`adm-del-online-badge ${partner.isOnline ? "online" : "offline"}`}>
                          ● {partner.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 6 }}>
                        Location: <strong>{partner.locationName || partner.address}</strong>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#087EA4", fontWeight: 700 }}>
                        Active Load: {partner.activeOrders} orders
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 16px 0" }}>Delivery System Performance Analytics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 14, border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 800 }}>Delivery Status Distribution</h4>
                    {analytics.statusDistribution.map((item) => (
                      <div key={item.status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #CBD5E1", fontSize: 13 }}>
                        <span style={{ fontWeight: 700, color: "#334155" }}>{item.status}</span>
                        <span style={{ fontWeight: 800, color: "#087EA4" }}>{item.count} orders</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 14, border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 800 }}>Completed Deliveries (Last 7 Days)</h4>
                    {analytics.dailyDeliveries.length === 0 ? (
                      <div style={{ color: "#64748B", fontSize: 13 }}>No delivery trend data available.</div>
                    ) : (
                      analytics.dailyDeliveries.map((item) => (
                        <div key={item.date} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #CBD5E1", fontSize: 13 }}>
                          <span style={{ fontWeight: 700, color: "#334155" }}>{new Date(item.date).toLocaleDateString()}</span>
                          <span style={{ fontWeight: 800, color: "#16A34A" }}>{item.count} delivered</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD DELIVERY PARTNER MODAL */}
      {addPartnerModal && (
        <div className="adm-del-modal-overlay">
          <div className="adm-del-modal-card" style={{ width: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>+ Add New Delivery Partner</h3>
              <button onClick={() => setAddPartnerModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePartnerSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Patel"
                    value={partnerForm.name}
                    onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. amit@pharmacare.com"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Delivery User ID (Login ID)</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="e.g. DEL1001"
                      value={partnerForm.delivery_id}
                      onChange={(e) => setPartnerForm({ ...partnerForm, delivery_id: e.target.value })}
                      style={{ flex: 1, padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, fontFamily: "monospace", boxSizing: "border-box" }}
                    />
                    <button type="button" onClick={handleGenerateId} style={{ background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD", padding: "0 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Delivery Address / Operating Zone</label>
                <input
                  type="text"
                  placeholder="e.g. Durgapur, West Bengal"
                  value={partnerForm.address}
                  onChange={(e) => setPartnerForm({ ...partnerForm, address: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Login Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="********"
                    value={partnerForm.password}
                    onChange={(e) => setPartnerForm({ ...partnerForm, password: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="********"
                    value={partnerForm.confirmPassword}
                    onChange={(e) => setPartnerForm({ ...partnerForm, confirmPassword: e.target.value })}
                    style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                <button type="button" onClick={() => setAddPartnerModal(false)} style={{ background: "#F1F5F9", color: "#475569", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} style={{ background: "#087EA4", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                  {actionLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PARTNER MODAL */}
      {assignModal && (
        <div className="adm-del-modal-overlay">
          <div className="adm-del-modal-card">
            <h3 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
              Assign Delivery Partner for {assignModal.orderIdFormatted}
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748B" }}>
              Customer: <strong>{assignModal.customerName}</strong> ({assignModal.deliveryAddress})
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>Select Available Partner</label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, fontWeight: 600 }}
              >
                <option value="">-- Choose Online Delivery Partner --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.deliveryId}) • {p.isOnline ? "Online" : "Offline"} ({p.activeOrders} active orders)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setAssignModal(null)} style={{ background: "#F1F5F9", color: "#475569", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignSubmit}
                disabled={actionLoading || !selectedPartnerId}
                style={{ background: selectedPartnerId ? "#087EA4" : "#CBD5E1", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, cursor: selectedPartnerId ? "pointer" : "not-allowed" }}
              >
                {actionLoading ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPwdModal && (
        <div className="adm-del-modal-overlay">
          <div className="adm-del-modal-card">
            <h3 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
              Reset Password for {resetPwdModal.name} ({resetPwdModal.deliveryId})
            </h3>

            <div style={{ margin: "16px 0 20px 0" }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>Enter New Password</label>
              <input
                type="password"
                placeholder="********"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setResetPwdModal(null)} style={{ background: "#F1F5F9", color: "#475569", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPasswordSubmit}
                disabled={actionLoading || !newPassword}
                style={{ background: "#D97706", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
