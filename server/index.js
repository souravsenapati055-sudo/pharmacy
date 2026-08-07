import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { initializeDatabase, firestoreService } from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_URL = process.env.CLIENT_URL || "*";
const JWT_SECRET = process.env.JWT_SECRET || "development-secret";
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const DEV_EXPOSE_OTP = process.env.DEV_EXPOSE_OTP === "true";
const execFileAsync = promisify(execFile);
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(serverDir, "..");
const diseaseModelDir = path.join(projectRoot, "Disease-Prediction-from-Symptoms-master");
const diseaseTrainingCsv = path.join(diseaseModelDir, "dataset", "training_data.csv");
const pythonCommand = process.env.PYTHON_COMMAND || "python";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// Normalize Vercel Serverless Function URLs to match /api routes
app.use((req, _res, next) => {
  if (!req.url.startsWith("/api") && req.url !== "/") {
    req.url = "/api" + req.url;
  }
  next();
});

// Ensure Database is initialized on Vercel or Express startup
let isInitialized = false;
app.use(async (_req, _res, next) => {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
    } catch (e) {
      console.error("DB init error:", e);
    }
  }
  next();
});

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    profilePhoto: row.profile_photo ?? "",
    role: row.role,
    isAdmin: row.role === "admin",
    businessName: row.business_name ?? "",
    businessAddress: row.business_address ?? "",
    verification: row.verification_document ?? "",
  };
}

const diseaseRecommendations = {
  "Common Cold": { medicineName: "Cough Syrup", advice: "Stay hydrated and rest. Consult a doctor if symptoms worsen." },
  Flu: { medicineName: "Paracetamol 500mg", advice: "Take fever and pain relief only as directed." },
  Allergy: { medicineName: "Vitamin C Tablets", advice: "Avoid known triggers and consult a doctor for antihistamines." },
  Migraine: { medicineName: "Ibuprofen 400mg", advice: "Use pain relief carefully and rest in a dark room." },
  Arthritis: { medicineName: "Ibuprofen 400mg", advice: "Pain relief may help temporarily; follow medical guidance." },
  Osteoarthristis: { medicineName: "Ibuprofen 400mg", advice: "Pain relief may help temporarily; follow medical guidance." },
  Diabetes: { medicineName: "Insulin Pen", advice: "Only use insulin under doctor supervision." },
  "Diabetes ": { medicineName: "Insulin Pen", advice: "Only use insulin under doctor supervision." },
  Impetigo: { medicineName: "Antibiotic Cream", advice: "Keep the affected area clean and consult a doctor." },
  Acne: { medicineName: "Antibiotic Cream", advice: "Use topical treatment carefully and avoid skin irritation." },
  Psoriasis: { medicineName: "Antibiotic Cream", advice: "Consult a dermatologist for the right treatment plan." },
  "Fungal infection": { medicineName: "Antifungal Cream", advice: "Keep the area dry and seek medical advice if persistent." },
  GERD: { medicineName: "Antacid", advice: "Avoid spicy food and consult a doctor if symptoms continue." },
  "Urinary tract infection": { medicineName: "Consult Doctor for Antibiotics", advice: "This usually needs prescription treatment." },
};

function mapMedicine(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? "",
    image: row.image_url ?? "",
    price: Number(row.price),
    discount: Number(row.discount_percent),
    stock: row.stock,
  };
}

function mapDeliveryPartner(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    orders: row.completed_order_count,
    activeOrders: row.active_order_count,
  };
}

function mapVendor(row) {
  return {
    id: row.id,
    type: row.vendor_type,
    name: row.name,
    phone: row.phone ?? "",
    location: row.location ?? "",
    rating: Number(row.rating || 0),
  };
}

async function fetchProcurementOrders(source = null) {
  return firestoreService.getProcurementOrders(source);
}

async function fetchOrdersForUser(userId = null) {
  const rawOrders = await firestoreService.getOrders(userId);
  return rawOrders.map((row) => {
    const items = row.items || [];
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.customer_name,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      items: items.map((it) => ({
        id: it.medicine_id,
        name: it.medicine_name,
        price: Number(it.unit_price),
        discount: Number(it.discount_percent || 0),
        qty: it.quantity,
        totalPrice: Number(it.total_price),
      })),
      medicine: items.map((item) => item.medicine_name).join(", "),
      qty: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      subtotal: Number(row.subtotal),
      discountTotal: Number(row.discount_total),
      deliveryFee: Number(row.delivery_fee),
      total: Number(row.total),
      totalPrice: Number(row.total),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      deliveryPartner: row.delivery_partner_name,
      deliveryPartnerPhone: row.delivery_partner_phone,
      address: {
        label: row.address_label,
        details: row.address_details,
      },
      notes: row.notes ?? "",
      createdAt: row.created_at,
    };
  });
}

