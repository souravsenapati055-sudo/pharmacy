import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { clearAuthSession } from "../lib/auth";
import {
  Pill,
  Home as HomeIcon,
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  User as UserIcon,
  LogOut,
  Search,
  Menu,
  X,
  ChevronDown,
  Bell,
  BarChart2,
  Bot,
  Package,
  FileText,
  RefreshCw,
  Tag,
  AlertTriangle,
} from "lucide-react";
import "../customer.css";

export default function Navbar({ user, setUser, cart = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setTimeout(() => navigate("/"), 0);
  };

  useEffect(() => {
    const loadProfileData = () => {
      if (!user) return;
      const adminStatus = user?.isAdmin === true || user?.role === "admin";
      setIsAdmin(adminStatus);
      let photo = null, name = "";
      if (adminStatus) {
        const adminProfile = localStorage.getItem("adminProfile");
        if (adminProfile) {
          const p = JSON.parse(adminProfile);
          photo = p.profilePhoto || null;
          name = p.fullName ? p.fullName.split(" ")[0] : "";
        }
        if (!photo && user?.profilePhoto) photo = user.profilePhoto;
        if (!name && user?.name) name = user.name.split(" ")[0];
        if (!photo) photo = "https://i.pravatar.cc/150?img=7";
        if (!name) name = "Admin";
      } else {
        const customerProfile = localStorage.getItem("customerProfile");
        if (customerProfile) {
          const p = JSON.parse(customerProfile);
          photo = p.profilePhoto || null;
          name = p.fullName ? p.fullName.split(" ")[0] : "";
        }
        if (!photo && user?.profilePhoto) photo = user.profilePhoto;
        if (!name && user?.name) name = user.name.split(" ")[0];
        if (!photo) photo = "https://i.pravatar.cc/150?img=8";
        if (!name) name = "Customer";
      }
      setProfilePhoto(photo);
      setUserName(name);
    };
    loadProfileData();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  if (!user) return null;

  const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      height: "68px",
      background: "#ffffff",
      borderBottom: "1px solid #E2E8F0",
      boxShadow: scrolled ? "0 4px 16px rgba(15,23,42,0.06)" : "none",
      transition: "box-shadow 0.2s ease",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        height: "100%",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16
      }}>
        {/* LEFT: PharmaCare Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate(isAdmin ? "/admin" : "/home")}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "#087EA4",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Pill size={22} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>PharmaCare</span>
          {isAdmin && (
            <span style={{ fontSize: 11, fontWeight: 800, background: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: 999, border: "1px solid #FDE68A" }}>
              ADMIN
            </span>
          )}
        </div>

        {/* CENTER: Navigation Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }} className="desktop-nav-links">
          {isAdmin ? (
            <>
              <NavLink to="/admin/analytics" className={({ isActive }) => `nav-item-btn${isActive ? " active" : ""}`}>
                <BarChart2 size={18} /> Analytics
              </NavLink>
              <NavLink to="/admin/alerts" className={({ isActive }) => `nav-item-btn${isActive ? " active" : ""}`}>
                <Bell size={18} /> Alerts
              </NavLink>
              <NavLink to="/admin/ai-insights" className={({ isActive }) => `nav-item-btn${isActive ? " active" : ""}`}>
                <Bot size={18} /> AI Insights
              </NavLink>
              <NavLink to="/admin/order-from-seller" className={({ isActive }) => `nav-item-btn${isActive ? " active" : ""}`}>
                <Package size={18} /> Procurement
              </NavLink>

              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  className="nav-item-btn"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  Quick Actions <ChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 8,
                    width: 200,
                    background: "#ffffff",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    boxShadow: "0 10px 25px rgba(15,23,42,0.1)",
                    padding: "6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2
                  }}>
                    <NavLink to="/admin/restock" className="dropdown-link"><RefreshCw size={15} /> Restock Catalog</NavLink>
                    <NavLink to="/admin/bulk-discount" className="dropdown-link"><Tag size={15} /> Bulk Discount</NavLink>
                    <NavLink to="/admin/emergency-order" className="dropdown-link"><AlertTriangle size={15} /> Emergency Order</NavLink>
                    <NavLink to="/admin/generate-report" className="dropdown-link"><FileText size={15} /> Generate Reports</NavLink>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/home" className={({ isActive }) => `nav-item-btn${isActive ? " active" : ""}`}>
                <HomeIcon size={18} /> Home
              </NavLink>
              <NavLink to="/inventory" className={({ isActive }) => `nav-item-btn${isActive ? " active" : ""}`}>
                <ShoppingBag size={18} /> Shop
              </NavLink>
              <NavLink to="/cart" className={({ isActive }) => `nav-item-btn${isActive ? " active" : ""}`}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <ShoppingCart size={18} />
                  {totalItems > 0 && (
                    <span style={{
                      position: "absolute",
                      top: -8,
                      right: -10,
                      background: "#DC2626",
                      color: "#ffffff",
                      fontSize: 10,
                      fontWeight: 800,
                      width: 17,
                      height: 17,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {totalItems}
                    </span>
                  )}
                </div>
                <span style={{ marginLeft: 4 }}>Cart</span>
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => `nav-item-btn${isActive ? " active" : ""}`}>
                <ClipboardList size={18} /> Orders
              </NavLink>
            </>
          )}
        </div>

        {/* RIGHT: User Profile & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Quick Search Button */}
          <button
            style={{ border: "none", background: "#F1F5F9", color: "#64748B", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            onClick={() => navigate(isAdmin ? "/admin" : "/inventory")}
            title="Search Medicines"
          >
            <Search size={18} />
          </button>

          {/* User Profile Pill */}
          <div
            onClick={() => navigate("/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "4px 12px 4px 4px",
              borderRadius: 999,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <img
              src={profilePhoto}
              alt={userName}
              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #087EA4" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = isAdmin ? "https://i.pravatar.cc/150?img=7" : "https://i.pravatar.cc/150?img=8";
              }}
            />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{userName}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            style={{
              border: "none",
              background: "#FEE2E2",
              color: "#DC2626",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <LogOut size={16} /> Logout
          </button>

          {/* Mobile Toggle */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMenuOpen((p) => !p)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#0F172A" }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div style={{
          position: "fixed",
          top: 68,
          left: 0,
          right: 0,
          background: "#ffffff",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 999
        }}>
          {isAdmin ? (
            <>
              <NavLink to="/admin" className="dropdown-link"><HomeIcon size={18} /> Dashboard</NavLink>
              <NavLink to="/admin/analytics" className="dropdown-link"><BarChart2 size={18} /> Analytics</NavLink>
              <NavLink to="/admin/alerts" className="dropdown-link"><Bell size={18} /> Alerts</NavLink>
              <NavLink to="/admin/ai-insights" className="dropdown-link"><Bot size={18} /> AI Insights</NavLink>
              <NavLink to="/admin/order-from-seller" className="dropdown-link"><Package size={18} /> Procurement</NavLink>
              <NavLink to="/profile" className="dropdown-link"><UserIcon size={18} /> Account Profile</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/home" className="dropdown-link"><HomeIcon size={18} /> Home Portal</NavLink>
              <NavLink to="/inventory" className="dropdown-link"><ShoppingBag size={18} /> Medicine Shop</NavLink>
              <NavLink to="/cart" className="dropdown-link"><ShoppingCart size={18} /> Shopping Cart ({totalItems})</NavLink>
              <NavLink to="/orders" className="dropdown-link"><ClipboardList size={18} /> My Orders</NavLink>
              <NavLink to="/profile" className="dropdown-link"><UserIcon size={18} /> Account Profile</NavLink>
            </>
          )}
        </div>
      )}

      {/* Inline Nav Styles */}
      <style>{`
        .nav-item-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #64748B;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .nav-item-btn:hover {
          color: #087EA4;
          background-color: #F0FDFA;
        }

        .nav-item-btn.active {
          color: #087EA4;
          background-color: #E0F2FE;
          font-weight: 700;
        }

        .dropdown-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
        }

        .dropdown-link:hover {
          background-color: #F1F5F9;
          color: #087EA4;
        }

        .mobile-hamburger-btn { display: none; }

        @media (max-width: 900px) {
          .desktop-nav-links { display: none !important; }
          .mobile-hamburger-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
