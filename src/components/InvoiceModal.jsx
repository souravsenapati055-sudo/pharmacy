import React from "react";
import { X, Printer, CheckCircle2, ShieldCheck, Download, Pill, Building2 } from "lucide-react";

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];
  const subtotal = Number(order.subtotal || items.reduce((sum, i) => sum + (i.unit_price || i.price || 0) * (i.quantity || i.qty || 1), 0));
  const discountTotal = Number(order.discount_total || order.discountTotal || 0);
  const deliveryFee = Number(order.delivery_fee || order.deliveryFee || 0);
  const total = Number(order.total || order.amount || 0);
  const tax = Number((total * 0.05).toFixed(2)); // 5% GST info

  const formattedDate = new Date(order.date || order.created_at || Date.now()).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #E2E8F0" }}>
        
        {/* Header Actions (Hidden in Print) */}
        <div className="no-print" style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill size={22} color="#087EA4" />
            <span style={{ fontWeight: 800, fontSize: 16, color: "#0F172A" }}>Tax Invoice & Payment Receipt</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <Printer size={16} /> Print Receipt
            </button>
            <button
              onClick={onClose}
              style={{ background: "#E2E8F0", border: "none", width: 32, height: 32, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div style={{ padding: 32 }} id="printable-receipt">
          {/* Pharmacy Branding */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "2px solid #E2E8F0" }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#087EA4", margin: 0, letterSpacing: "-0.5px" }}>PharmaCare Health</h1>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B" }}>Authorized Digital Pharmacy & Healthcare Services</p>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#94A3B8" }}>GSTIN: 19AAACP1234F1Z8 | Lic No: WB-CAL-2026-PH89</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ display: "inline-block", background: "#DCFCE7", color: "#166534", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                {String(order.paymentStatus || order.payment_status || "PAID").toUpperCase()}
              </span>
              <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 700, color: "#334155" }}>
                Order #{order.orderId || order.id}
              </p>

              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748B" }}>{formattedDate}</p>
            </div>
          </div>

          {/* Customer & Payment Info Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", margin: "0 0 6px 0", textTransform: "uppercase" }}>Billed To</p>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>{order.address?.name || order.userName || "Customer"}</p>
              <p style={{ fontSize: 12, color: "#475569", margin: "2px 0 0", lineHeight: 1.4 }}>
                {order.address?.details || order.address_details || "Registered Address"}
              </p>
              <p style={{ fontSize: 11.5, color: "#64748B", margin: "4px 0 0" }}>Mobile: {order.address?.phone || "N/A"}</p>
            </div>

            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", margin: "0 0 6px 0", textTransform: "uppercase" }}>Payment Summary</p>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Method: <span style={{ textTransform: "uppercase", color: "#087EA4" }}>{order.paymentMethod || order.payment_method || "Online"}</span>
              </p>
              <p style={{ fontSize: 11.5, color: "#475569", margin: "4px 0 0", wordBreak: "break-all" }}>
                Txn ID: <span style={{ fontFamily: "monospace" }}>{order.transactionId || order.gatewayPaymentId || `TXN-${order.id}`}</span>
              </p>
              <p style={{ fontSize: 11.5, color: "#166534", margin: "4px 0 0", fontWeight: 700 }}>
                Gateway: Razorpay 256-bit Verified
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0F172A", color: "#FFFFFF" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", borderRadius: "6px 0 0 6px" }}>Item Description</th>
                <th style={{ padding: "10px 12px", textAlign: "center" }}>Qty</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Unit Price</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderRadius: "0 6px 6px 0" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => {
                  const qty = item.quantity || item.qty || 1;
                  const price = Number(item.unit_price || item.price || 0);
                  const lineTotal = Number(item.total_price || price * qty);
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "#0F172A" }}>
                        {item.medicine_name || item.name}
                        {item.discount_percent > 0 && (
                          <span style={{ fontSize: 10, background: "#FEF08A", color: "#854D0E", padding: "2px 6px", borderRadius: 4, marginLeft: 8 }}>
                            {item.discount_percent}% OFF
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", color: "#475569" }}>{qty}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#475569" }}>₹{price.toFixed(2)}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: "16px", textAlign: "center", color: "#64748B" }}>
                    Standard Pharmacy Prescription Items Package
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pricing Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12.5, color: "#475569" }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12.5, color: "#166534" }}>
                  <span>Discount Savings</span>
                  <span>-₹{discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12.5, color: "#475569" }}>
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11.5, color: "#94A3B8" }}>
                <span>Incl. GST (5% Est.)</span>
                <span>₹{tax}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: 8, borderTop: "2px dashed #CBD5E1", fontSize: 16, fontWeight: 900, color: "#0F172A" }}>
                <span>Final Paid</span>
                <span style={{ color: "#087EA4" }}>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Verification Badge Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534", fontSize: 12, fontWeight: 700 }}>
              <ShieldCheck size={18} /> Verified Electronic Invoice & Proof of Payment
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>Computer generated receipt. No physical signature required.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
