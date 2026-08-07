import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { clearAuthSession } from "../lib/auth";

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
  const drawerRef = useRef(null);

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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location]);

  if (!user) return null;

  const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .pharma-navbar {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          font-family: 'Inter', sans-serif;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(226,232,240,0.8);
          transition: box-shadow 0.3s ease;
        }

        .pharma-navbar.scrolled {
          box-shadow: 0 4px 24px rgba(15,68,84,0.1);
        }

        .pharma-navbar.admin-nav {
          background: rgba(15,23,42,0.95);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 28px;
          height: 64px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .nav-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .nav-logo-text {
          font-size: 19px;
          font-weight: 800;
          background: linear-gradient(135deg, #0F4454 0%, #0ea5e9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.3px;
        }

        .admin-nav .nav-logo-text {
          background: linear-gradient(135deg, #7dd3fc, #a5b4fc);
          -webkit-background-clip: text;
          background-clip: text;
        }

        .admin-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(14,165,233,0.2));
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: #a5b4fc;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .admin-pill:hover {
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(14,165,233,0.35));
          transform: translateY(-1px);
        }

        /* Center Nav */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: center;
        }

        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
          position: relative;
        }

        .nav-link:hover {
          color: #0ea5e9;
          background: rgba(14,165,233,0.08);
        }

        .nav-link.active {
          color: #0284c7;
          background: rgba(14,165,233,0.1);
          font-weight: 600;
        }

        .admin-nav .nav-link { color: #64748b; }
        .admin-nav .nav-link:hover { color: #7dd3fc; background: rgba(14,165,233,0.1); }
        .admin-nav .nav-link.active { color: #7dd3fc; background: rgba(14,165,233,0.15); }

        /* Cart Badge */
        .cart-count {
          position: absolute;
          top: 0px;
          right: 1px;
          background: #ef4444;
          color: white;
          font-size: 9px;
          font-weight: 800;
          min-width: 16px;
          height: 16px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          animation: pop 0.3s ease;
        }

        @keyframes pop {
          0% { transform: scale(0.5); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        /* Notification dot */
        .notif-dot {
          position: absolute;
          top: 3px;
          right: 5px;
          width: 7px;
          height: 7px;
          background: #ef4444;
          border-radius: 50%;
          border: 1.5px solid white;
        }

        .admin-nav .notif-dot { border-color: #0f172a; }

        /* Dropdown */
        .nav-dropdown-wrapper {
          position: relative;
        }

        .dropdown-trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .admin-nav .dropdown-trigger { color: #64748b; }

        .dropdown-trigger:hover {
          color: #0ea5e9;
          background: rgba(14,165,233,0.08);
        }

        .dropdown-chevron {
          font-size: 10px;
          transition: transform 0.2s;
        }

        .dropdown-trigger.open .dropdown-chevron { transform: rotate(180deg); }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          min-width: 210px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          z-index: 1100;
          overflow: hidden;
          animation: slideDown 0.2s ease;
        }

        .admin-nav .dropdown-menu {
          background: #1e293b;
          border-color: rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dropdown-menu a {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          font-size: 13.5px;
          font-weight: 500;
          color: #334155;
          text-decoration: none;
          transition: background 0.15s;
        }

        .admin-nav .dropdown-menu a { color: #94a3b8; }

        .dropdown-menu a:hover {
          background: #f0f9ff;
          color: #0ea5e9;
        }

        .admin-nav .dropdown-menu a:hover {
          background: rgba(14,165,233,0.1);
          color: #7dd3fc;
        }

        /* Right section */
        .nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 12px 5px 5px;
          border-radius: 999px;
          background: rgba(14,165,233,0.06);
          border: 1px solid rgba(14,165,233,0.15);
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-nav .profile-btn {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
        }

        .profile-btn:hover {
          background: rgba(14,165,233,0.1);
          transform: translateY(-1px);
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(14,165,233,0.4);
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 1px;
          line-height: 1;
        }

        .profile-name {
          font-size: 13px;
          font-weight: 700;
          color: #0F4454;
        }

        .admin-nav .profile-name { color: #e2e8f0; }

        .profile-role {
          font-size: 10px;
          font-weight: 500;
          color: #0ea5e9;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .admin-nav .profile-role { color: #6366f1; }

        .logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border: none;
          border-radius: 9px;
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .logout-btn:hover {
          background: #ef4444;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239,68,68,0.3);
        }

        /* Mobile Hamburger */
        .nav-hamburger {
          display: none;
          width: 38px;
          height: 38px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: none;
          cursor: pointer;
          font-size: 18px;
          align-items: center;
          justify-content: center;
          color: #475569;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .admin-nav .nav-hamburger {
          border-color: rgba(255,255,255,0.1);
          color: #94a3b8;
        }

        .nav-hamburger:hover { background: #f1f5f9; }
        .admin-nav .nav-hamburger:hover { background: rgba(255,255,255,0.06); }

        /* Mobile Drawer */
        .mobile-drawer-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 1050;
          backdrop-filter: blur(3px);
        }

        .mobile-drawer-overlay.open { display: block; }

        .mobile-drawer {
          position: fixed;
          top: 0;
          right: -100%;
          width: min(320px, 85vw);
          height: 100vh;
          background: white;
          z-index: 1060;
          box-shadow: -8px 0 32px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }

        .admin-nav ~ .mobile-drawer-overlay .mobile-drawer {
          background: #1e293b;
        }

        .mobile-drawer.open { right: 0; }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .drawer-close {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: none;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .drawer-links {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .drawer-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 500;
          color: #334155;
          text-decoration: none;
          transition: all 0.15s;
        }

        .drawer-link:hover, .drawer-link.active {
          background: rgba(14,165,233,0.1);
          color: #0284c7;
        }

        .drawer-footer {
          padding: 16px 20px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .drawer-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border-radius: 10px;
          cursor: pointer;
        }

        .drawer-logout {
          width: 100%;
          padding: 11px;
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .drawer-logout:hover {
          background: #ef4444;
          color: white;
        }

        /* Responsive breakpoints */
        @media (max-width: 1000px) {
          .profile-details { display: none; }
          .nav-links { gap: 0; }
        }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-hamburger { display: flex; }
          .nav-container { padding: 0 16px; }
        }

        @media (max-width: 480px) {
          .logout-btn { display: none; }
        }
      `}</style>

      {/* Mobile Drawer Overlay */}
      <div className={`mobile-drawer-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
        <div ref={drawerRef} className={`mobile-drawer ${menuOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <div className="nav-logo" style={{ textDecoration: "none" }}>
              <div className="nav-logo-icon">💊</div>
              <span className="nav-logo-text" style={{ background: "linear-gradient(135deg,#0F4454,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PharmaCare</span>
            </div>
            <button className="drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
          </div>

          <div className="drawer-links">
            {isAdmin ? (
              <>
                <NavLink to="/admin/analytics"        className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>📊 Analytics</NavLink>
                <NavLink to="/admin/alerts"           className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>🔔 Alerts</NavLink>
                <NavLink to="/admin/ai-recommendations" className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>🤖 AI Insights</NavLink>
                <NavLink to="/restock"                className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>📦 Restock</NavLink>
                <NavLink to="/bulk-discount"          className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>🏷️ Bulk Discount</NavLink>
                <NavLink to="/emergency-order"        className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>🚨 Emergency Order</NavLink>
                <NavLink to="/admin/generate-report"  className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>📄 Reports</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/home"      className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>🏠 Home</NavLink>
                <NavLink to="/inventory" className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>🛍️ Shop</NavLink>
                <NavLink to="/cart"      className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>🛒 Cart {totalItems > 0 && <span style={{background:"#ef4444",color:"white",borderRadius:999,padding:"1px 7px",fontSize:11,fontWeight:800}}>{totalItems}</span>}</NavLink>
                <NavLink to="/orders"    className={navLinkClass} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,fontSize:14.5,fontWeight:500,color:"#334155",textDecoration:"none",transition:"all 0.15s"}}>📋 Orders</NavLink>
              </>
            )}
          </div>

          <div className="drawer-footer">
            <div className="drawer-profile" onClick={() => { navigate("/profile"); setMenuOpen(false); }}>
              <img src={profilePhoto} alt={userName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #0ea5e9" }}
                onError={(e) => { e.target.onerror = null; e.target.src = isAdmin ? "https://i.pravatar.cc/150?img=7" : "https://i.pravatar.cc/150?img=8"; }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F4454" }}>{userName}</div>
                <div style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 500 }}>{isAdmin ? "Administrator" : "Customer"}</div>
              </div>
            </div>
            <button className="drawer-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`pharma-navbar${isAdmin ? " admin-nav" : ""}${scrolled ? " scrolled" : ""}`}>
        <div className="nav-container">
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div className="nav-logo-icon">💊</div>
            <span className="nav-logo-text">PharmaCare</span>
            {isAdmin && (
              <span className="admin-pill" onClick={() => navigate("/admin")}>
                👑 Admin
              </span>
            )}
          </div>

          {/* Center Links */}
          <div className="nav-links">
            {isAdmin ? (
              <>
                <NavLink to="/admin/analytics" className={navLinkClass}>📊 Analytics</NavLink>
                <NavLink to="/admin/alerts" className={navLinkClass}>
                  🔔 Alerts
                  <span className="notif-dot" />
                </NavLink>
                <NavLink to="/admin/ai-recommendations" className={navLinkClass}>🤖 AI Insights</NavLink>
                <NavLink to="/admin/order-from-seller" className={navLinkClass}>📦 Seller Orders</NavLink>
                <div className="nav-dropdown-wrapper" ref={dropdownRef}>
                  <div
                    className={`dropdown-trigger${dropdownOpen ? " open" : ""}`}
                    onClick={() => setDropdownOpen((p) => !p)}
                  >
                    ⚡ Quick Actions
                    <span className="dropdown-chevron">▾</span>
                  </div>
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <NavLink to="/restock" onClick={() => setDropdownOpen(false)}>🔄 Restock Low Items</NavLink>
                      <NavLink to="/bulk-discount" onClick={() => setDropdownOpen(false)}>🏷️ Bulk Discount</NavLink>
                      <NavLink to="/emergency-order" onClick={() => setDropdownOpen(false)}>🚨 Emergency Order</NavLink>
                      <NavLink to="/admin/generate-report" onClick={() => setDropdownOpen(false)}>📄 Generate Report</NavLink>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/home" className={navLinkClass}>🏠 Home</NavLink>
                <NavLink to="/inventory" className={navLinkClass}>🛍️ Shop</NavLink>
                <NavLink to="/cart" className={navLinkClass}>
                  <span style={{ position: "relative" }}>
                    🛒
                    {totalItems > 0 && (
                      <span key={totalItems} className="cart-count">{totalItems}</span>
                    )}
                  </span>
                  Cart
                </NavLink>
                <NavLink to="/orders" className={navLinkClass}>📋 Orders</NavLink>
              </>
            )}
          </div>

          {/* Right */}
          <div className="nav-right">
            <div className="profile-btn" onClick={() => navigate("/profile")}>
              <img
                src={profilePhoto}
                alt={userName}
                className="profile-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = isAdmin ? "https://i.pravatar.cc/150?img=7" : "https://i.pravatar.cc/150?img=8";
                }}
              />
              <div className="profile-details">
                <span className="profile-name">{userName}</span>
                <span className="profile-role">{isAdmin ? "Administrator" : "Customer"}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              🚪 Logout
            </button>
            <button className="nav-hamburger" onClick={() => setMenuOpen((p) => !p)} aria-label="Open menu">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