async function fetchOverview(userId) {
  const allMeds = await firestoreService.getMedicines();
  const medicines = allMeds.filter((m) => m.is_active !== 0).map(mapMedicine);

  const categories = Array.from(
    new Map(
      medicines.map((medicine) => [
        medicine.category,
        {
          name: medicine.category,
          count: medicines.filter((item) => item.category === medicine.category).length,
        },
      ])
    ).values()
  );

  const orders = await fetchOrdersForUser(userId);
  return { medicines, categories, orders };
}

async function loadSymptomList() {
  try {
    const firstLine = (await fs.readFile(diseaseTrainingCsv, "utf8")).split(/\r?\n/)[0] || "";
    return firstLine
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item && item !== "prognosis");
  } catch (err) {
    // Fallback symptoms if CSV file is not present on Vercel serverless
    return [
      "itching", "skin_rash", "nodal_skin_eruptions", "continuous_sneezing", "shivering", "chills",
      "joint_pain", "stomach_pain", "acidity", "ulcers_on_tongue", "muscle_wasting", "vomiting",
      "burning_micturition", "spotting_urination", "fatigue", "weight_gain", "anxiety",
      "cold_hands_and_feets", "mood_swings", "weight_loss", "restlessness", "lethargy",
      "patches_in_throat", "irregular_sugar_level", "cough", "high_fever", "sunken_eyes",
      "breathlessness", "sweating", "dehydration", "indigestion", "headache", "yellowish_skin",
      "dark_urine", "nausea", "loss_of_appetite", "pain_behind_the_eyes", "back_pain",
      "constipation", "abdominal_pain", "diarrhoea", "mild_fever", "yellowing_of_eyes"
    ];
  }
}

async function runDiseasePrediction(symptoms) {
  try {
    const { stdout } = await execFileAsync(
      pythonCommand,
      [path.join(diseaseModelDir, "predict_api.py"), JSON.stringify(symptoms)],
      { cwd: diseaseModelDir }
    );
    return JSON.parse(stdout);
  } catch (err) {
    // Fallback JS symptom predictor for environments without Python (e.g. Vercel)
    const lowerSymptoms = symptoms.map((s) => s.toLowerCase());
    let predictedDisease = "Common Cold";

    if (lowerSymptoms.some((s) => s.includes("fever") || s.includes("chill") || s.includes("headache"))) {
      predictedDisease = "Flu";
    } else if (lowerSymptoms.some((s) => s.includes("skin") || s.includes("itch") || s.includes("rash"))) {
      predictedDisease = "Fungal infection";
    } else if (lowerSymptoms.some((s) => s.includes("sugar") || s.includes("polyuria") || s.includes("thirst"))) {
      predictedDisease = "Diabetes";
    } else if (lowerSymptoms.some((s) => s.includes("joint") || s.includes("muscle") || s.includes("back"))) {
      predictedDisease = "Migraine";
    }

    return {
      disease: predictedDisease,
      recognizedSymptoms: symptoms,
    };
  }
}

function formatDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function getDateRange(range, startDate, endDate) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (range === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (range === "weekly") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (range === "monthly") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (range === "quarterly") {
    start.setMonth(start.getMonth() - 3);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (range === "yearly") {
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (range === "custom" && startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }
  return { start: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), end };
}

async function fetchAnalyticsBaseData() {
  const orders = await firestoreService.getOrders();
  const orderItems = await firestoreService.getAllOrderItems();
  const allMeds = await firestoreService.getMedicines();
  const medicines = allMeds.filter((m) => m.is_active !== 0);
  const users = await firestoreService.getUsers();
  const allPartners = await firestoreService.getDeliveryPartners();
  const deliveryPartners = allPartners.filter((p) => p.is_active !== 0);
  return { orders, orderItems, medicines, users, deliveryPartners };
}

function buildAnalytics(range, baseData) {
  const { orders, orderItems, medicines, users } = baseData;
  const now = new Date();
  const salesSeries = [];

  if (range === "weekly") {
    for (let i = 6; i >= 0; i -= 1) {
      const current = new Date(now);
      current.setDate(now.getDate() - i);
      const label = current.toLocaleDateString("en-IN", { weekday: "short" });
      const key = formatDateKey(current);
      const dayOrders = orders.filter((order) => formatDateKey(order.created_at) === key);
      salesSeries.push({
        day: label,
        sales: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
        orders: dayOrders.length,
      });
    }
  } else if (range === "monthly") {
    for (let i = 3; i >= 0; i -= 1) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - 6);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      const weekOrders = orders.filter((order) => {
        const created = new Date(order.created_at);
        return created >= weekStart && created <= weekEnd;
      });
      salesSeries.push({
        month: `Week ${4 - i}`,
        sales: weekOrders.reduce((sum, order) => sum + Number(order.total), 0),
        orders: weekOrders.length,
      });
    }
  } else {
    for (let i = 11; i >= 0; i -= 1) {
      const current = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthOrders = orders.filter((order) => {
        const created = new Date(order.created_at);
        return created >= current && created < next;
      });
      salesSeries.push({
        month: current.toLocaleDateString("en-IN", { month: "short" }),
        sales: monthOrders.reduce((sum, order) => sum + Number(order.total), 0),
        orders: monthOrders.length,
      });
    }
  }

  const orderItemByMedicine = orderItems.reduce((acc, item) => {
    const current = acc.get(item.medicine_id) || { quantity: 0, sales: 0, name: item.medicine_name };
    current.quantity += item.quantity;
    current.sales += Number(item.total_price);
    acc.set(item.medicine_id, current);
    return acc;
  }, new Map());

  const topProducts = Array.from(orderItemByMedicine.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      sales: item.sales,
      quantity: item.quantity,
    }));

  const categoryMap = medicines.reduce((acc, medicine) => {
    const sold = orderItems
      .filter((item) => String(item.medicine_id) === String(medicine.id))
      .reduce((sum, item) => sum + item.quantity, 0);
    acc.set(medicine.category, (acc.get(medicine.category) || 0) + sold);
    return acc;
  }, new Map());

  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalOrders = orders.length;
  const activeCustomers = new Set(orders.map((order) => order.user_id)).size;

  return {
    stats: {
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders ? totalSales / totalOrders : 0,
      activeCustomers,
      totalMedicines: medicines.length,
      totalCategories: new Set(medicines.map((medicine) => medicine.category)).size,
      lowStockCount: medicines.filter((medicine) => medicine.stock < 20).length,
      totalCustomers: users.filter((user) => user.role === "customer").length,
    },
    salesData: salesSeries,
    topProducts,
    categoryData,
  };
}

function buildAlerts(baseData) {
  const { medicines, orders, deliveryPartners } = baseData;
  const alerts = [];

  medicines
    .filter((medicine) => medicine.stock < 20)
    .forEach((medicine) => {
      alerts.push({
        id: `stock-${medicine.id}`,
        type: "low-stock",
        title: "Low Stock Alert",
        message: `${medicine.name} is running low. Only ${medicine.stock} units left.`,
        severity: medicine.stock < 10 ? "high" : "medium",
        date: new Date().toISOString(),
        read: false,
        medicine: medicine.name,
        currentStock: medicine.stock,
        minStock: 20,
      });
    });

  orders
    .filter((order) => order.payment_status === "failed" || (order.payment_method === "cod" && order.payment_status === "pending"))
    .slice(0, 5)
    .forEach((order) => {
      alerts.push({
        id: `payment-${order.id}`,
        type: "payment",
        title: "Payment Attention",
        message: `Payment for order #${order.id} is ${order.payment_status}.`,
        severity: order.payment_status === "failed" ? "high" : "info",
        date: order.created_at,
        read: false,
        orderId: order.id,
      });
    });

  orders
    .filter((order) => order.status === "Processing")
    .slice(0, 5)
    .forEach((order) => {
      alerts.push({
        id: `order-${order.id}`,
        type: "order",
        title: "Processing Order",
        message: `Order #${order.id} is still processing and ready for dispatch.`,
        severity: "info",
        date: order.created_at,
        read: false,
        orderId: order.id,
      });
    });

  deliveryPartners
    .filter((partner) => partner.active_order_count > 3)
    .forEach((partner) => {
      alerts.push({
        id: `delivery-${partner.id}`,
        type: "delivery",
        title: "Delivery Load High",
        message: `${partner.name} currently has ${partner.active_order_count} active deliveries.`,
        severity: "medium",
        date: new Date().toISOString(),
        read: false,
        deliveryPartner: partner.name,
      });
    });

  return alerts.slice(0, 20);
}

