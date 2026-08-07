import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDbConfig() {
  const dbUrl =
    process.env.MYSQL_URL ||
    process.env.DATABASE_URL ||
    process.env.MYSQL_PUBLIC_URL ||
    process.env.MYSQLPRIVATEURL ||
    process.env.MYSQL_PRIVATE_URL;

  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      return {
        host: parsed.hostname,
        port: Number(parsed.port || 3306),
        user: decodeURIComponent(parsed.username || "root"),
        password: decodeURIComponent(parsed.password || "Sourav@9002249524"),
        database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : "pharmacy_app",
      };
    } catch (e) {
      console.warn("Failed to parse DB URL:", e.message);
    }
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Sourav@9002249524",
    database: process.env.DB_NAME || "pharmacy_app",
  };
}

const NEW_MEDICINES = [
  { id: 7, name: "Metformin 500mg", category: "Diabetes Care", description: "First-line medication for the treatment of type 2 diabetes.", image_url: "https://via.placeholder.com/150?text=Metformin", price: 50.00, discount_percent: 5.00, stock: 200, is_active: 1 },
  { id: 8, name: "Azithromycin 500mg", category: "Antibiotics", description: "Broad-spectrum macrolide antibiotic.", image_url: "https://via.placeholder.com/150?text=Azithromycin", price: 110.00, discount_percent: 10.00, stock: 80, is_active: 1 },
  { id: 9, name: "Omeprazole 20mg", category: "Gastrointestinal", description: "Proton pump inhibitor for acid reflux and heartburn.", image_url: "https://via.placeholder.com/150?text=Omeprazole", price: 65.00, discount_percent: 5.00, stock: 150, is_active: 1 },
  { id: 10, name: "Cetirizine 10mg", category: "Allergy & Anti-histamine", description: "Antihistamine for runny nose, sneezing, and hives.", image_url: "https://via.placeholder.com/150?text=Cetirizine", price: 30.00, discount_percent: 0.00, stock: 180, is_active: 1 },
  { id: 11, name: "D-3 60K Vitamin Capsules", category: "Vitamins", description: "High potency Vitamin D3 supplement for bone health.", image_url: "https://via.placeholder.com/150?text=Vitamin+D3", price: 150.00, discount_percent: 15.00, stock: 110, is_active: 1 },
  { id: 12, name: "Digital Blood Pressure Monitor", category: "Medical Devices", description: "Automatic upper arm BP monitor with digital pulse display.", image_url: "https://via.placeholder.com/150?text=BP+Monitor", price: 1499.00, discount_percent: 20.00, stock: 25, is_active: 1 },
  { id: 13, name: "Infrared Forehead Thermometer", category: "Medical Devices", description: "Non-contact instant body temperature reader.", image_url: "https://via.placeholder.com/150?text=Thermometer", price: 899.00, discount_percent: 15.00, stock: 40, is_active: 1 },
  { id: 14, name: "Antiseptic Liquid 500ml", category: "First Aid", description: "Disinfectant solution for wounds, cuts and hygiene.", image_url: "https://via.placeholder.com/150?text=Antiseptic", price: 185.00, discount_percent: 10.00, stock: 95, is_active: 1 },
  { id: 15, name: "ORS Electrolyte Powder", category: "Rehydration", description: "Oral rehydration salts for restoring fluids and minerals.", image_url: "https://via.placeholder.com/150?text=ORS", price: 22.00, discount_percent: 0.00, stock: 300, is_active: 1 }
];

const NEW_USERS = [
  { id: 2, role: "admin", name: "System Admin", email: "admin@gmail.com", phone: "9999999999", password_hash: bcrypt.hashSync("admin123", 10), business_name: "Pharmacy Store HQ", business_address: "123 Healthcare Blvd", verification_document: "DOC-ADMIN-001" },
  { id: 5, role: "admin", name: "Pharmacy Admin", email: "admin@pharmacy.com", phone: "9999999998", password_hash: bcrypt.hashSync("admin123", 10), business_name: "Pharmacy Store HQ", business_address: "123 Healthcare Blvd", verification_document: "DOC-ADMIN-002" },
  { id: 3, role: "customer", name: "John Doe", email: "john.doe@example.com", phone: "9811223344", password_hash: bcrypt.hashSync("customer123", 10), business_name: null, business_address: null, verification_document: null },
  { id: 4, role: "customer", name: "Priya Patel", email: "priya.patel@example.com", phone: "9822334455", password_hash: bcrypt.hashSync("customer123", 10), business_name: null, business_address: null, verification_document: null }
];

