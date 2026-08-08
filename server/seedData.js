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

// ─────────────────────────────────────────────
// Helper to produce a date N days ago as ISO string
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// ─────────────────────────────────────────────
// FULL MEDICINE CATALOG (20 items)
// ─────────────────────────────────────────────
const ALL_MEDICINES = [
  { id: 1,  name: "Paracetamol 500mg",              category: "Pain Relief",              description: "Fast relief for fever and mild pain.",                               image_url: "https://placehold.co/300x180/e0f2fe/0ea5e9?text=Paracetamol",    price: 25,   discount_percent: 10, stock: 120, is_active: 1 },
  { id: 2,  name: "Amoxicillin 250mg",              category: "Antibiotics",              description: "Prescription antibiotic for bacterial infections.",                  image_url: "https://placehold.co/300x180/fef9c3/ca8a04?text=Amoxicillin",   price: 45,   discount_percent: 5,  stock: 90,  is_active: 1 },
  { id: 3,  name: "Vitamin C Tablets",              category: "Vitamins",                 description: "Daily immunity support tablets.",                                    image_url: "https://placehold.co/300x180/dcfce7/16a34a?text=Vitamin+C",     price: 120,  discount_percent: 15, stock: 160, is_active: 1 },
  { id: 4,  name: "Cough Syrup",                    category: "Cough & Cold",             description: "Syrup for dry and wet cough relief.",                               image_url: "https://placehold.co/300x180/fce7f3/db2777?text=Cough+Syrup",   price: 85,   discount_percent: 8,  stock: 75,  is_active: 1 },
  { id: 5,  name: "Ibuprofen 400mg",                category: "Pain Relief",              description: "Anti-inflammatory tablets for pain relief.",                        image_url: "https://placehold.co/300x180/e0f2fe/0ea5e9?text=Ibuprofen",     price: 35,   discount_percent: 0,  stock: 140, is_active: 1 },
  { id: 6,  name: "Insulin Pen",                    category: "Diabetes Care",            description: "Insulin delivery pen for diabetes management.",                     image_url: "https://placehold.co/300x180/f3e8ff/9333ea?text=Insulin",       price: 450,  discount_percent: 12, stock: 35,  is_active: 1 },
  { id: 7,  name: "Metformin 500mg",                category: "Diabetes Care",            description: "First-line medication for the treatment of type 2 diabetes.",      image_url: "https://placehold.co/300x180/f3e8ff/9333ea?text=Metformin",     price: 50,   discount_percent: 5,  stock: 200, is_active: 1 },
  { id: 8,  name: "Azithromycin 500mg",             category: "Antibiotics",              description: "Broad-spectrum macrolide antibiotic.",                              image_url: "https://placehold.co/300x180/fef9c3/ca8a04?text=Azithromycin",  price: 110,  discount_percent: 10, stock: 80,  is_active: 1 },
  { id: 9,  name: "Omeprazole 20mg",                category: "Gastrointestinal",         description: "Proton pump inhibitor for acid reflux and heartburn.",              image_url: "https://placehold.co/300x180/fef3c7/d97706?text=Omeprazole",   price: 65,   discount_percent: 5,  stock: 150, is_active: 1 },
  { id: 10, name: "Cetirizine 10mg",                category: "Allergy & Antihistamine",  description: "Antihistamine for runny nose, sneezing, and hives.",                image_url: "https://placehold.co/300x180/ecfdf5/059669?text=Cetirizine",    price: 30,   discount_percent: 0,  stock: 180, is_active: 1 },
  { id: 11, name: "D-3 60K Vitamin Capsules",       category: "Vitamins",                 description: "High potency Vitamin D3 supplement for bone health.",              image_url: "https://placehold.co/300x180/dcfce7/16a34a?text=Vitamin+D3",    price: 150,  discount_percent: 15, stock: 110, is_active: 1 },
  { id: 12, name: "Digital Blood Pressure Monitor", category: "Medical Devices",          description: "Automatic upper arm BP monitor with digital pulse display.",        image_url: "https://placehold.co/300x180/ede9fe/7c3aed?text=BP+Monitor",    price: 1499, discount_percent: 20, stock: 25,  is_active: 1 },
  { id: 13, name: "Infrared Forehead Thermometer",  category: "Medical Devices",          description: "Non-contact instant body temperature reader.",                      image_url: "https://placehold.co/300x180/ede9fe/7c3aed?text=Thermometer",   price: 899,  discount_percent: 15, stock: 40,  is_active: 1 },
  { id: 14, name: "Antiseptic Liquid 500ml",        category: "First Aid",                description: "Disinfectant solution for wounds, cuts and hygiene.",               image_url: "https://placehold.co/300x180/fef3c7/d97706?text=Antiseptic",    price: 185,  discount_percent: 10, stock: 95,  is_active: 1 },
  { id: 15, name: "ORS Electrolyte Powder",         category: "Rehydration",              description: "Oral rehydration salts for restoring fluids and minerals.",         image_url: "https://placehold.co/300x180/e0f7fa/0097a7?text=ORS",           price: 22,   discount_percent: 0,  stock: 300, is_active: 1 },
  { id: 16, name: "Antibiotic Cream 15g",           category: "First Aid",                description: "Topical antibiotic ointment for skin infections and cuts.",         image_url: "https://placehold.co/300x180/fef9c3/ca8a04?text=Antibiotic",    price: 75,   discount_percent: 0,  stock: 88,  is_active: 1 },
  { id: 17, name: "Antifungal Cream 20g",           category: "Dermatology",              description: "Topical antifungal for ringworm, athlete's foot and skin fungus.",  image_url: "https://placehold.co/300x180/fce7f3/db2777?text=Antifungal",    price: 95,   discount_percent: 0,  stock: 60,  is_active: 1 },
  { id: 18, name: "Antacid Syrup 200ml",            category: "Gastrointestinal",         description: "Fast-acting antacid syrup for acidity and heartburn relief.",       image_url: "https://placehold.co/300x180/fef3c7/d97706?text=Antacid",       price: 55,   discount_percent: 0,  stock: 110, is_active: 1 },
  { id: 19, name: "B-Complex Tablets",              category: "Vitamins",                 description: "Comprehensive B vitamin supplement for energy and nerve health.",   image_url: "https://placehold.co/300x180/dcfce7/16a34a?text=B-Complex",     price: 80,   discount_percent: 10, stock: 130, is_active: 1 },
  { id: 20, name: "Pulse Oximeter",                 category: "Medical Devices",          description: "Fingertip SpO2 and heart rate monitor for home use.",               image_url: "https://placehold.co/300x180/ede9fe/7c3aed?text=Oximeter",      price: 699,  discount_percent: 10, stock: 7,   is_active: 1 },
];

