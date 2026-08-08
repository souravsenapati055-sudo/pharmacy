import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Star,
  Plus,
  Check,
  SlidersHorizontal,
  ShieldCheck,
  X,
  Boxes,
  RefreshCw,
  AlertTriangle,
  PackageCheck,
  TrendingUp,
  Minus,
  FileText,
} from "lucide-react";
import { updateMedicineStock, createMedicine } from "../lib/store";
import MedicineCardItem from "../components/MedicineCardItem";
import StockManagementModal from "../components/StockManagementModal";
import InventoryReportFilterModal from "../components/InventoryReportFilterModal";
import "../customer.css";

export default function Inventory({ medicines = [], setMedicines, addToCart, loading = false }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Stock Management & Report Modal States
  const [stockModalMed, setStockModalMed] = useState(null);
  const [stockModalTab, setStockModalTab] = useState("overview");
  const [showReportFilterModal, setShowReportFilterModal] = useState(false);

  const handleOpenStockModal = (med, tab = "overview") => {
    setStockModalMed(med);
    setStockModalTab(tab);
  };

  const handleStockUpdated = (medId, newStock) => {
    if (setMedicines) {
      setMedicines((prev) =>
        prev.map((m) => (m.id === medId ? { ...m, stock: newStock } : m))
      );
    }
  };

  // Admin Add New Medicine Modal State
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: "",
    category: "General Care",
    price: "",
    discount: "0",
    stock: "100",
    description: "",
    image: "",
  });

  const currentUser = (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch (e) {}
    return null;
  })();

  const isAdmin = currentUser?.role === "admin" || currentUser?.isAdmin === true;

  const safeMedicines = Array.isArray(medicines) ? medicines : [];

  const categories = useMemo(() => {
    const map = new Map();
    safeMedicines.forEach((m) => {
      if (m && m.category) map.set(m.category, (map.get(m.category) || 0) + 1);
    });
    return [
      { name: "All", count: safeMedicines.length },
      ...Array.from(map.entries()).map(([name, count]) => ({ name, count })),
    ];
  }, [safeMedicines]);

  const filtered = useMemo(() => {
    let list = safeMedicines.filter((m) => {
      if (!m) return false;
      const matchesSearch = `${m.name || ""} ${m.category || ""} ${m.description || ""}`.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === "All" || m.category === activeCategory;
      const matchesStock = !inStockOnly || (m.stock || 0) > 0;
      return matchesSearch && matchesCat && matchesStock;
    });

    if (sortOrder === "price-low") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === "price-high") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOrder === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return list;
  }, [safeMedicines, search, activeCategory, sortOrder, inStockOnly]);

  const handleAdd = (m) => {
    if (addToCart) addToCart(m);
    setAddedId(m.id);
    setTimeout(() => setAddedId(null), 900);
  };

  const handleCreateNewMed = async (e) => {
    e.preventDefault();
    if (!newMedForm.name || !newMedForm.price) return;
    try {
      const res = await createMedicine({
        name: newMedForm.name,
        category: newMedForm.category,
        description: newMedForm.description,
        image: newMedForm.image,
        price: Number(newMedForm.price),
        discount: Number(newMedForm.discount || 0),
        stock: Number(newMedForm.stock || 0),
      });

      if (res.medicine && setMedicines) {
        setMedicines((prev) => [res.medicine, ...prev]);
      }
      setShowAddMedModal(false);
      setNewMedForm({ name: "", category: "General Care", price: "", discount: "0", stock: "100", description: "", image: "" });
    } catch (err) {
      alert(err.message || "Failed to add medicine");
    }
  };

  return (
    <div className="customer-page">
      <div className="customer-container">
        {/* Header */}
        <div className="section-header-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="page-title">Pharmacy Medicine Shop</h1>
            <p className="page-subtitle">Search and order genuine pharmaceuticals, medical devices, and health products.</p>
          </div>

          {/* Admin Management Toolbar */}
          {isAdmin && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn-secondary-action"
                style={{ padding: "8px 16px", fontSize: 13, background: "#fefce8", color: "#a16207", border: "1px solid #fef08a" }}
                onClick={() => setShowReportFilterModal(true)}
              >
                <FileText size={16} /> Filter & Export PDF
              </button>
              <button
                className="btn-primary-action"
                style={{ padding: "8px 16px", fontSize: 13, background: "#087EA4" }}
                onClick={() => setShowAddMedModal(true)}
              >
                <Plus size={16} /> Add New Medicine
              </button>
            </div>
          )}

          <button
            className="btn-secondary-action mobile-filter-btn"
            onClick={() => setMobileFilterOpen((p) => !p)}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {/* E-Commerce Shop Layout */}
        <div className="shop-layout-container">
          {/* LEFT SIDEBAR FILTERS (Sticky Desktop) */}
          <aside className="filter-sidebar">
            <div className="filter-group">
              <div className="filter-title">
                <Search size={15} /> Search Products
              </div>
              <input
                className="ai-input-box"
                type="text"
                placeholder="Search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <div className="filter-title">
                <Filter size={15} /> Categories
              </div>
              <div>
                {categories.map((cat) => {
                  const active = cat.name === activeCategory;
                  return (
                    <button
                      key={cat.name}
                      className={`filter-category-btn${active ? " active" : ""}`}
                      onClick={() => setActiveCategory(cat.name)}
                    >
                      <span>{cat.name}</span>
                      <span style={{ fontSize: 11, background: active ? "#087EA4" : "#E2E8F0", color: active ? "#fff" : "#64748B", padding: "2px 6px", borderRadius: 999 }}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-title">Sort & Availability</div>
              <select
                className="ai-input-box"
                style={{ marginBottom: 12 }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="default">Sort by: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                Show In Stock Only
              </label>
            </div>

            <div style={{ background: "#F0FDFA", border: "1px solid #CCFBF1", borderRadius: 8, padding: 12, fontSize: 12, color: "#0F766E", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={16} /> 100% Certified & Verified Stock
            </div>
          </aside>

          {/* RIGHT MEDICINE CATALOG GRID */}
          <main>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
                <strong style={{ color: "#0F172A" }}>{filtered.length}</strong> medicines found
              </div>

              <select
                className="ai-input-box"
                style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="default">Sort by: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            {loading ? (
              <div className="ecom-medicine-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="ecom-card" style={{ height: 280, padding: 16 }}>
                    <div className="skeleton" style={{ height: 140, width: "100%", marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: "90%" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="ecom-medicine-grid">
                {filtered.map((m) => (
                  <MedicineCardItem
                    key={m.id}
                    medicine={m}
                    isAdmin={isAdmin}
                    onOpenStockModal={handleOpenStockModal}
                    onAddToCart={handleAdd}
                    isAdded={addedId === m.id}
                  />
                ))}

                {filtered.length === 0 && (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "64px 24px", background: "#ffffff", borderRadius: 16, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>No medicines found</div>
                    <div style={{ fontSize: 13.5, color: "#64748B" }}>Try adjusting your search keyword or clearing category filters.</div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* STOCK MANAGEMENT MODAL */}
      {stockModalMed && (
        <StockManagementModal
          medicine={stockModalMed}
          initialTab={stockModalTab}
          onClose={() => setStockModalMed(null)}
          onStockUpdated={handleStockUpdated}
        />
      )}

      {/* FILTER & EXPORT INVENTORY PDF MODAL */}
      {showReportFilterModal && (
        <InventoryReportFilterModal
          medicines={medicines}
          onClose={() => setShowReportFilterModal(false)}
        />
      )}

      {/* ADD NEW MEDICINE MODAL */}
      {showAddMedModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Add New Medicine to Catalog</h3>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setShowAddMedModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateNewMed}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Medicine Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol Extra 650mg"
                  value={newMedForm.name}
                  onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                  required
                  className="ai-input-box"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Pain Relief"
                    value={newMedForm.category}
                    onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                    className="ai-input-box"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={newMedForm.price}
                    onChange={(e) => setNewMedForm({ ...newMedForm, price: e.target.value })}
                    required
                    className="ai-input-box"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Discount %</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={newMedForm.discount}
                    onChange={(e) => setNewMedForm({ ...newMedForm, discount: e.target.value })}
                    className="ai-input-box"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Initial Live Stock</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={newMedForm.stock}
                    onChange={(e) => setNewMedForm({ ...newMedForm, stock: e.target.value })}
                    className="ai-input-box"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "block", marginBottom: 4 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Usage instructions & details..."
                  value={newMedForm.description}
                  onChange={(e) => setNewMedForm({ ...newMedForm, description: e.target.value })}
                  className="ai-input-box"
                  style={{ width: "100%", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowAddMedModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-action">Add Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .mobile-filter-btn { display: none; }
        @media (max-width: 1024px) {
          .mobile-filter-btn { display: inline-flex !important; }
          .filter-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function isOutofStock(stock) {
  return stock < 1;
}