function buildInsights(baseData) {
  const { orders, orderItems, medicines, users, deliveryPartners } = baseData;
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const last30Start = new Date();
  last30Start.setDate(last30Start.getDate() - 30);
  const last30Orders = orders.filter((order) => new Date(order.created_at) >= last30Start);
  const topMedicine = orderItems
    .reduce((acc, item) => {
      acc[item.medicine_name] = (acc[item.medicine_name] || 0) + item.quantity;
      return acc;
    }, {});
  const topMedicineEntry = Object.entries(topMedicine).sort((a, b) => b[1] - a[1])[0];
  const lowStockMedicine = [...medicines].sort((a, b) => a.stock - b.stock)[0];
  const busiestPartner = [...deliveryPartners].sort((a, b) => b.active_order_count - a.active_order_count)[0];

  return {
    insights: [
      {
        id: 1,
        title: "Sales Trend Analysis",
        description: `Total recorded sales are Rs ${totalSales.toFixed(0)} with ${last30Orders.length} orders in the last 30 days.`,
        impact: "high",
        category: "sales",
      },
      {
        id: 2,
        title: "Customer Behavior",
        description: `${new Set(orders.map((order) => order.user_id)).size} customers have placed orders so far.`,
        impact: "medium",
        category: "customers",
      },
      {
        id: 3,
        title: "Inventory Optimization",
        description: lowStockMedicine
          ? `${lowStockMedicine.name} has the lowest stock at ${lowStockMedicine.stock} units.`
          : "Inventory is currently healthy.",
        impact: "high",
        category: "inventory",
      },
    ],
    predictions: [
      {
        id: 1,
        title: "Next Month Sales Forecast",
        value: `Rs ${(last30Orders.reduce((sum, order) => sum + Number(order.total), 0) * 1.08 || 0).toFixed(0)}`,
        confidence: "78%",
        trend: "up",
      },
      {
        id: 2,
        title: "Expected Order Volume",
        value: `${Math.round(last30Orders.length * 1.05)} orders`,
        confidence: "74%",
        trend: "up",
      },
      {
        id: 3,
        title: "Customer Growth",
        value: `${users.filter((user) => user.role === "customer").length} customers`,
        confidence: "81%",
        trend: "up",
      },
    ],
    recommendations: [
      {
        id: 1,
        title: "Increase Low Stock Inventory",
        action: lowStockMedicine ? `Restock ${lowStockMedicine.name} soon to avoid stockouts.` : "No urgent inventory gaps detected.",
        priority: "high",
        roi: "Reduced missed sales",
      },
      {
        id: 2,
        title: "Promote Top Seller",
        action: topMedicineEntry ? `Bundle or feature ${topMedicineEntry[0]} which has sold ${topMedicineEntry[1]} units.` : "Collect more order history for product recommendations.",
        priority: "medium",
        roi: "Higher repeat orders",
      },
      {
        id: 3,
        title: "Balance Delivery Load",
        action: busiestPartner ? `Review assignments for ${busiestPartner.name} who has ${busiestPartner.active_order_count} active orders.` : "Delivery team load is balanced.",
        priority: "medium",
        roi: "Faster fulfilment",
      },
    ],
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function isEmail(value) {
  return value.includes("@");
}

function createOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

async function findUserByIdentifier(identifier, role) {
  const user = isEmail(identifier)
    ? await firestoreService.findUserByEmail(identifier)
    : await firestoreService.findUserByPhone(identifier);
  if (user && user.role === role) {
    return user;
  }
  return null;
}

async function createOtp(userId, purpose) {
  const otpCode = createOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  await firestoreService.createAuthOtp({
    user_id: userId,
    purpose,
    otp_code: otpCode,
    expires_at: expiresAt,
  });
  return { otp: otpCode, expiresAt };
}

async function consumeOtp(userId, purpose, otpCode) {
  const record = await firestoreService.findValidOtp(userId, purpose, otpCode);
  if (!record) {
    return { ok: false, message: "Invalid or expired OTP." };
  }
  await firestoreService.markOtpUsed(record.id);
  return { ok: true };
}

app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, database: "firestore" });
});

app.get("/api/prediction/symptoms", async (_req, res) => {
  try {
    const symptoms = await loadSymptomList();
    res.json(symptoms);
  } catch (error) {
    console.error("Symptom list load error:", error);
    res.status(500).json({ message: "Unable to load symptoms right now." });
  }
});

app.post("/api/prediction/disease", async (req, res) => {
  try {
    const { symptoms = [] } = req.body;
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: "Please select at least one symptom." });
    }

    const prediction = await runDiseasePrediction(symptoms);
    const recommendation =
      diseaseRecommendations[prediction.disease] ||
      { medicineName: "Consult Doctor", advice: "A direct medicine recommendation is not available for this disease in the current catalog." };

    const allMeds = await firestoreService.getMedicines();
    const matchedMedicine = allMeds.find((m) => m.name === recommendation.medicineName && m.is_active !== 0);

    res.json({
      disease: prediction.disease,
      recognizedSymptoms: prediction.recognizedSymptoms,
      recommendedMedicine: recommendation.medicineName,
      advice: recommendation.advice,
      recommendedProduct: matchedMedicine ? mapMedicine(matchedMedicine) : null,
    });
  } catch (error) {
    console.error("Disease prediction error:", error);
    res.status(500).json({ message: "Unable to run disease prediction right now." });
  }
});

app.get("/api/home", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const overview = await fetchOverview(userId);
    res.json(overview);
  } catch (error) {
    console.error("Home overview error:", error);
    res.status(500).json({ message: "Unable to load home data right now." });
  }
});