const NEW_USERS = [
  { id: 2, role: "admin",    name: "System Admin",   email: "admin@gmail.com",           phone: "9999999999", password_hash: bcrypt.hashSync("admin123",    10), business_name: "Pharmacy Store HQ", business_address: "123 Healthcare Blvd", verification_document: "DOC-ADMIN-001" },
  { id: 5, role: "admin",    name: "Pharmacy Admin", email: "admin@pharmacy.com",        phone: "9999999998", password_hash: bcrypt.hashSync("admin123",    10), business_name: "Pharmacy Store HQ", business_address: "123 Healthcare Blvd", verification_document: "DOC-ADMIN-002" },
  { id: 3, role: "customer", name: "John Doe",       email: "john.doe@example.com",      phone: "9811223344", password_hash: bcrypt.hashSync("customer123", 10), business_name: null, business_address: null, verification_document: null },
  { id: 4, role: "customer", name: "Priya Patel",    email: "priya.patel@example.com",   phone: "9822334455", password_hash: bcrypt.hashSync("customer123", 10), business_name: null, business_address: null, verification_document: null },
  { id: 6, role: "customer", name: "Rahul Singh",    email: "rahul.singh@example.com",   phone: "9833445566", password_hash: bcrypt.hashSync("customer123", 10), business_name: null, business_address: null, verification_document: null },
  { id: 7, role: "customer", name: "Anita Gupta",    email: "anita.gupta@example.com",   phone: "9844556677", password_hash: bcrypt.hashSync("customer123", 10), business_name: null, business_address: null, verification_document: null },
];

