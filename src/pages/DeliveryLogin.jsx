import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deliveryLogin } from "../lib/store";
import { storeAuthSession } from "../lib/auth";
import { Truck, ShieldCheck, KeyRound, AlertTriangle, ArrowRight } from "lucide-react";
import "../customer.css";

export default function DeliveryLogin({ setUser }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!userId.trim() || !password) {
      setErrorMessage("Delivery User ID and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = await deliveryLogin({ userId: userId.trim(), password });
      storeAuthSession({
        user: payload.user,
        token: payload.token,
      });
      setUser?.(payload.user);
      navigate("/delivery/dashboard");
    } catch (err) {
      setErrorMessage(err?.message || "Invalid Delivery User ID or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ background: "#FFFFFF", borderRadius: 20, width: 420, maxWidth: "95vw", padding: 32, boxShadow: "0 20px 40px -10px rgba(15,23,42,0.1)", border: "1px solid #E2E8F0" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#E0F2FE", color: "#0284C7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Truck size={28} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>Delivery Partner Portal</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Sign in with your Delivery ID (e.g. DEL1001) to access your dashboard.</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: 10, border: "1px solid #FCA5A5", fontSize: 13, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={16} /> {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>Delivery User ID / Phone Number *</label>
            <input
              type="text"
              placeholder="e.g. DEL1001 or 9876543210"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, fontFamily: "monospace", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>Password *</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: "#087EA4",
              color: "#FFFFFF",
              border: "none",
              padding: 14,
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(8, 126, 164, 0.2)",
              marginTop: 4,
            }}
          >
            {isLoading ? "Signing in..." : "Sign In to Delivery Portal"} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#94A3B8" }}>
          PharmaCare Logistics System • Authorized Personnel Only
        </div>
      </div>
    </div>
  );
}
