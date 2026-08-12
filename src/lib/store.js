import { apiRequest } from "./auth";

export function fetchMedicines() {
  return apiRequest("/medicines");
}

/**
 * Send real Google ID token (JWT credential) to backend for verification.
 * @param {string} credential - The Google ID token returned by GIS SDK
 */
export function googleSignIn(credential) {
  return apiRequest("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export function completeGooglePhone(userId, phone) {
  return apiRequest("/auth/google/complete-phone", {
    method: "POST",
    body: JSON.stringify({ userId, phone }),
  });
}

export function verifySignupOtp(email, otp) {
  return apiRequest("/auth/signup/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export function requestSignupOtp(email) {
  return apiRequest("/auth/signup/request-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function createMedicine(payload) {
  return apiRequest("/medicines", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMedicineStock(id, stock) {
  return apiRequest(`/medicines/${id}/stock`, {
    method: "PATCH",
    body: JSON.stringify({ stock }),
  });
}

export function addMedicineStock(id, payload) {
  return apiRequest(`/admin/medicines/${id}/add-stock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reduceMedicineStock(id, payload) {
  return apiRequest(`/admin/medicines/${id}/reduce-stock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMedicineStockHistory(id, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/admin/medicines/${id}/history?${query}`);
}

export function fetchMedicineCustomers(id) {
  return apiRequest(`/admin/medicines/${id}/customers`);
}

export function fetchDeliveryPartners() {
  return apiRequest("/delivery-partners");
}

export function fetchOrders(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return apiRequest(`/orders${query}`);
}

export function fetchHomeOverview(userId) {
  return apiRequest(`/home?userId=${encodeURIComponent(userId)}`);
}

export function createOrder(payload) {
  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOrderStatus(id, status) {
  return apiRequest(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function fetchPaymentConfig() {
  return apiRequest("/payment/config");
}

export function applyCoupon(code, orderTotal) {
  return apiRequest("/coupons/apply", {
    method: "POST",
    body: JSON.stringify({ code, orderTotal }),
  });
}

export function createRazorpayOrder(payload) {
  return apiRequest("/payment/create-razorpay-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyRazorpayPayment(payload) {
  return apiRequest("/payment/verify-razorpay-signature", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function retryOrderPayment(payload) {
  return apiRequest("/payment/retry", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAdminPayments() {
  return apiRequest("/admin/payments");
}

export function processRefund(payload) {
  return apiRequest("/admin/payments/refund", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCustomerPaymentHistory(userId) {
  return apiRequest(`/customer/payments?userId=${encodeURIComponent(userId)}`);
}

export function fetchAdminDashboard() {
  return apiRequest("/admin/dashboard");
}

export function fetchAdminAnalytics(range = "weekly") {
  return apiRequest(`/admin/analytics?range=${encodeURIComponent(range)}`);
}

export function fetchAdminAlerts() {
  return apiRequest("/admin/alerts");
}

export function fetchAdminInsights() {
  return apiRequest("/admin/insights");
}

export function fetchAdminReport(params) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/admin/report?${query}`);
}

export function fetchVendors(vendorType) {
  const query = vendorType ? `?vendorType=${encodeURIComponent(vendorType)}` : "";
  return apiRequest(`/admin/vendors${query}`);
}

export function fetchProcurementOrders(source) {
  const query = source ? `?source=${encodeURIComponent(source)}` : "";
  return apiRequest(`/admin/procurement-orders${query}`);
}

export function createProcurementOrder(payload) {
  return apiRequest("/admin/procurement-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function applyBulkDiscount(payload) {
  return apiRequest("/admin/discounts/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUserProfile(userId, payload) {
  return apiRequest(`/users/${encodeURIComponent(userId)}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchPredictionSymptoms() {
  return apiRequest("/prediction/symptoms");
}

export function predictDisease(symptoms) {
  return apiRequest("/prediction/disease", {
    method: "POST",
    body: JSON.stringify({ symptoms }),
  });
}

export function fetchAdminCustomersStats() {
  return apiRequest("/admin/customers/stats");
}

export function fetchAdminCustomers(query = "") {
  return apiRequest(`/admin/customers${query}`);
}

export function fetchAdminCustomerDetails(id) {
  return apiRequest(`/admin/customers/${id}`);
}

export function blockCustomer(id, payload = {}) {
  return apiRequest(`/admin/customers/${id}/block`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function toggleBlockCustomer(id, isBlocked) {
  return isBlocked ? unblockCustomer(id) : blockCustomer(id);
}

export function unblockCustomer(id, payload = {}) {
  return apiRequest(`/admin/customers/${id}/unblock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function suspendCustomer(id, payload = {}) {
  return apiRequest(`/admin/customers/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function restoreCustomer(id, payload = {}) {
  return apiRequest(`/admin/customers/${id}/restore`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteCustomer(id, payload = {}) {
  return apiRequest(`/admin/customers/${id}/delete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchDeletedCustomersAudit() {
  return apiRequest("/admin/customers/deleted");
}

export function fetchAdminAuditLogs() {
  return apiRequest("/admin/audit-logs");
}

// Delivery Boy APIs
export function deliveryLogin(payload) {
  return apiRequest("/delivery/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function toggleDeliveryOnlineStatus(partnerId, isOnline) {
  return apiRequest("/delivery/online-status", {
    method: "POST",
    body: JSON.stringify({ partnerId, isOnline }),
  });
}

export function fetchAvailableDeliveryOrders() {
  return apiRequest("/delivery/orders/available");
}

export function fetchDeliveryStats(partnerId) {
  return apiRequest(`/delivery/stats?partnerId=${encodeURIComponent(partnerId)}`);
}

export function fetchDeliveryHistory(partnerId) {
  return apiRequest(`/delivery/orders/history?partnerId=${encodeURIComponent(partnerId)}`);
}

export function fetchDeliveryNotifications(partnerId) {
  return apiRequest(`/delivery/notifications?partnerId=${encodeURIComponent(partnerId)}`);
}

export function markDeliveryNotificationRead(id) {
  return apiRequest(`/delivery/notifications/${id}/read`, { method: "POST" });
}

export function fetchDeliveryEarnings(partnerId) {
  return apiRequest(`/delivery/earnings?partnerId=${encodeURIComponent(partnerId)}`);
}

export function fetchActiveDeliveryOrder(partnerId) {
  return apiRequest(`/delivery/orders/active?partnerId=${encodeURIComponent(partnerId)}`);
}

export function acceptDeliveryOrder(orderId, partnerId) {
  return apiRequest(`/delivery/orders/${orderId}/accept`, {
    method: "POST",
    body: JSON.stringify({ partnerId }),
  });
}

export function batchAcceptDeliveryOrders(orderIds, partnerId) {
  return apiRequest("/delivery/orders/batch-accept", {
    method: "POST",
    body: JSON.stringify({ orderIds, partnerId }),
  });
}

export function updateDeliveryOrderStatus(orderId, partnerId, status, notes = "", location = "") {
  return apiRequest(`/delivery/orders/${orderId}/status`, {
    method: "POST",
    body: JSON.stringify({ partnerId, status, notes, location }),
  });
}

export function batchUpdateDeliveryOrderStatus(orderIds, partnerId, status, notes = "", location = "") {
  return apiRequest("/delivery/orders/batch-status", {
    method: "POST",
    body: JSON.stringify({ orderIds, partnerId, status, notes, location }),
  });
}

export function sendDeliveryLocation(partnerId, latitude, longitude, locationName = "") {
  return apiRequest("/delivery/location", {
    method: "POST",
    body: JSON.stringify({ partnerId, latitude, longitude, locationName }),
  });
}

// Admin Delivery Management APIs
export function fetchAdminDeliveryOverview() {
  return apiRequest("/admin/delivery/overview");
}

export function fetchAdminDeliveryPartners() {
  return apiRequest("/admin/delivery-partners");
}

export function createDeliveryPartner(payload) {
  return apiRequest("/admin/delivery-partners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDeliveryPartnerStatus(id, status) {
  return apiRequest(`/admin/delivery-partners/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export function resetDeliveryPartnerPassword(id, newPassword) {
  return apiRequest(`/admin/delivery-partners/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export function deleteDeliveryPartner(id) {
  return apiRequest(`/admin/delivery-partners/${id}`, {
    method: "DELETE",
  });
}

export function assignDeliveryOrder(orderId, partnerId) {
  return apiRequest(`/admin/orders/${orderId}/assign`, {
    method: "POST",
    body: JSON.stringify({ partnerId }),
  });
}

export function autoAssignDeliveryOrder(orderId) {
  return apiRequest(`/admin/orders/${orderId}/auto-assign`, {
    method: "POST",
  });
}

export function fetchAdminDeliveryAnalytics() {
  return apiRequest("/admin/delivery/analytics");
}

export function fetchOrderDeliveryTimeline(orderId) {
  return apiRequest(`/orders/${orderId}/delivery-timeline`);
}