app.get("/api/medicines", async (_req, res) => {
  try {
    const allMeds = await firestoreService.getMedicines();
    const activeMeds = allMeds.filter((m) => m.is_active !== 0);
    activeMeds.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    res.json(activeMeds.map(mapMedicine));
  } catch (error) {
    console.error("Medicines fetch error:", error);
    res.status(500).json({ message: "Unable to load medicines right now." });
  }
});

app.get("/api/delivery-partners", async (_req, res) => {
  try {
    const allPartners = await firestoreService.getDeliveryPartners();
    const activePartners = allPartners.filter((p) => p.is_active !== 0);
    activePartners.sort((a, b) => a.name.localeCompare(b.name));
    res.json(activePartners.map(mapDeliveryPartner));
  } catch (error) {
    console.error("Delivery partners fetch error:", error);
    res.status(500).json({ message: "Unable to load delivery partners right now." });
  }
});

app.get("/api/admin/dashboard", async (_req, res) => {
  try {
    const baseData = await fetchAnalyticsBaseData();
    const analytics = buildAnalytics("yearly", baseData);
    const recentOrders = await fetchOrdersForUser();
    res.json({
      stats: analytics.stats,
      deliverySummary: {
        totalPartners: baseData.deliveryPartners.length,
        activeOrders: baseData.orders.filter((order) => order.status !== "Delivered").length,
        completedDeliveries: baseData.deliveryPartners.reduce(
          (sum, partner) => sum + (partner.completed_order_count || 0),
          0
        ),
      },
      salesData: analytics.salesData,
      medicineData: analytics.topProducts.map((item) => ({
        name: item.name,
        qty: item.quantity,
      })),
      recentOrders: recentOrders.slice(0, 8),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Unable to load dashboard data right now." });
  }
});

app.get("/api/admin/analytics", async (req, res) => {
  try {
    const range = req.query.range || "weekly";
    const baseData = await fetchAnalyticsBaseData();
    res.json(buildAnalytics(range, baseData));
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ message: "Unable to load analytics right now." });
  }
});

app.get("/api/admin/alerts", async (_req, res) => {
  try {
    const baseData = await fetchAnalyticsBaseData();
    res.json(buildAlerts(baseData));
  } catch (error) {
    console.error("Admin alerts error:", error);
    res.status(500).json({ message: "Unable to load alerts right now." });
  }
});

app.get("/api/admin/insights", async (_req, res) => {
  try {
    const baseData = await fetchAnalyticsBaseData();
    res.json(buildInsights(baseData));
  } catch (error) {
    console.error("Admin insights error:", error);
    res.status(500).json({ message: "Unable to load insights right now." });
  }
});

app.get("/api/admin/report", async (req, res) => {
  try {
    const { reportType = "sales", dateRange = "weekly", startDate, endDate } = req.query;
    const { start, end } = getDateRange(dateRange, startDate, endDate);
    const baseData = await fetchAnalyticsBaseData();
    const filteredOrders = baseData.orders.filter((order) => {
      const created = new Date(order.created_at);
      return created >= start && created <= end;
    });

    let rows = [];
    if (reportType === "sales") {
      const byDate = filteredOrders.reduce((acc, order) => {
        const key = formatDateKey(order.created_at);
        if (!acc[key]) acc[key] = { date: key, orders: 0, revenue: 0 };
        acc[key].orders += 1;
        acc[key].revenue += Number(order.total);
        return acc;
      }, {});
      rows = Object.values(byDate).map((entry) => ({
        ...entry,
        avgOrder: entry.orders ? entry.revenue / entry.orders : 0,
      }));
    } else if (reportType === "inventory" || reportType === "expiry") {
      rows = baseData.medicines.map((medicine) => ({
        medicine: medicine.name,
        stock: medicine.stock,
        lowStock: medicine.stock < 20 ? "Yes" : "No",
        category: medicine.category,
      }));
    } else if (reportType === "orders") {
      rows = filteredOrders.map((order) => ({
        orderId: order.id,
        customer: order.customer_name,
        total: Number(order.total),
        status: order.status,
        paymentStatus: order.payment_status,
      }));
    } else if (reportType === "customers") {
      const customers = baseData.users.filter((user) => user.role === "customer");
      rows = customers.map((customer) => ({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      }));
    }

    res.json({
      title: `${reportType[0].toUpperCase()}${reportType.slice(1)} Report`,
      reportType,
      dateRange,
      generatedOn: new Date().toISOString(),
      totalRecords: rows.length,
      rows,
    });
  } catch (error) {
    console.error("Admin report error:", error);
    res.status(500).json({ message: "Unable to generate report preview right now." });
  }
});

