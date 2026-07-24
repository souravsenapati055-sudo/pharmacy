import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_STORE_FILE = path.join(__dirname, "local_db_store.json");

let db = null;
let isFirestoreConnected = false;

const firebaseAdmin = admin.default || admin;

// Initialize Firebase Admin if environment variables exist
try {
  let credential = null;
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_SERVICE_ACCOUNT_JSON,
  } = process.env;

  if (FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = firebaseAdmin.credential.cert(serviceAccount);
  } else if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
    credential = firebaseAdmin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    });
  }

  const existingApps = firebaseAdmin.apps || [];

  if (credential && existingApps.length === 0) {
    firebaseAdmin.initializeApp({
      credential,
    });
    db = firebaseAdmin.firestore();
    isFirestoreConnected = true;
    console.log("🔥 Successfully connected to Firebase Firestore");
  } else if (existingApps.length > 0) {
    db = firebaseAdmin.firestore();
    isFirestoreConnected = true;
  } else {
    console.log("ℹ️ Firebase credentials not found. Using local JSON store fallback for Firestore interface.");
  }
} catch (err) {
  console.warn("⚠️ Failed to initialize Firebase Admin SDK, falling back to local store:", err.message);
  isFirestoreConnected = false;
}

// Fallback Local Memory/JSON Store for development when Firebase credentials are not provided yet
let localStore = {
  users: [],
  auth_otps: [],
  medicines: [],
  delivery_partners: [],
  vendor_partners: [],
  procurement_orders: [],
  procurement_order_items: [],
  orders: [],
  order_items: [],
  discount_campaigns: [],
  discount_campaign_items: [],
  counters: {
    users: 1,
    auth_otps: 1,
    medicines: 1,
    delivery_partners: 1,
    vendor_partners: 1,
    procurement_orders: 1,
    orders: 1,
    order_items: 1,
    procurement_order_items: 1,
    discount_campaigns: 1,
  },
};

async function loadLocalStore() {
  try {
    const data = await fs.readFile(LOCAL_STORE_FILE, "utf8");
    localStore = JSON.parse(data);
  } catch (err) {
    await saveLocalStore();
  }
}