const ORDERS = [
  {
    id: 1,
    user_id: 2,
    delivery_partner_id: 1,
    status: "Delivered",
    payment_method: "upi",
    payment_status: "paid",
    subtotal: 170.00,
    discount_total: 23.00,
    delivery_fee: 30.00,
    total: 177.00,
    address_label: "Home",
    address_details: "45/A Park Street, Sector 5, City",
    notes: "Leave at door step",
    items: [
      { medicine_id: 1, medicine_name: "Paracetamol 500mg", unit_price: 25.00, discount_percent: 10.00, quantity: 2, total_price: 45.00 },
      { medicine_id: 3, medicine_name: "Vitamin C Tablets", unit_price: 120.00, discount_percent: 15.00, quantity: 1, total_price: 102.00 }
    ]
  },
  {
    id: 2,
    user_id: 3,
    delivery_partner_id: 2,
    status: "Out for Delivery",
    payment_method: "cod",
    payment_status: "pending",
    subtotal: 1599.00,
    discount_total: 304.80,
    delivery_fee: 0.00,
    total: 1294.20,
    address_label: "Office",
    address_details: "Tech Park Tower B, 4th Floor",
    notes: "Call upon arrival",
    items: [
      { medicine_id: 12, medicine_name: "Digital Blood Pressure Monitor", unit_price: 1499.00, discount_percent: 20.00, quantity: 1, total_price: 1199.20 },
      { medicine_id: 7, medicine_name: "Metformin 500mg", unit_price: 50.00, discount_percent: 5.00, quantity: 2, total_price: 95.00 }
    ]
  },
  {
    id: 3,
    user_id: 4,
    delivery_partner_id: 3,
    status: "Processing",
    payment_method: "card",
    payment_status: "paid",
    subtotal: 200.00,
    discount_total: 13.60,
    delivery_fee: 25.00,
    total: 211.40,
    address_label: "Apartment",
    address_details: "Sunrise Heights Apt 302",
    notes: "Deliver in the evening",
    items: [
      { medicine_id: 4, medicine_name: "Cough Syrup", unit_price: 85.00, discount_percent: 8.00, quantity: 2, total_price: 156.40 },
      { medicine_id: 10, medicine_name: "Cetirizine 10mg", unit_price: 30.00, discount_percent: 0.00, quantity: 1, total_price: 30.00 }
    ]
  },
  {
    id: 4,
    user_id: 2,
    delivery_partner_id: 1,
    status: "Delivered",
    payment_method: "upi",
    payment_status: "paid",
    subtotal: 305.00,
    discount_total: 9.75,
    delivery_fee: 30.00,
    total: 325.25,
    address_label: "Home",
    address_details: "45/A Park Street, Sector 5, City",
    notes: null,
    items: [
      { medicine_id: 9, medicine_name: "Omeprazole 20mg", unit_price: 65.00, discount_percent: 5.00, quantity: 3, total_price: 185.25 },
      { medicine_id: 15, medicine_name: "ORS Electrolyte Powder", unit_price: 22.00, discount_percent: 0.00, quantity: 5, total_price: 110.00 }
    ]
  }
];