app.get("/api/admin/vendors", async (req, res) => {
  try {
    const { vendorType } = req.query;
    const vendors = await firestoreService.getVendorPartners(vendorType || null);
    vendors.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
    res.json(vendors.map(mapVendor));
  } catch (error) {
    console.error("Vendor fetch error:", error);
    res.status(500).json({ message: "Unable to load vendors right now." });
  }
});

app.get("/api/admin/procurement-orders", async (req, res) => {
  try {
    const { source } = req.query;
    const orders = await fetchProcurementOrders(source || null);
    res.json(orders);
  } catch (error) {
    console.error("Procurement orders fetch error:", error);
    res.status(500).json({ message: "Unable to load procurement orders right now." });
  }
});

app.post("/api/admin/procurement-orders", async (req, res) => {
  try {
    const {
      vendorId,
      vendorType,
      source,
      items,
      notes = "",
      urgency = null,
      createdByUserId = null,
    } = req.body;

    const validSources = ["seller-order", "restock", "emergency"];
    const validVendorTypes = ["seller", "supplier"];
    const validUrgency = [null, "low", "medium", "high"];

    if (!vendorId || !validVendorTypes.includes(vendorType) || !validSources.includes(source)) {
      return res.status(400).json({ message: "Vendor, vendor type, and order source are required." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one medicine is required." });
    }

    if (!validUrgency.includes(urgency)) {
      return res.status(400).json({ message: "Invalid urgency value." });
    }

    const vendor = await firestoreService.findVendorById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Selected vendor was not found." });
    }

    let total = 0;
    const normalizedItems = [];
    for (const item of items) {
      const medicine = await firestoreService.getMedicineById(item.id);
      if (!medicine) {
        return res.status(400).json({ message: `Medicine ${item.id} not found.` });
      }

      const quantity = Number(item.qty || item.quantity || 0);
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: `Invalid quantity for ${medicine.name}.` });
      }

      const lineTotal = Number(medicine.price) * quantity;
      total += lineTotal;
      normalizedItems.push({
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        unit_price: Number(medicine.price),
        quantity,
        total_price: lineTotal,
      });
    }

    const createdOrder = await firestoreService.createProcurementOrder(
      {
        vendor_id: vendor.id,
        vendor_type: vendorType,
        source,
        urgency,
        total,
        notes,
        created_by_user_id: createdByUserId,
      },
      normalizedItems
    );

    res.status(201).json({
      message: "Procurement order created successfully.",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Procurement order create error:", error);
    res.status(400).json({ message: error.message || "Unable to create procurement order right now." });
  }
});

app.post("/api/admin/discounts/apply", async (req, res) => {
  try {
    const {
      medicineIds,
      discountType,
      discountValue,
      minQuantity = null,
      validUntil = null,
      promoCode = "",
    } = req.body;

    if (!Array.isArray(medicineIds) || medicineIds.length === 0) {
      return res.status(400).json({ message: "Select at least one medicine." });
    }

    const numericDiscount = Number(discountValue);
    if (!numericDiscount || numericDiscount <= 0) {
      return res.status(400).json({ message: "Enter a valid discount value." });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({ message: "Invalid discount type." });
    }

    const campaignItems = [];
    for (const medId of medicineIds) {
      const medicine = await firestoreService.getMedicineById(medId);
      if (medicine) {
        const originalPrice = Number(medicine.price);
        const appliedDiscountPercent =
          discountType === "percentage"
            ? Math.min(numericDiscount, 100)
            : Math.min((numericDiscount / originalPrice) * 100, 100);
        const discountedPrice = Math.max(originalPrice * (1 - appliedDiscountPercent / 100), 0);
        campaignItems.push({
          medicine_id: medicine.id,
          original_price: originalPrice,
          applied_discount_percent: appliedDiscountPercent,
          discounted_price: discountedPrice,
        });
      }
    }

    await firestoreService.createDiscountCampaign(
      {
        title: promoCode ? `Promo ${promoCode}` : `Discount Campaign ${new Date().toISOString().slice(0, 10)}`,
        discount_type: discountType,
        discount_value: numericDiscount,
        min_quantity: minQuantity,
        valid_until: validUntil,
        promo_code: promoCode,
      },
      campaignItems
    );

    const allMeds = await firestoreService.getMedicines();
    const updatedRows = allMeds.filter((m) => medicineIds.some((id) => String(id) === String(m.id)));

    res.json({
      message: "Discount applied successfully.",
      medicines: updatedRows.map(mapMedicine),
    });
  } catch (error) {
    console.error("Discount apply error:", error);
    res.status(400).json({ message: error.message || "Unable to apply discount right now." });
  }
});