async function saveLocalStore() {
  try {
    await fs.writeFile(LOCAL_STORE_FILE, JSON.stringify(localStore, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving local store:", err);
  }
}

await loadLocalStore();

// Default seed data
const SEED_MEDICINES = [
  { id: 1, name: "Paracetamol 500mg", category: "Pain Relief", description: "Fast relief for fever and mild pain.", image_url: "https://via.placeholder.com/150?text=Paracetamol", price: 25, discount_percent: 10, stock: 120, is_active: 1 },
  { id: 2, name: "Amoxicillin 250mg", category: "Antibiotics", description: "Prescription antibiotic for bacterial infections.", image_url: "https://via.placeholder.com/150?text=Amoxicillin", price: 45, discount_percent: 5, stock: 90, is_active: 1 },
  { id: 3, name: "Vitamin C Tablets", category: "Vitamins", description: "Daily immunity support tablets.", image_url: "https://via.placeholder.com/150?text=Vitamin+C", price: 120, discount_percent: 15, stock: 160, is_active: 1 },
  { id: 4, name: "Cough Syrup", category: "Cough & Cold", description: "Syrup for dry and wet cough relief.", image_url: "https://via.placeholder.com/150?text=Cough+Syrup", price: 85, discount_percent: 8, stock: 75, is_active: 1 },
  { id: 5, name: "Ibuprofen 400mg", category: "Pain Relief", description: "Anti-inflammatory tablets for pain relief.", image_url: "https://via.placeholder.com/150?text=Ibuprofen", price: 35, discount_percent: 0, stock: 140, is_active: 1 },
  { id: 6, name: "Insulin Pen", category: "Diabetes Care", description: "Insulin delivery pen for diabetes management.", image_url: "https://via.placeholder.com/150?text=Insulin", price: 450, discount_percent: 12, stock: 35, is_active: 1 }
];

const SEED_DELIVERY_PARTNERS = [
  { id: 1, name: "Ravi Kumar", phone: "9876543210", active_order_count: 0, completed_order_count: 5, is_active: 1 },
  { id: 2, name: "Priya Sharma", phone: "9876543211", active_order_count: 0, completed_order_count: 3, is_active: 1 },
  { id: 3, name: "Amit Patel", phone: "9876543212", active_order_count: 0, completed_order_count: 7, is_active: 1 }
];

const SEED_VENDOR_PARTNERS = [
  { id: 1, vendor_type: "seller", name: "MediSupply Co.", phone: "9822001100", location: "Mumbai", rating: 4.50, is_active: 1 },
  { id: 2, vendor_type: "seller", name: "PharmaDistributors Ltd.", phone: "9822001101", location: "Delhi", rating: 4.80, is_active: 1 },
  { id: 3, vendor_type: "seller", name: "HealthCare Wholesale", phone: "9822001102", location: "Bangalore", rating: 4.30, is_active: 1 },
  { id: 4, vendor_type: "seller", name: "Global Pharma Solutions", phone: "9822001103", location: "Chennai", rating: 4.70, is_active: 1 },
  { id: 5, vendor_type: "supplier", name: "Cipla", phone: "9876543210", location: "Mumbai", rating: 4.60, is_active: 1 },
  { id: 6, vendor_type: "supplier", name: "GSK", phone: "9876543211", location: "Delhi", rating: 4.70, is_active: 1 },
  { id: 7, vendor_type: "supplier", name: "Abbott", phone: "9876543212", location: "Bangalore", rating: 4.50, is_active: 1 },
  { id: 8, vendor_type: "supplier", name: "Sun Pharma", phone: "9876543213", location: "Mumbai", rating: 4.60, is_active: 1 },
  { id: 9, vendor_type: "supplier", name: "Pfizer", phone: "9876543214", location: "Chennai", rating: 4.80, is_active: 1 }
];

export async function initializeDatabase() {
  if (isFirestoreConnected && db) {
    // Check & Seed Medicines
    const medSnapshot = await db.collection("medicines").get();
    if (medSnapshot.empty) {
      const batch = db.batch();
      SEED_MEDICINES.forEach((med) => {
        const docRef = db.collection("medicines").doc(String(med.id));
        batch.set(docRef, { ...med, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      });
      await batch.commit();
      console.log("✅ Seeded initial medicines in Firestore");
    }

    // Check & Seed Delivery Partners
    const delSnapshot = await db.collection("delivery_partners").get();
    if (delSnapshot.empty) {
      const batch = db.batch();
      SEED_DELIVERY_PARTNERS.forEach((partner) => {
        const docRef = db.collection("delivery_partners").doc(String(partner.id));
        batch.set(docRef, { ...partner, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      });
      await batch.commit();
      console.log("✅ Seeded initial delivery partners in Firestore");
    }

    // Check & Seed Vendor Partners
    const venSnapshot = await db.collection("vendor_partners").get();
    if (venSnapshot.empty) {
      const batch = db.batch();
      SEED_VENDOR_PARTNERS.forEach((vendor) => {
        const docRef = db.collection("vendor_partners").doc(String(vendor.id));
        batch.set(docRef, { ...vendor, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      });
      await batch.commit();
      console.log("✅ Seeded initial vendor partners in Firestore");
    }
  } else {
    // Seed local memory store if empty
    if (!localStore.medicines || localStore.medicines.length === 0) {
      localStore.medicines = SEED_MEDICINES.map((m) => ({ ...m, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
      localStore.counters.medicines = 7;
    }
    if (!localStore.delivery_partners || localStore.delivery_partners.length === 0) {
      localStore.delivery_partners = SEED_DELIVERY_PARTNERS.map((d) => ({ ...d, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
      localStore.counters.delivery_partners = 4;
    }
    if (!localStore.vendor_partners || localStore.vendor_partners.length === 0) {
      localStore.vendor_partners = SEED_VENDOR_PARTNERS.map((v) => ({ ...v, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
      localStore.counters.vendor_partners = 10;
    }
    await saveLocalStore();
  }
}

// Data Access API for Firestore (or Fallback Store)
export const firestoreService = {
  // USERS
  async getUsers() {
    if (isFirestoreConnected) {
      const snap = await db.collection("users").get();
      return snap.docs.map((doc) => ({ id: Number(doc.id) || doc.id, ...doc.data() }));
    }
    return localStore.users;
  },

  async findUserByEmail(email) {
    if (isFirestoreConnected) {
      const snap = await db.collection("users").where("email", "==", email).get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: Number(doc.id) || doc.id, ...doc.data() };
    }
    return localStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserByPhone(phone) {
    if (isFirestoreConnected) {
      const snap = await db.collection("users").where("phone", "==", phone).get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: Number(doc.id) || doc.id, ...doc.data() };
    }
    return localStore.users.find((u) => u.phone === phone) || null;
  },

  async findUserById(id) {
    if (isFirestoreConnected) {
      const doc = await db.collection("users").doc(String(id)).get();
      if (!doc.exists) return null;
      return { id: Number(doc.id) || doc.id, ...doc.data() };
    }
    return localStore.users.find((u) => String(u.id) === String(id)) || null;
  },

  async createUser(userData) {
    const now = new Date().toISOString();
    if (isFirestoreConnected) {
      const id = localStore.counters.users++;
      const newUser = { id, ...userData, created_at: now, updated_at: now };
      await db.collection("users").doc(String(id)).set(newUser);
      return newUser;
    }
    const id = localStore.counters.users++;
    const newUser = { id, ...userData, created_at: now, updated_at: now };
    localStore.users.push(newUser);
    await saveLocalStore();
    return newUser;
  },

  async updateUser(id, updateData) {
    const now = new Date().toISOString();
    if (isFirestoreConnected) {
      await db.collection("users").doc(String(id)).update({ ...updateData, updated_at: now });
      return this.findUserById(id);
    }
    const idx = localStore.users.findIndex((u) => String(u.id) === String(id));
    if (idx !== -1) {
      localStore.users[idx] = { ...localStore.users[idx], ...updateData, updated_at: now };
      await saveLocalStore();
      return localStore.users[idx];
    }
    return null;
  },

  // AUTH OTPS
  async createAuthOtp(otpData) {
    const now = new Date().toISOString();
    if (isFirestoreConnected) {
      const id = localStore.counters.auth_otps++;
      const newOtp = { id, ...otpData, created_at: now };
      await db.collection("auth_otps").doc(String(id)).set(newOtp);
      return newOtp;
    }
    const id = localStore.counters.auth_otps++;
    const newOtp = { id, ...otpData, created_at: now };
    localStore.auth_otps.push(newOtp);
    await saveLocalStore();
    return newOtp;
  },

  async findValidOtp(userId, purpose, code) {
    const now = new Date();
    if (isFirestoreConnected) {
      const snap = await db.collection("auth_otps")
        .where("user_id", "==", Number(userId))
        .where("purpose", "==", purpose)
        .where("otp_code", "==", code)
        .get();
      if (snap.empty) return null;
      const validDoc = snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }))
        .find((o) => !o.used_at && new Date(o.expires_at) > now);
      return validDoc || null;
    }
    return localStore.auth_otps.find(
      (o) => String(o.user_id) === String(userId) &&
        o.purpose === purpose &&
        o.otp_code === code &&
        !o.used_at &&
        new Date(o.expires_at) > now
    ) || null;
  },

  async markOtpUsed(id) {
    const now = new Date().toISOString();
    if (isFirestoreConnected) {
      await db.collection("auth_otps").doc(String(id)).update({ used_at: now });
      return;
    }
    const otp = localStore.auth_otps.find((o) => String(o.id) === String(id));
    if (otp) {
      otp.used_at = now;
      await saveLocalStore();
    }
  },

  // MEDICINES
  async getMedicines() {
    if (isFirestoreConnected) {
      const snap = await db.collection("medicines").get();
      return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
    }
    return localStore.medicines;
  },

  async getMedicineById(id) {
    if (isFirestoreConnected) {
      const doc = await db.collection("medicines").doc(String(id)).get();
      if (!doc.exists) return null;
      return { id: Number(doc.id) || doc.id, ...doc.data() };
    }
    return localStore.medicines.find((m) => String(m.id) === String(id)) || null;
  },

  async updateMedicineStock(id, newStock) {
    const now = new Date().toISOString();
    if (isFirestoreConnected) {
      await db.collection("medicines").doc(String(id)).update({ stock: newStock, updated_at: now });
      return;
    }
    const med = localStore.medicines.find((m) => String(m.id) === String(id));
    if (med) {
      med.stock = newStock;
      med.updated_at = now;
      await saveLocalStore();
    }
  },

  async updateMedicineDiscount(id, discountPercent) {
    const now = new Date().toISOString();
    if (isFirestoreConnected) {
      await db.collection("medicines").doc(String(id)).update({ discount_percent: discountPercent, updated_at: now });
      return;
    }
    const med = localStore.medicines.find((m) => String(m.id) === String(id));
    if (med) {
      med.discount_percent = discountPercent;
      med.updated_at = now;
      await saveLocalStore();
    }
  },

  // DELIVERY PARTNERS
  async getDeliveryPartners() {
    if (isFirestoreConnected) {
      const snap = await db.collection("delivery_partners").get();
      return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
    }
    return localStore.delivery_partners;
  },

  async findDeliveryPartnerByPhone(phone) {
    if (isFirestoreConnected) {
      const snap = await db.collection("delivery_partners").where("phone", "==", phone).get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: Number(doc.id) || doc.id, ...doc.data() };
    }
    return localStore.delivery_partners.find((d) => d.phone === phone) || null;
  },

  async createDeliveryPartner(data) {
    const now = new Date().toISOString();
    const id = localStore.counters.delivery_partners++;
    const partner = {
      id,
      name: data.name,
      phone: data.phone,
      active_order_count: 0,
      completed_order_count: 0,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };
    if (isFirestoreConnected) {
      await db.collection("delivery_partners").doc(String(id)).set(partner);
    } else {
      localStore.delivery_partners.push(partner);
      await saveLocalStore();
    }
    return partner;
  },

  async deleteDeliveryPartner(id) {
    if (isFirestoreConnected) {
      await db.collection("delivery_partners").doc(String(id)).update({ is_active: 0 });
    } else {
      const partner = localStore.delivery_partners.find((d) => String(d.id) === String(id));
      if (partner) partner.is_active = 0;
      await saveLocalStore();
    }
  },

  async updateDeliveryPartnerCounts(id, activeDelta = 0, completedDelta = 0) {
    const now = new Date().toISOString();
    if (isFirestoreConnected) {
      const docRef = db.collection("delivery_partners").doc(String(id));
      const doc = await docRef.get();
      if (doc.exists) {
        const cur = doc.data();
        await docRef.update({
          active_order_count: Math.max(0, (cur.active_order_count || 0) + activeDelta),
          completed_order_count: Math.max(0, (cur.completed_order_count || 0) + completedDelta),
          updated_at: now,
        });
      }
    } else {
      const partner = localStore.delivery_partners.find((d) => String(d.id) === String(id));
      if (partner) {
        partner.active_order_count = Math.max(0, partner.active_order_count + activeDelta);
        partner.completed_order_count = Math.max(0, partner.completed_order_count + completedDelta);
        partner.updated_at = now;
        await saveLocalStore();
      }
    }
  },

  // VENDOR PARTNERS
  async getVendorPartners(vendorType = null) {
    let list = [];
    if (isFirestoreConnected) {
      let query = db.collection("vendor_partners");
      if (vendorType) query = query.where("vendor_type", "==", vendorType);
      const snap = await query.get();
      list = snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
    } else {
      list = localStore.vendor_partners;
      if (vendorType) {
        list = list.filter((v) => v.vendor_type === vendorType);
      }
    }
    return list.filter((v) => v.is_active !== 0);
  },

  async findVendorById(id) {
    if (isFirestoreConnected) {
      const doc = await db.collection("vendor_partners").doc(String(id)).get();
      if (!doc.exists) return null;
      return { id: Number(doc.id) || doc.id, ...doc.data() };
    }
    return localStore.vendor_partners.find((v) => String(v.id) === String(id)) || null;
  },

  // ORDERS & ORDER ITEMS
  async getOrders(userId = null) {
    let orderRows = [];
    if (isFirestoreConnected) {
      let query = db.collection("orders");
      if (userId) query = query.where("user_id", "==", Number(userId));
      const snap = await query.get();
      orderRows = snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
    } else {
      orderRows = localStore.orders;
      if (userId) {
        orderRows = orderRows.filter((o) => String(o.user_id) === String(userId));
      }
    }

    // Sort descending by created_at
    orderRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Attach user & delivery partner info and items
    const users = await this.getUsers();
    const deliveryPartners = await this.getDeliveryPartners();
    const allItems = await this.getAllOrderItems();

    return orderRows.map((o) => {
      const u = users.find((usr) => String(usr.id) === String(o.user_id));
      const dp = o.delivery_partner_id ? deliveryPartners.find((d) => String(d.id) === String(o.delivery_partner_id)) : null;
      const items = allItems.filter((it) => String(it.order_id) === String(o.id));
      return {
        ...o,
        customer_name: u ? u.name : "Customer",
        customer_email: u ? u.email : "",
        delivery_partner_name: dp ? dp.name : null,
        delivery_partner_phone: dp ? dp.phone : null,
        items,
      };
    });
  },

  async getAllOrderItems() {
    if (isFirestoreConnected) {
      const snap = await db.collection("order_items").get();
      return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
    }
    return localStore.order_items;
  },

  async getOrderById(id) {
    const orders = await this.getOrders();
    return orders.find((o) => String(o.id) === String(id)) || null;
  },

  async createOrder(orderData, itemsData) {
    const now = new Date().toISOString();
    const orderId = localStore.counters.orders++;

    const newOrder = {
      id: orderId,
      user_id: Number(orderData.user_id),
      delivery_partner_id: orderData.delivery_partner_id ? Number(orderData.delivery_partner_id) : null,
      status: orderData.status || "Processing",
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status || "pending",
      subtotal: Number(orderData.subtotal),
      discount_total: Number(orderData.discount_total || 0),
      delivery_fee: Number(orderData.delivery_fee || 0),
      total: Number(orderData.total),
      address_label: orderData.address_label,
      address_details: orderData.address_details,
      notes: orderData.notes || "",
      created_at: now,
      updated_at: now,
    };

    const createdItems = [];
    for (const item of itemsData) {
      const itemId = localStore.counters.order_items++;
      const newItem = {
        id: itemId,
        order_id: orderId,
        medicine_id: Number(item.medicine_id),
        medicine_name: item.medicine_name,
        unit_price: Number(item.unit_price),
        discount_percent: Number(item.discount_percent || 0),
        quantity: Number(item.quantity),
        total_price: Number(item.total_price),
        created_at: now,
      };
      createdItems.push(newItem);
    }

    if (isFirestoreConnected) {
      await db.collection("orders").doc(String(orderId)).set(newOrder);
      const batch = db.batch();
      createdItems.forEach((it) => {
        batch.set(db.collection("order_items").doc(String(it.id)), it);
      });
      await batch.commit();
    } else {
      localStore.orders.push(newOrder);
      localStore.order_items.push(...createdItems);
      await saveLocalStore();
    }

    // Update partner active order count if assigned
    if (newOrder.delivery_partner_id) {
      await this.updateDeliveryPartnerCounts(newOrder.delivery_partner_id, 1, 0);
    }

    return this.getOrderById(orderId);
  },

  async updateOrderStatus(id, newStatus) {
    const now = new Date().toISOString();
    const existingOrder = await this.getOrderById(id);
    if (!existingOrder) return null;

    const oldStatus = existingOrder.status;

    if (isFirestoreConnected) {
      await db.collection("orders").doc(String(id)).update({
        status: newStatus,
        updated_at: now,
      });
    } else {
      const o = localStore.orders.find((ord) => String(ord.id) === String(id));
      if (o) {
        o.status = newStatus;
        o.updated_at = now;
        await saveLocalStore();
      }
    }

    // Adjust delivery partner active/completed order counters
    if (existingOrder.delivery_partner_id) {
      if (oldStatus !== "Delivered" && newStatus === "Delivered") {
        await this.updateDeliveryPartnerCounts(existingOrder.delivery_partner_id, -1, 1);
      } else if (oldStatus !== "Cancelled" && newStatus === "Cancelled") {
        await this.updateDeliveryPartnerCounts(existingOrder.delivery_partner_id, -1, 0);
      }
    }

    return this.getOrderById(id);
  },

  // PROCUREMENT ORDERS
  async getProcurementOrders(source = null) {
    let orderRows = [];
    if (isFirestoreConnected) {
      let query = db.collection("procurement_orders");
      if (source) query = query.where("source", "==", source);
      const snap = await query.get();
      orderRows = snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
    } else {
      orderRows = localStore.procurement_orders;
      if (source) {
        orderRows = orderRows.filter((p) => p.source === source);
      }
    }

    orderRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const vendors = await this.getVendorPartners();
    const allItems = await this.getAllProcurementOrderItems();

    return orderRows.map((po) => {
      const v = vendors.find((vdr) => String(vdr.id) === String(po.vendor_id));
      const items = allItems.filter((it) => String(it.procurement_order_id) === String(po.id));
      return {
        id: po.id,
        vendorId: po.vendor_id,
        vendorType: po.vendor_type,
        vendorName: v ? v.name : "Vendor",
        vendorPhone: v ? v.phone : "",
        vendorLocation: v ? v.location : "",
        source: po.source,
        status: po.status,
        urgency: po.urgency,
        total: Number(po.total),
        notes: po.notes || "",
        items: items.map((it) => ({
          id: it.medicine_id,
          name: it.medicine_name,
          price: Number(it.unit_price),
          quantity: it.quantity,
          totalPrice: Number(it.total_price),
        })),
        createdAt: po.created_at,
      };
    });
  },

  async getAllProcurementOrderItems() {
    if (isFirestoreConnected) {
      const snap = await db.collection("procurement_order_items").get();
      return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
    }
    return localStore.procurement_order_items;
  },

  async createProcurementOrder(orderData, itemsData) {
    const now = new Date().toISOString();
    const orderId = localStore.counters.procurement_orders++;

    const newOrder = {
      id: orderId,
      vendor_id: Number(orderData.vendor_id),
      vendor_type: orderData.vendor_type,
      source: orderData.source,
      status: orderData.status || "Pending",
      urgency: orderData.urgency || null,
      total: Number(orderData.total),
      notes: orderData.notes || "",
      created_by_user_id: orderData.created_by_user_id ? Number(orderData.created_by_user_id) : null,
      created_at: now,
      updated_at: now,
    };

    const createdItems = [];
    for (const item of itemsData) {
      const itemId = localStore.counters.procurement_order_items++;
      const newItem = {
        id: itemId,
        procurement_order_id: orderId,
        medicine_id: Number(item.medicine_id),
        medicine_name: item.medicine_name,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        total_price: Number(item.total_price),
        created_at: now,
      };
      createdItems.push(newItem);
    }

    if (isFirestoreConnected) {
      await db.collection("procurement_orders").doc(String(orderId)).set(newOrder);
      const batch = db.batch();
      createdItems.forEach((it) => {
        batch.set(db.collection("procurement_order_items").doc(String(it.id)), it);
      });
      await batch.commit();
    } else {
      localStore.procurement_orders.push(newOrder);
      localStore.procurement_order_items.push(...createdItems);
      await saveLocalStore();
    }

    const allPos = await this.getProcurementOrders();
    return allPos.find((po) => String(po.id) === String(orderId));
  },

  // BULK DISCOUNTS & CAMPAIGNS
  async createDiscountCampaign(campaignData, itemsData) {
    const now = new Date().toISOString();
    const campaignId = localStore.counters.discount_campaigns++;

    const newCampaign = {
      id: campaignId,
      title: campaignData.title,
      discount_type: campaignData.discount_type,
      discount_value: Number(campaignData.discount_value),
      min_quantity: campaignData.min_quantity ? Number(campaignData.min_quantity) : null,
      valid_until: campaignData.valid_until || null,
      promo_code: campaignData.promo_code || null,
      created_at: now,
    };

    if (isFirestoreConnected) {
      await db.collection("discount_campaigns").doc(String(campaignId)).set(newCampaign);
    } else {
      localStore.discount_campaigns.push(newCampaign);
      await saveLocalStore();
    }

    for (const item of itemsData) {
      await this.updateMedicineDiscount(item.medicine_id, item.applied_discount_percent);
    }

    return newCampaign;
  },
};
