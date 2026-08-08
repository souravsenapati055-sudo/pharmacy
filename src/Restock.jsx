import React, { useEffect, useMemo, useState } from "react";
import "./Restock.css";
import {
  createProcurementOrder,
  fetchProcurementOrders,
  fetchVendors,
} from "./lib/store";

export default function Restock({ medicines = [] }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [restockQuantity, setRestockQuantity] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const lowStockItems = useMemo(
    () =>
      medicines
        .filter((item) => item.stock < 20)
        .map((item) => ({
          ...item,
          currentStock: item.stock,
          minStock: 20,
        })),
    [medicines]
  );

  useEffect(() => {
    const initialQuantities = {};
    lowStockItems.forEach((item) => {
      initialQuantities[item.id] = Math.max(item.minStock - item.currentStock, 1);
    });
    setRestockQuantity(initialQuantities);
  }, [lowStockItems]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [supplierRows, orderRows] = await Promise.all([
          fetchVendors("supplier"),
          fetchProcurementOrders("restock"),
        ]);
        if (!ignore) {
          setSuppliers(supplierRows);
          setRecentOrders(orderRows.slice(0, 5));
        }
      } catch (error) {
        if (!ignore) { setStatusMessage(error.message); setStatusIsError(true); }
      }
    }
    loadData();
    return () => { ignore = true; };
  }, []);

  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const updateQuantity = (itemId, value) => {
    setRestockQuantity((prev) => ({ ...prev, [itemId]: Number(value) || 0 }));
  };

  const calculateTotal = () =>
    selectedItems.reduce((total, itemId) => {
      const item = lowStockItems.find((e) => e.id === itemId);
      return total + (item?.price || 0) * (restockQuantity[itemId] || 0);
    }, 0);

  const placeRestockOrder = async () => {
    if (selectedItems.length === 0) { setStatusMessage("Please select items to restock."); setStatusIsError(true); return; }
    if (!selectedSupplier) { setStatusMessage("Please select a supplier."); setStatusIsError(true); return; }

    setSubmitting(true);
    setStatusMessage("");
    setStatusIsError(false);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await createProcurementOrder({
        vendorId: Number(selectedSupplier),
        vendorType: "supplier",
        source: "restock",
        createdByUserId: currentUser.id || null,
        items: selectedItems.map((itemId) => ({ id: itemId, quantity: restockQuantity[itemId] || 1 })),
      });
      setRecentOrders((prev) => [response.order, ...prev].slice(0, 5));
      setSelectedItems([]);
      setSelectedSupplier("");
      setStatusMessage(response.message || "Restock order placed successfully!");
      setStatusIsError(false);
    } catch (error) {
      setStatusMessage(error.message);
      setStatusIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getStockClass = (stock) => {
    if (stock <= 5) return "stock-critical";
    if (stock <= 12) return "stock-low";
    return "stock-ok";
  };

  const getStockLabel = (stock) => {
    if (stock <= 5) return "Critical";
    if (stock <= 12) return "Low";
    return "Moderate";
  };

  return (
    <div className="restock-page">
      <div className="restock-header">
        <h2>📦 Restock Low Inventory</h2>
        <p>Review live low-stock medicines and place supplier restock orders.</p>
      </div>

      {lowStockItems.length > 0 && (
        <div className="low-stock-banner">
          <span className="low-stock-banner-icon">⚠️</span>
          <span>
            <strong>{lowStockItems.length} medicines</strong> are below the minimum stock threshold (20 units). Select items and place a supplier order.
          </span>
        </div>
      )}

      <div className="restock-grid">
        {/* Left: Medicine List */}
        <div>
          <div className="restock-medicines-list">
            {lowStockItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", background: "#1e293b", borderRadius: 14, color: "#64748b" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8" }}>All medicines are well-stocked!</div>
              </div>
            ) : (
              lowStockItems.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                const quantity = restockQuantity[item.id] || 0;
                const stockPct = Math.min((item.currentStock / item.minStock) * 100, 100);
                const stockClass = getStockClass(item.currentStock);
                const stockLabel = getStockLabel(item.currentStock);

                return (
                  <div
                    key={item.id}
                    className={`medicine-restock-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSelectItem(item.id)}
                  >
                    <div className="med-restock-checkbox">{isSelected ? "✓" : ""}</div>
                    <div className="med-restock-info">
                      <div className="med-restock-name">{item.name}</div>
                      <div className="med-restock-category">{item.category} · Rs {item.price}</div>
                    </div>
                    <div className="stock-level">
                      <span className={`stock-badge ${stockClass}`}>{stockLabel}: {item.currentStock}</span>
                      <div className="stock-bar-track">
                        <div
                          className="stock-bar-fill"
                          style={{
                            width: `${stockPct}%`,
                            background: item.currentStock <= 5 ? "#ef4444" : item.currentStock <= 12 ? "#f59e0b" : "#22c55e",
                          }}
                        />
                      </div>
                    </div>
                    <div className="restock-qty-input" onClick={(e) => e.stopPropagation()}>
                      <label>Qty</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        min="0"
                        max="1000"
                        disabled={!isSelected}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Order Panel */}
        <div className="restock-order-panel">
          <h3>🛒 Order Summary</h3>

          <label style={{ fontSize: 12, color: "#64748b", marginBottom: 6, display: "block" }}>Select Supplier</label>
          <select
            className="supplier-select"
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">Choose a supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.location}</option>
            ))}
          </select>

          {selectedItems.length > 0 && (
            <div className="selected-summary">
              {selectedItems.map((itemId) => {
                const item = lowStockItems.find((e) => e.id === itemId);
                const qty = restockQuantity[itemId] || 0;
                return (
                  <div key={itemId} className="selected-summary-item">
                    <strong>{item?.name}</strong>
                    <span>{qty} units · Rs {((item?.price || 0) * qty).toFixed(0)}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#4ade80" }}>
                <span>Total</span>
                <span>Rs {calculateTotal().toFixed(0)}</span>
              </div>
            </div>
          )}

          <button
            className="restock-submit-btn"
            onClick={placeRestockOrder}
            disabled={selectedItems.length === 0 || !selectedSupplier || submitting}
          >
            {submitting ? "Placing Order…" : `Place Restock Order (${selectedItems.length} items)`}
          </button>

          {statusMessage && (
            <div className={`restock-status ${statusIsError ? "error" : ""}`}>
              {statusIsError ? "⚠️" : "✅"} {statusMessage}
            </div>
          )}

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div className="recent-restock-orders">
              <h3>Recent Orders</h3>
              {recentOrders.map((order) => (
                <div key={order.id} className="restock-order-row">
                  <span className="restock-order-id">#{order.id}</span>
                  <span className="restock-order-vendor">{order.vendor_name}</span>
                  <span className="restock-order-total">Rs {Number(order.total).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
