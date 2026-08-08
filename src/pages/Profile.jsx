import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUserProfile } from "../lib/store";
import { User, Mail, Phone, Camera, Check, ShieldCheck, ArrowLeft, Save } from "lucide-react";
import "../customer.css";

export default function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const currentUser = user || JSON.parse(localStorage.getItem("user") || "null");
    if (!currentUser) return;
    setFullName(currentUser.name || "");
    setEmail(currentUser.email || "");
    setPhone(currentUser.phone || "");
    setProfilePhoto(currentUser.profilePhoto || "");
    setPhotoPreview(currentUser.profilePhoto || "");
  }, [user]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSavedMessage("File must be under 5 MB.");
      setIsError(true);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setSavedMessage("Please upload an image file.");
      setIsError(true);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result || "";
      setProfilePhoto(b64);
      setPhotoPreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const currentUser = user || JSON.parse(localStorage.getItem("user") || "null");
    if (!currentUser?.id) {
      setSavedMessage("Please sign in again before saving.");
      setIsError(true);
      return;
    }
    setSaving(true);
    setSavedMessage("");
    setIsError(false);
    try {
      const response = await updateUserProfile(currentUser.id, {
        name: fullName,
        email,
        phone,
        profilePhoto,
      });
      localStorage.setItem("user", JSON.stringify(response.user));
      setUser?.(response.user);
      setSavedMessage("Profile updated successfully ✓");
      setIsError(false);
    } catch (error) {
      setSavedMessage(error.message);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const displayPhoto = photoPreview || profilePhoto || "https://i.pravatar.cc/150?img=8";
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = currentUser?.isAdmin === true || currentUser?.role === "admin";

  return (
    <div className="customer-page">
      <div className="customer-container" style={{ maxWidth: 720 }}>
        
        {/* Header */}
        <div className="section-header-wrap" style={{ marginBottom: 28 }}>
          <div>
            <h1 className="page-title">Account Profile</h1>
            <p className="page-subtitle">Manage your personal information, contact details, and account photo.</p>
          </div>
        </div>

        {/* Profile Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 36, boxShadow: "0 4px 12px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 32 }}>
            
            {/* Avatar upload */}
            <div
              style={{ position: "relative", cursor: "pointer", marginBottom: 16 }}
              onClick={() => document.getElementById("profilePhotoInput").click()}
              title="Click to upload profile photo"
            >
              <img
                src={displayPhoto}
                alt="Profile Avatar"
                style={{ width: 104, height: 104, borderRadius: "50%", objectFit: "cover", border: "3px solid #087EA4", boxShadow: "0 8px 24px rgba(8,126,164,0.2)" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = isAdmin ? "https://i.pravatar.cc/150?img=7" : "https://i.pravatar.cc/150?img=8";
                }}
              />
              <div style={{ position: "absolute", bottom: 2, right: 2, background: "#087EA4", color: "#fff", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                <Camera size={16} />
              </div>
            </div>

            <input
              type="file"
              id="profilePhotoInput"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
            />

            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
              {fullName || "User Name"}
            </h2>
            <span style={{ fontSize: 12, fontWeight: 700, background: "#E0F2FE", color: "#087EA4", padding: "4px 12px", borderRadius: 999 }}>
              ● {isAdmin ? "Administrator Account" : "Customer Account"}
            </span>
          </div>

          {savedMessage && (
            <div style={{ padding: 12, borderRadius: 8, marginBottom: 24, fontSize: 13.5, fontWeight: 700, textAlign: "center", background: isError ? "#FEE2E2" : "#DCFCE7", color: isError ? "#DC2626" : "#16A34A" }}>
              {savedMessage}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <User size={15} color="#087EA4" /> Full Name
              </label>
              <input
                className="ai-input-box"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Mail size={15} color="#087EA4" /> Email Address
              </label>
              <input
                className="ai-input-box"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Phone size={15} color="#087EA4" /> Mobile Number
              </label>
              <input
                className="ai-input-box"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                className="btn-primary-action"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} /> {saving ? "Saving Changes..." : "Save Changes"}
              </button>
              <button
                className="btn-secondary-action"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