app.post("/api/delivery-partners", async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required." });
    }

    const partner = await firestoreService.createDeliveryPartner({
      name: name.trim(),
      phone: phone.trim(),
    });

    res.status(201).json(mapDeliveryPartner(partner));
  } catch (error) {
    console.error("Delivery partner create error:", error);
    res.status(500).json({ message: "Unable to add delivery partner right now." });
  }
});

app.delete("/api/delivery-partners/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: "Invalid delivery partner id." });
    }

    await firestoreService.deleteDeliveryPartner(id);
    res.json({ message: "Delivery partner removed." });
  } catch (error) {
    console.error("Delivery partner delete error:", error);
    res.status(500).json({ message: "Unable to remove delivery partner right now." });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const orders = await fetchOrdersForUser(userId);
    res.json(orders);
  } catch (error) {
    console.error("Orders fetch error:", error);
    res.status(500).json({ message: "Unable to load orders right now." });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const {
      userId,
      items,
      paymentMethod,
      address,
      notes = "",
    } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0 || !paymentMethod || !address?.label || !address?.details) {
      return res.status(400).json({ message: "Order items, address, payment method, and user are required." });
    }

    const allPartners = await firestoreService.getDeliveryPartners();
    const activePartners = allPartners.filter((p) => p.is_active !== 0);
    activePartners.sort((a, b) => (a.active_order_count || 0) - (b.active_order_count || 0) || (b.completed_order_count || 0) - (a.completed_order_count || 0));
    const partner = activePartners[0] || null;

    let subtotal = 0;
    let discountTotal = 0;
    const normalizedItems = [];

    for (const item of items) {
      const medicine = await firestoreService.getMedicineById(item.id);
      if (!medicine) {
        return res.status(400).json({ message: `Medicine ${item.id} not found.` });
      }

      const quantity = Number(item.qty || item.quantity || 0);
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: `Invalid quantity for ${medicine.name}.` });
      }

      if (medicine.stock < quantity) {
        return res.status(400).json({ message: `Not enough stock for ${medicine.name}.` });
      }

      const unitPrice = Number(medicine.price);
      const discountPercent = Number(medicine.discount_percent);
      const lineSubtotal = unitPrice * quantity;
      const lineDiscount = (unitPrice * discountPercent * quantity) / 100;
      const lineTotal = lineSubtotal - lineDiscount;

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      normalizedItems.push({
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        quantity,
        total_price: lineTotal,
      });

      // Deduct stock
      await firestoreService.updateMedicineStock(medicine.id, medicine.stock - quantity);
    }

    const deliveryFee = normalizedItems.length > 0 ? 7 : 0;
    const total = subtotal - discountTotal + deliveryFee;
    const paymentStatus = paymentMethod === "cod" ? "pending" : "paid";

    const createdOrder = await firestoreService.createOrder(
      {
        user_id: userId,
        delivery_partner_id: partner?.id ?? null,
        status: "Processing",
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        subtotal,
        discount_total: discountTotal,
        delivery_fee: deliveryFee,
        total,
        address_label: address.label,
        address_details: address.details,
        notes,
      },
      normalizedItems
    );

    res.status(201).json({
      message: partner
        ? `Order placed successfully and assigned to ${partner.name}.`
        : "Order placed successfully.",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Order create error:", error);
    res.status(400).json({ message: error.message || "Unable to place order right now." });
  }
});

app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const validStatuses = ["Processing", "Out for Delivery", "Delivered", "Cancelled"];

    if (!id || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Valid order id and status are required." });
    }

    const updatedOrder = await firestoreService.updateOrderStatus(id, status);
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json({
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({ message: "Unable to update order status right now." });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const {
      role = "customer",
      name,
      email,
      mobile,
      password,
      businessName = "",
      businessAddress = "",
      verification = "",
    } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "Name, email, mobile, and password are required." });
    }

    if (role === "admin" && (!businessName || !businessAddress || !verification)) {
      return res.status(400).json({ message: "Admin signup requires business details and verification." });
    }

    const existingEmail = await firestoreService.findUserByEmail(email);
    const existingPhone = await firestoreService.findUserByPhone(mobile);

    if (existingEmail || existingPhone) {
      return res.status(409).json({ message: "An account with this email or phone already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRow = await firestoreService.createUser({
      role,
      name,
      email,
      phone: mobile,
      password_hash: passwordHash,
      business_name: businessName || null,
      business_address: businessAddress || null,
      verification_document: verification || null,
    });

    const user = sanitizeUser(userRow);

    res.status(201).json({
      message: "Account created successfully.",
      token: createToken(user),
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Unable to create account right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password, role = "customer" } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required." });
    }

    const userRow = await findUserByIdentifier(identifier, role);
    if (!userRow) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = sanitizeUser(userRow);
    res.json({
      message: "Signed in successfully.",
      token: createToken(user),
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Unable to sign in right now." });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, name, googleId, profilePhoto, role = "customer" } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Google email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    let userRow = await firestoreService.findUserByEmail(cleanEmail);

    if (!userRow) {
      const dummyPhone = "9" + Math.floor(100000000 + Math.random() * 900000000);
      const dummyPasswordHash = await bcrypt.hash("google-auth-" + Date.now(), 10);
      const userName = name ? name.trim() : cleanEmail.split("@")[0];

      userRow = await firestoreService.createUser({
        role,
        name: userName,
        email: cleanEmail,
        phone: dummyPhone,
        password_hash: dummyPasswordHash,
        profile_photo: profilePhoto || "",
      });
    } else if (userRow.role !== role) {
      userRow = await firestoreService.updateUser(userRow.id, { role });
    }

    const user = sanitizeUser(userRow);
    res.json({
      message: "Signed in with Google successfully.",
      token: createToken(user),
      user,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Unable to sign in with Google right now." });
  }
});

app.post("/api/auth/login/request-otp", async (req, res) => {
  try {
    const { identifier, role = "customer" } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: "Email or phone is required." });
    }

    const userRow = await findUserByIdentifier(identifier, role);
    if (!userRow) {
      return res.status(404).json({ message: "No account found for that email or phone." });
    }

    const { otp } = await createOtp(userRow.id, "login");
    res.json({
      message: "Login OTP generated successfully.",
      devOtp: DEV_EXPOSE_OTP ? otp : undefined,
    });
  } catch (error) {
    console.error("Login OTP request error:", error);
    res.status(500).json({ message: "Unable to generate OTP right now." });
  }
});