const PROCUREMENT_ORDERS = [
  {
    id: 1,
    vendor_id: 1,
    vendor_type: "seller",
    source: "seller-order",
    status: "Completed",
    urgency: "medium",
    total: 4500.00,
    notes: "Monthly stock replenishment for antibiotics and analgesics",
    items: [
      { medicine_id: 1, medicine_name: "Paracetamol 500mg", unit_price: 20.00, quantity: 100, total_price: 2000.00 },
      { medicine_id: 2, medicine_name: "Amoxicillin 250mg", unit_price: 35.00, quantity: 50, total_price: 1750.00 },
      { medicine_id: 7, medicine_name: "Metformin 500mg", unit_price: 15.00, quantity: 50, total_price: 750.00 }
    ]
  },
  {
    id: 2,
    vendor_id: 5,
    vendor_type: "supplier",
    source: "restock",
    status: "Approved",
    urgency: "high",
    total: 12500.00,
    notes: "Urgent replenishment for Insulin pens and BP monitors",
    items: [
      { medicine_id: 6, medicine_name: "Insulin Pen", unit_price: 380.00, quantity: 20, total_price: 7600.00 },
      { medicine_id: 12, medicine_name: "Digital Blood Pressure Monitor", unit_price: 980.00, quantity: 5, total_price: 4900.00 }
    ]
  },
  {
    id: 3,
    vendor_id: 8,
    vendor_type: "supplier",
    source: "emergency",
    status: "Pending",
    urgency: "high",
    total: 3200.00,
    notes: "Low stock alert for Azithromycin & Omeprazole",
    items: [
      { medicine_id: 8, medicine_name: "Azithromycin 500mg", unit_price: 85.00, quantity: 20, total_price: 1700.00 },
      { medicine_id: 9, medicine_name: "Omeprazole 20mg", unit_price: 50.00, quantity: 30, total_price: 1500.00 }
    ]
  }
];

const DISCOUNT_CAMPAIGNS = [
  {
    id: 1,
    title: "Monsoon Immunity Special",
    discount_type: "percentage",
    discount_value: 15.00,
    min_quantity: 2,
    valid_until: "2026-09-30 23:59:59",
    promo_code: "IMMUNITY15"
  },
  {
    id: 2,
    title: "Diabetes Care Super Sale",
    discount_type: "fixed",
    discount_value: 50.00,
    min_quantity: 1,
    valid_until: "2026-10-15 23:59:59",
    promo_code: "DIABETES50"
  },
  {
    id: 3,
    title: "Flat 20% Off on Medical Devices",
    discount_type: "percentage",
    discount_value: 20.00,
    min_quantity: 1,
    valid_until: "2026-12-31 23:59:59",
    promo_code: "DEVICES20"
  }
];

