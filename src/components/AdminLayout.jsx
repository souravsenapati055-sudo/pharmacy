import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { clearAuthSession, apiRequest } from "../lib/auth";
import {
  Pill,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Truck,
  BarChart3,
  FileText,
  Boxes,
  RefreshCw,
  AlertOctagon,
  Zap,
  Percent,
  Bot,
  TrendingUp,
  Settings,
  User,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  PackageCheck,
  AlertTriangle,
  Layers,
  ChevronRight,
} from "lucide-react";
import "./AdminLayout.css";

export default function AdminLayout({ children, user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Admin Credentials Modal State
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [adminEmailForm, setAdminEmailForm] = useState(user?.email || "souravsenapati408@gmail.com");
  const [adminPasswordForm, setAdminPasswordForm] = useState("");
  const [adminConfirmPwdForm, setAdminConfirmPwdForm] = useState("");
  const [credSubmitting, setCredSubmitting] = useState(false);
  const [credStatusMsg, setCredStatusMsg] = useState("");
  const [credErrorMsg, setCredErrorMsg] = useState("");

  const handleUpdateAdminCredentials = async (e) => {
    e.preventDefault();
    setCredStatusMsg("");
    setCredErrorMsg("");

    if (!adminEmailForm.trim()) {
      setCredErrorMsg("Please enter a valid email address.");
      return;
    }
    if (adminPasswordForm && adminPasswordForm !== adminConfirmPwdForm) {
      setCredErrorMsg("Passwords do not match.");
      return;
    }

    setCredSubmitting(true);
    try {
      const res = await apiRequest("/admin/update-credentials", {
        method: "POST",
        body: JSON.stringify({
          userId: user?.id || 1,
          email: adminEmailForm.trim(),
          newPassword: adminPasswordForm,
        }),
      });

      const updatedUser = { ...user, email: adminEmailForm.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (setUser) setUser(updatedUser);

      setCredStatusMsg(res.message || "Admin credentials updated successfully!");
      setAdminPasswordForm("");
      setAdminConfirmPwdForm("");
      setTimeout(() => setCredentialsModalOpen(false), 2500);
    } catch (err) {
      setCredErrorMsg(err.message || "Failed to update admin credentials.");
    } finally {
      setCredSubmitting(false);
    }
  };

  const quickActionsRef = useRef(null);
  const notificationsRef = useRef(null);
  const userDropdownRef = useRef(null);

  const adminProfile = (() => {
    try {
      const saved = localStorage.getItem("adminProfile");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  })();

  const adminName = adminProfile?.fullName
    ? adminProfile.fullName
    : user?.name || "Admin User";
  const adminPhoto = adminProfile?.profilePhoto || user?.profilePhoto || "https://i.pravatar.cc/150?img=7";

  const handleLogout = () => {
    clearAuthSession();
    if (setUser) setUser(null);
    navigate("/login/admin");
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target)) {
        setQuickActionsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navSections = [
    {
      title: "MAIN",
      items: [
        { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
        { label: "Orders", path: "/admin?tab=orders", icon: ShoppingBag },
        { label: "Customers", path: "/admin/customers", icon: Users },
        { label: "Delivery Management", path: "/admin/delivery", icon: Truck },
        { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
        { label: "Reports", path: "/admin/generate-report", icon: FileText },
      ],
    },
    {
      title: "INVENTORY",
      items: [
        { label: "Medicines", path: "/inventory", icon: Pill },
        { label: "Inventory", path: "/inventory", icon: Boxes },
        { label: "Restock", path: "/admin/restock", icon: RefreshCw },
        { label: "Suppliers", path: "/admin/order-from-seller", icon: Building2 },
        { label: "Low Stock", path: "/admin/restock", icon: AlertTriangle },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { label: "Emergency Orders", path: "/admin/emergency-order", icon: AlertOctagon },
        { label: "Bulk Discount", path: "/admin/bulk-discount", icon: Percent },
        { label: "Orders from Sellers", path: "/admin/order-from-seller", icon: Zap },
      ],
    },
    {
      title: "AI & INSIGHTS",
      items: [
        { label: "AI Insights", path: "/admin/ai-insights", icon: Bot },
        { label: "Demand Prediction", path: "/admin/ai-insights", icon: TrendingUp },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { label: "Settings", path: "/admin?tab=settings", icon: Settings },
        { label: "Admin Profile", path: "/profile", icon: User },
      ],
    },
  ];

  const isActive = (itemPath) => {
    if (itemPath.includes("?tab=")) {
      const searchParams = new URLSearchParams(location.search);
      const tab = searchParams.get("tab");
      return location.pathname === "/admin" && tab === itemPath.split("?tab=")[1];
    }
    if (itemPath === "/admin" && !location.search) {
      return location.pathname === "/admin";
    }
    return location.pathname === itemPath;
  };

  return (
    <div className={`admin-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Sticky Top Navbar */}
      <header className="admin-topbar">
        <div className="topbar-left">
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <div className="admin-logo-brand" onClick={() => navigate("/admin")}>
            <div className="logo-icon-bg">
              <Pill size={20} color="#ffffff" />
            </div>
            <div className="brand-text-group">
              <span className="brand-title">PharmaCare</span>
              <span className="admin-badge">ADMIN</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="topbar-center">
          <div className="global-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search medicines, orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="global-search-input"
            />
            <kbd className="search-shortcut">⌘K</kbd>
          </div>
        </div>

        {/* Topbar Right Controls */}
        <div className="topbar-right">
          {/* Quick Actions Dropdown */}
          <div className="dropdown-container" ref={quickActionsRef}>
            <button
              className="btn-quick-action"
              onClick={() => setQuickActionsOpen((prev) => !prev)}
            >
              <Plus size={16} />
              <span className="quick-action-text">Quick Actions</span>
              <ChevronDown size={14} />
            </button>
            {quickActionsOpen && (
              <div className="dropdown-menu quick-actions-menu">
                <div className="dropdown-header">QUICK ACTIONS</div>
                <button
                  onClick={() => {
                    setQuickActionsOpen(false);
                    navigate("/inventory");
                  }}
                >
                  <Pill size={15} /> Add Medicine
                </button>
                <button
                  onClick={() => {
                    setQuickActionsOpen(false);
                    navigate("/admin?tab=orders");
                  }}
                >
                  <ShoppingBag size={15} /> Create Order
                </button>
                <button
                  onClick={() => {
                    setQuickActionsOpen(false);
                    navigate("/admin?tab=customers");
                  }}
                >
                  <Users size={15} /> Add Customer
                </button>
                <button
                  onClick={() => {
                    setQuickActionsOpen(false);
                    navigate("/admin/delivery-team");
                  }}
                >
                  <Truck size={15} /> Add Delivery Partner
                </button>
                <button
                  onClick={() => {
                    setQuickActionsOpen(false);
                    navigate("/admin/generate-report");
                  }}
                >
                  <FileText size={15} /> View Reports
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="dropdown-container" ref={notificationsRef}>
            <button
              className="icon-btn-ghost"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="notification-badge">4</span>
            </button>
            {notificationsOpen && (
              <div className="dropdown-menu notifications-menu">
                <div className="dropdown-header-flex">
                  <span>Notifications</span>
                  <button onClick={() => navigate("/admin/alerts")} className="link-btn">
                    View All
                  </button>
                </div>
                <div className="notification-item unread">
                  <AlertTriangle size={16} className="text-warning" />
                  <div>
                    <p className="notif-title">8 medicines low in stock</p>
                    <span className="notif-time">10 minutes ago</span>
                  </div>
                </div>
                <div className="notification-item unread">
                  <AlertOctagon size={16} className="text-danger" />
                  <div>
                    <p className="notif-title">2 Emergency orders pending</p>
                    <span className="notif-time">25 minutes ago</span>
                  </div>
                </div>
                <div className="notification-item">
                  <PackageCheck size={16} className="text-success" />
                  <div>
                    <p className="notif-title">New order #1042 received</p>
                    <span className="notif-time">1 hour ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Branch Pill */}
          <div className="branch-pill">
            <Building2 size={14} />
            <span>Main Branch</span>
          </div>

          {/* Admin User Profile Dropdown */}
          <div className="dropdown-container" ref={userDropdownRef}>
            <div
              className="user-profile-pill"
              onClick={() => setUserDropdownOpen((prev) => !prev)}
            >
              <img
                src={adminPhoto}
                alt={adminName}
                className="user-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://i.pravatar.cc/150?img=7";
                }}
              />
              <div className="user-info">
                <span className="user-name">{adminName}</span>
                <span className="user-role">Super Admin</span>
              </div>
              <ChevronDown size={14} className="user-chevron" />
            </div>

            {userDropdownOpen && (
              <div className="dropdown-menu user-menu">
                <div className="user-menu-header">
                  <p className="user-menu-name">{adminName}</p>
                  <p className="user-menu-email">{user?.email || "souravsenapati408@gmail.com"}</p>
                </div>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setCredentialsModalOpen(true);
                  }}
                >
                  <User size={15} /> Change Email & Password
                </button>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate("/admin/ai-insights");
                  }}
                >
                  <Bot size={15} /> AI System Insights
                </button>
                <div className="menu-divider" />
                <button onClick={handleLogout} className="logout-btn">
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger toggle */}
          <button
            className="mobile-hamburger-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={22} /> : <PanelLeftOpen size={22} />}
          </button>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="admin-body-container">
        {/* Left Sidebar */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <nav className="sidebar-nav">
            {navSections.map((section) => (
              <div key={section.title} className="sidebar-section">
                {!collapsed && <div className="section-header-title">{section.title}</div>}
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      className={`sidebar-link ${active ? "active" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="link-icon-container">
                        <ItemIcon size={18} />
                      </div>
                      {!collapsed && <span className="link-label">{item.label}</span>}
                      {collapsed && <div className="sidebar-tooltip">{item.label}</div>}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Sidebar Footer */}
          {!collapsed && (
            <div className="sidebar-footer-card">
              <div className="footer-card-content">
                <p className="footer-title">Pharmacy System v2.4</p>
                <p className="footer-sub">All systems operational</p>
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="admin-main-content">{children}</main>
      </div>

      {/* ADMIN CREDENTIALS CHANGE MODAL */}
      {credentialsModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, maxWidth: 460, width: "100%", padding: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #E2E8F0", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Change Admin Email & Password</h3>
              <button onClick={() => setCredentialsModalOpen(false)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateAdminCredentials}>
              {credErrorMsg && (
                <div style={{ padding: 10, borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                  ⚠️ {credErrorMsg}
                </div>
              )}
              {credStatusMsg && (
                <div style={{ padding: 10, borderRadius: 8, background: "#DCFCE7", color: "#16A34A", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                  ✅ {credStatusMsg}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Admin Login Email ID *</label>
                <input
                  type="email"
                  value={adminEmailForm}
                  onChange={(e) => setAdminEmailForm(e.target.value)}
                  placeholder="souravsenapati408@gmail.com"
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5 }}
                />
                <span style={{ fontSize: 11, color: "#64748B", marginTop: 2, display: "block" }}>You will use this email ID to sign into the Admin portal.</span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>New Admin Password (Optional)</label>
                <input
                  type="password"
                  value={adminPasswordForm}
                  onChange={(e) => setAdminPasswordForm(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Confirm New Password</label>
                <input
                  type="password"
                  value={adminConfirmPwdForm}
                  onChange={(e) => setAdminConfirmPwdForm(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setCredentialsModalOpen(false)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFF", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={credSubmitting} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#087EA4", color: "#FFF", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
                  {credSubmitting ? "Updating..." : "Save Admin Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