app.post("/api/auth/login/verify-otp", async (req, res) => {
  try {
    const { identifier, otp, role = "customer" } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ message: "Email/phone and OTP are required." });
    }

    const userRow = await findUserByIdentifier(identifier, role);
    if (!userRow) {
      return res.status(404).json({ message: "No account found for that email or phone." });
    }

    const result = await consumeOtp(userRow.id, "login", otp);
    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    const user = sanitizeUser(userRow);
    res.json({
      message: "Signed in successfully.",
      token: createToken(user),
      user,
    });
  } catch (error) {
    console.error("Login OTP verify error:", error);
    res.status(500).json({ message: "Unable to verify OTP right now." });
  }
});

app.post("/api/auth/forgot-password/request-otp", async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: "Email or phone is required." });
    }

    const userRow = isEmail(identifier)
      ? await firestoreService.findUserByEmail(identifier)
      : await firestoreService.findUserByPhone(identifier);

    if (!userRow) {
      return res.status(404).json({ message: "No account found for that email or phone." });
    }

    const { otp } = await createOtp(userRow.id, "password_reset");
    res.json({
      message: "Reset OTP generated successfully.",
      devOtp: DEV_EXPOSE_OTP ? otp : undefined,
    });
  } catch (error) {
    console.error("Forgot password OTP request error:", error);
    res.status(500).json({ message: "Unable to generate reset OTP right now." });
  }
});

app.post("/api/auth/forgot-password/reset", async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: "Identifier, OTP, and new password are required." });
    }

    const userRow = isEmail(identifier)
      ? await firestoreService.findUserByEmail(identifier)
      : await firestoreService.findUserByPhone(identifier);

    if (!userRow) {
      return res.status(404).json({ message: "No account found for that email or phone." });
    }

    const result = await consumeOtp(userRow.id, "password_reset", otp);
    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await firestoreService.updateUser(userRow.id, { password_hash: passwordHash });

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Unable to reset password right now." });
  }
});

app.patch("/api/users/:id/profile", async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, phone, profilePhoto = "" } = req.body;

    if (!id || !name || !email || !phone) {
      return res.status(400).json({ message: "Name, email, and phone are required." });
    }

    const existing = await firestoreService.findUserById(id);
    if (!existing) {
      return res.status(404).json({ message: "User not found." });
    }

    const dupEmail = await firestoreService.findUserByEmail(email.trim());
    if (dupEmail && String(dupEmail.id) !== String(id)) {
      return res.status(409).json({ message: "Email already belongs to another account." });
    }

    const dupPhone = await firestoreService.findUserByPhone(phone.trim());
    if (dupPhone && String(dupPhone.id) !== String(id)) {
      return res.status(409).json({ message: "Phone already belongs to another account." });
    }

    const updatedUser = await firestoreService.updateUser(id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      profile_photo: profilePhoto || null,
    });

    const user = sanitizeUser(updatedUser);
    res.json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Unable to update profile right now." });
  }
});

// Standalone local server listener (ignored on Vercel serverless)
if (!process.env.VERCEL) {
  async function startServer() {
    try {
      await initializeDatabase();
      app.listen(PORT, () => {
        console.log(`Auth/Pharmacy server running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
  startServer();
}

export default app;
