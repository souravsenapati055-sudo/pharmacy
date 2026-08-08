import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  fetchAdminDashboard,
  updateOrderStatus,
  fetchAdminCustomers,
  toggleBlockCustomer,
  createDeliveryPartner,
  createMedicine,
  updateMedicineStock,
  fetchMedicines,
} from "./lib/store";
import { generateOrderInvoicePDF, generateMedicineReportPDF, generateSingleMedicinePDFReport } from "./lib/pdfGenerator";
import StockManagementModal from "./components/StockManagementModal";
import InventoryReportFilterModal from "./components/InventoryReportFilterModal";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Users,
  AlertTriangle,
  Truck,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  Search,
  DollarSign,
  Package,
  ShieldAlert,
  UserPlus,
  FileText,
  X,
  ExternalLink,
  Pill,
  Boxes,
  Settings as SettingsIcon,
  RefreshCw,
  Minus,
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard({
  deliveryPeople = [],
  setDeliveryPeople,
  orders = [],
  setOrders,
  medicines = [],
  setMedicines,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Active sub-tab state (dashboard | customers | orders | inventory | settings)
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "dashboard";

  const [adminName, setAdminName] = useState("Admin");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7 Days");
  const [search, setSearch] = useState("");

  // Inventory / Stock Filter State
  const [inventorySearch, setInventorySearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'instock' | 'lowstock' | 'outstock'
  const [dashStockModalMed, setDashStockModalMed] = useState(null);
  const [dashStockModalTab, setDashStockModalTab] = useState("overview");
  const [showReportFilterModal, setShowReportFilterModal] = useState(false);

  const handleOpenDashStockModal = (med, tab = "overview") => {
    setDashStockModalMed(med);
    setDashStockModalTab(tab);
  };

  const handleDashStockUpdated = (medId, newStock) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, stock: newStock } : m))
    );
  };

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success");

  // Modal Dialog States
  const [activeModal, setActiveModal] = useState(null); // 'add-medicine' | 'add-partner' | 'confirm-action'
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Form States for Modals
  const [partnerForm, setPartnerForm] = useState({ name: "", phone: "" });
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    category: "General",
    price: "",
    discount: "0",
    stock: "100",
    description: "",
    image: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("adminProfile");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        if (profile.fullName) setAdminName(profile.fullName.split(" ")[0]);
      } else {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          const u = JSON.parse(currentUser);
          if (u.name) setAdminName(u.name.split(" ")[0]);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadDashboard() {
      setLoading(true);
      try {
        const [data, medsData] = await Promise.all([
          fetchAdminDashboard(),
          fetchMedicines().catch(() => []),
        ]);
        if (!ignore && data) setDashboardData(data);
        if (!ignore && setMedicines && Array.isArray(medsData) && medsData.length > 0) {
          setMedicines(medsData);
        }
      } catch (error) {
        console.error("Dashboard load failed:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [setOrders, setMedicines]);

  useEffect(() => {
    if (currentTab === "customers") {
      loadCustomers();
    }
  }, [currentTab]);

  const loadCustomers = async () => {
    setCustomerLoading(true);
    try {
      const data = await fetchAdminCustomers();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleBlockToggleConfirm = (customer) => {
    if (!customer) return;
    const isBlocking = !customer.isBlocked;
    setConfirmConfig({
      title: isBlocking ? "Block Customer Account?" : "Unblock Customer Account?",
      message: isBlocking
        ? `Are you sure you want to block ${customer.name}? They will lose access to order creation.`
        : `Unblocking ${customer.name} will restore full account privileges.`,
      confirmLabel: isBlocking ? "Yes, Block Account" : "Yes, Unblock Account",
      confirmVariant: isBlocking ? "danger" : "success",
      onConfirm: async () => {
        try {
          const newBlockedState = !customer.isBlocked;
          const res = await toggleBlockCustomer(customer.id, newBlockedState);
          showToast(res.message || "Customer account status updated.");
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === customer.id
                ? { ...c, isBlocked: newBlockedState, status: newBlockedState ? "blocked" : "active" }
                : c
            )
          );
        } catch (err) {
          showToast(err.message || "Failed to update customer status", "danger");
        } finally {
          setActiveModal(null);
        }
      },
    });
    setActiveModal("confirm-action");
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const response = await updateOrderStatus(orderId, newStatus);
      const updatedOrder = response?.order || { id: orderId, status: newStatus };
      if (setOrders) {
        setOrders((prev) => (Array.isArray(prev) ? prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)) : []));
      }
      setDashboardData((prev) =>
        prev && prev.recentOrders
          ? {
              ...prev,
              recentOrders: prev.recentOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
            }
          : prev
      );
      showToast(`Order #${orderId} status updated to ${newStatus}.`);

      if (updatedOrder.deliveryPartner && setDeliveryPeople) {
        setDeliveryPeople((prev) =>
          Array.isArray(prev)
            ? prev.map((partner) =>
                partner.name === updatedOrder.deliveryPartner
                  ? {
                      ...partner,
                      activeOrders:
                        newStatus === "Delivered" ? Math.max((partner.activeOrders || 1) - 1, 0) : partner.activeOrders,
                      orders: newStatus === "Delivered" ? (partner.orders || 0) + 1 : partner.orders,
                    }
                  : partner
              )
            : []
        );
      }
    } catch (error) {
      showToast("Failed to update order status", "danger");
    }
  };

  const handleCreatePartnerSubmit = async (e) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.phone) {
      showToast("Please provide partner name and phone", "warning");
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await createDeliveryPartner(partnerForm);
      if (setDeliveryPeople && res.partner) {
        setDeliveryPeople((prev) => [...(Array.isArray(prev) ? prev : []), res.partner]);
      }
      showToast(`Delivery partner ${partnerForm.name} added successfully!`);
      setPartnerForm({ name: "", phone: "" });
      setActiveModal(null);
    } catch (err) {
      showToast(err.message || "Failed to add delivery partner", "danger");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCreateMedicineSubmit = async (e) => {
    e.preventDefault();
    if (!medicineForm.name || !medicineForm.category || !medicineForm.price) {
      showToast("Please provide medicine name, category, and price", "warning");
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await createMedicine({
        name: medicineForm.name,
        category: medicineForm.category,
        description: medicineForm.description,
        image: medicineForm.image,
        price: Number(medicineForm.price),
        discount: Number(medicineForm.discount || 0),
        stock: Number(medicineForm.stock || 0),
      });

      if (res.medicine) {
        if (setMedicines) {
          setMedicines((prev) => [...(Array.isArray(prev) ? prev : []), res.medicine]);
        }
        showToast(`Medicine "${medicineForm.name}" added successfully!`);
      }
      setMedicineForm({
        name: "",
        category: "General",
        price: "",
        discount: "0",
        stock: "100",
        description: "",
        image: "",
      });
      setActiveModal(null);
    } catch (err) {
      showToast(err.message || "Failed to add medicine", "danger");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStockUpdate = async (medId, newStock) => {
    const stockVal = Math.max(Number(newStock) || 0, 0);
    try {
      await updateMedicineStock(medId, stockVal);
      if (setMedicines) {
        setMedicines((prev) =>
          Array.isArray(prev)
            ? prev.map((m) => (m.id === medId ? { ...m, stock: stockVal } : m))
            : []
        );
      }
      showToast(`Live stock updated for medicine #${medId} to ${stockVal} units.`);
    } catch (err) {
      showToast(err.message || "Failed to update stock", "danger");
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(val || 0);

  const salesData = useMemo(() => {
    if (dashboardData?.salesData && Array.isArray(dashboardData.salesData) && dashboardData.salesData.length > 0) {
      return dashboardData.salesData;
    }
    return [
      { month: "Jan", sales: 45000 },
      { month: "Feb", sales: 52000 },
      { month: "Mar", sales: 48000 },
      { month: "Apr", sales: 61000 },
      { month: "May", sales: 58000 },
      { month: "Jun", sales: 72000 },
      { month: "Jul", sales: 85000 },
    ];
  }, [dashboardData]);

  const recentOrders = useMemo(() => {
    if (dashboardData?.recentOrders && Array.isArray(dashboardData.recentOrders) && dashboardData.recentOrders.length > 0) {
      return dashboardData.recentOrders;
    }
    if (Array.isArray(orders) && orders.length > 0) {
      return orders;
    }
    return [
      { id: 101, customerName: "Rahul Sharma", medicine: "Paracetamol 500mg (2x)", totalPrice: 50, paymentMethod: "UPI", paymentStatus: "paid", deliveryPartner: "Vikram Singh", status: "Delivered", createdAt: new Date().toISOString() },
      { id: 102, customerName: "Priya Patel", medicine: "Amoxicillin 250mg (1x)", totalPrice: 45, paymentMethod: "Card", paymentStatus: "paid", deliveryPartner: "Amit Kumar", status: "Out for Delivery", createdAt: new Date().toISOString() },
      { id: 103, customerName: "Suresh Verma", medicine: "Vitamin C Tablets (3x)", totalPrice: 360, paymentMethod: "COD", paymentStatus: "pending", deliveryPartner: null, status: "Processing", createdAt: new Date().toISOString() },
      { id: 104, customerName: "Ananya Roy", medicine: "Cough Syrup (1x)", totalPrice: 85, paymentMethod: "UPI", paymentStatus: "paid", deliveryPartner: "Rajesh Rao", status: "Out for Delivery", createdAt: new Date().toISOString() },
    ];
  }, [dashboardData, orders]);

  const filteredOrders = useMemo(() => {
    const list = Array.isArray(recentOrders) ? recentOrders : [];
    if (!search.trim()) return list;
    return list.filter((order) =>
      `${order?.customerName || order?.userName || ""} ${order?.medicine || ""} ${order?.deliveryPartner || ""} ${order?.id || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [recentOrders, search]);

  const filteredMedicines = useMemo(() => {
    const list = Array.isArray(medicines) ? medicines : [];
    return list.filter((m) => {
      const matchesSearch = `${m?.name || ""} ${m?.category || ""} ${m?.description || ""}`
        .toLowerCase()
        .includes(inventorySearch.toLowerCase());
      if (!matchesSearch) return false;

      if (stockFilter === "instock") return m.stock >= 20;
      if (stockFilter === "lowstock") return m.stock > 0 && m.stock < 20;
      if (stockFilter === "outstock") return m.stock === 0;
      return true;
    });
  }, [medicines, inventorySearch, stockFilter]);

  // Order Status breakdown for Donut Chart
  const orderStatusCounts = useMemo(() => {
    const counts = { Delivered: 0, Processing: 0, "Out for Delivery": 0, Cancelled: 0 };
    (Array.isArray(recentOrders) ? recentOrders : []).forEach((o) => {
      if (!o) return;
      const st = o.status || "Processing";
      if (counts[st] !== undefined) counts[st]++;
      else counts["Processing"]++;
    });
    return [
      { name: "Delivered", value: counts["Delivered"] || 45, color: "#10b981" },
      { name: "Out for Delivery", value: counts["Out for Delivery"] || 18, color: "#087ea4" },
      { name: "Processing", value: counts["Processing"] || 12, color: "#f59e0b" },
      { name: "Cancelled", value: counts["Cancelled"] || 4, color: "#ef4444" },
    ];
  }, [recentOrders]);

  // Derived metrics
  const totalRevenue = useMemo(() => {
    return (Array.isArray(recentOrders) ? recentOrders : []).reduce(
      (sum, o) => sum + Number(o?.totalPrice || o?.total || 0),
      0
    );
  }, [recentOrders]);

  const activeOrdersCount = useMemo(() => {
    return (Array.isArray(recentOrders) ? recentOrders : []).filter(
      (o) => o && o.status !== "Delivered" && o.status !== "Cancelled"
    ).length;
  }, [recentOrders]);

  const lowStockCount =
    dashboardData?.stats?.lowStockCount ||
    (Array.isArray(medicines) ? medicines.filter((m) => m && m.stock < 20).length : 8);

  const activeDeliveries = (Array.isArray(recentOrders) ? recentOrders : []).filter(
    (o) => o && o.status === "Out for Delivery"
  ).length;

  const topSellingMedicines = useMemo(() => {
    if (dashboardData?.medicineData && Array.isArray(dashboardData.medicineData) && dashboardData.medicineData.length > 0) {
      return dashboardData.medicineData.slice(0, 5).map((m) => ({
        name: m?.name || "Medicine",
        category: m?.category || "General",
        unitsSold: m?.qty || 120,
        revenue: (m?.qty || 120) * 150,
        stock: m?.stock || 45,
        status: (m?.stock || 45) < 20 ? "Low Stock" : "In Stock",
      }));
    }
    return [
      { name: "Paracetamol 500mg", category: "Analgesic", unitsSold: 420, revenue: 12600, stock: 150, status: "In Stock" },
      { name: "Amoxicillin 250mg", category: "Antibiotic", unitsSold: 280, revenue: 23800, stock: 14, status: "Low Stock" },
      { name: "Cetirizine 10mg", category: "Antihistamine", unitsSold: 210, revenue: 6300, stock: 85, status: "In Stock" },
      { name: "Metformin 500mg", category: "Anti-Diabetic", unitsSold: 195, revenue: 15600, stock: 40, status: "In Stock" },
      { name: "Omeprazole 20mg", category: "Antacid", unitsSold: 160, revenue: 11200, stock: 5, status: "Low Stock" },
    ];
  }, [dashboardData, medicines]);

  // Greeting by time of day
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="dashboard-wrapper">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`toast-notification toast-${toastType}`}>
          {toastType === "success" && <CheckCircle2 size={18} />}
          {toastType === "warning" && <AlertTriangle size={18} />}
          {toastType === "danger" && <AlertCircle size={18} />}
          <span>{toastMessage}</span>
          <button className="toast-close" onClick={() => setToastMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* RENDER CUSTOMERS SUB-TAB */}
      {currentTab === "customers" ? (
        <div className="tab-container">
          <div className="tab-header">
            <div>
              <h2 className="tab-title">Customer Accounts Management</h2>
              <p className="tab-subtitle">
                Manage registered customer profiles, review account verification, and block/unblock users.
              </p>
            </div>
            <div className="tab-actions">
              <div className="table-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search customers by name, email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="saas-card table-card">
            <div className="table-responsive">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>CUSTOMER ID</th>
                    <th>FULL NAME</th>
                    <th>EMAIL ADDRESS</th>
                    <th>PHONE NUMBER</th>
                    <th>ACCOUNT STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted">
                        Loading customer records...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted">
                        No customer records found.
                      </td>
                    </tr>
                  ) : (
                    customers
                      .filter((c) =>
                        `${c?.name || ""} ${c?.email || ""} ${c?.phone || ""}`
                          .toLowerCase()
                          .includes(customerSearch.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.id}>
                          <td className="font-mono text-primary font-bold">#{c.id}</td>
                          <td className="font-semibold text-slate">{c.name}</td>
                          <td className="text-muted">{c.email}</td>
                          <td className="text-muted">{c.phone}</td>
                          <td>
                            <span
                              className={`badge ${c.isBlocked ? "badge-danger" : "badge-success"}`}
                            >
                              {c.isBlocked ? "● Blocked" : "● Active"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`btn-action-small ${
                                c.isBlocked ? "btn-success" : "btn-danger"
                              }`}
                              onClick={() => handleBlockToggleConfirm(c)}
                            >
                              {c.isBlocked ? "Unblock Account" : "Block Customer"}
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : currentTab === "inventory" || currentTab === "medicines" ? (
        /* MEDICINE CATALOG & LIVE STOCK MANAGEMENT VIEW */
        <div className="tab-container">
          <div className="tab-header">
            <div>
              <h2 className="tab-title">Medicine Catalog & Live Stock Management</h2>
              <p className="tab-subtitle">Add new pharmaceuticals, check real-time stock, and manage live inventory levels.</p>
            </div>
            <div className="tab-actions" style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fefce8", color: "#a16207", border: "1px solid #fef08a" }}
                onClick={() => setShowReportFilterModal(true)}
              >
                <FileText size={16} /> Filter & Export Inventory PDF
              </button>
              <button className="btn-primary" onClick={() => setActiveModal("add-medicine")}>
                <Plus size={16} /> Add New Medicine
              </button>
            </div>
          </div>

          {/* Search & Stock Filter Bar */}
          <div className="inventory-controls-bar">
            <div className="table-search-box flex-1">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search medicine by name, category, description..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
            </div>
            <div className="stock-filter-pills">
              <button
                className={`stock-pill ${stockFilter === "all" ? "active" : ""}`}
                onClick={() => setStockFilter("all")}
              >
                All ({medicines.length})
              </button>
              <button
                className={`stock-pill ${stockFilter === "instock" ? "active" : ""}`}
                onClick={() => setStockFilter("instock")}
              >
                In Stock ({medicines.filter((m) => m.stock >= 20).length})
              </button>
              <button
                className={`stock-pill warning ${stockFilter === "lowstock" ? "active" : ""}`}
                onClick={() => setStockFilter("lowstock")}
              >
                Low Stock ({medicines.filter((m) => m.stock > 0 && m.stock < 20).length})
              </button>
              <button
                className={`stock-pill danger ${stockFilter === "outstock" ? "active" : ""}`}
                onClick={() => setStockFilter("outstock")}
              >
                Out of Stock ({medicines.filter((m) => m.stock === 0).length})
              </button>
            </div>
          </div>

          <div className="saas-card table-card">
            <div className="table-responsive">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>MEDICINE DETAILS</th>
                    <th>CATEGORY</th>
                    <th>UNIT PRICE</th>
                    <th>DISCOUNT</th>
                    <th>LIVE STOCK LEVEL</th>
                    <th>STOCK STATUS</th>
                    <th>LIVE STOCK CONTROL</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-muted">
                        No medicines match your current search/filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((med) => {
                      const isLow = med.stock < 20 && med.stock > 0;
                      const isOut = med.stock === 0;
                      const stockPct = Math.min((med.stock / 100) * 100, 100);

                      return (
                        <tr key={med.id}>
                          <td className="font-semibold text-slate">
                            <div className="medicine-cell-large">
                              <img
                                src={med.image || `https://placehold.co/100x100/e0f2fe/087ea4?text=${encodeURIComponent(med.name)}`}
                                alt={med.name}
                                className="medicine-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://placehold.co/100x100/e0f2fe/087ea4?text=Rx";
                                }}
                              />
                              <div>
                                <div className="medicine-title">{med.name}</div>
                                <div className="medicine-sub">{med.description ? `${med.description.slice(0, 45)}...` : `ID: #${med.id}`}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="category-tag">{med.category || "General"}</span>
                          </td>
                          <td className="font-bold text-slate">{formatCurrency(med.price)}</td>
                          <td>
                            <span className="discount-tag">{med.discount}% OFF</span>
                          </td>
                          <td>
                            <div className="stock-level-cell">
                              <span className="stock-count-number">{med.stock} units</span>
                              <div className="stock-track">
                                <div
                                  className="stock-fill"
                                  style={{
                                    width: `${stockPct}%`,
                                    backgroundColor: isOut ? "#ef4444" : isLow ? "#f59e0b" : "#10b981",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                isOut ? "badge-danger" : isLow ? "badge-warning" : "badge-success"
                              }`}
                            >
                              {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: "5px 10px", fontSize: 12, fontWeight: 700, background: "#f0f9ff", color: "#087ea4", border: "1px solid #bae6fd", display: "inline-flex", alignItems: "center", gap: 4 }}
                                onClick={() => handleOpenDashStockModal(med, "overview")}
                              >
                                <Boxes size={13} /> Stock
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: "5px 8px", fontSize: 12, fontWeight: 700 }}
                                onClick={() => handleOpenDashStockModal(med, "customers")}
                                title="View Customer Usage"
                              >
                                <Users size={13} />
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: "5px 8px", fontSize: 12, fontWeight: 700 }}
                                onClick={() => generateSingleMedicinePDFReport(med)}
                                title="Generate PDF Audit Report"
                              >
                                <FileText size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : currentTab === "orders" ? (
        /* FULL ORDERS TAB VIEW */
        <div className="tab-container">
          <div className="tab-header">
            <div>
              <h2 className="tab-title">All Pharmacy Orders</h2>
              <p className="tab-subtitle">Real-time order management, delivery dispatch, and status updates.</p>
            </div>
            <div className="tab-actions">
              <div className="table-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search order ID, customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="saas-card table-card">
            <div className="table-responsive">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>MEDICINES / ITEMS</th>
                    <th>TOTAL AMOUNT</th>
                    <th>DELIVERY PARTNER</th>
                    <th>STATUS</th>
                    <th>UPDATE STATUS</th>
                    <th>INVOICE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-mono text-primary font-bold">#{order.id}</td>
                      <td className="font-semibold text-slate">{order.customerName || order.userName || "Customer"}</td>
                      <td className="text-muted text-truncate max-w-200">{order.medicine || "Prescription medicines"}</td>
                      <td className="font-bold text-slate">{formatCurrency(order.totalPrice || order.total)}</td>
                      <td>
                        {order.deliveryPartner ? (
                          <span className="delivery-partner-tag">
                            <Truck size={13} /> {order.deliveryPartner}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge badge-status-${(order.status || "processing")
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {order.status || "Processing"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="saas-select-small"
                          value={order.status || "Processing"}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                        >
                          <option>Processing</option>
                          <option>Out for Delivery</option>
                          <option>Delivered</option>
                          <option>Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-action-small"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0f9ff", color: "#087ea4", border: "1px solid #bae6fd" }}
                          onClick={() => generateOrderInvoicePDF(order)}
                          title="Generate PDF Order Invoice"
                        >
                          <FileText size={13} /> PDF Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : currentTab === "settings" ? (
        /* SETTINGS TAB VIEW */
        <div className="tab-container">
          <div className="tab-header">
            <div>
              <h2 className="tab-title">Pharmacy System Settings</h2>
              <p className="tab-subtitle">Configure store parameters, notifications, and branch details.</p>
            </div>
          </div>

          <div className="saas-card p-6">
            <div className="form-group mb-4">
              <label>Pharmacy Store Name</label>
              <input type="text" defaultValue="PharmaCare Headquarters" readOnly />
            </div>
            <div className="form-group mb-4">
              <label>System Currency</label>
              <input type="text" defaultValue="INR (₹)" readOnly />
            </div>
            <div className="form-group mb-4">
              <label>Low Stock Warning Threshold</label>
              <input type="number" defaultValue={20} readOnly />
            </div>
            <div className="form-group">
              <label>System Version</label>
              <input type="text" defaultValue="PharmaCare SaaS v2.4 (Production)" readOnly />
            </div>
          </div>
        </div>
      ) : (
        /* MAIN DASHBOARD TAB VIEW */
        <>
          {/* Top Greeting Header */}
          <div className="dashboard-greeting-header">
            <div>
              <h1 className="greeting-title">
                {getGreeting()}, {adminName} <span className="hand-wave">👋</span>
              </h1>
              <p className="greeting-subtitle">
                Here's what's happening with your pharmacy management system today.
              </p>
            </div>
            <div className="greeting-right-controls">
              <span className="current-date-badge">{currentDateFormatted}</span>
              <div className="date-range-pill-selector">
                {["Today", "7 Days", "30 Days", "Custom"].map((range) => (
                  <button
                    key={range}
                    className={`range-pill ${dateRange === range ? "active" : ""}`}
                    onClick={() => setDateRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Bar */}
          <div className="quick-actions-bar">
            <button className="qa-btn" onClick={() => setActiveModal("add-medicine")}>
              <Plus size={15} /> Add Medicine
            </button>
            <button className="qa-btn" onClick={() => navigate("/admin?tab=orders")}>
              <ShoppingBag size={15} /> Create Order
            </button>
            <button
              className="qa-btn"
              onClick={() => {
                setActiveModal("add-customer");
              }}
            >
              <UserPlus size={15} /> Add Customer
            </button>
            <button
              className="qa-btn"
              onClick={() => setActiveModal("add-partner")}
            >
              <Truck size={15} /> Add Delivery Partner
            </button>
            <button className="qa-btn qa-btn-secondary" onClick={() => navigate("/admin/generate-report")}>
              <FileText size={15} /> View Reports
            </button>
          </div>

          {/* 6 KPI Cards Grid */}
          <div className="kpi-cards-grid">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Total Revenue</span>
                <div className="kpi-icon-wrapper teal">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{formatCurrency(totalRevenue || 84290)}</span>
                <span className="kpi-trend positive">
                  <ArrowUpRight size={14} /> +12.5%
                </span>
              </div>
              <span className="kpi-subtext">vs last period</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Total Orders</span>
                <div className="kpi-icon-wrapper blue">
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{recentOrders.length || 154}</span>
                <span className="kpi-trend positive">
                  <ArrowUpRight size={14} /> +8.2%
                </span>
              </div>
              <span className="kpi-subtext">Total store orders</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Active Orders</span>
                <div className="kpi-icon-wrapper amber">
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{activeOrdersCount}</span>
                <span className="kpi-badge-sub">Processing</span>
              </div>
              <span className="kpi-subtext">Currently being fulfilled</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Customers</span>
                <div className="kpi-icon-wrapper purple">
                  <Users size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{dashboardData?.stats?.totalCustomers || 128}</span>
                <span className="kpi-trend positive">
                  <ArrowUpRight size={14} /> +5.4%
                </span>
              </div>
              <span className="kpi-subtext">Registered user accounts</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Low Stock Items</span>
                <div className="kpi-icon-wrapper red">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{lowStockCount}</span>
                <span className="kpi-badge-sub danger">Needs Attention</span>
              </div>
              <span className="kpi-subtext">Below threshold (20 units)</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Pending Deliveries</span>
                <div className="kpi-icon-wrapper green">
                  <Truck size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{activeDeliveries || 6}</span>
                <span className="kpi-badge-sub info">In Transit</span>
              </div>
              <span className="kpi-subtext">Currently out for delivery</span>
            </div>
          </div>

          {/* ATTENTION REQUIRED (ALERTS) SECTION */}
          <div className="attention-section">
            <div className="section-title-row">
              <div className="title-with-badge">
                <ShieldAlert size={18} className="text-warning" />
                <h3 className="section-title">Attention Required</h3>
                <span className="section-count-badge">4 Action Items</span>
              </div>
              <button
                className="link-btn-text"
                onClick={() => navigate("/admin/alerts")}
              >
                Manage All Alerts <ChevronRight size={14} />
              </button>
            </div>

            <div className="alerts-cards-row">
              <div
                className="alert-pill-card warning"
                onClick={() => navigate("/admin/restock")}
              >
                <div className="alert-card-left">
                  <div className="alert-icon-circle warning">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="alert-card-title">{lowStockCount} Medicines Low in Stock</h4>
                    <p className="alert-card-sub">Current stock is below minimum reorder quantity</p>
                  </div>
                </div>
                <span className="alert-severity-badge warning">Warning</span>
              </div>

              <div
                className="alert-pill-card critical"
                onClick={() => navigate("/admin/emergency-order")}
              >
                <div className="alert-card-left">
                  <div className="alert-icon-circle critical">
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <h4 className="alert-card-title">2 Emergency Orders Pending</h4>
                    <p className="alert-card-sub">Urgent hospital request pending vendor confirmation</p>
                  </div>
                </div>
                <span className="alert-severity-badge critical">Critical</span>
              </div>

              <div
                className="alert-pill-card info"
                onClick={() => navigate("/admin?tab=customers")}
              >
                <div className="alert-card-left">
                  <div className="alert-icon-circle info">
                    <Info size={16} />
                  </div>
                  <div>
                    <h4 className="alert-card-title">5 Customers Require Verification</h4>
                    <p className="alert-card-sub">Prescription document uploaded for admin approval</p>
                  </div>
                </div>
                <span className="alert-severity-badge info">Info</span>
              </div>

              <div
                className="alert-pill-card success"
                onClick={() => navigate("/admin/delivery-team")}
              >
                <div className="alert-card-left">
                  <div className="alert-icon-circle success">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="alert-card-title">Delivery Partners Online</h4>
                    <p className="alert-card-sub">{deliveryPeople.length || 8} active drivers assigned</p>
                  </div>
                </div>
                <span className="alert-severity-badge success">Success</span>
              </div>
            </div>
          </div>

          {/* ANALYTICS CHARTS SECTION */}
          {loading ? (
            <div className="loading-skeleton-container">
              <div className="skeleton-card height-300" />
              <div className="skeleton-card height-300" />
            </div>
          ) : (
            <div className="analytics-charts-grid">
              {/* LEFT: Sales Overview Line/Area Chart */}
              <div className="saas-card chart-card">
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">Sales Overview</h3>
                    <p className="card-subtitle">Monthly revenue trends and performance metrics</p>
                  </div>
                  <button className="icon-btn-subtle" title="Export Chart">
                    <ExternalLink size={15} />
                  </button>
                </div>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={280} minHeight={280}>
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#087ea4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#087ea4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickFormatter={(val) => `₹${val / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                        }}
                        formatter={(val) => [formatCurrency(val), "Revenue"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#087ea4"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#salesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RIGHT: Order Status Donut Chart */}
              <div className="saas-card chart-card">
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">Order Status Distribution</h3>
                    <p className="card-subtitle">Breakdown of active vs completed orders</p>
                  </div>
                </div>
                <div className="chart-wrapper donut-wrapper">
                  <ResponsiveContainer width="100%" height={240} minHeight={240}>
                    <PieChart>
                      <Pie
                        data={orderStatusCounts}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {orderStatusCounts.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} orders`, name]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(val) => <span style={{ color: "#475569", fontSize: 12, fontWeight: 600 }}>{val}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TOP SELLING MEDICINES TABLE */}
          <div className="saas-card table-card margin-bottom-24">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Top Selling Medicines</h3>
                <p className="card-subtitle">Highest volume prescription and OTC medicines sold</p>
              </div>
              <button
                className="link-btn-text"
                onClick={() => navigate("/admin?tab=inventory")}
              >
                Manage Live Inventory <ChevronRight size={14} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>MEDICINE NAME</th>
                    <th>CATEGORY</th>
                    <th>UNITS SOLD</th>
                    <th>REVENUE GENERATED</th>
                    <th>STOCK LEVEL</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellingMedicines.map((med, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-slate">
                        <div className="medicine-cell">
                          <Pill size={16} className="text-primary" />
                          <span>{med.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{med.category}</span>
                      </td>
                      <td className="font-medium text-slate">{med.unitsSold} units</td>
                      <td className="font-bold text-success">{formatCurrency(med.revenue)}</td>
                      <td className="font-medium">{med.stock} units</td>
                      <td>
                        <span
                          className={`badge ${
                            med.stock < 20 ? "badge-warning" : "badge-success"
                          }`}
                        >
                          {med.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECENT ORDERS TABLE */}
          <div className="saas-card table-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Recent Orders</h3>
                <p className="card-subtitle">Live real-time stream of incoming customer pharmacy orders</p>
              </div>

              <div className="table-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search order ID, customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>ITEMS</th>
                    <th>AMOUNT</th>
                    <th>DELIVERY PARTNER</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th>UPDATE STATUS</th>
                    <th>INVOICE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-muted">
                        No matching orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-mono text-primary font-bold">#{order.id}</td>
                        <td className="font-semibold text-slate">{order.customerName || order.userName || "Customer"}</td>
                        <td className="text-muted text-truncate max-w-200">{order.medicine || "Prescription medicines"}</td>
                        <td className="font-bold text-slate">
                          {formatCurrency(order.totalPrice || order.total)}
                        </td>
                        <td>
                          {order.deliveryPartner ? (
                            <span className="delivery-partner-tag">
                              <Truck size={13} /> {order.deliveryPartner}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge badge-status-${(
                              order.status || "processing"
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {order.status || "Processing"}
                          </span>
                        </td>
                        <td className="text-muted text-xs">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })
                            : "Today"}
                        </td>
                        <td>
                          <select
                            className="saas-select-small"
                            value={order.status || "Processing"}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          >
                            <option>Processing</option>
                            <option>Out for Delivery</option>
                            <option>Delivered</option>
                            <option>Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn-action-small"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0f9ff", color: "#087ea4", border: "1px solid #bae6fd" }}
                            onClick={() => generateOrderInvoicePDF(order)}
                            title="Generate PDF Order Invoice"
                          >
                            <FileText size={13} /> PDF Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ADD MEDICINE MODAL DIALOG */}
      {activeModal === "add-medicine" && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Medicine to Catalog</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateMedicineSubmit} className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Medicine Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol Extra 650mg"
                    value={medicineForm.name}
                    onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={medicineForm.category}
                    onChange={(e) => setMedicineForm({ ...medicineForm, category: e.target.value })}
                  >
                    <option value="Analgesic">Analgesic (Pain Relief)</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Vitamins">Vitamins & Supplements</option>
                    <option value="Cough & Cold">Cough & Cold</option>
                    <option value="Antacid">Antacid & Digestion</option>
                    <option value="Anti-Diabetic">Anti-Diabetic</option>
                    <option value="Antihistamine">Antihistamine & Allergy</option>
                    <option value="General">General Care</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150"
                    value={medicineForm.price}
                    onChange={(e) => setMedicineForm({ ...medicineForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Discount %</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={medicineForm.discount}
                    onChange={(e) => setMedicineForm({ ...medicineForm, discount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Initial Live Stock *</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={medicineForm.stock}
                    onChange={(e) => setMedicineForm({ ...medicineForm, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Medicine Description</label>
                <textarea
                  rows={3}
                  placeholder="Usage instructions, active ingredients, dosage notes..."
                  value={medicineForm.description}
                  onChange={(e) => setMedicineForm({ ...medicineForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={medicineForm.image}
                  onChange={(e) => setMedicineForm({ ...medicineForm, image: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? "Adding..." : "Add Medicine to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DELIVERY PARTNER MODAL */}
      {activeModal === "add-partner" && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Delivery Partner</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePartnerSubmit} className="modal-body">
              <div className="form-group">
                <label>Partner Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={partnerForm.phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? "Adding..." : "Add Delivery Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {activeModal === "confirm-action" && confirmConfig && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{confirmConfig.title}</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>{confirmConfig.message}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button
                className={`btn-primary btn-${confirmConfig.confirmVariant || "danger"}`}
                onClick={confirmConfig.onConfirm}
              >
                {confirmConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD STOCK MANAGEMENT MODAL */}
      {dashStockModalMed && (
        <StockManagementModal
          medicine={dashStockModalMed}
          initialTab={dashStockModalTab}
          onClose={() => setDashStockModalMed(null)}
          onStockUpdated={handleDashStockUpdated}
        />
      )}

      {/* DASHBOARD ALL MEDICINES REPORT FILTER MODAL */}
      {showReportFilterModal && (
        <InventoryReportFilterModal
          medicines={medicines}
          onClose={() => setShowReportFilterModal(false)}
        />
      )}
    </div>
  );
}