// 15 orders spread over the last 30 days for rich analytics charts
const ORDERS = [
  {
    id: 1, user_id: 3, delivery_partner_id: 1, status: "Delivered",        payment_method: "upi",  payment_status: "paid",
    subtotal: 170.00,  discount_total: 23.00,  delivery_fee: 7.00, total: 154.00, created_at: daysAgo(28),
    address_label: "Home",      address_details: "45/A Park Street, Sector 5, Mumbai", notes: "Leave at door step",
    items: [
      { medicine_id: 1,  medicine_name: "Paracetamol 500mg",  unit_price: 25.00,  discount_percent: 10.00, quantity: 2, total_price: 45.00  },
      { medicine_id: 3,  medicine_name: "Vitamin C Tablets",   unit_price: 120.00, discount_percent: 15.00, quantity: 1, total_price: 102.00 },
    ],
  },
  {
    id: 2, user_id: 4, delivery_partner_id: 2, status: "Delivered",        payment_method: "cod",  payment_status: "paid",
    subtotal: 1599.00, discount_total: 299.80, delivery_fee: 7.00, total: 1306.20, created_at: daysAgo(26),
    address_label: "Office",    address_details: "Tech Park Tower B, 4th Floor, Delhi", notes: "Call upon arrival",
    items: [
      { medicine_id: 12, medicine_name: "Digital BP Monitor",  unit_price: 1499.00, discount_percent: 20.00, quantity: 1, total_price: 1199.20 },
      { medicine_id: 7,  medicine_name: "Metformin 500mg",     unit_price: 50.00,   discount_percent: 5.00,  quantity: 2, total_price: 95.00   },
    ],
  },
  {
    id: 3, user_id: 6, delivery_partner_id: 3, status: "Delivered",        payment_method: "card", payment_status: "paid",
    subtotal: 200.00,  discount_total: 13.60,  delivery_fee: 7.00, total: 193.40, created_at: daysAgo(24),
    address_label: "Apartment", address_details: "Sunrise Heights Apt 302, Bangalore", notes: "Deliver in the evening",
    items: [
      { medicine_id: 4,  medicine_name: "Cough Syrup",         unit_price: 85.00, discount_percent: 8.00, quantity: 2, total_price: 156.40 },
      { medicine_id: 10, medicine_name: "Cetirizine 10mg",     unit_price: 30.00, discount_percent: 0.00, quantity: 1, total_price: 30.00  },
    ],
  },
  {
    id: 4, user_id: 3, delivery_partner_id: 1, status: "Delivered",        payment_method: "upi",  payment_status: "paid",
    subtotal: 305.00,  discount_total: 9.75,   delivery_fee: 7.00, total: 302.25, created_at: daysAgo(21),
    address_label: "Home",      address_details: "45/A Park Street, Sector 5, Mumbai", notes: null,
    items: [
      { medicine_id: 9,  medicine_name: "Omeprazole 20mg",      unit_price: 65.00, discount_percent: 5.00, quantity: 3, total_price: 185.25 },
      { medicine_id: 15, medicine_name: "ORS Electrolyte Powder",unit_price: 22.00, discount_percent: 0.00, quantity: 5, total_price: 110.00 },
    ],
  },
  {
    id: 5, user_id: 7, delivery_partner_id: 4, status: "Delivered",        payment_method: "upi",  payment_status: "paid",
    subtotal: 899.00,  discount_total: 134.85, delivery_fee: 7.00, total: 771.15, created_at: daysAgo(19),
    address_label: "Home",      address_details: "Green Valley Colony, House 12, Chennai", notes: null,
    items: [
      { medicine_id: 13, medicine_name: "Infrared Thermometer", unit_price: 899.00, discount_percent: 15.00, quantity: 1, total_price: 764.15 },
    ],
  },
  {
    id: 6, user_id: 4, delivery_partner_id: 2, status: "Delivered",        payment_method: "card", payment_status: "paid",
    subtotal: 400.00,  discount_total: 36.00,  delivery_fee: 7.00, total: 371.00, created_at: daysAgo(17),
    address_label: "Office",    address_details: "MG Road Commercial Complex, Bangalore", notes: "Fragile items",
    items: [
      { medicine_id: 19, medicine_name: "B-Complex Tablets",    unit_price: 80.00, discount_percent: 10.00, quantity: 2, total_price: 144.00 },
      { medicine_id: 11, medicine_name: "D-3 60K Vitamin Caps", unit_price: 150.00, discount_percent: 15.00, quantity: 2, total_price: 255.00 },
    ],
  },
  {
    id: 7, user_id: 6, delivery_partner_id: 5, status: "Delivered",        payment_method: "upi",  payment_status: "paid",
    subtotal: 540.00,  discount_total: 54.00,  delivery_fee: 7.00, total: 493.00, created_at: daysAgo(14),
    address_label: "Home",      address_details: "Lakeview Apartments, Block C, Hyderabad", notes: null,
    items: [
      { medicine_id: 6,  medicine_name: "Insulin Pen",          unit_price: 450.00, discount_percent: 12.00, quantity: 1, total_price: 396.00 },
      { medicine_id: 18, medicine_name: "Antacid Syrup 200ml",  unit_price: 55.00,  discount_percent: 0.00,  quantity: 1, total_price: 55.00  },
    ],
  },
  {
    id: 8, user_id: 7, delivery_partner_id: 3, status: "Delivered",        payment_method: "cod",  payment_status: "paid",
    subtotal: 255.00,  discount_total: 18.50,  delivery_fee: 7.00, total: 243.50, created_at: daysAgo(12),
    address_label: "Home",      address_details: "Sector 9 Housing Society, Pune", notes: null,
    items: [
      { medicine_id: 8,  medicine_name: "Azithromycin 500mg",   unit_price: 110.00, discount_percent: 10.00, quantity: 1, total_price: 99.00  },
      { medicine_id: 14, medicine_name: "Antiseptic Liquid",     unit_price: 185.00, discount_percent: 10.00, quantity: 1, total_price: 166.50 },
    ],
  },
  {
    id: 9, user_id: 3, delivery_partner_id: 1, status: "Delivered",        payment_method: "upi",  payment_status: "paid",
    subtotal: 160.00,  discount_total: 16.00,  delivery_fee: 7.00, total: 151.00, created_at: daysAgo(10),
    address_label: "Home",      address_details: "45/A Park Street, Sector 5, Mumbai", notes: null,
    items: [
      { medicine_id: 16, medicine_name: "Antibiotic Cream 15g", unit_price: 75.00, discount_percent: 0.00, quantity: 1, total_price: 75.00 },
      { medicine_id: 17, medicine_name: "Antifungal Cream 20g", unit_price: 95.00, discount_percent: 0.00, quantity: 1, total_price: 95.00 },
    ],
  },
  {
    id: 10, user_id: 4, delivery_partner_id: 2, status: "Delivered",       payment_method: "card", payment_status: "paid",
    subtotal: 699.00,  discount_total: 69.90,  delivery_fee: 7.00, total: 636.10, created_at: daysAgo(8),
    address_label: "Office",    address_details: "Tech Park Tower B, 4th Floor, Delhi", notes: null,
    items: [
      { medicine_id: 20, medicine_name: "Pulse Oximeter",        unit_price: 699.00, discount_percent: 10.00, quantity: 1, total_price: 629.10 },
    ],
  },
  {
    id: 11, user_id: 6, delivery_partner_id: 4, status: "Delivered",       payment_method: "upi",  payment_status: "paid",
    subtotal: 175.00,  discount_total: 8.75,   delivery_fee: 7.00, total: 173.25, created_at: daysAgo(6),
    address_label: "Home",      address_details: "Lakeview Apartments, Block C, Hyderabad", notes: null,
    items: [
      { medicine_id: 2,  medicine_name: "Amoxicillin 250mg",     unit_price: 45.00, discount_percent: 5.00, quantity: 2, total_price: 85.50 },
      { medicine_id: 5,  medicine_name: "Ibuprofen 400mg",       unit_price: 35.00, discount_percent: 0.00, quantity: 2, total_price: 70.00 },
    ],
  },
  {
    id: 12, user_id: 7, delivery_partner_id: 5, status: "Delivered",       payment_method: "cod",  payment_status: "paid",
    subtotal: 270.00,  discount_total: 0.00,   delivery_fee: 7.00, total: 277.00, created_at: daysAgo(4),
    address_label: "Home",      address_details: "Sector 9 Housing Society, Pune", notes: null,
    items: [
      { medicine_id: 15, medicine_name: "ORS Electrolyte Powder", unit_price: 22.00, discount_percent: 0.00, quantity: 4, total_price: 88.00 },
      { medicine_id: 10, medicine_name: "Cetirizine 10mg",        unit_price: 30.00, discount_percent: 0.00, quantity: 3, total_price: 90.00 },
      { medicine_id: 18, medicine_name: "Antacid Syrup 200ml",    unit_price: 55.00, discount_percent: 0.00, quantity: 1, total_price: 55.00 },
    ],
  },
  {
    id: 13, user_id: 3, delivery_partner_id: 1, status: "Out for Delivery", payment_method: "upi",  payment_status: "paid",
    subtotal: 500.00,  discount_total: 54.00,  delivery_fee: 7.00, total: 453.00, created_at: daysAgo(2),
    address_label: "Home",      address_details: "45/A Park Street, Sector 5, Mumbai", notes: "Please ring the bell",
    items: [
      { medicine_id: 6,  medicine_name: "Insulin Pen",          unit_price: 450.00, discount_percent: 12.00, quantity: 1, total_price: 396.00 },
      { medicine_id: 7,  medicine_name: "Metformin 500mg",      unit_price: 50.00,  discount_percent: 5.00,  quantity: 1, total_price: 47.50  },
    ],
  },
  {
    id: 14, user_id: 6, delivery_partner_id: 3, status: "Processing",       payment_method: "card", payment_status: "paid",
    subtotal: 280.00,  discount_total: 28.00,  delivery_fee: 7.00, total: 259.00, created_at: daysAgo(1),
    address_label: "Home",      address_details: "Lakeview Apartments, Block C, Hyderabad", notes: null,
    items: [
      { medicine_id: 19, medicine_name: "B-Complex Tablets",    unit_price: 80.00, discount_percent: 10.00, quantity: 2, total_price: 144.00 },
      { medicine_id: 3,  medicine_name: "Vitamin C Tablets",    unit_price: 120.00, discount_percent: 15.00, quantity: 1, total_price: 102.00 },
    ],
  },
  {
    id: 15, user_id: 4, delivery_partner_id: 2, status: "Processing",       payment_method: "cod",  payment_status: "pending",
    subtotal: 220.00,  discount_total: 0.00,   delivery_fee: 7.00, total: 227.00, created_at: daysAgo(0),
    address_label: "Office",    address_details: "MG Road Commercial Complex, Bangalore", notes: "Urgent delivery needed",
    items: [
      { medicine_id: 4,  medicine_name: "Cough Syrup",          unit_price: 85.00, discount_percent: 8.00, quantity: 2, total_price: 156.40 },
      { medicine_id: 9,  medicine_name: "Omeprazole 20mg",      unit_price: 65.00, discount_percent: 5.00, quantity: 1, total_price: 61.75  },
    ],
  },
];