async function seedMySQL() {
  const config = getDbConfig();
  console.log(`Connecting to MySQL database "${config.database}"...`);
  const conn = await mysql.createConnection(config);

  try {
    // 1. Medicines
    console.log("Seeding medicines...");
    for (const m of NEW_MEDICINES) {
      await conn.query(
        `INSERT INTO medicines (id, name, category, description, image_url, price, discount_percent, stock, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         name=VALUES(name), category=VALUES(category), description=VALUES(description),
         price=VALUES(price), discount_percent=VALUES(discount_percent), stock=VALUES(stock)`,
        [m.id, m.name, m.category, m.description, m.image_url, m.price, m.discount_percent, m.stock, m.is_active]
      );
    }

    // 2. Users
    console.log("Seeding users...");
    for (const u of NEW_USERS) {
      await conn.query(
        `INSERT INTO users (id, role, name, email, phone, password_hash, business_name, business_address, verification_document)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash)`,
        [u.id, u.role, u.name, u.email, u.phone, u.password_hash, u.business_name, u.business_address, u.verification_document]
      );
    }

    // 3. Discount Campaigns
    console.log("Seeding discount campaigns...");
    for (const dc of DISCOUNT_CAMPAIGNS) {
      await conn.query(
        `INSERT INTO discount_campaigns (id, title, discount_type, discount_value, min_quantity, valid_until, promo_code)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title=VALUES(title)`,
        [dc.id, dc.title, dc.discount_type, dc.discount_value, dc.min_quantity, dc.valid_until, dc.promo_code]
      );
    }

    // 4. Orders & Order Items
    console.log("Seeding orders and order items...");
    for (const o of ORDERS) {
      await conn.query(
        `INSERT INTO orders (id, user_id, delivery_partner_id, status, payment_method, payment_status, subtotal, discount_total, delivery_fee, total, address_label, address_details, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), payment_status=VALUES(payment_status)`,
        [o.id, o.user_id, o.delivery_partner_id, o.status, o.payment_method, o.payment_status, o.subtotal, o.discount_total, o.delivery_fee, o.total, o.address_label, o.address_details, o.notes]
      );

      for (const item of o.items) {
        await conn.query(
          `INSERT INTO order_items (order_id, medicine_id, medicine_name, unit_price, discount_percent, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [o.id, item.medicine_id, item.medicine_name, item.unit_price, item.discount_percent, item.quantity, item.total_price]
        );
      }
    }

    // 5. Procurement Orders & Procurement Order Items
    console.log("Seeding procurement orders...");
    for (const po of PROCUREMENT_ORDERS) {
      await conn.query(
        `INSERT INTO procurement_orders (id, vendor_id, vendor_type, source, status, urgency, total, notes, created_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [po.id, po.vendor_id, po.vendor_type, po.source, po.status, po.urgency, po.total, po.notes]
      );

      for (const item of po.items) {
        await conn.query(
          `INSERT INTO procurement_order_items (procurement_order_id, medicine_id, medicine_name, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [po.id, item.medicine_id, item.medicine_name, item.unit_price, item.quantity, item.total_price]
        );
      }
    }

    console.log("✅ MySQL Seeding complete!");
  } finally {
    await conn.end();
  }
}

async function seedLocalJsonStore() {
  const jsonPath = path.join(__dirname, "local_db_store.json");
  try {
    const raw = await fs.readFile(jsonPath, "utf-8");
    const data = JSON.parse(raw);

    // Merge medicines
    const existingMedIds = new Set(data.medicines.map((m) => m.id));
    for (const m of NEW_MEDICINES) {
      if (!existingMedIds.has(m.id)) {
        data.medicines.push({
          ...m,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Merge users
    const existingUserIds = new Set(data.users.map((u) => u.id));
    for (const u of NEW_USERS) {
      if (!existingUserIds.has(u.id)) {
        data.users.push({
          ...u,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Orders
    data.orders = ORDERS.map((o) => ({
      id: o.id,
      user_id: o.user_id,
      delivery_partner_id: o.delivery_partner_id,
      status: o.status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      subtotal: o.subtotal,
      discount_total: o.discount_total,
      delivery_fee: o.delivery_fee,
      total: o.total,
      address_label: o.address_label,
      address_details: o.address_details,
      notes: o.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Order items
    data.order_items = [];
    let orderItemId = 1;
    for (const o of ORDERS) {
      for (const item of o.items) {
        data.order_items.push({
          id: orderItemId++,
          order_id: o.id,
          ...item,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Procurement orders
    data.procurement_orders = PROCUREMENT_ORDERS.map((po) => ({
      id: po.id,
      vendor_id: po.vendor_id,
      vendor_type: po.vendor_type,
      source: po.source,
      status: po.status,
      urgency: po.urgency,
      total: po.total,
      notes: po.notes,
      created_by_user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Procurement order items
    data.procurement_order_items = [];
    let poItemId = 1;
    for (const po of PROCUREMENT_ORDERS) {
      for (const item of po.items) {
        data.procurement_order_items.push({
          id: poItemId++,
          procurement_order_id: po.id,
          ...item,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Discount campaigns
    data.discount_campaigns = DISCOUNT_CAMPAIGNS.map((dc) => ({
      ...dc,
      created_at: new Date().toISOString(),
    }));

    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), "utf-8");
    console.log("✅ local_db_store.json updated successfully!");
  } catch (err) {
    console.warn("Could not update local_db_store.json:", err.message);
  }
}

async function run() {
  try {
    await seedMySQL();
  } catch (err) {
    console.error("MySQL seeding error:", err.message);
  }
  await seedLocalJsonStore();
  process.exit(0);
}

run();
