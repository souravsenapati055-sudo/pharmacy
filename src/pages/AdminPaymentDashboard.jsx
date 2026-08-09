import React, { useEffect, useState, useMemo } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
  Eye,
  FileText,
  Smartphone,
  Building2,
  Wallet,
  Coins,
  Calendar,
  X,
  ChevronDown
} from "lucide-react";
import { fetchAdminPayments, processRefund } from "../lib/store";
import InvoiceModal from "../components/InvoiceModal";
import "./AdminCustomers.css"; // Reuse table and card container styles

export default function AdminPaymentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Refund Modal State
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState(null);
  const [refundType, setRefundType] = useState("full"); // 'full' | 'partial'
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Customer requested cancellation");
  const [refunding, setRefunding] = useState(false);

  // View Details & Invoice Modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [detailsModalPayment, setDetailsModalPayment] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminPayments();
      setData(res);
    } catch (err) {
      console.error("Failed to load admin payments:", err);
      setError(err.message || "Failed to load payment dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const overview = data?.overview || {
    todayRevenue: 0,
    thisWeekRevenue: 0,
    thisMonthRevenue: 0,
    totalRevenue: 0,
    onlineRevenue: 0,
    codRevenue: 0,
    upiRevenue: 0,
    cardRevenue: 0,
    netbankingRevenue: 0,
    walletRevenue: 0,
    pendingPaymentsCount: 0,
    failedPaymentsCount: 0,
    totalRefundedAmount: 0,
  };

  const paymentsList = data?.payments || [];

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return paymentsList.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        String(p.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.orderId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.customerEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.gatewayPaymentId || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod = methodFilter === "all" || p.paymentMethod === methodFilter;
      const matchesStatus = statusFilter === "all" || p.paymentStatus === statusFilter;

      let matchesDate = true;
      if (dateRange !== "all" && p.createdAt) {
        const pDate = new Date(p.createdAt);
        const now = new Date();
        if (dateRange === "today") {
          matchesDate = pDate.toDateString() === now.toDateString();
        } else if (dateRange === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = pDate >= weekAgo;
        } else if (dateRange === "month") {
          matchesDate = pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesMethod && matchesStatus && matchesDate;
    });
  }, [paymentsList, searchTerm, methodFilter, statusFilter, dateRange]);

  // Export CSV Spreadsheet
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;
    const headers = [
      "Payment ID",
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Amount (INR)",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Gateway Txn ID",
      "Refund Status",
      "Date Time",
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      p.orderId,
      `"${p.customerName}"`,
      `"${p.customerEmail}"`,
      p.amount,
      p.paymentMethod,
      p.paymentStatus,
      p.orderStatus,
      p.gatewayPaymentId,
      p.refundStatus,
      `"${new Date(p.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pharmacare_payments_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Gateway Refund
  const handleExecuteRefund = async (e) => {
    e.preventDefault();
    if (!selectedPaymentForRefund) return;
    setRefunding(true);
    setStatusMsg("");
    setError("");

    try {
      const refundAmt = refundType === "full" ? selectedPaymentForRefund.amount : Number(customRefundAmount);
      if (!refundAmt || refundAmt <= 0) {
        throw new Error("Please enter a valid refund amount.");
      }

      const res = await processRefund({
        paymentId: selectedPaymentForRefund.id,
        orderId: selectedPaymentForRefund.orderId,
        gatewayPaymentId: selectedPaymentForRefund.gatewayPaymentId,
        amount: refundAmt,
        reason: refundReason,
      });

      setStatusMsg(res.message || "Refund executed successfully!");
      setSelectedPaymentForRefund(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to process refund.");
    } finally {
      setRefunding(false);
    }
  };

  const getMethodBadge = (method) => {
    const m = String(method || "").toLowerCase();
    if (m === "upi") return <span className="badge badge-info" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Smartphone size={12} /> UPI</span>;
    if (m === "card") return <span className="badge badge-primary" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CreditCard size={12} /> Card</span>;
    if (m === "netbanking") return <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Building2 size={12} /> Net Banking</span>;
    if (m === "wallet") return <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Wallet size={12} /> Wallet</span>;
    return <span className="badge badge-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Coins size={12} /> COD</span>;
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "paid") return <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> Paid</span>;
    if (s === "pending" || s === "created") return <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} /> Pending</span>;
    if (s === "failed") return <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={12} /> Failed</span>;
    if (s === "refunded" || s === "partially_refunded") return <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><RotateCcw size={12} /> Refunded</span>;
    return <span className="badge badge-secondary">{status}</span>;
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <CreditCard size={28} color="#087EA4" /> Financial & Payment Gateway Dashboard
          </h1>
          <p style={{ fontSize: 13.5, color: "#64748B", margin: "4px 0 0" }}>
            Real-time Razorpay revenue monitoring, transaction logs, refunds & security controls
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={loadData}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#334155" }}
          >
            <RefreshCw size={15} /> Refresh Data
          </button>
          <button
            onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#087EA4", color: "#FFFFFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: "#DCFCE7", color: "#166534", padding: "12px 16px", borderRadius: 10, marginBottom: 20, border: "1px solid #BBF7D0", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} /> {statusMsg}
        </div>
      )}
      {error && (
        <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px 16px", borderRadius: 10, marginBottom: 20, border: "1px solid #FCA5A5", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* KPI Financial Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", fontSize: 12, fontWeight: 700 }}>
            <span>TODAY'S REVENUE</span>
            <DollarSign size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>₹{overview.todayRevenue.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 11.5, color: "#10B981", marginTop: 4, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
            <TrendingUp size={14} /> Today's Live Sales
          </div>
        </div>

        <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", fontSize: 12, fontWeight: 700 }}>
            <span>THIS MONTH REVENUE</span>
            <TrendingUp size={18} color="#087EA4" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>₹{overview.thisMonthRevenue.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>Weekly: ₹{overview.thisWeekRevenue.toLocaleString("en-IN")}</div>
        </div>

        <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", fontSize: 12, fontWeight: 700 }}>
            <span>TOTAL REVENUE</span>
            <ShieldCheck size={18} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>₹{overview.totalRevenue.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 11.5, color: "#475569", marginTop: 4 }}>Online: ₹{overview.onlineRevenue} | COD: ₹{overview.codRevenue}</div>
        </div>

        <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", fontSize: 12, fontWeight: 700 }}>
            <span>REFUNDED AMOUNT</span>
            <RotateCcw size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#B45309", marginTop: 8 }}>₹{overview.totalRefundedAmount.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>Gateway Processed Refunds</div>
        </div>
      </div>

      {/* Payment Method Distribution Breakdown */}
      <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 14, border: "1px solid #E2E8F0", marginBottom: 24, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 16px 0" }}>Revenue by Payment Channel</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{ background: "#F0F9FF", padding: 14, borderRadius: 10, border: "1px solid #BAE6FD" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#0369A1" }}>UPI Instant Pay</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>₹{overview.upiRevenue.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ background: "#F5F3FF", padding: 14, borderRadius: 10, border: "1px solid #DDD6FE" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#6D28D9" }}>Cards (Debit/Credit)</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>₹{overview.cardRevenue.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ background: "#ECFDF5", padding: 14, borderRadius: 10, border: "1px solid #A7F3D0" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#047857" }}>Net Banking</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>₹{overview.netbankingRevenue.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ background: "#FEF3C7", padding: 14, borderRadius: 10, border: "1px solid #FDE68A" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#B45309" }}>Digital Wallets</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>₹{overview.walletRevenue.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Cash on Delivery</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>₹{overview.codRevenue.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 14, border: "1px solid #E2E8F0", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search by Payment ID, Order #, Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box", outline: "none" }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5, fontWeight: 600, color: "#334155", background: "#FFFFFF" }}
          >
            <option value="all">All Payment Methods</option>
            <option value="upi">UPI</option>
            <option value="card">Credit / Debit Card</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
            <option value="cod">Cash on Delivery (COD)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5, fontWeight: 600, color: "#334155", background: "#FFFFFF" }}
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5, fontWeight: 600, color: "#334155", background: "#FFFFFF" }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 11.5, fontWeight: 800, textTransform: "uppercase" }}>
                <th style={{ padding: "14px 16px" }}>Payment / Txn ID</th>
                <th style={{ padding: "14px 16px" }}>Order ID</th>
                <th style={{ padding: "14px 16px" }}>Customer</th>
                <th style={{ padding: "14px 16px" }}>Amount</th>
                <th style={{ padding: "14px 16px" }}>Method</th>
                <th style={{ padding: "14px 16px" }}>Payment Status</th>
                <th style={{ padding: "14px 16px" }}>Date & Time</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: 32, textAlign: "center", color: "#64748B" }}>
                    Loading payment records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: 32, textAlign: "center", color: "#94A3B8" }}>
                    No payment records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, fontFamily: "monospace", color: "#0F172A" }}>
                      {p.gatewayPaymentId || `PAY-${p.id}`}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#087EA4" }}>
                      #{p.orderId}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0F172A" }}>{p.customerName}</div>
                      <div style={{ fontSize: 11.5, color: "#64748B" }}>{p.customerEmail}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 900, color: "#0F172A" }}>
                      ₹{Number(p.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {getMethodBadge(p.paymentMethod)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {getStatusBadge(p.paymentStatus)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748B" }}>
                      {new Date(p.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button
                          onClick={() => setSelectedInvoiceOrder({ orderId: p.orderId, id: p.orderId, items: [], total: p.amount, paymentMethod: p.paymentMethod, paymentStatus: p.paymentStatus, address: { name: p.customerName } })}
                          style={{ padding: "6px 10px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#334155", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                          title="View Receipt"
                        >
                          <FileText size={14} /> Receipt
                        </button>
                        {p.paymentStatus === "paid" && p.refundStatus !== "completed" && (
                          <button
                            onClick={() => {
                              setSelectedPaymentForRefund(p);
                              setRefundType("full");
                              setCustomRefundAmount(p.amount);
                            }}
                            style={{ padding: "6px 10px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#B91C1C", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <RotateCcw size={14} /> Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {selectedPaymentForRefund && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <RotateCcw size={20} color="#B91C1C" /> Initiate Gateway Refund
              </h3>
              <button onClick={() => setSelectedPaymentForRefund(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleExecuteRefund}>
              <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12.5, color: "#475569" }}>
                <div><strong>Payment ID:</strong> {selectedPaymentForRefund.gatewayPaymentId}</div>
                <div><strong>Order ID:</strong> #{selectedPaymentForRefund.orderId}</div>
                <div><strong>Original Amount:</strong> ₹{selectedPaymentForRefund.amount}</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>Refund Type</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setRefundType("full")}
                    style={{ flex: 1, padding: "8px", borderRadius: 8, border: refundType === "full" ? "2px solid #087EA4" : "1px solid #CBD5E1", background: refundType === "full" ? "#F0F9FF" : "#FFFFFF", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    Full Refund (₹{selectedPaymentForRefund.amount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundType("partial")}
                    style={{ flex: 1, padding: "8px", borderRadius: 8, border: refundType === "partial" ? "2px solid #087EA4" : "1px solid #CBD5E1", background: refundType === "partial" ? "#F0F9FF" : "#FFFFFF", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    Partial Amount
                  </button>
                </div>
              </div>

              {refundType === "partial" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>Custom Refund Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedPaymentForRefund.amount}
                    value={customRefundAmount}
                    onChange={(e) => setCustomRefundAmount(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, fontWeight: 700, boxSizing: "border-box" }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>Reason for Refund</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Out of stock / Unavailable">Out of stock / Unavailable</option>
                  <option value="Damaged or expired medicine returned">Damaged or expired medicine returned</option>
                  <option value="Duplicate payment resolution">Duplicate payment resolution</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForRefund(null)}
                  style={{ flex: 1, padding: "11px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 8, fontWeight: 700, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refunding}
                  style={{ flex: 1, padding: "11px", background: "#B91C1C", color: "#FFFFFF", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
                >
                  {refunding ? "Processing Refund..." : "Execute Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}

    </div>
  );
}
