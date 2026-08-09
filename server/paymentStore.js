import { getPool } from "./mysqlService.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_STORE_PATH = path.join(__dirname, "local_db_store.json");

/**
 * Payment & Refund Store Data Access Layer
 * Handles MySQL persistence with fallback to local JSON file store.
 */
class PaymentStore {
  async getLocalStore() {
    try {
      const data = await fs.readFile(LOCAL_STORE_PATH, "utf8");
      const parsed = JSON.parse(data);
      if (!parsed.payments) parsed.payments = [];
      if (!parsed.payment_attempts) parsed.payment_attempts = [];
      if (!parsed.refunds) parsed.refunds = [];
      if (!parsed.addresses) parsed.addresses = [];
      if (!parsed.coupons) parsed.coupons = [];
      if (!parsed.audit_logs) parsed.audit_logs = [];
      if (!parsed.webhooks) parsed.webhooks = [];
      return parsed;
    } catch (err) {
      return {
        payments: [],
        payment_attempts: [],
        refunds: [],
        addresses: [],
        coupons: [],
        audit_logs: [],
        webhooks: [],
      };
    }
  }

  async saveLocalStore(data) {
    try {
      await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not save to local_db_store.json:", e.message);
    }
  }

  /**
   * Save or Create Payment Record
   */
  async createPaymentRecord({
    order_id,
    user_id,
    gateway_payment_id = null,
    gateway_order_id = null,
    gateway_signature = null,
    payment_method,
    amount,
    currency = "INR",
    status = "created",
    error_code = null,
    error_description = null,
    card_network = null,
    card_last4 = null,
    upi_vpa = null,
    bank_name = null,
    wallet_name = null,
  }) {
    const numAmount = Number(amount);
    let insertedId = Date.now();

    try {
      const pool = getPool();
      const [res] = await pool.query(
        `INSERT INTO payments (
          order_id, user_id, gateway_payment_id, gateway_order_id, gateway_signature,
          payment_method, amount, currency, status, error_code, error_description,
          card_network, card_last4, upi_vpa, bank_name, wallet_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_id,
          user_id,
          gateway_payment_id,
          gateway_order_id,
          gateway_signature,
          payment_method,
          numAmount,
          currency,
          status,
          error_code,
          error_description,
          card_network,
          card_last4,
          upi_vpa,
          bank_name,
          wallet_name,
        ]
      );
      insertedId = res.insertId;
    } catch (mysqlErr) {
      console.warn("⚠️ MySQL Insert Payment fallback to Local JSON:", mysqlErr.message);
    }

    // Always mirror to Local Store
    const local = await this.getLocalStore();
    const existingIdx = local.payments.findIndex(p => p.order_id === order_id && p.status === status);

    const record = {
      id: insertedId,
      order_id,
      user_id,
      gateway_payment_id,
      gateway_order_id,
      gateway_signature,
      payment_method,
      amount: numAmount,
      currency,
      status,
      error_code,
      error_description,
      card_network,
      card_last4,
      upi_vpa,
      bank_name,
      wallet_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      local.payments[existingIdx] = { ...local.payments[existingIdx], ...record };
    } else {
      local.payments.unshift(record);
    }

    await this.saveLocalStore(local);
    return record;
  }

  /**
   * Update Payment Record Status & Gateway Identifiers
   */
  async updatePaymentStatus({
    order_id,
    gateway_payment_id,
    gateway_signature,
    status,
    error_code = null,
    error_description = null,
    details = {},
  }) {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE payments 
         SET status = ?, 
             gateway_payment_id = COALESCE(?, gateway_payment_id),
             gateway_signature = COALESCE(?, gateway_signature),
             error_code = ?,
             error_description = ?,
             card_network = COALESCE(?, card_network),
             card_last4 = COALESCE(?, card_last4),
             upi_vpa = COALESCE(?, upi_vpa),
             bank_name = COALESCE(?, bank_name),
             wallet_name = COALESCE(?, wallet_name),
             updated_at = NOW()
         WHERE order_id = ?`,
        [
          status,
          gateway_payment_id,
          gateway_signature,
          error_code,
          error_description,
          details.card_network || null,
          details.card_last4 || null,
          details.upi_vpa || null,
          details.bank_name || null,
          details.wallet_name || null,
          order_id,
        ]
      );
    } catch (mysqlErr) {
      console.warn("⚠️ MySQL Update Payment fallback to Local JSON:", mysqlErr.message);
    }

    const local = await this.getLocalStore();
    const idx = local.payments.findIndex(p => p.order_id === Number(order_id) || p.order_id === String(order_id));
    if (idx !== -1) {
      local.payments[idx] = {
        ...local.payments[idx],
        status,
        gateway_payment_id: gateway_payment_id || local.payments[idx].gateway_payment_id,
        gateway_signature: gateway_signature || local.payments[idx].gateway_signature,
        error_code,
        error_description,
        card_network: details.card_network || local.payments[idx].card_network,
        card_last4: details.card_last4 || local.payments[idx].card_last4,
        upi_vpa: details.upi_vpa || local.payments[idx].upi_vpa,
        bank_name: details.bank_name || local.payments[idx].bank_name,
        wallet_name: details.wallet_name || local.payments[idx].wallet_name,
        updated_at: new Date().toISOString(),
      };
      await this.saveLocalStore(local);
    }
  }

