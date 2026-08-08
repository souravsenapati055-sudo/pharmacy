import React, { useState, useEffect } from "react";
import {
  fetchAdminCustomers,
  fetchAdminCustomersStats,
  fetchAdminCustomerDetails,
  blockCustomer,
  unblockCustomer,
  suspendCustomer,
  restoreCustomer,
  deleteCustomer,
  fetchDeletedCustomersAudit,
} from "../lib/store";
import {
  Users,
  CheckCircle2,
  ShieldAlert,
  Clock,
  UserPlus,
  Archive,
  Search,
  Eye,
  Lock,
  Unlock,
  RotateCcw,
  Trash2,
  Mail,
  Phone,
  Calendar,
  KeyRound,
  ShoppingBag,
  Shield,
  X,
  AlertTriangle,
  FileText,
  UserCheck,
} from "lucide-react";
import "./AdminCustomers.css";

export default function AdminCustomers({ adminUser }) {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "blocked" | "suspended" | "deleted"
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    blockedCustomers: 0,
    suspendedCustomers: 0,
    newThisMonth: 0,
    deletedRecordsCount: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [deletedAuditLogs, setDeletedAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [authFilter, setAuthFilter] = useState("all");

  // Selected customer modal state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsTab, setDetailsTab] = useState("profile"); // "profile" | "security" | "orders" | "audit"
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Action Modals
  const [blockModal, setBlockModal] = useState(null); // customer object
  const [blockReason, setBlockReason] = useState("Suspicious activity");
  const [blockNote, setBlockNote] = useState("");

  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState("Policy violation");
  const [suspendDuration, setSuspendDuration] = useState("24h");

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteReason, setDeleteReason] = useState("User requested deletion");
  const [confirmText, setConfirmText] = useState("");

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, customersData, deletedData] = await Promise.all([
        fetchAdminCustomersStats(),
        fetchAdminCustomers(),
        fetchDeletedCustomersAudit(),
      ]);
      setStats(statsData || {
        totalCustomers: 0,
        activeCustomers: 0,
        blockedCustomers: 0,
        suspendedCustomers: 0,
        newThisMonth: 0,
        deletedRecordsCount: 0,
      });
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setDeletedAuditLogs(Array.isArray(deletedData) ? deletedData : []);
    } catch (err) {
      console.error("Failed to load customer management data:", err);
      showError(err?.message || "Failed to load customers data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCustomerDetails = async (customer) => {
    if (!customer) return;
    setSelectedCustomer(customer);
    setDetailsTab("profile");
    setDetailsLoading(true);
    try {
      const data = await fetchAdminCustomerDetails(customer.id);
      setCustomerDetails(data);
    } catch (err) {
      showError(err?.message || "Failed to load customer details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleBlockCustomer = async () => {
    if (!blockModal) return;
    setActionLoading(true);
    try {
      const res = await blockCustomer(blockModal.id, {
        reason: blockReason,
        note: blockNote,
        adminName: adminUser?.name || "Admin",
      });
      showToast(res?.message || "Customer blocked.");
      setBlockModal(null);
      setBlockNote("");
      loadData();
      if (selectedCustomer?.id === blockModal.id) {
        openCustomerDetails(blockModal);
      }
    } catch (err) {
      showError(err?.message || "Failed to block customer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockCustomer = async (cust) => {
    if (!cust) return;
    setActionLoading(true);
    try {
      const res = await unblockCustomer(cust.id, { adminName: adminUser?.name || "Admin" });
      showToast(res?.message || "Customer unblocked.");
      loadData();
      if (selectedCustomer?.id === cust.id) {
        openCustomerDetails(cust);
      }
    } catch (err) {
      showError(err?.message || "Failed to unblock customer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendCustomer = async () => {
    if (!suspendModal) return;
    setActionLoading(true);
    try {
      const res = await suspendCustomer(suspendModal.id, {
        reason: suspendReason,
        duration: suspendDuration,
        adminName: adminUser?.name || "Admin",
      });
      showToast(res?.message || "Customer suspended.");
      setSuspendModal(null);
      loadData();
      if (selectedCustomer?.id === suspendModal.id) {
        openCustomerDetails(suspendModal);
      }
    } catch (err) {
      showError(err?.message || "Failed to suspend customer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreCustomer = async (cust) => {
    if (!cust) return;
    setActionLoading(true);
    try {
      const res = await restoreCustomer(cust.id, { adminName: adminUser?.name || "Admin" });
      showToast(res?.message || "Customer restored.");
      loadData();
      if (selectedCustomer?.id === cust.id) {
        openCustomerDetails(cust);
      }
    } catch (err) {
      showError(err?.message || "Failed to restore customer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteModal || confirmText !== "DELETE") return;
    setActionLoading(true);
    try {
      const res = await deleteCustomer(deleteModal.id, {
        reason: deleteReason,
        adminName: adminUser?.name || "Admin",
      });
      showToast(res?.message || "Customer deleted.");
      setDeleteModal(null);
      setConfirmText("");
      if (selectedCustomer?.id === deleteModal.id) {
        setSelectedCustomer(null);
      }
      loadData();
    } catch (err) {
      showError(err?.message || "Failed to delete customer.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered customer list
  const filteredCustomers = (customers || []).filter((c) => {
    if (!c) return false;
    const status = c.status || "ACTIVE";
    const authMethods = Array.isArray(c.authMethods) ? c.authMethods : [];

    // Tab filter
    if (activeTab === "blocked" && status !== "BLOCKED") return false;
    if (activeTab === "suspended" && status !== "SUSPENDED") return false;
    if (activeTab === "active" && status !== "ACTIVE") return false;

    // Auth method filter
    if (authFilter !== "all") {
      if (authFilter === "password" && !authMethods.includes("Password")) return false;
      if (authFilter === "otp" && !authMethods.includes("Email OTP")) return false;
      if (authFilter === "google" && !authMethods.includes("Google")) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = String(c.name || "").toLowerCase().includes(q);
      const matchEmail = String(c.email || "").toLowerCase().includes(q);
      const matchPhone = String(c.phone || "").toLowerCase().includes(q);
      const matchId = String(c.formattedId || "").toLowerCase().includes(q) || String(c.id || "").includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
    }

    return true;
  });

  return (
    <div className="admin-customers-container">
      {/* Header Section */}
      <div className="ac-header-section">
        <div>
          <h1 className="ac-header-title">
            <Users size={28} color="#087EA4" /> Customer Account Management
          </h1>
          <p className="ac-header-subtitle">
            Manage customer identities, authentication methods, security enforcement, and admin audit logs.
          </p>
        </div>
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
      <div className="ac-stats-grid">
        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{ background: "#E0F2FE", color: "#0284C7" }}>
            <Users size={22} />
          </div>
          <div>
            <div className="ac-stat-val">{stats.totalCustomers}</div>
            <div className="ac-stat-label">Total Customers</div>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="ac-stat-val">{stats.activeCustomers}</div>
            <div className="ac-stat-label">Active Accounts</div>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{ background: "#FEE2E2", color: "#DC2626" }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="ac-stat-val">{stats.blockedCustomers}</div>
            <div className="ac-stat-label">Blocked Accounts</div>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="ac-stat-val">{stats.suspendedCustomers}</div>
            <div className="ac-stat-label">Suspended Accounts</div>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{ background: "#F3E8FF", color: "#9333EA" }}>
            <UserPlus size={22} />
          </div>
          <div>
            <div className="ac-stat-val">{stats.newThisMonth}</div>
            <div className="ac-stat-label">New This Month</div>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon" style={{ background: "#F1F5F9", color: "#475569" }}>
            <Archive size={22} />
          </div>
          <div>
            <div className="ac-stat-val">{stats.deletedRecordsCount}</div>
            <div className="ac-stat-label">Deleted Audit Records</div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="ac-card">
        {/* Toolbar */}
        <div className="ac-toolbar">
          {/* Tabs */}
          <div className="ac-tabs">
            <button className={`ac-tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
              All Customers ({customers.length})
            </button>
            <button className={`ac-tab-btn ${activeTab === "blocked" ? "active" : ""}`} onClick={() => setActiveTab("blocked")}>
              Blocked ({stats.blockedCustomers})
            </button>
            <button className={`ac-tab-btn ${activeTab === "suspended" ? "active" : ""}`} onClick={() => setActiveTab("suspended")}>
              Suspended ({stats.suspendedCustomers})
            </button>
            <button className={`ac-tab-btn ${activeTab === "deleted" ? "active" : ""}`} onClick={() => setActiveTab("deleted")}>
              Deleted Records Log ({deletedAuditLogs.length})
            </button>
          </div>

          {/* Search & Filter */}
          {activeTab !== "deleted" && (
            <div className="ac-filters">
              <div className="ac-search-box">
                <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ac-search-input"
                />
              </div>

              <select value={authFilter} onChange={(e) => setAuthFilter(e.target.value)} className="ac-select">
                <option value="all">All Auth Methods</option>
                <option value="password">Password Users</option>
                <option value="otp">Email OTP Users</option>
                <option value="google">Google Linked Users</option>
              </select>
            </div>
          )}
        </div>

        {/* Table View */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: 14 }}>
            Loading customer accounts database...
          </div>
        ) : activeTab === "deleted" ? (
          /* DELETED CUSTOMERS AUDIT TAB */
          <div className="ac-table-container">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Archived ID</th>
                  <th>Customer Name</th>
                  <th>Original Email</th>
                  <th>Deleted By</th>
                  <th>Deletion Date</th>
                  <th>Reason</th>
                  <th>Past Orders / Spent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deletedAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                      No deleted customer audit records found.
                    </td>
                  </tr>
                ) : (
                  deletedAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="ac-cus-id">{log.formattedCustomerId}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0F172A" }}>{log.name || "N/A"}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#64748B" }}>
                          {(log.email || "").replace(/(^.{2}).*(@.*$)/, "$1***$2")}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{log.deletedBy || "Admin"}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: "#64748B" }}>
                          {log.deletedAt ? new Date(log.deletedAt).toLocaleString() : "N/A"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, color: "#475569", maxWidth: 180 }}>{log.deletionReason || "N/A"}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          {log.totalOrders || 0} orders (₹{(log.totalSpent || 0).toLocaleString()})
                        </div>
                      </td>
                      <td>
                        <span className="ac-status-pill ac-status-deleted">
                          <Archive size={12} /> DELETED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ACTIVE / BLOCKED / SUSPENDED CUSTOMERS TABLE */
          <div className="ac-table-container">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Customer Identity</th>
                  <th>Auth Methods</th>
                  <th>Registration</th>
                  <th>Last Login</th>
                  <th>Orders / Total Spent</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                      No matching customer accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        <div className="ac-user-cell">
                          <img
                            src={cust.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cust.name || "Customer")}`}
                            alt={cust.name || "Customer"}
                            className="ac-avatar"
                          />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span className="ac-user-name">{cust.name || "Customer"}</span>
                              <span className="ac-cus-id">{cust.formattedId || `CUS-${cust.id}`}</span>
                            </div>
                            <div className="ac-user-email">
                              {cust.email} • {cust.phone || "No phone"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(cust.authMethods || []).map((method) => (
                            <span
                              key={method}
                              className={`ac-auth-badge ${
                                method === "Password"
                                  ? "ac-badge-password"
                                  : method === "Email OTP"
                                  ? "ac-badge-otp"
                                  : "ac-badge-google"
                              }`}
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: 12.5, color: "#475569" }}>
                          {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : "N/A"}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: 12.5, color: "#475569" }}>
                          {cust.lastLoginAt ? new Date(cust.lastLoginAt).toLocaleDateString() : "Never"}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                          {cust.totalOrders || 0} Orders
                        </div>
                        <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
                          ₹{(cust.totalSpent || 0).toLocaleString()}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`ac-status-pill ${
                            cust.status === "ACTIVE"
                              ? "ac-status-active"
                              : cust.status === "BLOCKED"
                              ? "ac-status-blocked"
                              : "ac-status-suspended"
                          }`}
                        >
                          {cust.status === "ACTIVE" && <CheckCircle2 size={12} />}
                          {cust.status === "BLOCKED" && <ShieldAlert size={12} />}
                          {cust.status === "SUSPENDED" && <Clock size={12} />}
                          {cust.status}
                        </span>
                      </td>

                      <td>
                        <div className="ac-actions-cell" style={{ justifyContent: "flex-end" }}>
                          <button
                            title="View Customer Profile & Activity Log"
                            className="ac-btn-icon"
                            onClick={() => openCustomerDetails(cust)}
                          >
                            <Eye size={16} />
                          </button>

                          {cust.status === "BLOCKED" ? (
                            <button
                              title="Unblock Customer Account"
                              className="ac-btn-icon"
                              onClick={() => handleUnblockCustomer(cust)}
                            >
                              <Unlock size={16} color="#16A34A" />
                            </button>
                          ) : (
                            <button
                              title="Block Customer Account"
                              className="ac-btn-icon danger"
                              onClick={() => setBlockModal(cust)}
                            >
                              <Lock size={16} />
                            </button>
                          )}

                          {cust.status === "SUSPENDED" ? (
                            <button
                              title="Restore Suspended Account"
                              className="ac-btn-icon"
                              onClick={() => handleRestoreCustomer(cust)}
                            >
                              <RotateCcw size={16} color="#087EA4" />
                            </button>
                          ) : (
                            <button
                              title="Suspend Customer Account"
                              className="ac-btn-icon"
                              onClick={() => setSuspendModal(cust)}
                            >
                              <Clock size={16} color="#D97706" />
                            </button>
                          )}

                          <button
                            title="Permanently Delete Customer"
                            className="ac-btn-icon danger"
                            onClick={() => {
                              setDeleteModal(cust);
                              setConfirmText("");
                            }}
                          >
                            <Trash2 size={16} />
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
      </div>

      {/* CUSTOMER DETAILS MODAL / DRAWER */}
      {selectedCustomer && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-card" style={{ width: 680 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={selectedCustomer.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedCustomer.name)}`}
                  alt=""
                  style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #E2E8F0" }}
                />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{selectedCustomer.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span className="ac-cus-id">{selectedCustomer.formattedId}</span>
                    <span className={`ac-status-pill ac-status-${selectedCustomer.status.toLowerCase()}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Inner Tabs */}
            <div className="ac-tabs" style={{ marginBottom: 20 }}>
              <button className={`ac-tab-btn ${detailsTab === "profile" ? "active" : ""}`} onClick={() => setDetailsTab("profile")}>
                Profile Info
              </button>
              <button className={`ac-tab-btn ${detailsTab === "security" ? "active" : ""}`} onClick={() => setDetailsTab("security")}>
                Security & Auth
              </button>
              <button className={`ac-tab-btn ${detailsTab === "orders" ? "active" : ""}`} onClick={() => setDetailsTab("orders")}>
                Orders ({customerDetails?.ordersCount || 0})
              </button>
              <button className={`ac-tab-btn ${detailsTab === "audit" ? "active" : ""}`} onClick={() => setDetailsTab("audit")}>
                Audit Log ({customerDetails?.auditLogs?.length || 0})
              </button>
            </div>

            {detailsLoading ? (
              <div style={{ padding: 30, textAlign: "center", color: "#64748B" }}>Loading profile details...</div>
            ) : customerDetails ? (
              <div>
                {detailsTab === "profile" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
                    <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10 }}>
                      <div style={{ color: "#64748B", fontWeight: 600 }}>Email Address</div>
                      <div style={{ fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{customerDetails.user.email}</div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10 }}>
                      <div style={{ color: "#64748B", fontWeight: 600 }}>Mobile Number</div>
                      <div style={{ fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{customerDetails.user.phone}</div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10 }}>
                      <div style={{ color: "#64748B", fontWeight: 600 }}>Registration Date</div>
                      <div style={{ fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                        {new Date(customerDetails.user.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10 }}>
                      <div style={{ color: "#64748B", fontWeight: 600 }}>Email Verified Status</div>
                      <div style={{ fontWeight: 700, color: customerDetails.user.emailVerified ? "#16A34A" : "#D97706", marginTop: 2 }}>
                        {customerDetails.user.emailVerified ? "Verified ✓" : "Pending Verification"}
                      </div>
                    </div>
                  </div>
                )}

                {detailsTab === "security" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
                    <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10 }}>
                      <div style={{ color: "#64748B", fontWeight: 600 }}>Auth Methods Supported</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                        {customerDetails.user.authMethods.map((m) => (
                          <span key={m} className="ac-auth-badge ac-badge-password">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10 }}>
                      <div style={{ color: "#64748B", fontWeight: 600 }}>Google Account Linked</div>
                      <div style={{ fontWeight: 700, color: customerDetails.user.googleLinked ? "#16A34A" : "#64748B", marginTop: 2 }}>
                        {customerDetails.user.googleLinked ? "Yes (Google ID linked)" : "Not Linked"}
                      </div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10 }}>
                      <div style={{ color: "#64748B", fontWeight: 600 }}>Password Set</div>
                      <div style={{ fontWeight: 700, color: customerDetails.user.hasPassword ? "#16A34A" : "#D97706", marginTop: 2 }}>
                        {customerDetails.user.hasPassword ? "Password Hash Configured" : "No Password Set"}
                      </div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10 }}>
                      <div style={{ color: "#64748B", fontWeight: 600 }}>Last Sign In</div>
                      <div style={{ fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                        {customerDetails.user.lastLoginAt ? new Date(customerDetails.user.lastLoginAt).toLocaleString() : "Never"}
                      </div>
                    </div>
                  </div>
                )}

                {detailsTab === "orders" && (
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {customerDetails.orders.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "#64748B" }}>No orders placed yet.</div>
                    ) : (
                      <table className="ac-table" style={{ fontSize: 12.5 }}>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerDetails.orders.map((o) => (
                            <tr key={o.id}>
                              <td style={{ fontWeight: 700 }}>#{o.id}</td>
                              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                              <td>
                                <span style={{ padding: "2px 6px", borderRadius: 4, background: "#E0F2FE", color: "#0369A1", fontSize: 11, fontWeight: 700 }}>
                                  {o.status}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700 }}>₹{o.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {detailsTab === "audit" && (
                  <div style={{ maxHeight: 280, overflowY: "auto", fontSize: 12.5 }}>
                    {customerDetails.auditLogs.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "#64748B" }}>No administrative audit events recorded for this customer.</div>
                    ) : (
                      customerDetails.auditLogs.map((log) => (
                        <div key={log.id} style={{ padding: 10, borderBottom: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 800, color: "#087EA4" }}>{log.action}</span>
                            <span style={{ color: "#94A3B8", fontSize: 11 }}>{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ color: "#334155", marginTop: 2 }}>By: <strong>{log.adminName}</strong> • {log.reason}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* BLOCK CUSTOMER MODAL */}
      {blockModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-card">
            <h3 className="ac-modal-title">Block Customer Account?</h3>
            <p className="ac-modal-subtitle">
              Blocking will prevent <strong>{blockModal.name}</strong> ({blockModal.formattedId}) from logging in via password, OTP, or Google.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>Select Reason</label>
              <select value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="ac-select" style={{ width: "100%" }}>
                <option value="Suspicious activity">Suspicious activity</option>
                <option value="Fraud prevention">Fraud prevention</option>
                <option value="Repeated policy violation">Repeated policy violation</option>
                <option value="Abnormal ordering">Abnormal ordering</option>
                <option value="Admin decision">Admin decision</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>Admin Internal Note</label>
              <textarea
                rows="3"
                placeholder="Optional details..."
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setBlockModal(null)} className="ac-tab-btn">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockCustomer}
                disabled={actionLoading}
                style={{ background: "#DC2626", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "Blocking..." : "Confirm Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND CUSTOMER MODAL */}
      {suspendModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-card">
            <h3 className="ac-modal-title">Suspend Customer Account</h3>
            <p className="ac-modal-subtitle">
              Temporarily restrict access for <strong>{suspendModal.name}</strong> ({suspendModal.formattedId}).
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>Suspension Reason</label>
              <input
                type="text"
                placeholder="Reason..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="ac-search-input"
                style={{ paddingLeft: 12 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>Duration</label>
              <select value={suspendDuration} onChange={(e) => setSuspendDuration(e.target.value)} className="ac-select" style={{ width: "100%" }}>
                <option value="24h">24 Hours (Auto-restores after 24h)</option>
                <option value="7d">7 Days (Auto-restores after 7 days)</option>
                <option value="30d">30 Days (Auto-restores after 30 days)</option>
                <option value="indefinite">Until Manually Restored</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setSuspendModal(null)} className="ac-tab-btn">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspendCustomer}
                disabled={actionLoading}
                style={{ background: "#D97706", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CUSTOMER MODAL */}
      {deleteModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-card">
            <h3 className="ac-modal-title" style={{ color: "#DC2626" }}>Permanently Delete Customer Account?</h3>
            <p className="ac-modal-subtitle">
              Customer: <strong>{deleteModal.name}</strong> ({deleteModal.formattedId})
            </p>

            <div style={{ background: "#FEE2E2", color: "#991B1B", padding: 14, borderRadius: 10, fontSize: 12.5, lineHeight: 1.5, marginBottom: 16, border: "1px solid #FCA5A5" }}>
              <strong>WARNING:</strong> This action will permanently remove this customer account identity. If this email (<strong>{deleteModal.email}</strong>) registers again later, it will be treated as a <strong>COMPLETELY NEW CUSTOMER ID</strong> with no access to past orders or Google link history.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>Deletion Reason</label>
              <input
                type="text"
                placeholder="Reason for deletion..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="ac-search-input"
                style={{ paddingLeft: 12 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder="Type DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="ac-search-input"
                style={{ paddingLeft: 12, fontFamily: "monospace", fontSize: 15 }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setDeleteModal(null)} className="ac-tab-btn">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={actionLoading || confirmText !== "DELETE"}
                style={{
                  background: confirmText === "DELETE" ? "#991B1B" : "#CBD5E1",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: confirmText === "DELETE" ? "pointer" : "not-allowed",
                }}
              >
                {actionLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
