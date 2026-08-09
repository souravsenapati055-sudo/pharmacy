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
import {
  fetchDeliveryPartners,
  fetchMedicines,
  fetchOrders,
} from "./lib/store";

import AdminLayout from "./components/AdminLayout";

function AppContent() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const [medicines, setMedicines] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  const [orders, setOrders] = useState([]);
  const [deliveryPeople, setDeliveryPeople] = useState([]);

  // Sync user across tabs
  useEffect(() => {
    const onStorage = () => {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Ensure user updates instantly in same tab
  useEffect(() => {
    const u = localStorage.getItem("user");
    setUser(u ? JSON.parse(u) : null);
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

  // Add to cart
  const addToCart = (m) => {
    const idx = cart.findIndex(item => item.id === m.id);
    let updated;

    if (idx !== -1) {
      updated = cart.map((item, i) =>
        i === idx ? { ...item, qty: (item.qty || 1) + 1 } : item
      );
    } else {
      updated = [...cart, { ...m, qty: 1 }];
    }

    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
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
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute user={user}>
              <Orders orders={orders} setOrders={setOrders} deliveryPeople={deliveryPeople} />
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
          element={renderAdminView(<EmergencyOrder medicines={medicines} />)}
        />

        {/* Admin Generate Report Route */}
        <Route
          path="/admin/generate-report"
          element={renderAdminView(<GenerateReport />)}
        />

        {/* Delivery Partner Login & Dashboard Routes */}
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

      {user && !hideNavbar && <Footer />}
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
