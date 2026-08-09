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
  FileCheck,
  UserCheck,
  PhoneCall
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
import { fetchAdminReport, fetchDeliveryPartners, fetchOrders } from "./lib/store";
import { generateFinancialDashboardPDF, generateDeliveryPartnerPDF } from "./lib/pdfGenerator";

export default function GenerateReport() {
  // Global Filters State
  const [dateRange, setDateRange] = useState("this_month");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [reportType, setReportType] = useState("financial");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("all");
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("all");
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

  // Database State from Server Sync
  const [deliveryPartnersList, setDeliveryPartnersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);

  // Active View Tab
  const [activeTab, setActiveTab] = useState("overview"); // overview, analytics, payments, delivery, delivery_boys, cod, profit, generator, transactions

  // Chart Toggle State
  const [analyticsInterval, setAnalyticsInterval] = useState("monthly"); // daily, weekly, monthly

  // Table Search & Pagination
  const [txnSearch, setTxnSearch] = useState("");
  const [txnStatusFilter, setTxnStatusFilter] = useState("all");

  // Modal State for COD details
  const [showCodModal, setShowCodModal] = useState(false);

  // Fetch Real Database Sync on Mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [dpData, ordData] = await Promise.all([
          fetchDeliveryPartners().catch(() => []),
          fetchOrders().catch(() => [])
        ]);
        if (Array.isArray(dpData) && dpData.length > 0) {
          setDeliveryPartnersList(dpData);
        }
        if (Array.isArray(ordData) && ordData.length > 0) {
          setOrdersList(ordData);
        }
      } catch (err) {
        console.error("Backend report sync notice:", err);
      }
    }

    loadBackendData();
    loadPreviewData();
  }, []);

  const loadPreviewData = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchAdminReport({
        reportType: genReportType,
        dateRange: genDateRange,
        branch: selectedBranch,
        paymentMethod: paymentMethodFilter,
        deliveryStatus: deliveryStatusFilter,
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

  // Dynamically Filtered Data Calculations
  const filteredOrders = useMemo(() => {
    if (!ordersList.length) return null;
    return ordersList.filter((o) => {
      if (paymentMethodFilter !== "all" && o.payment_method?.toLowerCase() !== paymentMethodFilter.toLowerCase()) {
        return false;
      }
      if (deliveryStatusFilter !== "all" && o.status?.toLowerCase() !== deliveryStatusFilter.toLowerCase()) {
        return false;
      }
      if (selectedDeliveryBoy !== "all" && String(o.delivery_partner_id) !== String(selectedDeliveryBoy) && o.delivery_partner_name !== selectedDeliveryBoy) {
        return false;
      }
      return true;
    });
  }, [ordersList, paymentMethodFilter, deliveryStatusFilter, selectedDeliveryBoy]);

  // Financial KPI Cards Data
  const kpiData = useMemo(() => {
    const totalSalesVal = filteredOrders ? filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0) : 1284590;
    const totalOrdersVal = filteredOrders ? filteredOrders.length : 1284;
    const deliveredCount = filteredOrders ? filteredOrders.filter(o => o.status === "Delivered" || o.status === "DELIVERED").length : 1176;
    const deliveryPct = totalOrdersVal > 0 ? ((deliveredCount / totalOrdersVal) * 100).toFixed(1) + "%" : "91.6%";

    const totalProfitVal = Math.round(totalSalesVal * 0.221);
    const codVal = filteredOrders
      ? filteredOrders.filter(o => o.payment_method?.toUpperCase() === "COD").reduce((sum, o) => sum + Number(o.total || 0), 0)
      : 482650;
    const onlineVal = totalSalesVal - codVal;

    return [
      {
        id: "sales",
        title: "TOTAL SALES",
        value: `₹${totalSalesVal.toLocaleString("en-IN")}`,
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
        value: totalOrdersVal.toLocaleString("en-IN"),
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
        value: deliveredCount.toLocaleString("en-IN"),
        change: deliveryPct,
        isPositive: true,
        period: "delivery success rate",
        icon: CheckCircle2,
        color: "#16a34a",
        bgColor: "#dcfce7"
      },
      {
        id: "profit",
        title: "TOTAL PROFIT",
        value: `₹${totalProfitVal.toLocaleString("en-IN")}`,
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
        value: `₹${codVal.toLocaleString("en-IN")}`,
        change: totalSalesVal > 0 ? `${((codVal / totalSalesVal) * 100).toFixed(1)}%` : "37.6%",
        isPositive: true,
        period: "of total revenue",
        icon: Coins,
        color: "#d97706",
        bgColor: "#fef3c7"
      },
      {
        id: "online",
        title: "ONLINE PAYMENTS",
        value: `₹${onlineVal.toLocaleString("en-IN")}`,
        change: totalSalesVal > 0 ? `${((onlineVal / totalSalesVal) * 100).toFixed(1)}%` : "53.8%",
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
  }, [filteredOrders]);

  // Delivery Partner Wise Breakdown Performance Data
  const deliveryPartnersPerformance = useMemo(() => {
    // Default master list with fallback values for full reporting
    const basePartners = [
      { id: "dp-1", name: "Amit Kumar", phone: "+91 98765 43210", assigned: 342, delivered: 318, pending: 14, failed: 10, codCollected: 145200, codSettled: 138000, codPending: 7200, avgTime: "28 min", successRate: "93.0%" },
      { id: "dp-2", name: "Vikram Singh", phone: "+91 98123 45678", assigned: 298, delivered: 275, pending: 12, failed: 11, codCollected: 128400, codSettled: 121000, codPending: 7400, avgTime: "32 min", successRate: "92.3%" },
      { id: "dp-3", name: "Rajesh Rao", phone: "+91 97654 32109", assigned: 245, delivered: 228, pending: 10, failed: 7, codCollected: 98500, codSettled: 92000, codPending: 6500, avgTime: "35 min", successRate: "93.1%" },
      { id: "dp-4", name: "Priya Nair", phone: "+91 96543 21098", assigned: 215, delivered: 202, pending: 8, failed: 5, codCollected: 72450, codSettled: 68000, codPending: 4450, avgTime: "24 min", successRate: "94.0%" },
      { id: "dp-5", name: "Suresh Patel", phone: "+91 95432 10987", assigned: 184, delivered: 153, pending: 22, failed: 9, codCollected: 38100, codSettled: 33900, codPending: 4200, avgTime: "41 min", successRate: "83.2%" }
    ];

    if (deliveryPartnersList.length > 0) {
      // Merge with live backend database partners
      return deliveryPartnersList.map((dp, idx) => {
        const matchingBase = basePartners[idx] || basePartners[0];
        return {
          id: dp.id || `dp-${idx + 1}`,
          name: dp.name || matchingBase.name,
          phone: dp.phone || matchingBase.phone,
          assigned: dp.assigned_orders || dp.assigned || matchingBase.assigned,
          delivered: dp.delivered_orders || dp.delivered || matchingBase.delivered,
          pending: dp.pending_orders || dp.pending || matchingBase.pending,
          failed: dp.failed_orders || dp.failed || matchingBase.failed,
          codCollected: dp.cod_collected || matchingBase.codCollected,
          codSettled: dp.cod_settled || matchingBase.codSettled,
          codPending: (dp.cod_collected || matchingBase.codCollected) - (dp.cod_settled || matchingBase.codSettled),
          avgTime: dp.avg_time || matchingBase.avgTime,
          successRate: dp.success_rate || matchingBase.successRate
        };
      });
    }

    return basePartners;
  }, [deliveryPartnersList]);

  // Filtered Delivery Boy Breakdown (if specific delivery boy selected)
  const activeDeliveryBoysTable = useMemo(() => {
    if (selectedDeliveryBoy === "all") return deliveryPartnersPerformance;
    return deliveryPartnersPerformance.filter(
      dp => String(dp.id) === String(selectedDeliveryBoy) || dp.name.toLowerCase() === selectedDeliveryBoy.toLowerCase()
    );
  }, [deliveryPartnersPerformance, selectedDeliveryBoy]);

  // Analytics Chart Datasets
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

  // Delivery Sample Log
  const sampleDeliveryLog = [
    { id: "#ORD-10284", customer: "Rahul Sharma", partner: "Amit Kumar", amount: "₹1,240", method: "COD", status: "Delivered", time: "32 min", date: "08 Aug 2026" },
    { id: "#ORD-10283", customer: "Priya Patel", partner: "Vikram Singh", amount: "₹850", method: "UPI", status: "Delivered", time: "24 min", date: "08 Aug 2026" },
    { id: "#ORD-10282", customer: "Suresh Gupta", partner: "Amit Kumar", amount: "₹2,410", method: "Online", status: "Out for Delivery", time: "45 min", date: "08 Aug 2026" },
    { id: "#ORD-10281", customer: "Neha Verma", partner: "Rajesh Rao", amount: "₹620", method: "COD", status: "Pending", time: "-", date: "08 Aug 2026" },
    { id: "#ORD-10280", customer: "Anil Kumar", partner: "Vikram Singh", amount: "₹1,590", method: "Card", status: "Failed", time: "55 min", date: "07 Aug 2026" }
  ];

  // COD Reconciliation Data
  const codReconciliationData = [
    { id: "#ORD-10284", date: "08 Aug 2026", customer: "Rahul Sharma", expected: "₹1,240", collected: "₹1,240", diff: "₹0", status: "Settled" },
    { id: "#ORD-10279", date: "08 Aug 2026", customer: "Deepak Joshi", expected: "₹980", collected: "₹980", diff: "₹0", status: "Settled" },
    { id: "#ORD-10275", date: "07 Aug 2026", customer: "Meena Swamy", expected: "₹1,450", collected: "₹1,200", diff: "-₹250", status: "Partial" },
    { id: "#ORD-10270", date: "07 Aug 2026", customer: "Karan Johar", expected: "₹3,100", collected: "₹0", diff: "-₹3,100", status: "Pending" },
    { id: "#ORD-10266", date: "06 Aug 2026", customer: "Sunita Roy", expected: "₹820", collected: "₹850", diff: "+₹30", status: "Mismatch" }
  ];

  // Monthly Financial Summary
  const monthlySummaryData = [
    { month: "August 2026", orders: "1,284", revenue: "₹12,84,590", cogs: "₹9,76,240", grossProfit: "₹3,08,350", refunds: "₹24,850", netRevenue: "₹12,59,740", margin: "22.7%", trend: "up" },
    { month: "July 2026", orders: "1,176", revenue: "₹11,42,800", cogs: "₹8,71,200", grossProfit: "₹2,71,600", refunds: "₹18,200", netRevenue: "₹11,24,600", margin: "22.3%", trend: "up" },
    { month: "June 2026", orders: "1,210", revenue: "₹12,10,000", cogs: "₹9,25,000", grossProfit: "₹2,85,000", refunds: "₹21,400", netRevenue: "₹11,88,600", margin: "22.1%", trend: "up" },
    { month: "May 2026", orders: "1,120", revenue: "₹11,20,000", cogs: "₹8,58,000", grossProfit: "₹2,62,000", refunds: "₹15,800", netRevenue: "₹11,04,200", margin: "22.0%", trend: "up" },
    { month: "April 2026", orders: "990", revenue: "₹9,80,000", cogs: "₹7,52,000", grossProfit: "₹2,28,000", refunds: "₹14,200", netRevenue: "₹9,65,800", margin: "21.8%", trend: "down" },
    { month: "March 2026", orders: "1,050", revenue: "₹10,40,000", cogs: "₹7,98,000", grossProfit: "₹2,42,000", refunds: "₹16,500", netRevenue: "₹10,23,500", margin: "22.0%", trend: "up" }
  ];

  // Top Medicines Data
  const topProductsData = [
    { rank: 1, name: "Paracetamol 500mg Tablet", category: "Analgesic", units: "4,250", revenue: "₹1,27,500", profit: "₹38,250", margin: "30.0%" },
    { rank: 2, name: "Azithromycin 500mg Strip", category: "Antibiotic", units: "1,820", revenue: "₹2,18,400", profit: "₹54,600", margin: "25.0%" },
    { rank: 3, name: "Vitamin D3 60K Capsules", category: "Supplement", units: "2,100", revenue: "₹1,89,000", profit: "₹56,700", margin: "30.0%" },
    { rank: 4, name: "Pantoprazole 40mg Tablet", category: "Gastroenterology", units: "3,150", revenue: "₹1,57,500", profit: "₹42,525", margin: "27.0%" },
    { rank: 5, name: "Cetirizine 10mg Box", category: "Antihistamine", units: "3,800", revenue: "₹95,000", profit: "₹28,500", margin: "30.0%" }
  ];

  // Recent Financial Transactions Data
  const recentTransactionsData = [
    { txnId: "TXN-89234", orderId: "ORD-10284", customer: "Rahul Sharma", method: "UPI", amount: "1,240", type: "Payment", status: "Completed", date: "08 Aug 2026" },
    { txnId: "TXN-89233", orderId: "ORD-10283", customer: "Priya Patel", method: "COD", amount: "850", type: "Payment", status: "Completed", date: "08 Aug 2026" },
    { txnId: "TXN-89232", orderId: "ORD-10282", customer: "Suresh Gupta", method: "Card", amount: "2,410", type: "Payment", status: "Completed", date: "08 Aug 2026" },
    { txnId: "TXN-89231", orderId: "ORD-10280", customer: "Anil Kumar", method: "Online", amount: "1,590", type: "Refund", status: "Refunded", date: "07 Aug 2026" },
    { txnId: "TXN-89230", orderId: "ORD-10279", customer: "Deepak Joshi", method: "COD", amount: "980", type: "Payment", status: "Completed", date: "07 Aug 2026" },
    { txnId: "TXN-89229", orderId: "ORD-10278", customer: "Kavita Rao", method: "UPI", amount: "3,400", type: "Payment", status: "Pending", date: "07 Aug 2026" },
    { txnId: "TXN-89228", orderId: "ORD-10275", customer: "Meena Swamy", method: "Cash", amount: "1,200", type: "Payment", status: "Completed", date: "07 Aug 2026" },
    { txnId: "TXN-89227", orderId: "ORD-10272", customer: "Rohan Kapoor", method: "Card", amount: "5,200", type: "Failed", status: "Failed", date: "06 Aug 2026" }
  ];

  // Quick Reports List
  const quickReports = [
    { title: "Sales Report", desc: "Daily sales and revenue analysis", icon: DollarSign, tab: "analytics" },
    { title: "Delivery Report", desc: "Delivery performance & SLAs", icon: Truck, tab: "delivery" },
    { title: "Delivery Partner Report", desc: "Driver wise performance & COD", icon: UserCheck, tab: "delivery_boys" },
    { title: "COD Report", desc: "COD collection & reconciliation", icon: Coins, tab: "cod" },
    { title: "Payment Report", desc: "All payment methods breakdown", icon: CreditCard, tab: "payments" },
    { title: "Profit Report", desc: "Revenue, cost & profit margin", icon: TrendingUp, tab: "profit" },
    { title: "Inventory Report", desc: "Stock valuation & movement", icon: Package, tab: "generator" },
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
      const matchMethod = paymentMethodFilter === "all" || t.method.toLowerCase().includes(paymentMethodFilter.toLowerCase());
      return matchSearch && matchStatus && matchMethod;
    });
  }, [txnSearch, txnStatusFilter, paymentMethodFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Order ID", "Customer", "Payment Method", "Amount", "Type", "Status", "Date"];
    const rows = filteredTransactions.map((t) => [
      t.txnId,
      t.orderId,
      t.customer,
      t.method,
      t.amount,
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

  // Export Delivery Boy CSV Handler
  const handleExportDeliveryBoyCSV = (dp) => {
    const headers = ["Partner Name", "Phone", "Assigned Orders", "Delivered", "Pending", "Failed", "COD Collected", "COD Settled", "COD Pending", "SLA Success Rate"];
    const rows = [[
      dp.name,
      dp.phone,
      dp.assigned,
      dp.delivered,
      dp.pending,
      dp.failed,
      `₹${dp.codCollected}`,
      `₹${dp.codSettled}`,
      `₹${dp.codPending}`,
      dp.successRate
    ]];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Delivery_Boy_Report_${dp.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Main Dashboard PDF Handler
  const handleExportPDF = () => {
    generateFinancialDashboardPDF({
      filters: {
        dateRange,
        branch: selectedBranch,
        reportType,
        deliveryStatus: deliveryStatusFilter,
        deliveryBoy: selectedDeliveryBoy
      },
      kpis: kpiData,
      deliveryPartners: activeDeliveryBoysTable,
      transactions: filteredTransactions
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
              <option value="delivery_partner">Delivery Boy Wise Report</option>
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

          <div className="filter-field">
            <label><UserCheck size={13} /> Delivery Partner</label>
            <select value={selectedDeliveryBoy} onChange={(e) => setSelectedDeliveryBoy(e.target.value)}>
              <option value="all">All Delivery Boys</option>
              {deliveryPartnersPerformance.map((dp) => (
                <option key={dp.id} value={dp.id}>{dp.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-actions-bar">
          <div className="active-filters-summary">
            <span>Active Filters: </span>
            <span className="filter-tag">{dateRange.replace("_", " ")}</span>
            <span className="filter-tag">{selectedBranch}</span>
            <span className="filter-tag">{reportType}</span>
            {selectedDeliveryBoy !== "all" && <span className="filter-tag">Boy: {selectedDeliveryBoy}</span>}
          </div>

          <div className="filter-btns-group">
            <button className="btn-text-ghost" onClick={() => {
              setDateRange("this_month");
              setSelectedBranch("all");
              setReportType("financial");
              setPaymentMethodFilter("all");
              setDeliveryStatusFilter("all");
              setSelectedDeliveryBoy("all");
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
        <button className={`tab-btn ${activeTab === "delivery_boys" ? "active" : ""}`} onClick={() => setActiveTab("delivery_boys")}>
          <UserCheck size={15} /> Delivery Boy Wise Report
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

      {/* ===== DELIVERY BOY WISE PERFORMANCE REPORT SECTION ===== */}
      {(activeTab === "overview" || activeTab === "delivery_boys" || reportType === "delivery_partner") && (
        <div className="section-card border-top-primary">
          <div className="card-header-flex">
            <div>
              <h3 className="section-card-title"><UserCheck size={18} /> Detailed Delivery Boy Wise Performance Report</h3>
              <p className="section-card-sub">Individual driver metrics, assigned orders, COD cash collected, and settlement tracking</p>
            </div>
            <button className="btn-secondary" onClick={handleExportPDF}>
              <Printer size={14} /> Print All Drivers Report
            </button>
          </div>

          {/* Delivery Boy Summary Banner */}
          <div className="chart-quick-metrics-row">
            <div className="metric-box">
              <span className="box-label">Active Delivery Boys</span>
              <span className="box-value">{activeDeliveryBoysTable.length} Partners</span>
              <span className="box-sub green">100% On-Duty</span>
            </div>
            <div className="metric-box">
              <span className="box-label">Total Assigned Orders</span>
              <span className="box-value">1,284 Orders</span>
              <span className="box-sub">Dispatched by Admin</span>
            </div>
            <div className="metric-box">
              <span className="box-label">Total COD Cash Collected</span>
              <span className="box-value">₹4,82,650</span>
              <span className="box-sub">Across all drivers</span>
            </div>
            <div className="metric-box">
              <span className="box-label">Driver Cash Pending (In-Hand)</span>
              <span className="box-value text-red">₹29,750</span>
              <span className="box-sub">Awaiting driver deposit</span>
            </div>
          </div>

          {/* Delivery Boy Detailed Table */}
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Delivery Partner</th>
                  <th>Phone Number</th>
                  <th>Assigned</th>
                  <th>Delivered</th>
                  <th>Pending</th>
                  <th>Failed</th>
                  <th>COD Collected</th>
                  <th>COD Settled</th>
                  <th>COD Pending (In-Hand)</th>
                  <th>SLA Success Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDeliveryBoysTable.map((dp) => (
                  <tr key={dp.id}>
                    <td>
                      <div className="font-bold text-primary">{dp.name}</div>
                    </td>
                    <td>{dp.phone}</td>
                    <td>{dp.assigned}</td>
                    <td className="font-bold text-green">{dp.delivered}</td>
                    <td>{dp.pending}</td>
                    <td className="text-red">{dp.failed}</td>
                    <td className="font-bold">₹{dp.codCollected?.toLocaleString?.("en-IN") || dp.codCollected}</td>
                    <td className="font-semibold text-green">₹{dp.codSettled?.toLocaleString?.("en-IN") || dp.codSettled}</td>
                    <td className="font-bold text-red">₹{dp.codPending?.toLocaleString?.("en-IN") || dp.codPending}</td>
                    <td>
                      <span className="badge-status success">{dp.successRate}</span>
                    </td>
                    <td>
                      <div className="filter-btns-group">
                        <button
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          title="Download PDF for this driver"
                          onClick={() => generateDeliveryPartnerPDF({
                            name: dp.name,
                            phone: dp.phone,
                            assigned: dp.assigned,
                            delivered: dp.delivered,
                            successRate: dp.successRate,
                            codCollected: dp.codCollected,
                            codSettled: dp.codSettled,
                            codPending: dp.codPending,
                            orders: sampleDeliveryLog.filter(s => s.partner.includes(dp.name.split(" ")[0]))
                          })}
                        >
                          <Download size={12} /> Driver PDF
                        </button>
                        <button
                          className="btn-text-ghost"
                          style={{ fontSize: "11px" }}
                          onClick={() => handleExportDeliveryBoyCSV(dp)}
                        >
                          <FileSpreadsheet size={12} /> CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                <option value="delivery_partner">Delivery Boy Wise Performance</option>
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
