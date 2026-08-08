import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  History,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Calendar,
  DollarSign,
  Package,
  ArrowRight,
} from "lucide-react";
import {
  addMedicineStock,
  reduceMedicineStock,
  fetchMedicineStockHistory,
  fetchMedicineCustomers,
  fetchVendors,
} from "../lib/store";
import { generateSingleMedicinePDFReport } from "../lib/pdfGenerator";
import "./StockManagementModal.css";

export default function StockManagementModal({
  medicine,
  onClose,
  onStockUpdated,
  initialTab = "overview", // 'overview' | 'add' | 'reduce' | 'history' | 'customers'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success");

  // Stock History & Customer usage data
  const [history, setHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Form States
  const [addForm, setAddForm] = useState({
    quantity: "",
    reason: "Supplier Delivery",
    supplierId: "",
    purchaseCost: "",
    batchNumber: "",
    expiryDate: "",
    adminNote: "",
  });

  const [reduceForm, setReduceForm] = useState({
    quantity: "",
    reason: "Manual Correction",
    note: "",
  });

  const [reduceError, setReduceError] = useState("");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!medicine) return;
    loadHistory();
    loadCustomers();
    loadVendors();
  }, [medicine]);

  const loadHistory = async () => {
    try {
      const data = await fetchMedicineStockHistory(medicine.id);
      if (Array.isArray(data)) setHistory(data);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await fetchMedicineCustomers(medicine.id);
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) {
      console.error("Failed to load customers:", e);
    }
  };

  const loadVendors = async () => {
    try {
      const data = await fetchVendors();
      if (Array.isArray(data)) setVendors(data);
    } catch (e) {}
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(addForm.quantity);
    if (!qty || qty <= 0) {
      showToast("Please enter a valid stock quantity to add", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await addMedicineStock(medicine.id, {
        quantity: qty,
        reason: addForm.reason,
        supplierId: addForm.supplierId,
        purchaseCost: addForm.purchaseCost,
        batchNumber: addForm.batchNumber,
        expiryDate: addForm.expiryDate,
        adminNote: addForm.adminNote,
      });

      const newStock = res.result?.newStock ?? (medicine.stock + qty);
      showToast(`${qty} units added successfully. Previous: ${res.result?.previousStock ?? medicine.stock} → New: ${newStock}`);
      
      if (onStockUpdated) onStockUpdated(medicine.id, newStock);
      loadHistory();
      setAddForm({ quantity: "", reason: "Supplier Delivery", supplierId: "", purchaseCost: "", batchNumber: "", expiryDate: "", adminNote: "" });
      setActiveTab("overview");
    } catch (err) {
      showToast(err.message || "Failed to add stock", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleReduceQuantityChange = (val) => {
    setReduceForm({ ...reduceForm, quantity: val });
    const num = Number(val);
    if (num > medicine.stock) {
      setReduceError(`Insufficient stock. Only ${medicine.stock} units are available.`);
    } else {
      setReduceError("");
    }
  };

  const handleReduceStockSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(reduceForm.quantity);
    if (!qty || qty <= 0) {
      showToast("Please enter a valid quantity to remove", "warning");
      return;
    }

    if (qty > medicine.stock) {
      setReduceError(`Insufficient stock. Only ${medicine.stock} units are available.`);
      return;
    }

    setLoading(true);
    try {
      const res = await reduceMedicineStock(medicine.id, {
        quantity: qty,
        reason: reduceForm.reason,
        note: reduceForm.note,
      });

      const newStock = res.result?.newStock ?? Math.max(0, medicine.stock - qty);
      showToast(`${qty} units removed successfully. Previous: ${res.result?.previousStock ?? medicine.stock} → New: ${newStock}`);

      if (onStockUpdated) onStockUpdated(medicine.id, newStock);
      loadHistory();
      setReduceForm({ quantity: "", reason: "Manual Correction", note: "" });
      setReduceError("");
      setActiveTab("overview");
    } catch (err) {
      setReduceError(err.message || "Failed to reduce stock");
      showToast(err.message || "Failed to reduce stock", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdfReport = () => {
    generateSingleMedicinePDFReport(medicine, history, customers);
    showToast("PDF Inventory Report generated successfully!");
  };

  if (!medicine) return null;

  const isLowStock = medicine.stock <= (medicine.minimum_stock || 20) && medicine.stock > 0;
  const isOutOfStock = medicine.stock === 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="stock-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Toast Feedback */}
        {toastMessage && (
          <div className={`modal-toast toast-${toastType}`}>
            {toastType === "success" && <CheckCircle2 size={16} />}
            {toastType === "warning" && <AlertTriangle size={16} />}
            {toastType === "danger" && <AlertTriangle size={16} />}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="stock-modal-header">
          <div className="header-left">
            <div className="med-icon-box">💊</div>
            <div>
              <h3 className="modal-med-title">{medicine.name}</h3>
              <p className="modal-med-sub">
                {medicine.strength || "500mg"} · {medicine.category} · {medicine.manufacturer || "PharmaCare Labs"}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="stock-modal-nav">
          <button
            className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Boxes size={15} /> Overview
          </button>
          <button
            className={`nav-tab tab-add ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <Plus size={15} /> Add Stock
          </button>
          <button
            className={`nav-tab tab-reduce ${activeTab === "reduce" ? "active" : ""}`}
            onClick={() => setActiveTab("reduce")}
          >
            <Minus size={15} /> Reduce Stock
          </button>
          <button
            className={`nav-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <History size={15} /> Stock History ({history.length})
          </button>
          <button
            className={`nav-tab ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => setActiveTab("customers")}
          >
            <Users size={15} /> Customers ({customers.length})
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="stock-modal-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="tab-content-overview">
              <div className="stock-summary-card">
                <div className="summary-left">
                  <span className="summary-label">Current Stock Level</span>
                  <div className="summary-stock-value">
                    {medicine.stock} <span className="stock-unit">units</span>
                  </div>
                  <span
                    className={`status-badge ${
                      isOutOfStock ? "badge-red" : isLowStock ? "badge-amber" : "badge-green"
                    }`}
                  >
                    {isOutOfStock ? "🔴 Out of Stock" : isLowStock ? "🟡 Low Stock" : "🟢 In Stock"}
                  </span>
                </div>
                <div className="summary-right">
                  <div className="price-tag">
                    <span className="price-main">₹{medicine.price}</span>
                    <span className="mrp-sub">MRP ₹{medicine.mrp || (medicine.price * 1.15).toFixed(0)}</span>
                  </div>
                  <span className="sold-sub">{medicine.units_sold || 42} sold this month</span>
                </div>
              </div>

              <div className="stock-actions-grid">
                <button className="action-card btn-add-stock" onClick={() => setActiveTab("add")}>
                  <div className="action-icon green">
                    <Plus size={20} />
                  </div>
                  <div className="action-text">
                    <h4>+ Add Stock</h4>
                    <p>Log new purchase, supplier shipment, or return</p>
                  </div>
                </button>

                <button className="action-card btn-reduce-stock" onClick={() => setActiveTab("reduce")}>
                  <div className="action-icon red">
                    <Minus size={20} />
                  </div>
                  <div className="action-text">
                    <h4>− Reduce Stock</h4>
                    <p>Remove damaged, expired, or lost inventory</p>
                  </div>
                </button>

                <button className="action-card btn-view-history" onClick={() => setActiveTab("history")}>
                  <div className="action-icon blue">
                    <History size={20} />
                  </div>
                  <div className="action-text">
                    <h4>View Stock History</h4>
                    <p>Complete audit timeline of all transactions</p>
                  </div>
                </button>

                <button className="action-card btn-pdf-report" onClick={handleGeneratePdfReport}>
                  <div className="action-icon purple">
                    <FileText size={20} />
                  </div>
                  <div className="action-text">
                    <h4>Generate PDF Report</h4>
                    <p>Official medicine audit & consumption report</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ADD STOCK */}
          {activeTab === "add" && (
            <form onSubmit={handleAddStockSubmit} className="stock-form">
              <div className="form-info-header">
                <div>
                  <span className="form-info-label">Medicine</span>
                  <p className="form-info-val">{medicine.name}</p>
                </div>
                <div>
                  <span className="form-info-label">Current Stock</span>
                  <p className="form-info-val highlight">{medicine.stock} units</p>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Quantity to Add *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reason *</label>
                  <select
                    value={addForm.reason}
                    onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}
                  >
                    <option value="Supplier Delivery">Supplier Delivery</option>
                    <option value="New Purchase">New Purchase</option>
                    <option value="Stock Correction">Stock Correction</option>
                    <option value="Return">Return</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Supplier (Optional)</label>
                  <select
                    value={addForm.supplierId}
                    onChange={(e) => setAddForm({ ...addForm, supplierId: e.target.value })}
                  >
                    <option value="">Select Supplier...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.vendorType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 18.50"
                    value={addForm.purchaseCost}
                    onChange={(e) => setAddForm({ ...addForm, purchaseCost: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BATCH-2026-X8"
                    value={addForm.batchNumber}
                    onChange={(e) => setAddForm({ ...addForm, batchNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={addForm.expiryDate}
                    onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Admin Note</label>
                <textarea
                  rows={2}
                  placeholder="Optional admin note or reference invoice number..."
                  value={addForm.adminNote}
                  onChange={(e) => setAddForm({ ...addForm, adminNote: e.target.value })}
                />
              </div>

              <div className="form-footer-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveTab("overview")}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-add" disabled={loading}>
                  {loading ? "Updating..." : "+ Add Stock"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REDUCE STOCK */}
          {activeTab === "reduce" && (
            <form onSubmit={handleReduceStockSubmit} className="stock-form">
              <div className="form-info-header warning-bg">
                <div>
                  <span className="form-info-label">Medicine</span>
                  <p className="form-info-val">{medicine.name}</p>
                </div>
                <div>
                  <span className="form-info-label">Current Stock Available</span>
                  <p className="form-info-val danger-text">{medicine.stock} units</p>
                </div>
              </div>

              {reduceError && (
                <div className="error-alert-banner">
                  <AlertTriangle size={16} />
                  <span>{reduceError}</span>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Quantity to Remove *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={reduceForm.quantity}
                    onChange={(e) => handleReduceQuantityChange(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reason *</label>
                  <select
                    value={reduceForm.reason}
                    onChange={(e) => setReduceForm({ ...reduceForm, reason: e.target.value })}
                  >
                    <option value="Damaged">Damaged</option>
                    <option value="Expired">Expired</option>
                    <option value="Manual Correction">Manual Correction</option>
                    <option value="Lost">Lost</option>
                    <option value="Returned to Supplier">Returned to Supplier</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Admin Explanation / Note</label>
                <textarea
                  rows={2}
                  placeholder="Explain why stock is being reduced..."
                  value={reduceForm.note}
                  onChange={(e) => setReduceForm({ ...reduceForm, note: e.target.value })}
                />
              </div>

              <div className="form-footer-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveTab("overview")}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-reduce"
                  disabled={loading || Boolean(reduceError)}
                >
                  {loading ? "Updating..." : "− Reduce Stock"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: STOCK HISTORY */}
          {activeTab === "history" && (
            <div className="history-tab-content">
              <div className="history-table-wrapper">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>DATE & TIME</th>
                      <th>ACTION</th>
                      <th>QTY</th>
                      <th>PREVIOUS</th>
                      <th>NEW STOCK</th>
                      <th>REASON / REF</th>
                      <th>BY ADMIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No stock transactions logged yet.
                        </td>
                      </tr>
                    ) : (
                      history.map((h) => (
                        <tr key={h.id}>
                          <td className="text-muted text-xs">
                            {new Date(h.created_at).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td>
                            <span className={`type-tag tag-${(h.type || "").toLowerCase()}`}>
                              {h.type}
                            </span>
                          </td>
                          <td className={`font-bold ${h.quantity > 0 ? "text-success" : "text-danger"}`}>
                            {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                          </td>
                          <td className="text-muted">{h.previous_stock}</td>
                          <td className="font-bold">{h.new_stock}</td>
                          <td className="text-xs text-truncate max-w-180">
                            {h.reason || (h.order_id ? `Order #ORD${h.order_id}` : "N/A")}
                          </td>
                          <td className="text-xs text-muted">{h.admin_name || "System"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER USAGE */}
          {activeTab === "customers" && (
            <div className="customers-tab-content">
              <div className="customers-table-wrapper">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>CUSTOMER NAME</th>
                      <th>ORDER ID</th>
                      <th>QTY ORDERED</th>
                      <th>ORDER DATE</th>
                      <th>DELIVERY STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No customer consumption records found for this medicine.
                        </td>
                      </tr>
                    ) : (
                      customers.map((c, idx) => (
                        <tr key={idx}>
                          <td className="font-semibold text-slate">{c.customer_name}</td>
                          <td className="font-mono text-primary font-bold">#ORD{c.order_id}</td>
                          <td className="font-bold text-slate">{c.quantity} units</td>
                          <td className="text-muted text-xs">
                            {new Date(c.order_date).toLocaleDateString("en-IN")}
                          </td>
                          <td>
                            <span
                              className={`status-pill-small ${
                                c.order_status === "Delivered" ? "pill-success" : "pill-warning"
                              }`}
                            >
                              {c.order_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