const PROCUREMENT_ORDERS = [
  {
    id: 1, vendor_id: 1, vendor_type: "seller",   source: "seller-order", status: "Completed", urgency: "medium", total: 4500.00,
    notes: "Monthly stock replenishment for antibiotics and analgesics",
    items: [
      { medicine_id: 1, medicine_name: "Paracetamol 500mg",  unit_price: 20.00, quantity: 100, total_price: 2000.00 },
      { medicine_id: 2, medicine_name: "Amoxicillin 250mg",  unit_price: 35.00, quantity: 50,  total_price: 1750.00 },
      { medicine_id: 7, medicine_name: "Metformin 500mg",    unit_price: 15.00, quantity: 50,  total_price: 750.00  },
    ],
  },
  {
    id: 2, vendor_id: 5, vendor_type: "supplier", source: "restock",       status: "Approved",  urgency: "high",   total: 12500.00,
    notes: "Urgent replenishment for Insulin pens and BP monitors",
    items: [
      { medicine_id: 6,  medicine_name: "Insulin Pen",                    unit_price: 380.00, quantity: 20, total_price: 7600.00 },
      { medicine_id: 12, medicine_name: "Digital Blood Pressure Monitor", unit_price: 980.00, quantity: 5,  total_price: 4900.00 },
    ],
  },
  {
    id: 3, vendor_id: 8, vendor_type: "supplier", source: "emergency",     status: "Pending",   urgency: "high",   total: 3200.00,
    notes: "Low stock alert for Azithromycin & Omeprazole",
    items: [
      { medicine_id: 8, medicine_name: "Azithromycin 500mg", unit_price: 85.00, quantity: 20, total_price: 1700.00 },
      { medicine_id: 9, medicine_name: "Omeprazole 20mg",    unit_price: 50.00, quantity: 30, total_price: 1500.00 },
    ],
  },
  {
    id: 4, vendor_id: 6, vendor_type: "supplier", source: "restock",       status: "Completed", urgency: "medium", total: 5600.00,
    notes: "Restock vitamins and antihistamines for monsoon season",
    items: [
      { medicine_id: 3,  medicine_name: "Vitamin C Tablets",  unit_price: 80.00,  quantity: 30, total_price: 2400.00 },
      { medicine_id: 11, medicine_name: "D-3 60K Vitamin Caps",unit_price: 100.00, quantity: 20, total_price: 2000.00 },
      { medicine_id: 10, medicine_name: "Cetirizine 10mg",    unit_price: 20.00,  quantity: 60, total_price: 1200.00 },
    ],
  },
  {
    id: 5, vendor_id: 2, vendor_type: "seller",   source: "seller-order", status: "Approved",  urgency: "low",    total: 2800.00,
    notes: "Routine procurement for first aid and dermatology supplies",
    items: [
      { medicine_id: 14, medicine_name: "Antiseptic Liquid 500ml", unit_price: 120.00, quantity: 10, total_price: 1200.00 },
      { medicine_id: 16, medicine_name: "Antibiotic Cream 15g",    unit_price: 50.00,  quantity: 20, total_price: 1000.00 },
      { medicine_id: 17, medicine_name: "Antifungal Cream 20g",    unit_price: 60.00,  quantity: 10, total_price: 600.00  },
    ],
  },
];

