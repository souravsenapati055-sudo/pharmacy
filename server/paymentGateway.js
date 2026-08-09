import Razorpay from "razorpay";
import crypto from "node:crypto";

/**
 * Production-Ready Payment Gateway Service (Razorpay Integration with Sandbox Fallback)
 */
class PaymentGatewayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "pharmacare_webhook_secret_2026";
    this.isConfigured = Boolean(this.keyId && this.keySecret && !this.keyId.startsWith("rzp_test_placeholder"));

    if (this.isConfigured) {
      try {
        this.razorpay = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        console.log("✅ [Razorpay SDK] Initialized successfully with Key ID:", this.keyId.substring(0, 10) + "...");
      } catch (err) {
        console.warn("⚠️ [Razorpay SDK Init Warning]:", err.message);
        this.isConfigured = false;
      }
    } else {
      console.log("ℹ️ [PaymentGateway] Running in Sandbox/Test Mode (Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env for live gateway)");
    }
  }

  /**
   * Returns public gateway configuration for frontend checkout setup
   */
  getConfig() {
    return {
      gateway: "Razorpay",
      keyId: this.keyId || "rzp_test_pharmacare_demo_key",
      currency: "INR",
      isLive: this.isConfigured,
      codEnabled: process.env.COD_ENABLED !== "false",
      codFee: Number(process.env.COD_FEE || 15),
      minCodOrderAmount: Number(process.env.MIN_COD_ORDER_AMOUNT || 0),
      allowedPaymentMethods: ["upi", "card", "netbanking", "wallet", "cod"],
      supportedUPIApps: ["Google Pay", "PhonePe", "Paytm", "BHIM", "Cred UPI"],
      topBanks: [
        { code: "HDFC", name: "HDFC Bank" },
        { code: "ICIC", name: "ICICI Bank" },
        { code: "SBIN", name: "State Bank of India" },
        { code: "UTIB", name: "Axis Bank" },
        { code: "KKBK", name: "Kotak Mahindra Bank" },
      ],
      supportedWallets: ["Paytm Wallet", "Amazon Pay", "PhonePe Wallet", "MobiKwik"],
    };
  }

  /**
   * Create Razorpay Order
   * @param {Object} param0 { orderId, amount, currency, notes }
   */
  async createRazorpayOrder({ orderId, amount, currency = "INR", notes = {} }) {
    const amountInPaise = Math.round(Number(amount) * 100);
    const receipt = `rcpt_ord_${orderId}_${Date.now()}`;

    if (this.isConfigured && this.razorpay) {
      try {
        const razorpayOrder = await this.razorpay.orders.create({
          amount: amountInPaise,
          currency,
          receipt,
          notes: {
            app_order_id: String(orderId),
            platform: "PharmaCare Health",
            ...notes,
          },
        });

        console.log(`[Razorpay Order Created] Gateway Order ID: ${razorpayOrder.id} for Order #${orderId} (₹${amount})`);
        return {
          id: razorpayOrder.id,
          entity: razorpayOrder.entity,
          amount: razorpayOrder.amount,
          amount_due: razorpayOrder.amount_due,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
          status: razorpayOrder.status,
          isSandbox: false,
        };
      } catch (error) {
        console.error(`[Razorpay API Order Error]`, error);
        throw new Error(`Payment Gateway Error: ${error.description || error.message || "Failed to create gateway order"}`);
      }
    }

    // Sandbox / Test fallback order generation
    const mockGatewayOrderId = `order_sim_${orderId}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[Sandbox Order Created] Simulated Gateway Order ID: ${mockGatewayOrderId} for Order #${orderId}`);
    return {
      id: mockGatewayOrderId,
      entity: "order",
      amount: amountInPaise,
      amount_due: amountInPaise,
      currency,
      receipt,
      status: "created",
      isSandbox: true,
    };
  }

  /**
   * Server-Side Payment Signature Verification
   * @param {Object} param0 { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id) {
      return { isValid: false, reason: "Missing Razorpay payment identifiers" };
    }

    // In sandbox mode with mock order ID
    if (razorpay_order_id.startsWith("order_sim_") || !this.isConfigured) {
      const isMockValid = razorpay_signature && (razorpay_signature.length > 5 || razorpay_signature.startsWith("sig_sim_"));
      return {
        isValid: isMockValid,
        isSandbox: true,
        reason: isMockValid ? "Sandbox signature verified" : "Invalid mock signature",
      };
    }

    // Live Razorpay HMAC SHA256 Signature Verification
    try {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(body.toString())
        .digest("hex");

      const isValid = expectedSignature === razorpay_signature;
      if (!isValid) {
        console.warn(`⚠️ [Razorpay Signature Mismatch] Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
      } else {
        console.log(`✅ [Razorpay Signature Verified] Payment ID: ${razorpay_payment_id}`);
      }

      return {
        isValid,
        isSandbox: false,
        reason: isValid ? "Signature verified successfully" : "HMAC SHA256 Signature Mismatch",
      };
    } catch (err) {
      console.error("[Razorpay Signature Verification Exception]", err);
      return { isValid: false, reason: err.message };
    }
  }

  /**
   * Webhook Signature Verification
   * @param {string} rawBody 
   * @param {string} signature 
   */
  verifyWebhookSignature(rawBody, signature) {
    if (!signature) return false;
    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      return expectedSignature === signature;
    } catch (err) {
      console.error("[Webhook Signature Error]", err);
      return false;
    }
  }

  /**
   * Process Refund via Razorpay API
   * @param {Object} param0 { gatewayPaymentId, amount, reason, notes }
   */
  async processRefund({ gatewayPaymentId, amount, reason = "Customer requested refund", notes = {} }) {
    const amountInPaise = amount ? Math.round(Number(amount) * 100) : undefined;

    if (this.isConfigured && this.razorpay && gatewayPaymentId && !gatewayPaymentId.startsWith("pay_sim_")) {
      try {
        const refundOptions = {
          notes: { reason, ...notes },
        };
        if (amountInPaise) refundOptions.amount = amountInPaise;

        const refund = await this.razorpay.payments.refund(gatewayPaymentId, refundOptions);
        console.log(`[Razorpay Refund Issued] Refund ID: ${refund.id} for Payment ID: ${gatewayPaymentId} (₹${amount || "Full"})`);
        return {
          id: refund.id,
          entity: refund.entity,
          amount: (refund.amount / 100).toFixed(2),
          currency: refund.currency,
          payment_id: refund.payment_id,
          status: refund.status === "processed" ? "completed" : refund.status || "processing",
          isSandbox: false,
        };
      } catch (error) {
        console.error(`[Razorpay Refund API Error]`, error);
        throw new Error(`Refund Gateway Error: ${error.description || error.message || "Failed to process gateway refund"}`);
      }
    }

    // Sandbox / Test refund simulation
    const mockRefundId = `rfnd_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Sandbox Refund Issued] Simulated Refund ID: ${mockRefundId} for Payment: ${gatewayPaymentId || "SIM"} (₹${amount})`);
    return {
      id: mockRefundId,
      entity: "refund",
      amount: Number(amount).toFixed(2),
      currency: "INR",
      payment_id: gatewayPaymentId || "pay_sim_demo",
      status: "completed",
      isSandbox: true,
    };
  }
}

export const paymentGatewayService = new PaymentGatewayService();