  /**
   * Log Payment Attempt
   */
  async logPaymentAttempt({ order_id, user_id, attempt_number = 1, gateway = "Razorpay", gateway_order_id, gateway_payment_id = null, status = "initiated", error_message = null }) {
    let insertedId = Date.now();
    try {
      const pool = getPool();
      const [res] = await pool.query(
        `INSERT INTO payment_attempts (order_id, user_id, attempt_number, gateway, gateway_order_id, gateway_payment_id, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_id, user_id, attempt_number, gateway, gateway_order_id, gateway_payment_id, status, error_message]
      );
      insertedId = res.insertId;
    } catch (e) {
      // Fallback
    }

    const local = await this.getLocalStore();
    const attempt = {
      id: insertedId,
      order_id,
      user_id,
      attempt_number,
      gateway,
      gateway_order_id,
      gateway_payment_id,
      status,
      error_message,
      created_at: new Date().toISOString(),
    };
    local.payment_attempts.unshift(attempt);
    await this.saveLocalStore(local);
    return attempt;
  }

  /**
   * Create Refund Record
   */
  async createRefundRecord({ payment_id, order_id, user_id, gateway_refund_id, amount, currency = "INR", status = "completed", reason, initiated_by_user_id }) {
    let insertedId = Date.now();
    const numAmount = Number(amount);

    try {
      const pool = getPool();
      const [res] = await pool.query(
        `INSERT INTO refunds (payment_id, order_id, user_id, gateway_refund_id, amount, currency, status, reason, initiated_by_user_id, processed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [payment_id, order_id, user_id, gateway_refund_id, numAmount, currency, status, reason, initiated_by_user_id]
      );
      insertedId = res.insertId;
    } catch (e) {
      // Fallback
    }

    const local = await this.getLocalStore();
    const refund = {
      id: insertedId,
      payment_id,
      order_id,
      user_id,
      gateway_refund_id,
      amount: numAmount,
      currency,
      status,
      reason,
      initiated_by_user_id,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    local.refunds.unshift(refund);
    await this.saveLocalStore(local);
    return refund;
  }

  /**
   * Log Audit Event
   */
  async logAudit({ user_id = null, user_name = "System", user_email = null, action, resource_type, resource_id = null, details = "", ip_address = "127.0.0.1" }) {
    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_name, user_email, action, resource_type, resource_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, user_name, user_email, action, resource_type, String(resource_id), typeof details === "object" ? JSON.stringify(details) : details, ip_address]
      );
    } catch (e) {
      // Ignore
    }