const DISCOUNT_CAMPAIGNS = [
  { id: 1, title: "Monsoon Immunity Special",       discount_type: "percentage", discount_value: 15.00, min_quantity: 2, valid_until: "2026-09-30 23:59:59", promo_code: "IMMUNITY15" },
  { id: 2, title: "Diabetes Care Super Sale",       discount_type: "fixed",      discount_value: 50.00, min_quantity: 1, valid_until: "2026-10-15 23:59:59", promo_code: "DIABETES50" },
  { id: 3, title: "Flat 20% Off on Medical Devices",discount_type: "percentage", discount_value: 20.00, min_quantity: 1, valid_until: "2026-12-31 23:59:59", promo_code: "DEVICES20"  },
];

const SEED_DELIVERY_PARTNERS = [
  { id: 1, name: "Ravi Kumar",   phone: "9876543210", active_order_count: 2, completed_order_count: 18, is_active: 1 },
  { id: 2, name: "Priya Sharma", phone: "9876543211", active_order_count: 1, completed_order_count: 12, is_active: 1 },
  { id: 3, name: "Amit Patel",   phone: "9876543212", active_order_count: 3, completed_order_count: 25, is_active: 1 },
  { id: 4, name: "Sunita Rao",   phone: "9876543213", active_order_count: 0, completed_order_count: 9,  is_active: 1 },
  { id: 5, name: "Deepak Verma", phone: "9876543214", active_order_count: 1, completed_order_count: 14, is_active: 1 },
];

