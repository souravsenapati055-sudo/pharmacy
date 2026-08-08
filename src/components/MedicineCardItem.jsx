import React, { useState, useRef, useEffect } from "react";
import {
  Pill,
  MoreVertical,
  Boxes,
  Users,
  FileText,
  History,
  Check,
  Plus,
  Eye,
  Edit,
} from "lucide-react";
import { generateSingleMedicinePDFReport } from "../lib/pdfGenerator";
import { fetchMedicineStockHistory, fetchMedicineCustomers } from "../lib/store";
import "./MedicineCardItem.css";

export default function MedicineCardItem({
  medicine,
  isAdmin = false,
  onOpenStockModal,
  onAddToCart,
  isAdded = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!medicine) return null;

  const stock = Number(medicine.stock || 0);
  const minStock = Number(medicine.minimum_stock || 20);
  const isOutOfStock = stock < 1;
  const isLowStock = stock > 0 && stock <= minStock;

  const price = Number(medicine.price || 0);
  const discount = Number(medicine.discount_percent || medicine.discount || 0);
  const mrp = Number(medicine.mrp || (price > 0 ? (price * 1.15).toFixed(0) : 0));
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;

  const handleGenerateReportClick = async () => {
    setMenuOpen(false);
    try {
      const [history, customers] = await Promise.all([
        fetchMedicineStockHistory(medicine.id).catch(() => []),
        fetchMedicineCustomers(medicine.id).catch(() => []),
      ]);
      generateSingleMedicinePDFReport(medicine, history, customers);
    } catch (e) {
      generateSingleMedicinePDFReport(medicine, [], []);
    }
  };

  return (
    <div className="redesigned-medicine-card">
      {/* Top Header Row */}
      <div className="card-top-row">
        <div className="title-left">
          <div className="med-pill-icon">
            <Pill size={16} />
          </div>
          <div>
            <h3 className="med-card-name">
              {medicine.name} <span className="med-strength">{medicine.strength || "500mg"}</span>
            </h3>
            <p className="med-card-sub">
              {medicine.category} · <span className="med-mfg">{medicine.manufacturer || "PharmaCare Labs"}</span>
            </p>
          </div>
        </div>

        <div className="top-right-group">
          <span className={`active-badge ${medicine.is_active !== 0 ? "active" : "inactive"}`}>
            {medicine.is_active !== 0 ? "Active" : "Inactive"}
          </span>

          {/* 3-Dot Action Menu */}
          {isAdmin && (
            <div className="menu-container" ref={menuRef}>
              <button
                className="btn-three-dots"
                onClick={() => setMenuOpen((prev) => !prev)}
                title="Medicine Actions"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div className="dropdown-menu card-menu">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenStockModal) onOpenStockModal(medicine, "overview");
                    }}
                  >
                    <Boxes size={14} /> Manage Stock
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenStockModal) onOpenStockModal(medicine, "customers");
                    }}
                  >
                    <Users size={14} /> Customers
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenStockModal) onOpenStockModal(medicine, "history");
                    }}
                  >
                    <History size={14} /> Stock History
                  </button>
                  <button onClick={handleGenerateReportClick}>
                    <FileText size={14} /> Generate PDF Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock Information Section */}
      <div className="card-stock-row">
        <div className="stock-info">
          <span className="stock-label">Stock</span>
          <div className="stock-count-wrap">
            <span className="stock-number">{stock} units</span>
            <span
              className={`stock-status-dot ${
                isOutOfStock ? "dot-red" : isLowStock ? "dot-amber" : "dot-green"
              }`}
            >
              ● {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
            </span>
          </div>
        </div>
      </div>

      {/* Price & Monthly Sales Section */}
      <div className="card-price-row">
        <div className="price-group">
          <span className="selling-price">₹{finalPrice.toFixed(0)}</span>
          {mrp > price && <span className="mrp-price">MRP ₹{mrp}</span>}
        </div>
        <span className="units-sold-tag">{medicine.units_sold || 42} sold this month</span>
      </div>

      {/* Action System Bar */}
      <div className="card-action-footer">
        {isAdmin ? (
          <div className="admin-pill-actions">
            <button
              className="action-pill pill-stock"
              onClick={() => onOpenStockModal && onOpenStockModal(medicine, "overview")}
            >
              <Boxes size={13} /> Stock
            </button>
            <button
              className="action-pill pill-customers"
              onClick={() => onOpenStockModal && onOpenStockModal(medicine, "customers")}
            >
              <Users size={13} /> Customers
            </button>
            <button className="action-pill pill-report" onClick={handleGenerateReportClick}>
              <FileText size={13} /> Report
            </button>
          </div>
        ) : (
          <button
            className={`btn-customer-add ${isAdded ? "added" : ""}`}
            disabled={isOutOfStock}
            onClick={() => !isOutOfStock && onAddToCart && onAddToCart(medicine)}
          >
            {isOutOfStock ? (
              "Out of Stock"
            ) : isAdded ? (
              <>
                <Check size={14} /> Added to Cart
              </>
            ) : (
              <>
                <Plus size={14} /> Add to Cart
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
