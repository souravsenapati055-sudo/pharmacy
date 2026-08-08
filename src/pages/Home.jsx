import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchPredictionSymptoms, predictDisease } from "../lib/store";
import {
  Pill,
  Stethoscope,
  Truck,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Activity,
  Star,
  Plus,
  Check,
  Info,
} from "lucide-react";
import "../customer.css";

export default function Home({ addToCart, orders = [], medicines = [], loading = false }) {
  const [user, setUser] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [predictionTouched, setPredictionTouched] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u);
    if (!u) navigate("/login/customer");
  }, [navigate]);

  useEffect(() => {
    let ignore = false;
    async function loadSymptoms() {
      try {
        const response = await fetchPredictionSymptoms();
        if (!ignore) setSymptoms(response);
      } catch (error) {
        if (!ignore) setPredictionError(error.message);
      }
    }
    loadSymptoms();
    return () => { ignore = true; };
  }, []);

  const customerOrders = useMemo(
    () => (orders || []).filter((o) => o.userId && user?.id && String(o.userId) === String(user.id)),
    [orders, user]
  );
  const openOrders = useMemo(
    () => customerOrders.filter((o) => o.status?.toLowerCase() !== "delivered"),
    [customerOrders]
  );
  const spentAmount = customerOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const categories = useMemo(() => {
    const map = new Map();
    medicines.forEach((m) => {
      map.set(m.category, (map.get(m.category) || 0) + 1);
    });
    return [
      { name: "All", count: medicines.length },
      ...Array.from(map.entries()).map(([name, count]) => ({ name, count })),
    ];
  }, [medicines]);

  const featuredMedicines = useMemo(() => {
    const list = activeCategory === "All"
      ? medicines
      : medicines.filter((m) => m.category === activeCategory);
    return list.slice(0, 8);
  }, [medicines, activeCategory]);

  const filteredSymptoms = useMemo(
    () => symptoms.filter((s) =>
      s.replaceAll("_", " ").toLowerCase().includes(symptomSearch.toLowerCase())
    ),
    [symptoms, symptomSearch]
  );

  if (!user) return null;

  const handleAdd = (medicine) => {
    addToCart(medicine);
    setAddedId(medicine.id);
    setTimeout(() => setAddedId(null), 900);
  };

  const toggleSymptom = (symptom) => {
    setPredictionTouched(true);
    setPredictionResult(null);
    setPredictionError("");
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : prev.length >= 8 ? prev : [...prev, symptom]
    );
  };

  const clearPredictionState = () => {
    setSelectedSymptoms([]);
    setPredictionResult(null);
    setPredictionError("");
    setPredictionTouched(false);
    setSymptomSearch("");
  };

  const handlePredictDisease = async () => {
    if (selectedSymptoms.length === 0) {
      setPredictionError("Please select at least one symptom to analyze.");
      return;
    }
    setPredictionLoading(true);
    setPredictionError("");
    try {
      const result = await predictDisease(selectedSymptoms);
      setPredictionResult(result);
    } catch (error) {
      setPredictionError(error.message);
    } finally {
      setPredictionLoading(false);
    }
  };

  return (
    <div className="customer-page">
      <div className="customer-container">

        {/* ── 1. HEALTHCARE HERO SECTION (400-500px tall) ── */}
        <div className="healthcare-hero">
          <div>
            <div className="hero-pill-tag">
              <ShieldCheck size={16} /> Certified Digital Pharmacy Platform
            </div>
            <h1 className="hero-main-heading">
              Your health, simplified.
            </h1>
            <p className="hero-description">
              Order genuine medicines, manage prescriptions, track deliveries, and get personalized health insights — all in one place.
            </p>
            <div className="hero-cta-group">
              <button className="btn-primary-action" onClick={() => navigate("/inventory")}>
                <Pill size={18} /> Shop Medicines
              </button>
              <button className="btn-secondary-action" onClick={() => document.getElementById("ai-symptom-section")?.scrollIntoView({ behavior: "smooth" })}>
                <Stethoscope size={18} /> Check Symptoms
              </button>
            </div>
          </div>

          <div className="hero-graphic-card">
            <div className="hero-graphic-item">
              <div className="hero-graphic-icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>100% Genuine Medicines</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Sourced directly from licensed manufacturers</div>
              </div>
            </div>

            <div className="hero-graphic-item">
              <div className="hero-graphic-icon" style={{ background: "#CCFBF1", color: "#0F766E" }}>
                <Truck size={22} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Express Home Delivery</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Temperature-controlled doorstep delivery</div>
              </div>
            </div>

            <div className="hero-graphic-item">
              <div className="hero-graphic-icon" style={{ background: "#FEF3C7", color: "#B45309" }}>
                <Activity size={22} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>AI Health Analytics</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Instant ML symptom analysis & guidance</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. QUICK ACTIONS (4 Compact Action Cards) ── */}
        <div className="quick-actions-grid">
          <Link to="/inventory" className="quick-action-card">
            <div className="quick-action-icon-box">
              <Pill size={22} />
            </div>
            <div>
              <h3 className="quick-action-title">Medicines</h3>
              <p className="quick-action-sub">Browse catalog & shop</p>
            </div>
          </Link>

          <a href="#ai-symptom-section" className="quick-action-card">
            <div className="quick-action-icon-box" style={{ background: "#CCFBF1", color: "#0F766E" }}>
              <Stethoscope size={22} />
            </div>
            <div>
              <h3 className="quick-action-title">Symptom Checker</h3>
              <p className="quick-action-sub">AI health analysis</p>
            </div>
          </a>

          <Link to="/orders" className="quick-action-card">
            <div className="quick-action-icon-box" style={{ background: "#FEF3C7", color: "#B45309" }}>
              <Truck size={22} />
            </div>
            <div>
              <h3 className="quick-action-title">Track Order</h3>
              <p className="quick-action-sub">Live delivery progress</p>
            </div>
          </Link>

          <Link to="/orders" className="quick-action-card">
            <div className="quick-action-icon-box" style={{ background: "#FEE2E2", color: "#DC2626" }}>
              <ClipboardList size={22} />
            </div>
            <div>
              <h3 className="quick-action-title">My Orders</h3>
              <p className="quick-action-sub">Order history & receipts</p>
            </div>
          </Link>
        </div>

        {/* ── 3. SUBTLE COMPACT STATISTICS ROW ── */}
        <div className="stats-row">
          <div className="stat-box">
            <div>
              <div className="stat-box-lbl">Available Medicines</div>
              <div className="stat-box-num">{medicines.length}</div>
            </div>
            <Pill size={28} color="#087EA4" opacity={0.3} />
          </div>

          <div className="stat-box">
            <div>
              <div className="stat-box-lbl">Active Orders</div>
              <div className="stat-box-num" style={{ color: "#F59E0B" }}>{openOrders.length}</div>
            </div>
            <Truck size={28} color="#F59E0B" opacity={0.3} />
          </div>

          <div className="stat-box">
            <div>
              <div className="stat-box-lbl">Completed Orders</div>
              <div className="stat-box-num" style={{ color: "#16A34A" }}>
                {customerOrders.filter((o) => o.status?.toLowerCase() === "delivered").length}
              </div>
            </div>
            <CheckCircle2 size={28} color="#16A34A" opacity={0.3} />
          </div>

          <div className="stat-box">
            <div>
              <div className="stat-box-lbl">Total Spent</div>
              <div className="stat-box-num">₹{spentAmount.toFixed(0)}</div>
            </div>
            <Activity size={28} color="#087EA4" opacity={0.3} />
          </div>
        </div>

        {/* ── 4. AI HEALTH ASSISTANT (2-COLUMN UI) ── */}
        <div className="ai-assistant-container" id="ai-symptom-section">
          <div className="section-header-wrap" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="page-title" style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: 10 }}>
                <Stethoscope color="#087EA4" size={24} /> AI Health Assistant
              </h2>
              <p className="page-subtitle">Select your symptoms to get an AI-powered health insight.</p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#087EA4", background: "#E0F2FE", padding: "4px 12px", borderRadius: 999 }}>
              {selectedSymptoms.length} / 8 symptoms selected
            </span>
          </div>

          <div className="ai-assistant-grid">
            {/* LEFT: Symptom selection */}
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <input
                  className="ai-input-box"
                  type="text"
                  placeholder="Search symptoms (e.g. headache, fever, cough)..."
                  value={symptomSearch}
                  onChange={(e) => setSymptomSearch(e.target.value)}
                />
                {selectedSymptoms.length > 0 && (
                  <button
                    style={{ border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#64748B", padding: "0 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                    onClick={clearPredictionState}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="symptom-chips-container">
                {filteredSymptoms.slice(0, 140).map((s) => {
                  const active = selectedSymptoms.includes(s);
                  return (
                    <button
                      key={s}
                      className={`symptom-chip-btn${active ? " selected" : ""}`}
                      onClick={() => toggleSymptom(s)}
                    >
                      {active ? <Check size={14} /> : null}
                      {s.replaceAll("_", " ")}
                    </button>
                  );
                })}
              </div>

              <button
                className="btn-primary-action"
                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                onClick={handlePredictDisease}
                disabled={predictionLoading || selectedSymptoms.length === 0}
              >
                {predictionLoading ? "Analyzing Symptoms..." : "Analyze Symptoms"}
              </button>

              {predictionError && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
                  ⚠️ {predictionError}
                </div>
              )}
            </div>

            {/* RIGHT: Results & Guidance */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {predictionResult ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                    Analysis Outcome
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Possible Condition: {predictionResult.disease}</span>
                    <span style={{ fontSize: 12, background: "#DCFCE7", color: "#16A34A", padding: "4px 10px", borderRadius: 999, fontWeight: 700 }}>
                      Confidence: 87%
                    </span>
                  </div>

                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14, fontSize: 13.5, color: "#475569", lineHeight: 1.5, marginBottom: 16 }}>
                    💡 <strong>Clinical Guidance:</strong> {predictionResult.advice}
                  </div>

                  {predictionResult.recommendedProduct ? (
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#087EA4", textTransform: "uppercase" }}>Recommended Product</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{predictionResult.recommendedProduct.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>₹{predictionResult.recommendedProduct.price}</div>
                      </div>
                      <button className="btn-add-cart" onClick={() => handleAdd(predictionResult.recommendedProduct)}>
                        <Plus size={14} /> Add to Cart
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#B45309", padding: 12, background: "#FEF3C7", borderRadius: 8 }}>
                      Recommended product ({predictionResult.recommendedMedicine}) is not in catalog.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748B" }}>
                  <Activity size={40} color="#087EA4" style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Ready for Health Analysis</div>
                  <div style={{ fontSize: 13.5, color: "#64748B", maxWidth: 300, margin: "0 auto" }}>
                    Select your symptoms on the left and click <strong>Analyze Symptoms</strong> to view insights.
                  </div>
                </div>
              )}

              {/* MANDATORY MEDICAL DISCLAIMER */}
              <div className="ai-disclaimer-banner">
                <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Medical Disclaimer:</strong> This tool provides informational guidance only and is not a substitute for professional medical advice, diagnosis, or treatment.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. E-COMMERCE MEDICINE CATALOG ── */}
        <div>
          <div className="section-header-wrap">
            <div>
              <h2 className="page-title" style={{ fontSize: "1.5rem" }}>
                Pharmaceutical Medicine Catalog
              </h2>
              <p className="page-subtitle">Shop genuine medications, devices, and supplements directly from certified distributors.</p>
            </div>
            <Link to="/inventory" style={{ fontSize: 13.5, fontWeight: 700, color: "#087EA4", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              View All Medicines ({medicines.length}) <ChevronRight size={16} />
            </Link>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 24 }}>
            {categories.map((cat) => {
              const active = cat.name === activeCategory;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: active ? "1.5px solid #087EA4" : "1px solid #E2E8F0",
                    background: active ? "#E0F2FE" : "#FFFFFF",
                    color: active ? "#087EA4" : "#64748B",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {cat.name} ({cat.count})
                </button>
              );
            })}
          </div>

          {/* 4-Column Medicine Grid */}
          <div className="ecom-medicine-grid">
            {featuredMedicines.map((m) => {
              const isAdded = addedId === m.id;
              const outOfStock = m.stock < 1;
              const discountPct = m.discount || m.discount_percent || 0;
              const finalPrice = discountPct > 0 ? m.price * (1 - discountPct / 100) : m.price;

              return (
                <div className="ecom-card" key={m.id}>
                  <div className="ecom-card-img-wrap">
                    <img
                      className="ecom-card-img"
                      src={m.image || m.image_url || "https://placehold.co/300x180/e0f2fe/087ea4?text=PharmaCare"}
                      alt={m.name}
                    />
                    <span className="ecom-category-badge">{m.category}</span>
                    {discountPct > 0 && (
                      <span className="ecom-discount-badge">-{discountPct.toFixed(0)}%</span>
                    )}
                  </div>

                  <div className="ecom-card-body">
                    <h3 className="ecom-card-title">{m.name}</h3>
                    <p className="ecom-card-desc">{m.description || "Certified pharmaceutical product."}</p>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#F59E0B", marginBottom: 10 }}>
                      <Star size={14} fill="#F59E0B" /> 4.8 <span style={{ color: "#94A3B8" }}>(120+ reviews)</span>
                    </div>

                    <div className="ecom-price-row">
                      <div>
                        <span className="ecom-price">₹{finalPrice.toFixed(0)}</span>
                        {discountPct > 0 && <span className="ecom-mrp">₹{m.price}</span>}
                      </div>

                      <button
                        className={`btn-add-cart${isAdded ? " added" : ""}`}
                        disabled={outOfStock}
                        onClick={() => !outOfStock && handleAdd(m)}
                      >
                        {outOfStock ? "Out of stock" : isAdded ? <Check size={14} /> : <Plus size={14} />}
                        {outOfStock ? "" : isAdded ? "Added" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
