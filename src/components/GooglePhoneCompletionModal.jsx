import React, { useState } from "react";
import { Check, ShieldCheck, ArrowRight, Phone, AlertCircle, Loader2 } from "lucide-react";
import { completeGooglePhone } from "../lib/store";
import { storeAuthSession } from "../lib/auth";
import "./GooglePhoneCompletionModal.css";

export default function GooglePhoneCompletionModal({ user, onComplete, onCancel, rememberMe = false }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanPhone) {
      setError("Please enter your mobile phone number.");
      return;
    }

    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number (e.g. 9876543210).");
      return;
    }

    setLoading(true);
    try {
      const res = await completeGooglePhone(user.id, cleanPhone);
      if (res.token && res.user) {
        storeAuthSession({ user: res.user, token: res.token, rememberMe });
        if (onComplete) onComplete(res.user);
      } else {
        throw new Error(res.message || "Failed to complete phone registration");
      }
    } catch (err) {
      setError(err.message || "Mobile registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="g-completion-backdrop">
      <div className="g-completion-card">
        {/* User Profile Avatar & Header */}
        <div className="g-completion-header">
          <div className="g-user-avatar-wrap">
            <img
              src={
                user.profilePhoto ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "Customer")}&background=e0f2fe&color=087ea4&bold=true`
              }
              alt={user.name}
              className="g-user-avatar"
            />
            <div className="g-verified-badge" title="Verified Google Account">
              <Check size={14} />
            </div>
          </div>
          <h2 className="g-title">Complete Your PharmaCare Account</h2>
          <p className="g-subtitle">Welcome to PharmaCare, <strong>{user.name}</strong>!</p>
        </div>

        {error && (
          <div className="g-error-alert" style={{ marginBottom: 16 }}>
            <AlertCircle size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="g-form">
          {/* Read-Only Full Name */}
          <div className="g-field-group">
            <div className="g-field-label">
              <span>Full Name</span>
              <span className="g-badge-verified">
                <ShieldCheck size={13} /> Verified by Google
              </span>
            </div>
            <div className="g-readonly-box">
              <span>{user.name}</span>
              <Check size={16} color="#16a34a" />
            </div>
          </div>

          {/* Read-Only Email Address */}
          <div className="g-field-group">
            <div className="g-field-label">
              <span>Email Address</span>
              <span className="g-badge-verified">
                <ShieldCheck size={13} /> Verified
              </span>
            </div>
            <div className="g-readonly-box">
              <span>{user.email}</span>
              <Check size={16} color="#16a34a" />
            </div>
          </div>

          {/* Editable Mobile Phone Field ONLY */}
          <div className="g-field-group">
            <div className="g-field-label">
              <span>Mobile Number *</span>
              <span style={{ fontSize: 11, color: "#087ea4", fontWeight: 700 }}>Required for Orders & OTP</span>
            </div>
            <div className="g-phone-input-wrap">
              <span className="g-phone-prefix">
                <Phone size={14} /> +91
              </span>
              <input
                type="tel"
                className="g-phone-input"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="g-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" /> Verifying Mobile...
              </>
            ) : (
              <>
                Continue to PharmaCare <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
