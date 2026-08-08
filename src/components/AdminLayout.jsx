import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { clearAuthSession } from "../lib/auth";
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
                  <p className="user-menu-email">{user?.email || "admin@pharmacare.com"}</p>
                </div>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate("/profile");
                  }}
                >
                  <User size={15} /> Account Settings
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
    </div>
  );
}