const SEED_VENDOR_PARTNERS = [
  { id: 1, vendor_type: "seller",   name: "MediSupply Co.",          phone: "9822001100", location: "Mumbai",    rating: 4.50, is_active: 1 },
  { id: 2, vendor_type: "seller",   name: "PharmaDistributors Ltd.", phone: "9822001101", location: "Delhi",     rating: 4.80, is_active: 1 },
  { id: 3, vendor_type: "seller",   name: "HealthCare Wholesale",    phone: "9822001102", location: "Bangalore", rating: 4.30, is_active: 1 },
  { id: 4, vendor_type: "seller",   name: "Global Pharma Solutions", phone: "9822001103", location: "Chennai",   rating: 4.70, is_active: 1 },
  { id: 5, vendor_type: "supplier", name: "Cipla",                   phone: "9876500010", location: "Mumbai",    rating: 4.60, is_active: 1 },
  { id: 6, vendor_type: "supplier", name: "GSK",                     phone: "9876500011", location: "Delhi",     rating: 4.70, is_active: 1 },
  { id: 7, vendor_type: "supplier", name: "Abbott",                  phone: "9876500012", location: "Bangalore", rating: 4.50, is_active: 1 },
  { id: 8, vendor_type: "supplier", name: "Sun Pharma",              phone: "9876500013", location: "Mumbai",    rating: 4.60, is_active: 1 },
  { id: 9, vendor_type: "supplier", name: "Pfizer",                  phone: "9876500014", location: "Chennai",   rating: 4.80, is_active: 1 },
];

