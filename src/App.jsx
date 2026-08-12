import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginModern from "./pages/LoginModern";
import ForgotPassword from "./pages/ForgotPassword";
import SignupModern from "./pages/SignupModern";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Inventory from "./pages/Inventory";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Dashboard from "./Dashboard";
import DeliveryTeam from "./DeliveryTeam";
import OrderFromSeller from "./components/OrderFromSeller";
import Profile from "./pages/Profile";

import AdminCustomers from "./pages/AdminCustomers";
import AdminDeliveryManagement from "./pages/AdminDeliveryManagement";
import DeliveryLogin from "./pages/DeliveryLogin";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import AIInsights from "./pages/AIInsights";
import Restock from "./Restock";
import BulkDiscount from "./BulkDiscount";
import EmergencyOrder from "./EmergencyOrder";
import GenerateReport from "./GenerateReport";
import AdminPaymentDashboard from "./pages/AdminPaymentDashboard";
import {
  fetchDeliveryPartners,
  fetchMedicines,
  fetchOrders,
} from "./lib/store";

import { getStoredUser } from "./lib/auth";
import AdminLayout from "./components/AdminLayout";

function AppContent() {
  const [user, setUser] = useState(() => getStoredUser());

  const [medicines, setMedicines] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("cart");
      return stored && stored !== "undefined" ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [orders, setOrders] = useState([]);
  const [deliveryPeople, setDeliveryPeople] = useState([]);

  // Sync user across tabs
  useEffect(() => {
    const onStorage = () => {
      setUser(getStoredUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Ensure user updates instantly in same tab
  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadAppData() {
      setDataLoading(true);
      try {
        const medicineData = await fetchMedicines();
        if (!ignore) setMedicines(medicineData);

        if (user) {
          const [deliveryData, orderData] = await Promise.all([
            fetchDeliveryPartners(),
            fetchOrders(
              String(user?.role || "").toLowerCase().includes("admin") || user?.isAdmin
                ? undefined
                : user.id
            ),
          ]);
          if (!ignore) {
            setDeliveryPeople(deliveryData);
            setOrders(orderData);
          }
        } else {
          if (!ignore) {
            setDeliveryPeople([]);
            setOrders([]);
          }
        }
      } catch (error) {
        console.error("Failed to load app data:", error);
      } finally {
        if (!ignore) setDataLoading(false);
      }
    }

    loadAppData();
    return () => {
      ignore = true;
    };
  }, [user]);

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const refreshMedicinesAndOrders = async () => {
    try {
      const updatedMeds = await fetchMedicines();
      if (Array.isArray(updatedMeds)) setMedicines(updatedMeds);
      if (user?.id) {
        const updatedOrders = await fetchOrders(user.id);
        if (Array.isArray(updatedOrders)) setOrders(updatedOrders);
      }
    } catch (e) {
      console.warn("Failed to refresh app data:", e);
    }
  };

  // Add to cart with stock validation & micro-feedback
  const addToCart = (m, qtyToAdd = 1) => {
    const stock = Number(m.stock || 0);
    const existingIndex = cart.findIndex(item => item.id === m.id);
    const currentQtyInCart = existingIndex !== -1 ? (cart[existingIndex].qty || 1) : 0;

    if (stock < 1) {
      setToastMessage({
        type: "error",
        title: "Out of Stock",
        text: `${m.name} is currently out of stock.`
      });
      return false;
    }

    if (currentQtyInCart + qtyToAdd > stock) {
      setToastMessage({
        type: "warning",
        title: "Stock Limit Reached",
        text: `Only ${stock} unit(s) available for ${m.name}.`
      });
      return false;
    }

    let updated;
    if (existingIndex !== -1) {
      updated = cart.map((item, i) =>
        i === existingIndex ? { ...item, qty: (item.qty || 1) + qtyToAdd } : item
      );
    } else {
      updated = [...cart, { ...m, qty: qtyToAdd }];
    }

    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));

    setToastMessage({
      type: "success",
      title: "Added to Cart!",
      text: `${m.name} added to your cart.`
    });
    return true;
  };

  // Remove from cart
  const removeFromCart = (id) => {
    let updated = cart
      .map(item =>
        item.id === id
          ? { ...item, qty: (item.qty || 1) - 1 }
          : item
      )
      .filter(item => (item.qty || 1) > 0);

    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  // Keep cart synced
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const location = useLocation();

  // NAVBAR LOGIC - Hide customer navbar on landing, login, signup, admin, and delivery pages
  const hideNavbar =
    location.pathname === "/" ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/delivery") ||
    String(user?.role || "").toLowerCase().includes("delivery") ||
    String(user?.role || "").toLowerCase().includes("admin") ||
    Boolean(user?.isAdmin);

  const renderAdminView = (Component) => (
    <ProtectedRoute user={user} requiredRole="admin">
      <AdminLayout user={user} setUser={setUser}>
        {Component}
      </AdminLayout>
    </ProtectedRoute>
  );

  return (
    <>
      {user && !hideNavbar && (
        <Navbar user={user} setUser={setUser} cart={cart} />
      )}

      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<Navigate to="/login/admin" replace />} />
        <Route path="/login/:role" element={<LoginModern setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<Navigate to="/signup/customer" replace />} />
        <Route path="/register" element={<Navigate to="/signup/customer" replace />} />
        <Route path="/signup/:role" element={<SignupModern setUser={setUser} />} />
        <Route path="/" element={<Landing medicines={medicines} />} />

        {/* Customer Routes */}
        <Route path="/customer/dashboard" element={<Navigate to="/home" replace />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute user={user}>
              <Home
                cart={cart}
                addToCart={addToCart}
                orders={orders}
                medicines={medicines}
                loading={dataLoading}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute user={user}>
              <Inventory medicines={medicines} setMedicines={setMedicines} addToCart={addToCart} loading={dataLoading} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute user={user}>
              <Cart
                cart={cart}
                setCart={setCart}
                medicines={medicines}
                setMedicines={setMedicines}
                setOrders={setOrders}
                orders={orders}
                deliveryPeople={deliveryPeople}
                setDeliveryPeople={setDeliveryPeople}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                refreshData={refreshMedicinesAndOrders}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute user={user}>
              <Orders orders={orders} setOrders={setOrders} deliveryPeople={deliveryPeople} refreshData={refreshMedicinesAndOrders} />
            </ProtectedRoute>
          }
        />

        {/* Profile Route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <Profile user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard Routes */}
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin"
          element={renderAdminView(
            <Dashboard
              setUser={setUser}
              medicines={medicines}
              setMedicines={setMedicines}
              deliveryPeople={deliveryPeople}
              setDeliveryPeople={setDeliveryPeople}
              orders={orders}
              setOrders={setOrders}
            />
          )}
        />

        {/* Admin Customers Route */}
        <Route
          path="/admin/customers"
          element={renderAdminView(<AdminCustomers adminUser={user} />)}
        />

        {/* Admin Payments & Refunds Route */}
        <Route
          path="/admin/payments"
          element={renderAdminView(<AdminPaymentDashboard />)}
        />

        {/* Admin Analytics Route */}
        <Route
          path="/admin/analytics"
          element={renderAdminView(<Analytics />)}
        />

        {/* Admin Alerts Route */}
        <Route
          path="/admin/alerts"
          element={renderAdminView(<Alerts />)}
        />

        {/* Admin AI Insights Route */}
        <Route
          path="/admin/ai-insights"
          element={renderAdminView(<AIInsights />)}
        />

        {/* Admin Restock Route */}
        <Route
          path="/admin/restock"
          element={renderAdminView(<Restock medicines={medicines} />)}
        />

        {/* Admin Bulk Discount Route */}
        <Route
          path="/admin/bulk-discount"
          element={renderAdminView(<BulkDiscount medicines={medicines} setMedicines={setMedicines} />)}
        />

        {/* Admin Emergency Order Route */}
        <Route
          path="/admin/emergency-order"
          element={renderAdminView(<EmergencyOrder />)}
        />

        {/* Admin Generate Report Route */}
        <Route
          path="/admin/generate-report"
          element={renderAdminView(<GenerateReport />)}
        />

        {/* Delivery Partner Login & Dashboard Routes */}
        <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />
        <Route path="/delivery/portal" element={<Navigate to="/delivery/dashboard" replace />} />
        <Route path="/delivery-portal" element={<Navigate to="/delivery/dashboard" replace />} />

        <Route path="/login/delivery" element={<DeliveryLogin setUser={setUser} />} />
        <Route path="/delivery/login" element={<DeliveryLogin setUser={setUser} />} />
        <Route path="/delivery/dashboard" element={<DeliveryDashboard user={user} setUser={setUser} />} />

        {/* Admin Delivery Management Route */}
        <Route path="/admin/delivery" element={renderAdminView(<AdminDeliveryManagement />)} />
        <Route path="/admin/delivery-team" element={renderAdminView(<AdminDeliveryManagement />)} />

        {/* Admin Procurement / Order from Seller Route */}
        <Route
          path="/admin/order-from-seller"
          element={renderAdminView(<OrderFromSeller medicines={medicines} />)}
        />

        {/* Catch-all Route - Redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating Add to Cart & Status Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: toastMessage.type === "error" ? "#FEF2F2" : toastMessage.type === "warning" ? "#FFFBEB" : "#F0FDF4",
          border: `1.5px solid ${toastMessage.type === "error" ? "#FCA5A5" : toastMessage.type === "warning" ? "#FCD34D" : "#86EFAC"}`,
          borderRadius: 14,
          padding: "14px 20px",
          boxShadow: "0 12px 32px rgba(15,23,42,0.18)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          maxWidth: 380,
          animation: "toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: toastMessage.type === "error" ? "#DC2626" : toastMessage.type === "warning" ? "#D97706" : "#16A34A",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            {toastMessage.type === "error" ? "❌" : toastMessage.type === "warning" ? "⚠️" : "🛒"}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{toastMessage.title}</h4>
            <p style={{ margin: "2px 0 0 0", fontSize: 12.5, color: "#475569" }}>{toastMessage.text}</p>
          </div>
          {toastMessage.type === "success" && (
            <a
              href="/cart"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#087EA4",
                background: "#E0F2FE",
                padding: "6px 12px",
                borderRadius: 8,
                textDecoration: "none",
                whiteSpace: "nowrap"
              }}
            >
              View Cart →
            </a>
          )}
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 16 }}
          >
            ✕
          </button>
        </div>
      )}

      {user && !hideNavbar && <Footer />}

      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
