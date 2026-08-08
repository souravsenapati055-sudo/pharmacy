import React, { useState, useMemo } from "react";
import { X, FileText, Filter, Printer, Layers, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateMedicineReportPDF } from "../lib/pdfGenerator";
import "./StockManagementModal.css";

export default function InventoryReportFilterModal({
  medicines = [],
  onClose,
}) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockStatusFilter, setStockStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [reportTitle, setReportTitle] = useState("PharmaCare Complete Inventory & Live Stock Audit Report");

  const categories = useMemo(() => {
    const set = new Set();
    medicines.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ["All", ...Array.from(set)];
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    let list = medicines.filter((m) => {
      const matchCat = categoryFilter === "All" || m.category === categoryFilter;
      
      let matchStatus = true;
      const stock = Number(m.stock || 0);
      if (stockStatusFilter === "In Stock") matchStatus = stock >= 20;
      else if (stockStatusFilter === "Low Stock") matchStatus = stock > 0 && stock < 20;
      else if (stockStatusFilter === "Out of Stock") matchStatus = stock === 0;

      return matchCat && matchStatus;
    });

    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "stock-low") {
      list.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    } else if (sortBy === "stock-high") {
      list.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "sold-high") {
      list.sort((a, b) => (b.units_sold || 0) - (a.units_sold || 0));
    }

    return list;
  }, [medicines, categoryFilter, stockStatusFilter, sortBy]);

  const handleExportPDF = (e) => {
    e.preventDefault();
    const filterMeta = {
      category: categoryFilter,
      status: stockStatusFilter,
      count: filteredMedicines.length,
      totalCount: medicines.length,
    };

    generateMedicineReportPDF(filteredMedicines, reportTitle, filterMeta);
    if (onClose) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="stock-modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stock-modal-header" style={{ background: "#f0f9ff" }}>
          <div className="header-left">
            <div className="med-icon-box" style={{ background: "#e0f2fe", color: "#087ea4" }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 className="modal-med-title">All Medicines PDF Report Generator</h3>
              <p className="modal-med-sub">Filter & customize inventory PDF audit report before exporting</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExportPDF} className="stock-modal-body" style={{ gap: 16 }}>
          <div className="form-group">
            <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
              Report Document Title
            </label>
            <input
              type="text"
              className="ai-input-box"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                Category Filter
              </label>
              <select
                className="ai-input-box"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                Stock Status Filter
              </label>
              <select
                className="ai-input-box"
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
              >
                <option value="All">All Stock Statuses</option>
                <option value="In Stock">🟢 In Stock Only (≥20 units)</option>
                <option value="Low Stock">🟡 Low Stock Alert (1-19 units)</option>
                <option value="Out of Stock">🔴 Out of Stock (0 units)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
              Sort Table Order
            </label>
            <select
              className="ai-input-box"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
            >
              <option value="name">Alphabetical (Name A - Z)</option>
              <option value="stock-low">Stock Level (Lowest Stock First)</option>
              <option value="stock-high">Stock Level (Highest Stock First)</option>
              <option value="sold-high">Units Sold (Most Sold First)</option>
              <option value="price-high">Price (Highest Price First)</option>
            </select>
          </div>

          {/* Filter Live Summary Banner */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12.5,
              color: "#334155",
            }}
          >
            <div>
              <strong>{filteredMedicines.length}</strong> of {medicines.length} medicines match active filters.
            </div>
            <span
              style={{
                background: "#087ea4",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 11,
              }}
            >
              Ready to Export
            </span>
          </div>

          {/* Action Footer */}
          <div className="form-footer-actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit-add"
              style={{ background: "#087ea4", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Printer size={15} /> Export Filtered PDF Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
