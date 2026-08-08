import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Pill, ShoppingBag, ShieldCheck, ArrowRight, UserCheck, Stethoscope, Truck, CheckCircle2 } from "lucide-react";
import "../customer.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAFC", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Landing Header */}
      <header style={{ height: 72, borderBottom: "1px solid #E2E8F0", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#087EA4", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Pill size={22} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>PharmaCare</span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-secondary-action" style={{ padding: "8px 18px", fontSize: 13.5 }} onClick={() => navigate("/login/customer")}>
            Sign In
          </button>
          <button className="btn-primary-action" style={{ padding: "8px 18px", fontSize: 13.5 }} onClick={() => navigate("/signup/customer")}>
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: 1280, margin: "0 auto", padding: "48px 24px", width: "100%" }}>
        <div style={{
          background: "linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 100%)",
          borderRadius: 24,
          border: "1px solid rgba(8, 126, 164, 0.15)",
          padding: "56px 48px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 48,
          alignItems: "center",
          boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
          marginBottom: 48
        }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFFFFF", color: "#087EA4", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid #BAE6FD", marginBottom: 20 }}>
              <ShieldCheck size={16} /> Certified Digital Health Platform
            </div>

            <h1 style={{ fontSize: "2.8rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 18 }}>
              Your Genuine Digital Pharmacy Partner.
            </h1>

            <p style={{ fontSize: "1.1rem", color: "#64748B", lineHeight: 1.6, marginBottom: 32, maxWidth: 560 }}>
              Order verified medicines, consult smart AI symptom diagnostics, track express doorstep deliveries, and manage healthcare records effortlessly.
            </p>

            {/* Portal Option Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div
                onClick={() => navigate("/login/customer")}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #087EA4",
                  borderRadius: 16,
                  padding: 24,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(8,126,164,0.12)"
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E0F2FE", color: "#087EA4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <ShoppingBag size={22} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Customer Portal</div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Shop medicines, track orders & AI assistant</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#087EA4", marginTop: 14, display: "flex", alignItems: "center", gap: 4 }}>
                  Enter Portal <ArrowRight size={14} />
                </div>
              </div>

              <div
                onClick={() => navigate("/login/admin")}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  padding: 24,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#CCFBF1", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <UserCheck size={22} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Admin Portal</div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Manage catalog, orders & analytics</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F766E", marginTop: 14, display: "flex", alignItems: "center", gap: 4 }}>
                  Admin Sign In <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Graphic Feature Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#E0F2FE", color: "#087EA4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Pill size={24} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>100% Doctor Certified Stock</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>Sourced directly from verified licensed pharmaceutical distributors.</div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#CCFBF1", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Stethoscope size={24} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Instant AI Symptom Insights</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>Machine learning analysis to guide your health decisions safely.</div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF3C7", color: "#B45309", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Truck size={24} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Express Doorstep Delivery</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>Real-time 5-stage package tracking with active delivery partners.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Trust Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, textAlign: "center" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#087EA4" }}>10K+</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#64748B", marginTop: 4 }}>Satisfied Patients</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0F766E" }}>500+</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#64748B", marginTop: 4 }}>Verified Medicines</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#16A34A" }}>100%</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#64748B", marginTop: 4 }}>Genuine Quality Guarantee</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#F59E0B" }}>24/7</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#64748B", marginTop: 4 }}>Healthcare Support</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #E2E8F0", background: "#FFFFFF", padding: "24px 32px", textAlign: "center", fontSize: 13, color: "#64748B" }}>
        © 2026 PharmaCare Health Technologies Inc. All rights reserved.
      </footer>
    </div>
  );
}