// ─────────────────────────────────────────────
async function seedMySQL() {
  const config = getDbConfig();
  console.log(`Connecting to MySQL database "${config.database}"...`);
  const conn = await mysql.createConnection(config);

  try {
    // 1. Medicines — upsert all 20
    console.log("Seeding medicines (20 items)...");
    for (const m of ALL_MEDICINES) {
      await conn.query(
        `INSERT INTO medicines (id, name, category, description, image_url, price, discount_percent, stock, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         name=VALUES(name), category=VALUES(category), description=VALUES(description),
         image_url=VALUES(image_url), price=VALUES(price), discount_percent=VALUES(discount_percent), stock=VALUES(stock)`,
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

    // 3. Delivery Partners (must be seeded BEFORE orders due to foreign key)
    console.log("Seeding delivery partners...");
    for (const d of SEED_DELIVERY_PARTNERS) {
      await conn.query(
        `INSERT INTO delivery_partners (id, name, phone, active_order_count, completed_order_count, is_active)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), active_order_count=VALUES(active_order_count), completed_order_count=VALUES(completed_order_count)`,
        [d.id, d.name, d.phone, d.active_order_count, d.completed_order_count, d.is_active]
      );
    }

    // 4. Vendor Partners (must be seeded BEFORE procurement orders)
    console.log("Seeding vendor partners...");
    for (const v of SEED_VENDOR_PARTNERS) {
      await conn.query(
        `INSERT INTO vendor_partners (id, vendor_type, name, phone, location, rating, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), vendor_type=VALUES(vendor_type)`,
        [v.id, v.vendor_type, v.name, v.phone, v.location, v.rating, v.is_active]
      );
    }

    // 5. Discount Campaigns
    console.log("Seeding discount campaigns...");
    for (const dc of DISCOUNT_CAMPAIGNS) {
      await conn.query(
        `INSERT INTO discount_campaigns (id, title, discount_type, discount_value, min_quantity, valid_until, promo_code)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title=VALUES(title)`,
        [dc.id, dc.title, dc.discount_type, dc.discount_value, dc.min_quantity, dc.valid_until, dc.promo_code]
      );
    }

    // 6. Orders & Order Items (15 orders spread over 30 days)
    console.log("Seeding 15 orders and order items...");
    for (const o of ORDERS) {
      await conn.query(
        `INSERT INTO orders (id, user_id, delivery_partner_id, status, payment_method, payment_status, subtotal, discount_total, delivery_fee, total, address_label, address_details, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), payment_status=VALUES(payment_status)`,
        [o.id, o.user_id, o.delivery_partner_id, o.status, o.payment_method, o.payment_status, o.subtotal, o.discount_total, o.delivery_fee, o.total, o.address_label, o.address_details, o.notes, o.created_at]
      );

      // Delete existing items first to avoid duplicates, then re-insert
      await conn.query("DELETE FROM order_items WHERE order_id = ?", [o.id]);
      for (const item of o.items) {
        await conn.query(
          `INSERT INTO order_items (order_id, medicine_id, medicine_name, unit_price, discount_percent, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [o.id, item.medicine_id, item.medicine_name, item.unit_price, item.discount_percent, item.quantity, item.total_price]
        );
      }
    }

    // 7. Procurement Orders
    console.log("Seeding procurement orders...");
    for (const po of PROCUREMENT_ORDERS) {
      await conn.query(
        `INSERT INTO procurement_orders (id, vendor_id, vendor_type, source, status, urgency, total, notes, created_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [po.id, po.vendor_id, po.vendor_type, po.source, po.status, po.urgency, po.total, po.notes]
      );

      // Delete existing items first to avoid duplicates
      await conn.query("DELETE FROM procurement_order_items WHERE procurement_order_id = ?", [po.id]);
      for (const item of po.items) {
        await conn.query(
          `INSERT INTO procurement_order_items (procurement_order_id, medicine_id, medicine_name, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [po.id, item.medicine_id, item.medicine_name, item.unit_price, item.quantity, item.total_price]
        );
      }
    }

    console.log("✅ MySQL Seeding complete! (20 medicines, 15 orders, 5 delivery partners, 9 vendors, 5 procurement orders)");
  } finally {
    await conn.end();
  }
}

// ─────────────────────────────────────────────
async function seedLocalJsonStore() {
  const jsonPath = path.join(__dirname, "local_db_store.json");
  try {
    let data;
    try {
      const raw = await fs.readFile(jsonPath, "utf-8");
      data = JSON.parse(raw);
    } catch {
      data = {
        users: [], medicines: [], delivery_partners: [], vendor_partners: [],
        orders: [], order_items: [], procurement_orders: [], procurement_order_items: [],
        discount_campaigns: [], auth_otps: [],
      };
    }

    // Replace medicines with full 20-item catalog
    data.medicines = ALL_MEDICINES.map((m) => ({
      ...m,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Merge users
    const existingUserIds = new Set((data.users || []).map((u) => u.id));
    for (const u of NEW_USERS) {
      if (!existingUserIds.has(u.id)) {
        data.users.push({ ...u, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
    }

    // Replace orders with all 15
    data.orders = ORDERS.map((o) => ({
      id: o.id, user_id: o.user_id, delivery_partner_id: o.delivery_partner_id,
      status: o.status, payment_method: o.payment_method, payment_status: o.payment_status,
      subtotal: o.subtotal, discount_total: o.discount_total, delivery_fee: o.delivery_fee,
      total: o.total, address_label: o.address_label, address_details: o.address_details,
      notes: o.notes, created_at: o.created_at, updated_at: new Date().toISOString(),
    }));

    // Replace order_items
    data.order_items = [];
    let orderItemId = 1;
    for (const o of ORDERS) {
      for (const item of o.items) {
        data.order_items.push({
          id: orderItemId++, order_id: o.id, ...item, created_at: new Date().toISOString(),
        });
      }
    }

    // Replace procurement orders
    data.procurement_orders = PROCUREMENT_ORDERS.map((po) => ({
      id: po.id, vendor_id: po.vendor_id, vendor_type: po.vendor_type, source: po.source,
      status: po.status, urgency: po.urgency, total: po.total, notes: po.notes,
      created_by_user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }));

    data.procurement_order_items = [];
    let poItemId = 1;
    for (const po of PROCUREMENT_ORDERS) {
      for (const item of po.items) {
        data.procurement_order_items.push({
          id: poItemId++, procurement_order_id: po.id, ...item, created_at: new Date().toISOString(),
        });
      }
    }

    data.discount_campaigns = DISCOUNT_CAMPAIGNS.map((dc) => ({
      ...dc, created_at: new Date().toISOString(),
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
