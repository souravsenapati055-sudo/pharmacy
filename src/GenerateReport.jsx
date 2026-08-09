import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Truck,
  CreditCard,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Printer,
  SlidersHorizontal,
  Layers,
  PieChart as PieChartIcon,
  BarChart3,
  Check,
  X,
  Building2,
  Clock,
  Receipt,
  ShieldCheck,
  Package,
  Percent,
  Sparkles,
  ChevronDown,
  FileSpreadsheet,
  Eye,
  RotateCcw,
  ArrowRight,
  BadgeAlert,
  Wallet,
  Coins,
  MapPin,
  FileCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import "./GenerateReport.css";
import { fetchAdminReport } from "./lib/store";
import { generateMedicineReportPDF } from "./lib/pdfGenerator";

export default function GenerateReport() {
  // Global Filters State
  const [dateRange, setDateRange] = useState("this_month");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [reportType, setReportType] = useState("financial");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Custom Generator State
  const [genReportType, setGenReportType] = useState("sales");
  const [genDateRange, setGenDateRange] = useState("this_month");
  const [genBranch, setGenBranch] = useState("all");
  const [genPaymentMethod, setGenPaymentMethod] = useState("all");
  const [genOrderStatus, setGenOrderStatus] = useState("all");
  const [genDeliveryStatus, setGenDeliveryStatus] = useState("all");
  const [genFormat, setGenFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportPreviewData, setReportPreviewData] = useState(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState("overview"); // overview, analytics, payments, delivery, cod, profit, generator, transactions

  // Chart Toggle State
  const [analyticsInterval, setAnalyticsInterval] = useState("monthly"); // daily, weekly, monthly

  // Table Search & Pagination
  const [txnSearch, setTxnSearch] = useState("");
  const [txnStatusFilter, setTxnStatusFilter] = useState("all");
  const [txnPage, setTxnPage] = useState(1);

  // Modal State for COD details
  const [showCodModal, setShowCodModal] = useState(false);

  // Initial Load of Custom Report Preview Data
  useEffect(() => {
    loadPreviewData();
  }, []);

  const loadPreviewData = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchAdminReport({
        reportType: genReportType,
        dateRange: genDateRange,
        startDate: customStartDate,
        endDate: customEndDate,
        format: genFormat,
      });
      setReportPreviewData(data);
    } catch (err) {
      console.error("Failed to load preview data", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Preset Data for Dashboard Visualizations
  const kpiData = [
    {
      id: "sales",
      title: "TOTAL SALES",
      value: "₹12,84,590",
      change: "+12.8%",
      isPositive: true,
      period: "vs previous period",
      icon: DollarSign,
      color: "#087ea4",
      bgColor: "#e0f2fe"
    },
    {
      id: "orders",
      title: "TOTAL ORDERS",
      value: "1,284",
      change: "+8.4%",
      isPositive: true,
      period: "vs previous period",
      icon: ShoppingBag,
      color: "#0284c7",
      bgColor: "#e0f2fe"
    },
    {
      id: "delivered",
      title: "DELIVERED ORDERS",
      value: "1,176",
      change: "91.6%",
      isPositive: true,
      period: "delivery success rate",
      icon: CheckCircle2,
      color: "#16a34a",
      bgColor: "#dcfce7"
    },
    {
      id: "profit",
      title: "TOTAL PROFIT",
      value: "₹2,84,320",
      change: "22.1%",
      isPositive: true,
      period: "gross margin",
      icon: TrendingUp,
      color: "#0d9488",
      bgColor: "#ccfbf1"
    },
    {
      id: "cod",
      title: "COD COLLECTED",
      value: "₹4,82,650",
      change: "37.6%",
      isPositive: true,
      period: "of total revenue",
      icon: Coins,
      color: "#d97706",
      bgColor: "#fef3c7"
    },
    {
      id: "online",
      title: "ONLINE PAYMENTS",
      value: "₹6,91,940",
      change: "53.8%",
      isPositive: true,
      period: "of total revenue",
      icon: CreditCard,
      color: "#2563eb",
      bgColor: "#dbeafe"
    },
    {
      id: "pending",
      title: "PENDING PAYMENTS",
      value: "₹38,420",
      change: "42 txns",
      isPositive: false,
      period: "awaiting settlement",
      icon: Clock,
      color: "#ea580c",
      bgColor: "#ffedd5"
    },
    {
      id: "refunds",
      title: "REFUNDS / RETURNS",
      value: "₹24,850",
      change: "18 txns",
      isPositive: false,
      period: "1.9% of total revenue",
      icon: RotateCcw,
      color: "#dc2626",
      bgColor: "#fee2e2"
    }
  ];

  // Revenue & Sales Chart Data
  const monthlyRevenueData = [
    { month: "Jan", revenue: 820000, orders: 850, profit: 180400 },
    { month: "Feb", revenue: 910000, orders: 920, profit: 200200 },
    { month: "Mar", revenue: 1040000, orders: 1050, profit: 228800 },
    { month: "Apr", revenue: 980000, orders: 990, profit: 215600 },
    { month: "May", revenue: 1120000, orders: 1120, profit: 246400 },
    { month: "Jun", revenue: 1210000, orders: 1210, profit: 266200 },
    { month: "Jul", revenue: 1170000, orders: 1160, profit: 257400 },
    { month: "Aug", revenue: 1284590, orders: 1284, profit: 284320 },
    { month: "Sep (Proj)", revenue: 1320000, orders: 1310, profit: 290400 },
    { month: "Oct (Proj)", revenue: 1380000, orders: 1370, profit: 303600 },
    { month: "Nov (Proj)", revenue: 1450000, orders: 1420, profit: 319000 },
    { month: "Dec (Proj)", revenue: 1520000, orders: 1490, profit: 334400 }
  ];

  const weeklyRevenueData = [
    { week: "Week 1", revenue: 290000, orders: 290, profit: 63800 },
    { week: "Week 2", revenue: 315000, orders: 310, profit: 69300 },
    { week: "Week 3", revenue: 334000, orders: 335, profit: 73480 },
    { week: "Week 4", revenue: 345590, orders: 349, profit: 77740 }
  ];

  const dailyRevenueData = [
    { day: "Aug 01", revenue: 38200, orders: 38, profit: 8400 },
    { day: "Aug 02", revenue: 41500, orders: 42, profit: 9130 },
    { day: "Aug 03", revenue: 39800, orders: 40, profit: 8750 },
    { day: "Aug 04", revenue: 52100, orders: 51, profit: 11460 },
    { day: "Aug 05", revenue: 64200, orders: 63, profit: 14120 },
    { day: "Aug 06", revenue: 48900, orders: 47, profit: 10750 },
    { day: "Aug 07", revenue: 55400, orders: 54, profit: 12180 },
    { day: "Aug 08", revenue: 43200, orders: 44, profit: 9500 }
  ];

  const activeAnalyticsData =
    analyticsInterval === "daily"
      ? dailyRevenueData
      : analyticsInterval === "weekly"
      ? weeklyRevenueData
      : monthlyRevenueData;

  // Payment Breakdown Data
  const paymentBreakdownData = [
    { name: "COD", value: 482650, percent: "37.6%", count: 486, color: "#d97706" },
    { name: "UPI", value: 420500, percent: "32.7%", count: 418, color: "#087ea4" },
    { name: "Online Payment", value: 189140, percent: "14.7%", count: 192, color: "#2563eb" },
    { name: "Card", value: 182300, percent: "14.2%", count: 176, color: "#7c3aed" },
    { name: "Cash", value: 10000, percent: "0.8%", count: 12, color: "#16a34a" },
    { name: "Wallet", value: 0, percent: "0.0%", count: 0, color: "#64748b" }
  ];

  // Delivery Status Data
  const deliveryStatusData = [
    { status: "Delivered", count: 1176, percentage: "91.6%", color: "#16a34a" },
    { status: "Out for Delivery", count: 48, percentage: "3.7%", color: "#0284c7" },
    { status: "Pending", count: 32, percentage: "2.5%", color: "#d97706" },
    { status: "Failed", count: 18, percentage: "1.4%", color: "#dc2626" },
    { status: "Cancelled", count: 10, percentage: "0.8%", color: "#64748b" }
  ];

  // Delivery Sample Log
  const sampleDeliveryLog = [
    { id: "#ORD-10284", customer: "Rahul Sharma", partner: "Amit Kumar", amount: "₹1,240", method: "COD", status: "Delivered", time: "32 min", date: "08 Aug 2026" },
    { id: "#ORD-10283", customer: "Priya Patel", partner: "Vikram Singh", amount: "₹850", method: "UPI", status: "Delivered", time: "24 min", date: "08 Aug 2026" },
    { id: "#ORD-10282", customer: "Suresh Gupta", partner: "Amit Kumar", amount: "₹2,410", method: "Online", status: "Out for Delivery", time: "45 min", date: "08 Aug 2026" },
    { id: "#ORD-10281", customer: "Neha Verma", partner: "Rajesh Rao", amount: "₹620", method: "COD", status: "Pending", time: "-", date: "08 Aug 2026" },
    { id: "#ORD-10280", customer: "Anil Kumar", partner: "Vikram Singh", amount: "₹1,590", method: "Card", status: "Failed", time: "55 min", date: "07 Aug 2026" }
  ];

  // COD Reconciliation Table Data
  const codReconciliationData = [
    { id: "#ORD-10284", date: "08 Aug 2026", customer: "Rahul Sharma", expected: "₹1,240", collected: "₹1,240", diff: "₹0", status: "Settled" },
    { id: "#ORD-10279", date: "08 Aug 2026", customer: "Deepak Joshi", expected: "₹980", collected: "₹980", diff: "₹0", status: "Settled" },
    { id: "#ORD-10275", date: "07 Aug 2026", customer: "Meena Swamy", expected: "₹1,450", collected: "₹1,200", diff: "-₹250", status: "Partial" },
    { id: "#ORD-10270", date: "07 Aug 2026", customer: "Karan Johar", expected: "₹3,100", collected: "₹0", diff: "-₹3,100", status: "Pending" },
    { id: "#ORD-10266", date: "06 Aug 2026", customer: "Sunita Roy", expected: "₹820", collected: "₹850", diff: "+₹30", status: "Mismatch" }
  ];

  // Monthly Financial Summary Data
  const monthlySummaryData = [
    { month: "August 2026", orders: "1,284", revenue: "₹12,84,590", cogs: "₹9,76,240", grossProfit: "₹3,08,350", refunds: "₹24,850", netRevenue: "₹12,59,740", margin: "22.7%", trend: "up" },
    { month: "July 2026", orders: "1,176", revenue: "₹11,42,800", cogs: "₹8,71,200", grossProfit: "₹2,71,600", refunds: "₹18,200", netRevenue: "₹11,24,600", margin: "22.3%", trend: "up" },
    { month: "June 2026", orders: "1,210", revenue: "₹12,10,000", cogs: "₹9,25,000", grossProfit: "₹2,85,000", refunds: "₹21,400", netRevenue: "₹11,88,600", margin: "22.1%", trend: "up" },
    { month: "May 2026", orders: "1,120", revenue: "₹11,20,000", cogs: "₹8,58,000", grossProfit: "₹2,62,000", refunds: "₹15,800", netRevenue: "₹11,04,200", margin: "22.0%", trend: "up" },
    { month: "April 2026", orders: "990", revenue: "₹9,80,000", cogs: "₹7,52,000", grossProfit: "₹2,28,000", refunds: "₹14,200", netRevenue: "₹9,65,800", margin: "21.8%", trend: "down" },
    { month: "March 2026", orders: "1,050", revenue: "₹10,40,000", cogs: "₹7,98,000", grossProfit: "₹2,42,000", refunds: "₹16,500", netRevenue: "₹10,23,500", margin: "22.0%", trend: "up" }
  ];

  // Top Performing Products Data
  const topProductsData = [
    { rank: 1, name: "Paracetamol 500mg Tablet", category: "Analgesic", units: "4,250", revenue: "₹1,27,500", profit: "₹38,250", margin: "30.0%" },
    { rank: 2, name: "Azithromycin 500mg Strip", category: "Antibiotic", units: "1,820", revenue: "₹2,18,400", profit: "₹54,600", margin: "25.0%" },
    { rank: 3, name: "Vitamin D3 60K Capsules", category: "Supplement", units: "2,100", revenue: "₹1,89,000", profit: "₹56,700", margin: "30.0%" },
    { rank: 4, name: "Pantoprazole 40mg Tablet", category: "Gastroenterology", units: "3,150", revenue: "₹1,57,500", profit: "₹42,525", margin: "27.0%" },
    { rank: 5, name: "Cetirizine 10mg Box", category: "Antihistamine", units: "3,800", revenue: "₹95,000", profit: "₹28,500", margin: "30.0%" }
  ];

  // Branch Performance Data
  const branchPerformanceData = [
    { name: "Main Branch (MG Road)", orders: "1,284", revenue: "₹12,84,590", delivered: "91.6%", cod: "₹4,82,650", online: "₹6,91,940", profit: "₹2,84,320", margin: "22.1%" },
    { name: "Downtown Branch", orders: "840", revenue: "₹8,42,100", delivered: "94.2%", cod: "₹2,90,100", online: "₹5,10,400", profit: "₹1,93,680", margin: "23.0%" },
    { name: "Suburban Health Hub", orders: "620", revenue: "₹6,15,400", delivered: "89.5%", cod: "₹2,45,000", online: "₹3,50,400", profit: "₹1,35,380", margin: "22.0%" }
  ];

  // Refund Log Data
  const refundLogData = [
    { id: "#ORD-10260", customer: "Anita Desai", reason: "Damaged packaging", orderAmt: "₹1,450", refundAmt: "₹1,450", method: "UPI", status: "Completed", date: "07 Aug 2026" },
    { id: "#ORD-10255", customer: "Rajiv Malhotra", reason: "Expired item sent", orderAmt: "₹2,200", refundAmt: "₹2,200", method: "Card", status: "Completed", date: "06 Aug 2026" },
    { id: "#ORD-10249", customer: "Pooja Bhatia", reason: "Order cancelled by user", orderAmt: "₹890", refundAmt: "₹890", method: "Online", status: "Pending", date: "05 Aug 2026" },
    { id: "#ORD-10242", customer: "Vikash Jain", reason: "Wrong medicine delivered", orderAmt: "₹3,150", refundAmt: "₹3,150", method: "COD", status: "Completed", date: "04 Aug 2026" }
  ];

  // Recent Financial Transactions Table Data
  const recentTransactionsData = [
    { txnId: "TXN-89234", orderId: "ORD-10284", customer: "Rahul Sharma", method: "UPI", amount: "₹1,240", type: "Payment", status: "Completed", date: "08 Aug 2026" },
    { txnId: "TXN-89233", orderId: "ORD-10283", customer: "Priya Patel", method: "COD", amount: "₹850", type: "Payment", status: "Completed", date: "08 Aug 2026" },
    { txnId: "TXN-89232", orderId: "ORD-10282", customer: "Suresh Gupta", method: "Card", amount: "₹2,410", type: "Payment", status: "Completed", date: "08 Aug 2026" },
    { txnId: "TXN-89231", orderId: "ORD-10280", customer: "Anil Kumar", method: "Online", amount: "₹1,590", type: "Refund", status: "Refunded", date: "07 Aug 2026" },
    { txnId: "TXN-89230", orderId: "ORD-10279", customer: "Deepak Joshi", method: "COD", amount: "₹980", type: "Payment", status: "Completed", date: "07 Aug 2026" },
    { txnId: "TXN-89229", orderId: "ORD-10278", customer: "Kavita Rao", method: "UPI", amount: "₹3,400", type: "Payment", status: "Pending", date: "07 Aug 2026" },
    { txnId: "TXN-89228", orderId: "ORD-10275", customer: "Meena Swamy", method: "Cash", amount: "₹1,200", type: "Payment", status: "Completed", date: "07 Aug 2026" },
    { txnId: "TXN-89227", orderId: "ORD-10272", customer: "Rohan Kapoor", method: "Card", amount: "₹5,200", type: "Failed", status: "Failed", date: "06 Aug 2026" }
  ];

  // Quick Reports List
  const quickReports = [
    { title: "Sales Report", desc: "Daily sales and revenue analysis", icon: DollarSign, tab: "analytics" },
    { title: "Delivery Report", desc: "Delivery performance & SLAs", icon: Truck, tab: "delivery" },
    { title: "COD Report", desc: "COD collection & reconciliation", icon: Coins, tab: "cod" },
    { title: "Payment Report", desc: "All payment methods breakdown", icon: CreditCard, tab: "payments" },
    { title: "Profit Report", desc: "Revenue, cost & profit margin", icon: TrendingUp, tab: "profit" },
    { title: "Inventory Report", desc: "Stock valuation & movement", icon: Package, tab: "generator" },
    { title: "Refund Report", desc: "Returns & refund audit log", icon: RotateCcw, tab: "overview" },
    { title: "Monthly Report", desc: "Complete monthly summary", icon: Calendar, tab: "overview" }
  ];

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return recentTransactionsData.filter((t) => {
      const matchSearch =
        t.txnId.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.orderId.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.customer.toLowerCase().includes(txnSearch.toLowerCase());
      const matchStatus = txnStatusFilter === "all" || t.status.toLowerCase() === txnStatusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [txnSearch, txnStatusFilter]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Order ID", "Customer", "Payment Method", "Amount", "Type", "Status", "Date"];
    const rows = filteredTransactions.map((t) => [
      t.txnId,
      t.orderId,
      t.customer,
      t.method,
      t.amount.replace(/[^0-9.]/g, ""),
      t.type,
      t.status,
      t.date
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PharmaCare_Financial_Report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Export PDF via Print Helper
  const handleExportPDF = () => {
    generateMedicineReportPDF({
      title: "PharmaCare Financial & Operations Report",
      subtitle: `Date Range: ${dateRange.replace("_", " ").toUpperCase()} | Branch: ${selectedBranch.toUpperCase()}`,
      metrics: [
        { label: "Total Sales", value: "₹12,84,590" },
        { label: "Total Orders", value: "1,284" },
        { label: "Total Profit", value: "₹2,84,320" },
        { label: "COD Collected", value: "₹4,82,650" }
      ],
      rows: filteredTransactions.map(t => ({
        "Txn ID": t.txnId,
        "Order ID": t.orderId,
        "Customer": t.customer,
        "Method": t.method,
        "Amount": t.amount,
        "Status": t.status,
        "Date": t.date
      }))
    });
  };

  return (
    <div className="report-page">
      {/* ===== PAGE HEADER ===== */}
      <div className="report-header-flex">
        <div>
          <div className="badge-category">
            <ShieldCheck size={14} /> Enterprise Operations & Financial Suite
          </div>
          <h1 className="report-page-title">Reports & Financial Overview</h1>
          <p className="report-page-subtitle">
            Monitor revenue, payments, deliveries, profit, and pharmacy operations in one place.
          </p>
        </div>

        <div className="header-actions-group">
          <span className="last-updated-pill">
            <Clock size={13} /> Last updated: Today, 11:45 AM
          </span>
          <button className="btn-secondary" onClick={handleExportCSV}>
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button className="btn-primary" onClick={handleExportPDF}>
            <Download size={16} /> Download PDF Report
          </button>
        </div>
      </div>

      {/* ===== 1. TOP FILTER BAR ===== */}
      <div className="top-filter-bar-card">
        <div className="filter-controls-grid">
          <div className="filter-field">
            <label><Calendar size={13} /> Date Range</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === "custom" && (
            <>
              <div className="filter-field">
                <label>Start Date</label>
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
              </div>
              <div className="filter-field">
                <label>End Date</label>
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
              </div>
            </>
          )}

          <div className="filter-field">
            <label><Building2 size={13} /> Branch</label>
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              <option value="all">All Branches</option>
              <option value="main">Main Branch (MG Road)</option>
              <option value="downtown">Downtown Branch</option>
              <option value="suburban">Suburban Health Hub</option>
            </select>
          </div>

          <div className="filter-field">
            <label><FileText size={13} /> Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="financial">Financial Overview</option>
              <option value="sales">Sales & Orders</option>
              <option value="deliveries">Deliveries & Logistics</option>
              <option value="payments">Payments & Settlements</option>
              <option value="cod">COD Reconciliation</option>
              <option value="profit">Profit & Margins</option>
              <option value="inventory">Inventory Valuation</option>
            </select>
          </div>

          <div className="filter-field">
            <label><CreditCard size={13} /> Payment Method</label>
            <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="cod">COD</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="online">Online Payment</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>

          <div className="filter-field">
            <label><Truck size={13} /> Delivery Status</label>
            <select value={deliveryStatusFilter} onChange={(e) => setDeliveryStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="filter-actions-bar">
          <div className="active-filters-summary">
            <span>Active Filters: </span>
            <span className="filter-tag">{dateRange.replace("_", " ")}</span>
            <span className="filter-tag">{selectedBranch}</span>
            <span className="filter-tag">{reportType}</span>
          </div>

          <div className="filter-btns-group">
            <button className="btn-text-ghost" onClick={() => {
              setDateRange("this_month");
              setSelectedBranch("all");
              setReportType("financial");
              setPaymentMethodFilter("all");
              setDeliveryStatusFilter("all");
            }}>
              <RotateCcw size={14} /> Reset
            </button>
            <button className="btn-filter-apply" onClick={loadPreviewData}>
              <Filter size={14} /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* ===== 2. FINANCIAL KPI CARDS GRID (8 CARDS) ===== */}
      <div className="kpi-cards-grid">
        {kpiData.map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <div key={kpi.id} className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-title">{kpi.title}</span>
                <div className="kpi-icon-wrapper" style={{ backgroundColor: kpi.bgColor, color: kpi.color }}>
                  <IconComp size={18} />
                </div>
              </div>
              <div className="kpi-amount">{kpi.value}</div>
              <div className="kpi-card-bottom">
                <span className={`kpi-badge ${kpi.isPositive ? "positive" : "negative"}`}>
                  {kpi.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {kpi.change}
                </span>
                <span className="kpi-period">{kpi.period}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== TAB SYSTEM NAVIGATION ===== */}
      <div className="dashboard-tabs-nav">
        <button className={`tab-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          <BarChart3 size={15} /> Overview & Analytics
        </button>
        <button className={`tab-btn ${activeTab === "payments" ? "active" : ""}`} onClick={() => setActiveTab("payments")}>
          <CreditCard size={15} /> Payments & COD
        </button>
        <button className={`tab-btn ${activeTab === "delivery" ? "active" : ""}`} onClick={() => setActiveTab("delivery")}>
          <Truck size={15} /> Delivery Performance
        </button>
        <button className={`tab-btn ${activeTab === "profit" ? "active" : ""}`} onClick={() => setActiveTab("profit")}>
          <TrendingUp size={15} /> Profit & Margins
        </button>
        <button className={`tab-btn ${activeTab === "generator" ? "active" : ""}`} onClick={() => setActiveTab("generator")}>
          <SlidersHorizontal size={15} /> Custom Report Generator
        </button>
      </div>

      {/* ===== 3. REVENUE & SALES ANALYTICS SECTION ===== */}
      {(activeTab === "overview" || activeTab === "analytics") && (
        <div className="section-card chart-section-card">
          <div className="card-header-flex">
            <div>
              <h3 className="section-card-title"><AreaChart size={18} /> Revenue & Sales Analytics</h3>
              <p className="section-card-sub">Interactive revenue, order volume, and gross profit breakdown</p>
            </div>

            <div className="interval-toggle-group">
              <button
                className={`toggle-btn ${analyticsInterval === "daily" ? "active" : ""}`}
                onClick={() => setAnalyticsInterval("daily")}
              >
                Daily
              </button>
              <button
                className={`toggle-btn ${analyticsInterval === "weekly" ? "active" : ""}`}
                onClick={() => setAnalyticsInterval("weekly")}
              >
                Weekly
              </button>
              <button
                className={`toggle-btn ${analyticsInterval === "monthly" ? "active" : ""}`}
                onClick={() => setAnalyticsInterval("monthly")}
              >
                Monthly (12M)
              </button>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="chart-quick-metrics-row">
            <div className="metric-box">
              <span className="box-label">Total Revenue</span>
              <span className="box-value">₹12,84,590</span>
              <span className="box-sub green">+12.8% YoY</span>
            </div>
            <div className="metric-box">
              <span className="box-label">Average Order Value</span>
              <span className="box-value">₹1,000.46</span>
              <span className="box-sub">+₹42 vs last month</span>
            </div>
            <div className="metric-box">
              <span className="box-label">Highest Revenue Day</span>
              <span className="box-value">Aug 05 (₹64,200)</span>
              <span className="box-sub">63 orders processed</span>
            </div>
            <div className="metric-box">
              <span className="box-label">Highest Revenue Month</span>
              <span className="box-value">August 2026</span>
              <span className="box-sub">₹12.84L total sales</span>
            </div>
          </div>

          <div style={{ width: "100%", height: 350, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeAnalyticsData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#087ea4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#087ea4" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey={analyticsInterval === "monthly" ? "month" : analyticsInterval === "weekly" ? "week" : "day"} stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value, name) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    name === "revenue" ? "Revenue" : name === "profit" ? "Gross Profit" : "Orders"
                  ]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "10px", borderColor: "#cbd5e1", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#087ea4" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ===== 4. PAYMENT BREAKDOWN & COLLECTION ===== */}
      {(activeTab === "overview" || activeTab === "payments") && (
        <div className="two-column-layout">
          <div className="section-card">
            <div className="card-header-flex">
              <div>
                <h3 className="section-card-title"><PieChartIcon size={18} /> Payment Collection Breakdown</h3>
                <p className="section-card-sub">Distribution of customer payment methods</p>
              </div>
              <span className="badge-neutral">Total: ₹12,84,590</span>
            </div>

            <div className="donut-chart-container">
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="donut-legend-grid">
                {paymentBreakdownData.map((item) => (
                  <div key={item.name} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: item.color }} />
                    <span className="legend-name">{item.name}</span>
                    <span className="legend-val">₹{item.value.toLocaleString("en-IN")}</span>
                    <span className="legend-pct">({item.percent})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section-card">
            <h3 className="section-card-title"><CreditCard size={18} /> Payment Methods Summary</h3>
            <p className="section-card-sub">Transaction volume & collection status by gateway</p>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Transactions</th>
                    <th>Amount</th>
                    <th>Share</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentBreakdownData.map((item) => (
                    <tr key={item.name}>
                      <td className="font-semibold">{item.name}</td>
                      <td>{item.count} txns</td>
                      <td className="font-bold">₹{item.value.toLocaleString("en-IN")}</td>
                      <td>
                        <div className="progress-bar-inline">
                          <div className="progress-fill" style={{ width: item.percent, backgroundColor: item.color }} />
                          <span>{item.percent}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-status success"><Check size={12} /> Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== 5. DELIVERY PERFORMANCE SECTION ===== */}
      {(activeTab === "overview" || activeTab === "delivery") && (
        <div className="section-card">
          <div className="card-header-flex">
            <div>
              <h3 className="section-card-title"><Truck size={18} /> Delivery Performance & Logistics</h3>
              <p className="section-card-sub">Delivery SLAs, status distribution, and courier logistics</p>
            </div>
            <span className="badge-success"><CheckCircle2 size={13} /> 91.6% SLA Compliance</span>
          </div>

          <div className="delivery-kpis-row">
            <div className="delivery-kpi-box">
              <span className="del-label">Total Deliveries</span>
              <span className="del-val">1,284</span>
            </div>
            <div className="delivery-kpi-box text-green">
              <span className="del-label">Delivered</span>
              <span className="del-val">1,176</span>
            </div>
            <div className="delivery-kpi-box text-blue">
              <span className="del-label">Out for Delivery</span>
              <span className="del-val">48</span>
            </div>
            <div className="delivery-kpi-box text-orange">
              <span className="del-label">Pending</span>
              <span className="del-val">32</span>
            </div>
            <div className="delivery-kpi-box text-red">
              <span className="del-label">Failed</span>
              <span className="del-val">18</span>
            </div>
            <div className="delivery-kpi-box text-gray">
              <span className="del-label">Cancelled</span>
              <span className="del-val">10</span>
            </div>
          </div>

          {/* Delivery Progress Bar */}
          <div className="stacked-progress-container">
            <div className="stacked-bar">
              <div className="bar-segment del-delivered" style={{ width: "91.6%" }} title="Delivered: 91.6%" />
              <div className="bar-segment del-out" style={{ width: "3.7%" }} title="Out for Delivery: 3.7%" />
              <div className="bar-segment del-pending" style={{ width: "2.5%" }} title="Pending: 2.5%" />
              <div className="bar-segment del-failed" style={{ width: "1.4%" }} title="Failed: 1.4%" />
              <div className="bar-segment del-cancelled" style={{ width: "0.8%" }} title="Cancelled: 0.8%" />
            </div>

            <div className="stacked-bar-legend">
              <span><i className="bg-delivered" /> Delivered (91.6%)</span>
              <span><i className="bg-out" /> Out for Delivery (3.7%)</span>
              <span><i className="bg-pending" /> Pending (2.5%)</span>
              <span><i className="bg-failed" /> Failed (1.4%)</span>
              <span><i className="bg-cancelled" /> Cancelled (0.8%)</span>
            </div>
          </div>

          {/* Delivery Log Table */}
          <div className="table-header-title">Recent Delivery Dispatch Logs</div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Delivery Partner</th>
                  <th>Order Amount</th>
                  <th>Payment Method</th>
                  <th>Delivery Status</th>
                  <th>Delivery Time</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sampleDeliveryLog.map((log) => (
                  <tr key={log.id}>
                    <td className="font-bold text-primary">{log.id}</td>
                    <td>{log.customer}</td>
                    <td>{log.partner}</td>
                    <td className="font-semibold">{log.amount}</td>
                    <td>{log.method}</td>
                    <td>
                      <span className={`badge-status ${
                        log.status === "Delivered" ? "success" : log.status === "Out for Delivery" ? "info" : log.status === "Pending" ? "warning" : "danger"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td>{log.time}</td>
                    <td>{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== 6. COD RECONCILIATION SECTION ===== */}
      {(activeTab === "overview" || activeTab === "payments" || activeTab === "cod") && (
        <div className="section-card border-left-amber">
          <div className="card-header-flex">
            <div>
              <h3 className="section-card-title"><Coins size={18} /> COD Management & Settlement</h3>
              <p className="section-card-sub">Cash on Delivery collection, driver balance, and bank settlement</p>
            </div>
            <button className="btn-secondary" onClick={() => setShowCodModal(true)}>
              <Eye size={14} /> View All COD Transactions
            </button>
          </div>

          <div className="cod-summary-grid">
            <div className="cod-metric-card">
              <span className="cod-metric-title">COD Orders</span>
              <span className="cod-metric-val">486</span>
              <span className="cod-metric-sub">37.8% of total orders</span>
            </div>
            <div className="cod-metric-card">
              <span className="cod-metric-title">COD Expected</span>
              <span className="cod-metric-val">₹5,12,400</span>
              <span className="cod-metric-sub">Total dispatched COD</span>
            </div>
            <div className="cod-metric-card highlight-green">
              <span className="cod-metric-title">COD Collected</span>
              <span className="cod-metric-val">₹4,82,650</span>
              <span className="cod-metric-sub">Handed in by partners</span>
            </div>
            <div className="cod-metric-card highlight-amber">
              <span className="cod-metric-title">COD Pending</span>
              <span className="cod-metric-val">₹29,750</span>
              <span className="cod-metric-sub">In-transit with drivers</span>
            </div>
            <div className="cod-metric-card highlight-blue">
              <span className="cod-metric-title">COD Settled to Bank</span>
              <span className="cod-metric-val">₹4,61,800</span>
              <span className="cod-metric-sub">Verified & deposited</span>
            </div>
          </div>

          <div className="table-header-title">COD Reconciliation Audit Table</div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Delivery Date</th>
                  <th>Customer</th>
                  <th>Expected COD</th>
                  <th>Collected Amount</th>
                  <th>Difference</th>
                  <th>Settlement Status</th>
                </tr>
              </thead>
              <tbody>
                {codReconciliationData.map((row) => (
                  <tr key={row.id}>
                    <td className="font-bold text-primary">{row.id}</td>
                    <td>{row.date}</td>
                    <td>{row.customer}</td>
                    <td className="font-semibold">{row.expected}</td>
                    <td className="font-bold">{row.collected}</td>
                    <td className={`font-semibold ${row.diff.startsWith("-") ? "text-red" : row.diff.startsWith("+") ? "text-blue" : ""}`}>
                      {row.diff}
                    </td>
                    <td>
                      <span className={`badge-status ${
                        row.status === "Settled" ? "success" : row.status === "Pending" ? "warning" : row.status === "Partial" ? "info" : "danger"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== 7. MONTHLY FINANCIAL SUMMARY ===== */}
      {(activeTab === "overview" || activeTab === "profit") && (
        <div className="section-card">
          <div className="card-header-flex">
            <div>
              <h3 className="section-card-title"><Calendar size={18} /> Monthly Financial Performance</h3>
              <p className="section-card-sub">Month-by-month breakdown of revenue, COGS, profit, and margins</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Orders</th>
                  <th>Gross Revenue</th>
                  <th>COGS (Cost)</th>
                  <th>Gross Profit</th>
                  <th>Refunds</th>
                  <th>Net Revenue</th>
                  <th>Profit Margin</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaryData.map((m) => (
                  <tr key={m.month}>
                    <td className="font-bold">{m.month}</td>
                    <td>{m.orders}</td>
                    <td className="font-semibold">{m.revenue}</td>
                    <td>{m.cogs}</td>
                    <td className="font-bold text-green">{m.grossProfit}</td>
                    <td className="text-red">{m.refunds}</td>
                    <td className="font-bold text-primary">{m.netRevenue}</td>
                    <td><span className="badge-neutral font-bold">{m.margin}</span></td>
                    <td>
                      {m.trend === "up" ? (
                        <span className="text-green font-bold"><ArrowUpRight size={16} /></span>
                      ) : (
                        <span className="text-red font-bold"><ArrowDownRight size={16} /></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== 8. PROFIT & MARGIN ANALYSIS ===== */}
      {(activeTab === "overview" || activeTab === "profit") && (
        <div className="two-column-layout">
          <div className="section-card">
            <h3 className="section-card-title"><TrendingUp size={18} /> Profit & Margin Waterfall Breakdown</h3>
            <p className="section-card-sub">Step-by-step breakdown from Gross Revenue to Net Profit</p>

            <div className="waterfall-list">
              <div className="waterfall-item plus">
                <span className="wf-label">Gross Revenue</span>
                <span className="wf-val">₹12,84,590</span>
              </div>
              <div className="waterfall-item minus">
                <span className="wf-label">Cost of Medicines (COGS)</span>
                <span className="wf-val">-₹9,76,240</span>
              </div>
              <div className="waterfall-item minus">
                <span className="wf-label">Delivery & Driver Logistics</span>
                <span className="wf-val">-₹42,500</span>
              </div>
              <div className="waterfall-item minus">
                <span className="wf-label">Promotional Discounts</span>
                <span className="wf-val">-₹18,420</span>
              </div>
              <div className="waterfall-item minus">
                <span className="wf-label">Refunds & Returns</span>
                <span className="wf-val">-₹24,850</span>
              </div>
              <div className="waterfall-total">
                <span className="wf-label">NET PROFIT</span>
                <span className="wf-val">₹2,22,580</span>
                <span className="wf-pct">17.3% Net Margin</span>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="card-header-flex">
              <div>
                <h3 className="section-card-title"><Package size={18} /> Top Selling Medicines</h3>
                <p className="section-card-sub">Highest revenue generating pharmaceuticals</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Units</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductsData.map((p) => (
                    <tr key={p.rank}>
                      <td className="font-bold text-subtle">{p.rank}</td>
                      <td className="font-semibold">{p.name}</td>
                      <td>{p.units}</td>
                      <td className="font-bold">₹{p.revenue}</td>
                      <td className="text-green font-semibold">₹{p.profit}</td>
                      <td><span className="badge-neutral">{p.margin}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== 10. BRANCH PERFORMANCE ===== */}
      {activeTab === "overview" && (
        <div className="section-card">
          <h3 className="section-card-title"><Building2 size={18} /> Multi-Branch Operational Comparison</h3>
          <p className="section-card-sub">Performance metrics across all pharmacy store locations</p>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Branch Location</th>
                  <th>Total Orders</th>
                  <th>Gross Revenue</th>
                  <th>SLA Delivery %</th>
                  <th>COD Share</th>
                  <th>Online Share</th>
                  <th>Net Profit</th>
                  <th>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {branchPerformanceData.map((b) => (
                  <tr key={b.name}>
                    <td className="font-bold">{b.name}</td>
                    <td>{b.orders}</td>
                    <td className="font-bold text-primary">{b.revenue}</td>
                    <td><span className="badge-status success">{b.delivered}</span></td>
                    <td>{b.cod}</td>
                    <td>{b.online}</td>
                    <td className="font-bold text-green">{b.profit}</td>
                    <td><span className="badge-neutral">{b.margin}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== 11 & 12. REFUNDS & TAX / GST SUMMARY ===== */}
      <div className="two-column-layout">
        <div className="section-card">
          <div className="card-header-flex">
            <div>
              <h3 className="section-card-title"><RotateCcw size={18} /> Refund & Return Summary</h3>
              <p className="section-card-sub">Customer returns, audit trail, and pending refunds</p>
            </div>
          </div>

          <div className="refund-kpis-grid">
            <div className="refund-box">
              <span>Total Refund Amt</span>
              <strong>₹24,850</strong>
            </div>
            <div className="refund-box">
              <span>Returned Orders</span>
              <strong>18</strong>
            </div>
            <div className="refund-box text-orange">
              <span>Refund Pending</span>
              <strong>₹5,420</strong>
            </div>
            <div className="refund-box text-green">
              <span>Refund Completed</span>
              <strong>₹19,430</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {refundLogData.map((r) => (
                  <tr key={r.id}>
                    <td className="font-bold text-primary">{r.id}</td>
                    <td>{r.reason}</td>
                    <td className="font-semibold">{r.refundAmt}</td>
                    <td>
                      <span className={`badge-status ${r.status === "Completed" ? "success" : "warning"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section-card">
          <div className="card-header-flex">
            <div>
              <h3 className="section-card-title"><Receipt size={18} /> Tax & GST Compliance Summary</h3>
              <p className="section-card-sub">GST collections, CGST/SGST breakdown, and tax liability</p>
            </div>
            <button className="btn-secondary" onClick={() => alert("Downloading official GST Report...")}>
              <Download size={13} /> GST Report
            </button>
          </div>

          <div className="gst-summary-list">
            <div className="gst-row">
              <span>Taxable Sales Amount</span>
              <strong>₹11,46,955.00</strong>
            </div>
            <div className="gst-row">
              <span>Total GST Collected (12% avg)</span>
              <strong className="text-primary">₹1,37,635.00</strong>
            </div>
            <div className="gst-row sub">
              <span>• CGST (Central GST - 6%)</span>
              <span>₹68,817.50</span>
            </div>
            <div className="gst-row sub">
              <span>• SGST (State GST - 6%)</span>
              <span>₹68,817.50</span>
            </div>
            <div className="gst-row sub">
              <span>• IGST (Integrated GST)</span>
              <span>₹0.00</span>
            </div>
            <div className="gst-row text-red">
              <span>Tax Credit on Refunds</span>
              <span>-₹2,236.00</span>
            </div>
            <div className="gst-total-row">
              <span>NET TAX LIABILITY</span>
              <strong className="text-green">₹1,35,399.00</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 13. DEDICATED CUSTOM REPORT GENERATOR AREA ===== */}
      {(activeTab === "overview" || activeTab === "generator") && (
        <div className="section-card border-top-primary">
          <div className="card-header-flex">
            <div>
              <h3 className="section-card-title"><SlidersHorizontal size={18} /> Generate Custom Operational Report</h3>
              <p className="section-card-sub">Configure custom parameters to export specialized PDFs or CSVs</p>
            </div>
          </div>

          <div className="generator-form-grid">
            <div className="form-field">
              <label>Report Type</label>
              <select value={genReportType} onChange={(e) => setGenReportType(e.target.value)}>
                <option value="sales">Sales & Revenue Report</option>
                <option value="inventory">Inventory & Valuation Report</option>
                <option value="deliveries">Delivery & Courier Report</option>
                <option value="cod">COD Reconciliation Report</option>
                <option value="payments">Payment Gateway Report</option>
                <option value="profit">Profit & Margin Analysis</option>
              </select>
            </div>

            <div className="form-field">
              <label>Date Range</label>
              <select value={genDateRange} onChange={(e) => setGenDateRange(e.target.value)}>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            <div className="form-field">
              <label>Branch</label>
              <select value={genBranch} onChange={(e) => setGenBranch(e.target.value)}>
                <option value="all">All Branches</option>
                <option value="main">Main Branch</option>
                <option value="downtown">Downtown Branch</option>
              </select>
            </div>

            <div className="form-field">
              <label>Payment Method</label>
              <select value={genPaymentMethod} onChange={(e) => setGenPaymentMethod(e.target.value)}>
                <option value="all">All Payment Methods</option>
                <option value="cod">COD</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="form-field">
              <label>Order Status</label>
              <select value={genOrderStatus} onChange={(e) => setGenOrderStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="form-field">
              <label>Export Format</label>
              <select value={genFormat} onChange={(e) => setGenFormat(e.target.value)}>
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Spreadsheet (.xlsx)</option>
                <option value="csv">CSV File (.csv)</option>
              </select>
            </div>
          </div>

          <div className="generator-actions-row">
            <button className="btn-secondary" onClick={loadPreviewData} disabled={isGenerating}>
              {isGenerating ? <RefreshCw size={15} className="spin" /> : <Eye size={15} />} Generate Preview
            </button>
            <button className="btn-primary" onClick={handleExportPDF}>
              <Download size={15} /> Export Report ({genFormat.toUpperCase()})
            </button>
          </div>

          {/* Generated Preview Table */}
          {reportPreviewData && (
            <div className="preview-container">
              <div className="preview-header">
                <span>Preview: {reportPreviewData.title || "Custom Generated Report"}</span>
                <span className="badge-neutral">{reportPreviewData.rows?.length || 0} Records</span>
              </div>

              {reportPreviewData.rows?.length > 0 ? (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        {Object.keys(reportPreviewData.rows[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportPreviewData.rows.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((val, i) => (
                            <td key={i}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data-text">No matching record preview found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== 14. QUICK REPORTS SHORTCUTS ===== */}
      <div className="section-card">
        <h3 className="section-card-title"><Sparkles size={18} /> Quick Pre-Configured Reports</h3>
        <p className="section-card-sub">Instant 1-click access to essential financial & operational reports</p>

        <div className="quick-reports-grid">
          {quickReports.map((q) => {
            const QIcon = q.icon;
            return (
              <div
                key={q.title}
                className="quick-report-card"
                onClick={() => {
                  setActiveTab(q.tab);
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
              >
                <div className="qr-icon-wrapper">
                  <QIcon size={20} />
                </div>
                <div className="qr-content">
                  <div className="qr-title">{q.title}</div>
                  <div className="qr-desc">{q.desc}</div>
                </div>
                <ChevronRight size={16} className="qr-arrow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== 15. RECENT FINANCIAL TRANSACTIONS TABLE ===== */}
      <div className="section-card">
        <div className="card-header-flex">
          <div>
            <h3 className="section-card-title"><Receipt size={18} /> Recent Financial Transactions</h3>
            <p className="section-card-sub">Real-time ledger of store payments, refunds, and collections</p>
          </div>

          <div className="table-filters-flex">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search Txn ID, Order ID, Customer..."
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
              />
            </div>

            <select
              value={txnStatusFilter}
              onChange={(e) => setTxnStatusFilter(e.target.value)}
              className="select-status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.txnId}>
                  <td className="font-bold text-subtle">{t.txnId}</td>
                  <td className="font-bold text-primary">{t.orderId}</td>
                  <td>{t.customer}</td>
                  <td>{t.method}</td>
                  <td className="font-bold">₹{t.amount}</td>
                  <td>
                    <span className={`badge-type ${t.type === "Refund" ? "refund" : "payment"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${
                      t.status === "Completed" ? "success" : t.status === "Pending" ? "warning" : t.status === "Refunded" ? "info" : "danger"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== COD RECONCILIATION MODAL ===== */}
      {showCodModal && (
        <div className="modal-backdrop" onClick={() => setShowCodModal(false)}>
          <div className="modal-card-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-flex">
              <div>
                <h3>COD Reconciliation Details</h3>
                <p>Full driver-wise Cash on Delivery settlement audit</p>
              </div>
              <button className="btn-close" onClick={() => setShowCodModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Expected COD</th>
                    <th>Collected</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {codReconciliationData.map((row) => (
                    <tr key={row.id}>
                      <td className="font-bold text-primary">{row.id}</td>
                      <td>{row.customer}</td>
                      <td>{row.expected}</td>
                      <td className="font-bold">{row.collected}</td>
                      <td>
                        <span className={`badge-status ${row.status === "Settled" ? "success" : "warning"}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer-flex">
              <button className="btn-secondary" onClick={() => setShowCodModal(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={handleExportCSV}>
                <FileSpreadsheet size={15} /> Export COD Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
