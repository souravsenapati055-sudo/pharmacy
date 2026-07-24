import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_STORE_FILE = path.join(__dirname, "local_db_store.json");

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAI-nGCCQSb9gX5ohEOJaDUzhrHwMGyf48",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "pharmacy-ecfa5.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "pharmacy-ecfa5",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "pharmacy-ecfa5.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "836439675778",
  appId: process.env.FIREBASE_APP_ID || "1:836439675778:web:9ba81d7c78280d16b4b59b",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-5MXZ8412J8",
};

let db = null;
let isFirestoreConnected = false;

// Initialize Firebase App & Firestore SDK
try {
  const existingApps = getApps();
  const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
  db = getFirestore(app);
  isFirestoreConnected = true;
  console.log(`🔥 Connected to Firebase Firestore project: ${firebaseConfig.projectId}`);
} catch (err) {
  console.warn("⚠️ Firebase Client initialization failed, falling back to local store:", err.message);
  isFirestoreConnected = false;
}

// Fallback Local Memory Store
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
    // Keep in-memory store initialized
  }
}

async function saveLocalStore() {
  try {
    await fs.writeFile(LOCAL_STORE_FILE, JSON.stringify(localStore, null, 2), "utf8");
  } catch (err) {
    // Silent catch for Vercel read-only filesystem environment
  }
}

