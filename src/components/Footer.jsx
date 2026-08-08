import { Link } from "react-router-dom";
import { Pill, ShieldCheck } from "lucide-react";
import "../customer.css";

export default function Footer() {
  return (
    <footer className="pharma-footer">
      <div className="footer-grid">
        {/* Col 1: PharmaCare Overview */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#087EA4", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pill size={20} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>PharmaCare</span>
          </div>
          <p style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.6, margin: "0 0 16px 0", maxWidth: 280 }}>
            Your trusted digital pharmacy platform delivering genuine medicines, lab products, and smart AI health solutions directly to your doorstep.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#0F766E" }}>
            <ShieldCheck size={16} /> 100% Certified Medicines & Verified Partners
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <div className="footer-col-title">Quick Links</div>
          <Link to="/home" className="footer-link">Home</Link>
          <Link to="/inventory" className="footer-link">Shop</Link>
          <Link to="/orders" className="footer-link">Orders</Link>
          <Link to="/orders" className="footer-link">Track Order</Link>
        </div>

        {/* Col 3: Healthcare */}
        <div>
          <div className="footer-col-title">Healthcare</div>
          <a href="#ai-symptom-section" className="footer-link">Symptom Checker</a>
          <Link to="/inventory" className="footer-link">Health Products</Link>
          <Link to="/inventory" className="footer-link">Medicine Categories</Link>
          <Link to="/inventory" className="footer-link">Prescriptions</Link>
        </div>

        {/* Col 4: Support */}
        <div>
          <div className="footer-col-title">Support</div>
          <a href="#contact" className="footer-link">Contact Support</a>
          <a href="#faq" className="footer-link">FAQ</a>
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <a href="#terms" className="footer-link">Terms of Service</a>
        </div>
      </div>

      <div className="footer-bottom">
        <div>© 2026 PharmaCare. All rights reserved.</div>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="#privacy" className="footer-link" style={{ margin: 0 }}>Privacy Policy</a>
          <a href="#terms" className="footer-link" style={{ margin: 0 }}>Terms of Service</a>
          <a href="#compliance" className="footer-link" style={{ margin: 0 }}>FDA Compliance</a>
        </div>
      </div>
    </footer>
  );
}