    const local = await this.getLocalStore();
    local.audit_logs.unshift({
      id: Date.now(),
      user_id,
      user_name,
      user_email,
      action,
      resource_type,
      resource_id: String(resource_id),
      details,
      ip_address,
      created_at: new Date().toISOString(),
    });
    await this.saveLocalStore(local);
  }

  /**
   * Fetch All Payments & Financial Summary Data
   */
  async getAdminFinancialOverview() {
    const local = await this.getLocalStore();
    let payments = local.payments || [];
    let refunds = local.refunds || [];

    try {
      const pool = getPool();
      const [pRows] = await pool.query(`SELECT * FROM payments ORDER BY id DESC`);
      const [rRows] = await pool.query(`SELECT * FROM refunds ORDER BY id DESC`);
      if (pRows && pRows.length > 0) payments = pRows;
      if (rRows && rRows.length > 0) refunds = rRows;
    } catch (e) {
      // Use local fallback
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRevenue = 0;
    let thisWeekRevenue = 0;
    let thisMonthRevenue = 0;
    let totalRevenue = 0;
    let onlineRevenue = 0;
    let codRevenue = 0;

    let upiRevenue = 0;
    let cardRevenue = 0;
    let netbankingRevenue = 0;
    let walletRevenue = 0;

    let pendingPaymentsCount = 0;
    let failedPaymentsCount = 0;
    let totalRefundedAmount = 0;

    payments.forEach((p) => {
      const pAmt = Number(p.amount || 0);
      const pDate = new Date(p.created_at || Date.now());
      const pDateStr = pDate.toISOString().split("T")[0];
      const isPaid = p.status === "paid" || p.status === "Paid";

      if (isPaid) {
        totalRevenue += pAmt;
        if (pDateStr === todayStr) todayRevenue += pAmt;
        if (pDate >= startOfWeek) thisWeekRevenue += pAmt;
        if (pDate >= startOfMonth) thisMonthRevenue += pAmt;

        if (p.payment_method === "cod") {
          codRevenue += pAmt;
        } else {
          onlineRevenue += pAmt;
          if (p.payment_method === "upi") upiRevenue += pAmt;
          else if (p.payment_method === "card") cardRevenue += pAmt;
          else if (p.payment_method === "netbanking") netbankingRevenue += pAmt;
          else if (p.payment_method === "wallet") walletRevenue += pAmt;
        }
      }

      if (p.status === "pending" || p.status === "created") pendingPaymentsCount++;
      if (p.status === "failed") failedPaymentsCount++;
    });

    refunds.forEach((r) => {
      if (r.status === "completed") {
        totalRefundedAmount += Number(r.amount || 0);
      }
    });

    return {
      kpi: {
        todayRevenue,
        thisWeekRevenue,
        thisMonthRevenue,
        totalRevenue,
        onlineRevenue,
        codRevenue,
        upiRevenue,
        cardRevenue,
        netbankingRevenue,
        walletRevenue,
        pendingPaymentsCount,
        failedPaymentsCount,
        totalRefundedAmount,
      },
      paymentCount: payments.length,
      refundCount: refunds.length,
    };
  }

  /**
   * Coupon validation
   */
  async validateCoupon(code, orderTotal) {
    const defaultCoupons = [
      { code: "PHARMA10", discount_percent: 10, max_discount_amount: 150, min_order_amount: 200, description: "10% Instant Discount on orders above ₹200" },
      { code: "FREESHIP", discount_percent: 0, free_delivery: true, min_order_amount: 100, description: "Free Express Delivery on all orders above ₹100" },
      { code: "FLAT50", flat_discount: 50, min_order_amount: 300, description: "Flat ₹50 Flat Off on health orders above ₹300" },
      { code: "HEALTH20", discount_percent: 20, max_discount_amount: 300, min_order_amount: 500, description: "20% Big Health Savings up to ₹300" },
    ];

    const cleanCode = String(code).trim().toUpperCase();
    const coupon = defaultCoupons.find((c) => c.code === cleanCode);

    if (!coupon) {
      return { valid: false, message: `Coupon code '${cleanCode}' is invalid.` };
    }

    if (orderTotal < coupon.min_order_amount) {
      return { valid: false, message: `Coupon '${cleanCode}' requires a minimum order amount of ₹${coupon.min_order_amount}.` };
    }

    let discountAmount = 0;
    if (coupon.flat_discount) {
      discountAmount = coupon.flat_discount;
    } else if (coupon.discount_percent) {
      discountAmount = (orderTotal * coupon.discount_percent) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    }

    return {
      valid: true,
      code: coupon.code,
      discountAmount: Number(discountAmount.toFixed(2)),
      freeDelivery: Boolean(coupon.free_delivery),
      description: coupon.description,
    };
  }
}

export const paymentStore = new PaymentStore();