try {
  await loadLocalStore();
} catch (err) {}

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
  const defaultAdminPasswordHash = await bcrypt.hash("admin123", 10);
  const defaultCustomerPasswordHash = await bcrypt.hash("customer123", 10);

  const SEED_USERS = [
    {
      id: 1,
      role: "admin",
      name: "System Admin",
      email: "admin@pharmacy.com",
      phone: "9999999999",
      password_hash: defaultAdminPasswordHash,
      business_name: "Pharmacy Store HQ",
      business_address: "123 Healthcare Blvd",
      verification_document: "DOC-ADMIN-001",
    },
    {
      id: 2,
      role: "customer",
      name: "Demo Customer",
      email: "customer@pharmacy.com",
      phone: "9876543210",
      password_hash: defaultCustomerPasswordHash,
    },
  ];

  if (isFirestoreConnected && db) {
    try {
      // Check & Seed Users in Firestore
      const userSnap = await getDocs(collection(db, "users"));
      if (userSnap.empty) {
        const batch = writeBatch(db);
        SEED_USERS.forEach((u) => {
          const ref = doc(db, "users", String(u.id));
          batch.set(ref, { ...u, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        });
        await batch.commit();
      }

      // Check & Seed Medicines in Firestore
      const medSnap = await getDocs(collection(db, "medicines"));
      if (medSnap.empty) {
        const batch = writeBatch(db);
        SEED_MEDICINES.forEach((med) => {
          const ref = doc(db, "medicines", String(med.id));
          batch.set(ref, { ...med, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        });
        await batch.commit();
      }

      // Check & Seed Delivery Partners
      const delSnap = await getDocs(collection(db, "delivery_partners"));
      if (delSnap.empty) {
        const batch = writeBatch(db);
        SEED_DELIVERY_PARTNERS.forEach((partner) => {
          const ref = doc(db, "delivery_partners", String(partner.id));
          batch.set(ref, { ...partner, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        });
        await batch.commit();
      }

      // Check & Seed Vendor Partners
      const venSnap = await getDocs(collection(db, "vendor_partners"));
      if (venSnap.empty) {
        const batch = writeBatch(db);
        SEED_VENDOR_PARTNERS.forEach((vendor) => {
          const ref = doc(db, "vendor_partners", String(vendor.id));
          batch.set(ref, { ...vendor, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        });
        await batch.commit();
      }
    } catch (err) {}
  }

  // Ensure local memory store fallback is seeded
  if (!localStore.users || localStore.users.length === 0) {
    localStore.users = SEED_USERS.map((u) => ({ ...u, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
    localStore.counters.users = 3;
  }
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

// Data Access API for Firestore (or Fallback Store)
export const firestoreService = {
  // USERS
  async getUsers() {
    if (isFirestoreConnected && db) {
      try {
        const snap = await getDocs(collection(db, "users"));
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
        }
      } catch (err) {}
    }
    return localStore.users;
  },

  async findUserByEmail(email) {
    if (isFirestoreConnected && db) {
      try {
        const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          return { id: Number(d.id) || d.id, ...d.data() };
        }
      } catch (err) {}
    }
    return localStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserByPhone(phone) {
    if (isFirestoreConnected && db) {
      try {
        const q = query(collection(db, "users"), where("phone", "==", phone));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          return { id: Number(d.id) || d.id, ...d.data() };
        }
      } catch (err) {}
    }
    return localStore.users.find((u) => u.phone === phone) || null;
  },

  async findUserById(id) {
    if (isFirestoreConnected && db) {
      try {
        const docRef = doc(db, "users", String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: Number(docSnap.id) || docSnap.id, ...docSnap.data() };
        }
      } catch (err) {}
    }
    return localStore.users.find((u) => String(u.id) === String(id)) || null;
  },

  async createUser(userData) {
    const now = new Date().toISOString();
    const id = localStore.counters.users++;
    const newUser = { id, ...userData, created_at: now, updated_at: now };

    if (isFirestoreConnected && db) {
      try {
        await setDoc(doc(db, "users", String(id)), newUser);
      } catch (err) {}
    }
    localStore.users.push(newUser);
    await saveLocalStore();
    return newUser;
  },

  async updateUser(id, updateData) {
    const now = new Date().toISOString();
    if (isFirestoreConnected && db) {
      try {
        await updateDoc(doc(db, "users", String(id)), { ...updateData, updated_at: now });
      } catch (err) {}
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
    const id = localStore.counters.auth_otps++;
    const newOtp = { id, ...otpData, created_at: now };

    if (isFirestoreConnected && db) {
      try {
        await setDoc(doc(db, "auth_otps", String(id)), newOtp);
      } catch (err) {}
    }
    localStore.auth_otps.push(newOtp);
    await saveLocalStore();
    return newOtp;
  },

  async findValidOtp(userId, purpose, code) {
    const now = new Date();
    if (isFirestoreConnected && db) {
      try {
        const q = query(
          collection(db, "auth_otps"),
          where("user_id", "==", Number(userId)),
          where("purpose", "==", purpose),
          where("otp_code", "==", code)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const validDoc = snap.docs
            .map((d) => ({ id: Number(d.id) || d.id, ...d.data() }))
            .find((o) => !o.used_at && new Date(o.expires_at) > now);
          if (validDoc) return validDoc;
        }
      } catch (err) {}
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
    if (isFirestoreConnected && db) {
      try {
        await updateDoc(doc(db, "auth_otps", String(id)), { used_at: now });
      } catch (err) {}
    }
    const otp = localStore.auth_otps.find((o) => String(o.id) === String(id));
    if (otp) {
      otp.used_at = now;
      await saveLocalStore();
    }
  },

  // MEDICINES
  async getMedicines() {
    if (isFirestoreConnected && db) {
      try {
        const snap = await getDocs(collection(db, "medicines"));
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
        }
      } catch (err) {}
    }
    return localStore.medicines;
  },

  async getMedicineById(id) {
    if (isFirestoreConnected && db) {
      try {
        const docRef = doc(db, "medicines", String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: Number(docSnap.id) || docSnap.id, ...docSnap.data() };
        }
      } catch (err) {}
    }
    return localStore.medicines.find((m) => String(m.id) === String(id)) || null;
  },

  async updateMedicineStock(id, newStock) {
    const now = new Date().toISOString();
    if (isFirestoreConnected && db) {
      try {
        await updateDoc(doc(db, "medicines", String(id)), { stock: newStock, updated_at: now });
      } catch (err) {}
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
    if (isFirestoreConnected && db) {
      try {
        await updateDoc(doc(db, "medicines", String(id)), { discount_percent: discountPercent, updated_at: now });
      } catch (err) {}
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
    if (isFirestoreConnected && db) {
      try {
        const snap = await getDocs(collection(db, "delivery_partners"));
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
        }
      } catch (err) {}
    }
    return localStore.delivery_partners;
  },

  async findDeliveryPartnerByPhone(phone) {
    if (isFirestoreConnected && db) {
      try {
        const q = query(collection(db, "delivery_partners"), where("phone", "==", phone));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          return { id: Number(d.id) || d.id, ...d.data() };
        }
      } catch (err) {}
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
    if (isFirestoreConnected && db) {
      try {
        await setDoc(doc(db, "delivery_partners", String(id)), partner);
      } catch (err) {}
    }
    localStore.delivery_partners.push(partner);
    await saveLocalStore();
    return partner;
  },

  async deleteDeliveryPartner(id) {
    if (isFirestoreConnected && db) {
      try {
        await updateDoc(doc(db, "delivery_partners", String(id)), { is_active: 0 });
      } catch (err) {}
    }
    const partner = localStore.delivery_partners.find((d) => String(d.id) === String(id));
    if (partner) partner.is_active = 0;
    await saveLocalStore();
  },

  async updateDeliveryPartnerCounts(id, activeDelta = 0, completedDelta = 0) {
    const now = new Date().toISOString();
    const partner = localStore.delivery_partners.find((d) => String(d.id) === String(id));
    if (partner) {
      partner.active_order_count = Math.max(0, partner.active_order_count + activeDelta);
      partner.completed_order_count = Math.max(0, partner.completed_order_count + completedDelta);
      partner.updated_at = now;
      await saveLocalStore();
    }
    if (isFirestoreConnected && db) {
      try {
        const docRef = doc(db, "delivery_partners", String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cur = docSnap.data();
          await updateDoc(docRef, {
            active_order_count: Math.max(0, (cur.active_order_count || 0) + activeDelta),
            completed_order_count: Math.max(0, (cur.completed_order_count || 0) + completedDelta),
            updated_at: now,
          });
        }
      } catch (err) {}
    }
  },

  // VENDOR PARTNERS
  async getVendorPartners(vendorType = null) {
    let list = [];
    if (isFirestoreConnected && db) {
      try {
        let q = collection(db, "vendor_partners");
        if (vendorType) q = query(collection(db, "vendor_partners"), where("vendor_type", "==", vendorType));
        const snap = await getDocs(q);
        if (!snap.empty) {
          list = snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
        }
      } catch (err) {}
    }
    if (list.length === 0) {
      list = localStore.vendor_partners;
      if (vendorType) {
        list = list.filter((v) => v.vendor_type === vendorType);
      }
    }
    return list.filter((v) => v.is_active !== 0);
  },

  async findVendorById(id) {
    if (isFirestoreConnected && db) {
      try {
        const docRef = doc(db, "vendor_partners", String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: Number(docSnap.id) || docSnap.id, ...docSnap.data() };
        }
      } catch (err) {}
    }
    return localStore.vendor_partners.find((v) => String(v.id) === String(id)) || null;
  },

  // ORDERS & ORDER ITEMS
  async getOrders(userId = null) {
    let orderRows = [];
    if (isFirestoreConnected && db) {
      try {
        let q = collection(db, "orders");
        if (userId) q = query(collection(db, "orders"), where("user_id", "==", Number(userId)));
        const snap = await getDocs(q);
        if (!snap.empty) {
          orderRows = snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
        }
      } catch (err) {}
    }
    if (orderRows.length === 0) {
      orderRows = localStore.orders;
      if (userId) {
        orderRows = orderRows.filter((o) => String(o.user_id) === String(userId));
      }
    }

    orderRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
    if (isFirestoreConnected && db) {
      try {
        const snap = await getDocs(collection(db, "order_items"));
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
        }
      } catch (err) {}
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

    if (isFirestoreConnected && db) {
      try {
        await setDoc(doc(db, "orders", String(orderId)), newOrder);
        const batch = writeBatch(db);
        createdItems.forEach((it) => {
          batch.set(doc(db, "order_items", String(it.id)), it);
        });
        await batch.commit();
      } catch (err) {}
    }

    localStore.orders.push(newOrder);
    localStore.order_items.push(...createdItems);
    await saveLocalStore();

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

    if (isFirestoreConnected && db) {
      try {
        await updateDoc(doc(db, "orders", String(id)), {
          status: newStatus,
          updated_at: now,
        });
      } catch (err) {}
    }

    const o = localStore.orders.find((ord) => String(ord.id) === String(id));
    if (o) {
      o.status = newStatus;
      o.updated_at = now;
      await saveLocalStore();
    }

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
    if (isFirestoreConnected && db) {
      try {
        let q = collection(db, "procurement_orders");
        if (source) q = query(collection(db, "procurement_orders"), where("source", "==", source));
        const snap = await getDocs(q);
        if (!snap.empty) {
          orderRows = snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
        }
      } catch (err) {}
    }
    if (orderRows.length === 0) {
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
    if (isFirestoreConnected && db) {
      try {
        const snap = await getDocs(collection(db, "procurement_order_items"));
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
        }
      } catch (err) {}
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

    if (isFirestoreConnected && db) {
      try {
        await setDoc(doc(db, "procurement_orders", String(orderId)), newOrder);
        const batch = writeBatch(db);
        createdItems.forEach((it) => {
          batch.set(doc(db, "procurement_order_items", String(it.id)), it);
        });
        await batch.commit();
      } catch (err) {}
    }

    localStore.procurement_orders.push(newOrder);
    localStore.procurement_order_items.push(...createdItems);
    await saveLocalStore();

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

    if (isFirestoreConnected && db) {
      try {
        await setDoc(doc(db, "discount_campaigns", String(campaignId)), newCampaign);
      } catch (err) {}
    }

    localStore.discount_campaigns.push(newCampaign);
    await saveLocalStore();

    for (const item of itemsData) {
      await this.updateMedicineDiscount(item.medicine_id, item.applied_discount_percent);
    }

    return newCampaign;
  },
};
