import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest, storeAuthSession } from "../lib/auth";
import { googleSignIn, verifySignupOtp, requestSignupOtp } from "../lib/store";
import GooglePhoneCompletionModal from "../components/GooglePhoneCompletionModal";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { Pill, ShieldCheck, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import "../customer.css";

export default function SignupModern({ setUser }) {
  const { role = "customer" } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    businessName: "",
    businessAddress: "",
    verification: "",
  });
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Google auth state
  const [googlePendingUser, setGooglePendingUser] = useState(null);

  // Real Google GIS callback
  const handleGoogleCredential = useCallback(async (credential) => {
    setError("");
    setIsLoading(true);
    try {
      const payload = await googleSignIn(credential);
      if (payload.requiresPhone) {
        setGooglePendingUser(payload.user);
      } else {
        storeAuthSession({ user: payload.user, token: payload.token, rememberMe: true });
        setUser?.(payload.user);
        navigate(payload.user.role === "admin" ? "/admin" : "/customer/dashboard");
      }
    } catch (err) {
      setError(err.message || "Google sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { triggerGoogleSignIn } = useGoogleAuth({
    onSuccess: handleGoogleCredential,
    onError: (msg) => {
      setError(msg);
      setIsLoading(false);
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");
    setIsLoading(true);

    try {
      const payload = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          role,
        }),
      });

      if (payload.requiresOtp) {
        setStep("otp");
        setPendingEmail(payload.email || form.email);
        setDevOtp(payload.devOtp || "");
        setStatusMessage("Registration initiated! We sent a 6-digit OTP code to your email address.");
      } else {
        storeAuthSession({
          user: payload.user,
          token: payload.token,
          rememberMe: true,
        });
        setUser?.(payload.user);
        navigate(role === "admin" ? "/admin" : "/customer/dashboard");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = await verifySignupOtp(pendingEmail || form.email, otpCode);
      storeAuthSession({
        user: payload.user,
        token: payload.token,
        rememberMe: true,
      });
      setUser?.(payload.user);
      navigate(payload.user.role === "admin" ? "/admin" : "/customer/dashboard");
    } catch (err) {
      setError(err.message || "OTP verification failed. Please check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setStatusMessage("");
    setIsLoading(true);
    try {
      const payload = await requestSignupOtp(pendingEmail || form.email);
      setStatusMessage(payload.message || "A new 6-digit OTP code was sent to your email.");
      setDevOtp(payload.devOtp || "");
    } catch (err) {
      setError(err.message || "Failed to resend OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7FAFC", padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E2E8F0", padding: 40, width: 440, maxWidth: "95vw", boxShadow: "0 12px 32px -4px rgba(15,23,42,0.08)" }}>
        
        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#087EA4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px auto" }}>
            <Pill size={26} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
            {step === "otp"
              ? "Verify Your Email"
              : role === "admin"
              ? "Admin Registration"
              : "Create PharmaCare Account"}
          </h2>
          <p style={{ fontSize: 13.5, color: "#64748B", margin: 0 }}>
            {step === "otp"
              ? `We sent a 6-digit verification code to ${pendingEmail}`
              : "Join thousands of patients ordering genuine medicines with AI health guidance"}
          </p>
        </div>

        {statusMessage && (
          <div style={{ background: "#DCFCE7", color: "#16A34A", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
            {statusMessage}
          </div>
        )}

        {devOtp && (
          <div style={{ background: "#DCFCE7", color: "#16A34A", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
            Your OTP code is: <strong style={{ fontSize: 17, letterSpacing: 2 }}>{devOtp}</strong>
          </div>
        )}

        {error && (
          <div style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
            {error}
          </div>
        )}

        {step === "form" ? (
          <>
            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Full Name</label>
                <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required className="ai-input-box" />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Email Address</label>
                <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required className="ai-input-box" />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Mobile Number</label>
                <input name="mobile" placeholder="Mobile Number" value={form.mobile} onChange={handleChange} required className="ai-input-box" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Password</label>
                <input name="password" type="password" placeholder="Password (min. 6 characters)" value={form.password} onChange={handleChange} required minLength={6} className="ai-input-box" />
              </div>

              {role === "admin" && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Business Name</label>
                    <input name="businessName" placeholder="Business Name" value={form.businessName} onChange={handleChange} required className="ai-input-box" />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Business Address</label>
                    <input name="businessAddress" placeholder="Business Address" value={form.businessAddress} onChange={handleChange} required className="ai-input-box" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Verification Document ID</label>
                    <input name="verification" placeholder="Verification Document URL or ID" value={form.verification} onChange={handleChange} required className="ai-input-box" />
                  </div>
                </>
              )}

              <button type="submit" disabled={isLoading} className="btn-primary-action" style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15, marginBottom: 16 }}>
                {isLoading ? "Creating account..." : "Sign Up & Send OTP"}
              </button>
            </form>

            <div style={{ textAlign: "center", margin: "16px 0 14px", position: "relative" }}>
              <div style={{ borderTop: "1px solid #E2E8F0", position: "absolute", top: "50%", left: 0, right: 0 }}></div>
              <span style={{ background: "#FFFFFF", padding: "0 12px", color: "#94A3B8", fontSize: 12, position: "relative" }}>Or sign up with</span>
            </div>

            <button
              onClick={() => {
                setError("");
                setIsLoading(true);
                triggerGoogleSignIn();
              }}
              disabled={isLoading}
              style={{ width: "100%", padding: 11, background: "#FFFFFF", color: "#0F172A", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {isLoading ? "Verifying with Google..." : "Sign up with Google"}
            </button>
          </>
        ) : (
          /* STEP 2: Email Registration OTP Verification Screen */
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 8, textAlign: "center" }}>
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                placeholder="------"
                maxLength="6"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                required
                autoFocus
                className="ai-input-box"
                style={{
                  fontFamily: "monospace",
                  fontSize: 22,
                  letterSpacing: 6,
                  textAlign: "center",
                  padding: "12px",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="btn-primary-action"
              style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15, marginBottom: 12 }}
            >
              {isLoading ? "Verifying OTP..." : "Verify OTP & Activate Account"}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading}
              className="btn-secondary-action"
              style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, marginBottom: 12 }}
            >
              Resend Verification Code
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError("");
                setStatusMessage("");
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "#64748B",
                fontSize: 13,
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <ArrowLeft size={14} /> Back to Sign Up Form
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748B" }}>
          Already have an account?{" "}
          <Link to={`/login/${role}`} style={{ color: "#087EA4", fontWeight: 700, textDecoration: "none" }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* First-Time Google Sign-In Mobile Phone Completion Modal */}
      {googlePendingUser && (
        <GooglePhoneCompletionModal
          user={googlePendingUser}
          rememberMe={true}
          onComplete={(completedUser) => {
            setGooglePendingUser(null);
            setUser?.(completedUser);
            navigate(completedUser.role === "admin" ? "/admin" : "/customer/dashboard");
          }}
          onCancel={() => setGooglePendingUser(null)}
        />
      )}
    </div>
  );
}
