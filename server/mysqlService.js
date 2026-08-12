import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

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
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
      };
    } catch (e) {
      console.warn("⚠️ Failed to parse database URL, falling back to individual env variables:", e.message);
    }
  }

  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "Sourav@9002249524",
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || "pharmacy_app",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
  };
}

let pool = null;

export function getPool() {
  if (!pool) {
    const config = getDbConfig();
    pool = mysql.createPool(config);
  }
  return pool;
}

// ─────────────────────────────────────────────
// RICH SEED DATA — 20 medicines, 5 delivery partners, 9 vendor partners
// ─────────────────────────────────────────────
const SEED_MEDICINES = [
  { id: 1,  name: "Paracetamol 500mg",             category: "Pain Relief",             description: "Fast relief for fever and mild pain.",                               image_url: "https://placehold.co/300x180/e0f2fe/0ea5e9?text=Paracetamol",   price: 25,    discount_percent: 10, stock: 120, is_active: 1 },
  { id: 2,  name: "Amoxicillin 250mg",             category: "Antibiotics",             description: "Prescription antibiotic for bacterial infections.",                  image_url: "https://placehold.co/300x180/fef9c3/ca8a04?text=Amoxicillin",  price: 45,    discount_percent: 5,  stock: 90,  is_active: 1 },
  { id: 3,  name: "Vitamin C Tablets",             category: "Vitamins",                description: "Daily immunity support tablets.",                                    image_url: "https://placehold.co/300x180/dcfce7/16a34a?text=Vitamin+C",    price: 120,   discount_percent: 15, stock: 160, is_active: 1 },
  { id: 4,  name: "Cough Syrup",                   category: "Cough & Cold",            description: "Syrup for dry and wet cough relief.",                               image_url: "https://placehold.co/300x180/fce7f3/db2777?text=Cough+Syrup",  price: 85,    discount_percent: 8,  stock: 75,  is_active: 1 },
  { id: 5,  name: "Ibuprofen 400mg",               category: "Pain Relief",             description: "Anti-inflammatory tablets for pain relief.",                        image_url: "https://placehold.co/300x180/e0f2fe/0ea5e9?text=Ibuprofen",    price: 35,    discount_percent: 0,  stock: 140, is_active: 1 },
  { id: 6,  name: "Insulin Pen",                   category: "Diabetes Care",           description: "Insulin delivery pen for diabetes management.",                     image_url: "https://placehold.co/300x180/f3e8ff/9333ea?text=Insulin",      price: 450,   discount_percent: 12, stock: 35,  is_active: 1 },
  { id: 7,  name: "Metformin 500mg",               category: "Diabetes Care",           description: "First-line medication for the treatment of type 2 diabetes.",      image_url: "https://placehold.co/300x180/f3e8ff/9333ea?text=Metformin",    price: 50,    discount_percent: 5,  stock: 200, is_active: 1 },
  { id: 8,  name: "Azithromycin 500mg",            category: "Antibiotics",             description: "Broad-spectrum macrolide antibiotic.",                              image_url: "https://placehold.co/300x180/fef9c3/ca8a04?text=Azithromycin", price: 110,   discount_percent: 10, stock: 80,  is_active: 1 },
  { id: 9,  name: "Omeprazole 20mg",               category: "Gastrointestinal",        description: "Proton pump inhibitor for acid reflux and heartburn.",              image_url: "https://placehold.co/300x180/fef3c7/d97706?text=Omeprazole",  price: 65,    discount_percent: 5,  stock: 150, is_active: 1 },
  { id: 10, name: "Cetirizine 10mg",               category: "Allergy & Antihistamine", description: "Antihistamine for runny nose, sneezing, and hives.",                image_url: "https://placehold.co/300x180/ecfdf5/059669?text=Cetirizine",   price: 30,    discount_percent: 0,  stock: 180, is_active: 1 },
  { id: 11, name: "D-3 60K Vitamin Capsules",      category: "Vitamins",                description: "High potency Vitamin D3 supplement for bone health.",              image_url: "https://placehold.co/300x180/dcfce7/16a34a?text=Vitamin+D3",   price: 150,   discount_percent: 15, stock: 110, is_active: 1 },
  { id: 12, name: "Digital Blood Pressure Monitor",category: "Medical Devices",         description: "Automatic upper arm BP monitor with digital pulse display.",        image_url: "https://placehold.co/300x180/ede9fe/7c3aed?text=BP+Monitor",   price: 1499,  discount_percent: 20, stock: 25,  is_active: 1 },
  { id: 13, name: "Infrared Forehead Thermometer", category: "Medical Devices",         description: "Non-contact instant body temperature reader.",                      image_url: "https://placehold.co/300x180/ede9fe/7c3aed?text=Thermometer",  price: 899,   discount_percent: 15, stock: 40,  is_active: 1 },
  { id: 14, name: "Antiseptic Liquid 500ml",       category: "First Aid",               description: "Disinfectant solution for wounds, cuts and hygiene.",               image_url: "https://placehold.co/300x180/fef3c7/d97706?text=Antiseptic",   price: 185,   discount_percent: 10, stock: 95,  is_active: 1 },
  { id: 15, name: "ORS Electrolyte Powder",        category: "Rehydration",             description: "Oral rehydration salts for restoring fluids and minerals.",         image_url: "https://placehold.co/300x180/e0f7fa/0097a7?text=ORS",          price: 22,    discount_percent: 0,  stock: 300, is_active: 1 },
  { id: 16, name: "Antibiotic Cream 15g",          category: "First Aid",               description: "Topical antibiotic ointment for skin infections and cuts.",         image_url: "https://placehold.co/300x180/fef9c3/ca8a04?text=Antibiotic",   price: 75,    discount_percent: 0,  stock: 88,  is_active: 1 },
  { id: 17, name: "Antifungal Cream 20g",          category: "Dermatology",             description: "Topical antifungal for ringworm, athlete's foot and skin fungus.",  image_url: "https://placehold.co/300x180/fce7f3/db2777?text=Antifungal",   price: 95,    discount_percent: 0,  stock: 60,  is_active: 1 },
  { id: 18, name: "Antacid Syrup 200ml",           category: "Gastrointestinal",        description: "Fast-acting antacid syrup for acidity and heartburn relief.",       image_url: "https://placehold.co/300x180/fef3c7/d97706?text=Antacid",      price: 55,    discount_percent: 0,  stock: 110, is_active: 1 },
  { id: 19, name: "B-Complex Tablets",             category: "Vitamins",                description: "Comprehensive B vitamin supplement for energy and nerve health.",   image_url: "https://placehold.co/300x180/dcfce7/16a34a?text=B-Complex",    price: 80,    discount_percent: 10, stock: 130, is_active: 1 },
  { id: 20, name: "Pulse Oximeter",                category: "Medical Devices",         description: "Fingertip SpO2 and heart rate monitor for home use.",               image_url: "https://placehold.co/300x180/ede9fe/7c3aed?text=Oximeter",     price: 699,   discount_percent: 10, stock: 7,   is_active: 1 },
];

const SEED_DELIVERY_PARTNERS = [
  { id: 1, name: "Ravi Kumar",     phone: "9876543210", active_order_count: 2, completed_order_count: 18, is_active: 1 },
  { id: 2, name: "Priya Sharma",   phone: "9876543211", active_order_count: 1, completed_order_count: 12, is_active: 1 },
  { id: 3, name: "Amit Patel",     phone: "9876543212", active_order_count: 3, completed_order_count: 25, is_active: 1 },
  { id: 4, name: "Sunita Rao",     phone: "9876543213", active_order_count: 0, completed_order_count: 9,  is_active: 1 },
  { id: 5, name: "Deepak Verma",   phone: "9876543214", active_order_count: 1, completed_order_count: 14, is_active: 1 },
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

export async function initializeDatabase(retries = 5, delayMs = 3000) {
  const config = getDbConfig();
  console.log(`🔌 Attempting MySQL connection to host: ${config.host}:${config.port}, database: ${config.database}, user: ${config.user}`);

  if ((process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL) && (config.host === "localhost" || config.host === "127.0.0.1")) {
    console.warn("⚠️ CRITICAL: Railway environment detected, but MYSQL_URL or DB_HOST environment variable is missing in your Web Service Variables tab!");
  }

  for (let i = 1; i <= retries; i++) {
    try {
      // First ensure Database exists (for local or root connection)
      try {
        const rootConnection = await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          ssl: config.ssl,
          connectTimeout: 5000,
        });
        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
        await rootConnection.end();
      } catch (err) {
        // Pre-created database on Railway or restricted root permissions
      }

      const p = getPool();

      // Test database connectivity and select database
      await p.query("SELECT 1");
      if (config.database) {
        try {
          await p.query(`USE \`${config.database}\`;`);
        } catch (e) {}
      }

      // Create tables if they do not exist
      await p.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          role VARCHAR(40) NOT NULL DEFAULT 'customer',
          name VARCHAR(120) NOT NULL,
          email VARCHAR(191) NOT NULL UNIQUE,
          phone VARCHAR(20) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          profile_photo VARCHAR(255) NULL,
          business_name VARCHAR(160) NULL,
          business_address VARCHAR(255) NULL,
          verification_document VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS auth_otps (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          purpose VARCHAR(40) NOT NULL,
          otp_code VARCHAR(6) NOT NULL,
          expires_at DATETIME NOT NULL,
          used_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_auth_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS medicines (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(160) NOT NULL,
          category VARCHAR(120) NOT NULL,
          description TEXT NULL,
          image_url VARCHAR(255) NULL,
          price DECIMAL(10,2) NOT NULL,
          discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
          stock INT NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS delivery_partners (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(120) NOT NULL,
          phone VARCHAR(20) NOT NULL UNIQUE,
          active_order_count INT NOT NULL DEFAULT 0,
          completed_order_count INT NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS vendor_partners (
          id INT PRIMARY KEY AUTO_INCREMENT,
          vendor_type VARCHAR(40) NOT NULL DEFAULT 'wholesaler',
          name VARCHAR(160) NOT NULL,
          phone VARCHAR(20) NULL,
          location VARCHAR(255) NULL,
          rating DECIMAL(3,2) NOT NULL DEFAULT 4.50,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          delivery_partner_id INT NULL,
          status VARCHAR(40) NOT NULL DEFAULT 'Processing',
          payment_method VARCHAR(40) NOT NULL,
          payment_status VARCHAR(40) NOT NULL DEFAULT 'pending',
          subtotal DECIMAL(10,2) NOT NULL,
          discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
          delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
          total DECIMAL(10,2) NOT NULL,
          address_label VARCHAR(80) NOT NULL,
          address_details VARCHAR(255) NOT NULL,
          notes VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_orders_delivery_partner FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INT PRIMARY KEY AUTO_INCREMENT,
          order_id INT NOT NULL,
          medicine_id INT NOT NULL,
          medicine_name VARCHAR(160) NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
          quantity INT NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          CONSTRAINT fk_order_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS procurement_orders (
          id INT PRIMARY KEY AUTO_INCREMENT,
          vendor_id INT NOT NULL,
          vendor_type VARCHAR(80) NOT NULL,
          source VARCHAR(80) NOT NULL,
          status VARCHAR(40) NOT NULL DEFAULT 'Pending',
          urgency VARCHAR(40) NULL,
          total DECIMAL(10,2) NOT NULL DEFAULT 0,
          notes VARCHAR(255) NULL,
          created_by_user_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_procurement_vendor FOREIGN KEY (vendor_id) REFERENCES vendor_partners(id) ON DELETE RESTRICT
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS procurement_order_items (
          id INT PRIMARY KEY AUTO_INCREMENT,
          procurement_order_id INT NOT NULL,
          medicine_id INT NOT NULL,
          medicine_name VARCHAR(160) NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          quantity INT NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_procurement_items_order FOREIGN KEY (procurement_order_id) REFERENCES procurement_orders(id) ON DELETE CASCADE,
          CONSTRAINT fk_procurement_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT
        );
      `);

      await p.query(`
        CREATE TABLE IF NOT EXISTS discount_campaigns (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(160) NOT NULL,
          discount_type VARCHAR(50) NOT NULL,
          discount_value DECIMAL(10,2) NOT NULL,
          min_quantity INT NULL,
          valid_until DATETIME NULL,
          promo_code VARCHAR(50) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Safe column migrations for medicines
      const medicineColDefs = [
        "ADD COLUMN strength VARCHAR(50) DEFAULT '500mg'",
        "ADD COLUMN manufacturer VARCHAR(120) DEFAULT 'PharmaCare Labs'",
        "ADD COLUMN mrp DECIMAL(10,2) DEFAULT 0.00",
        "ADD COLUMN minimum_stock INT DEFAULT 20",
        "ADD COLUMN units_sold INT DEFAULT 0"
      ];
      for (const colDef of medicineColDefs) {
        try { await p.query(`ALTER TABLE medicines ${colDef}`); } catch (e) {}
      }

      // Safe column migrations for orders
      try { await p.query("ALTER TABLE orders ADD COLUMN stock_deducted TINYINT(1) DEFAULT 0"); } catch (e) {}
      try { await p.query("ALTER TABLE orders ADD COLUMN stock_deducted_at DATETIME NULL"); } catch (e) {}

      // Safe column migrations for delivery partners
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN delivery_id VARCHAR(50) NULL UNIQUE"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN email VARCHAR(191) NULL UNIQUE"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN address TEXT NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN profile_image VARCHAR(255) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN password_hash VARCHAR(255) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN status VARCHAR(40) DEFAULT 'ACTIVE'"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN is_online TINYINT(1) DEFAULT 1"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN last_active_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN latitude DECIMAL(10,8) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN longitude DECIMAL(11,8) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE delivery_partners ADD COLUMN current_location_name VARCHAR(255) NULL"); } catch (e) {}

      // Safe column migrations for orders delivery status
      try { await p.query("ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(40) DEFAULT 'ORDER_PLACED'"); } catch (e) {}
      try { await p.query("ALTER TABLE orders ADD COLUMN assigned_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE orders ADD COLUMN accepted_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE orders ADD COLUMN picked_up_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE orders ADD COLUMN out_for_delivery_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE orders ADD COLUMN delivered_at DATETIME NULL"); } catch (e) {}

      // Create delivery_status_history table
      await p.query(`
        CREATE TABLE IF NOT EXISTS delivery_status_history (
          id INT PRIMARY KEY AUTO_INCREMENT,
          order_id INT NOT NULL,
          delivery_partner_id INT NULL,
          status VARCHAR(50) NOT NULL,
          notes VARCHAR(255) NULL,
          location VARCHAR(255) NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create delivery_locations table
      await p.query(`
        CREATE TABLE IF NOT EXISTS delivery_locations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          delivery_partner_id INT NOT NULL,
          latitude DECIMAL(10,8) NOT NULL,
          longitude DECIMAL(11,8) NOT NULL,
          location_name VARCHAR(255) NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create delivery_notifications table
      await p.query(`
        CREATE TABLE IF NOT EXISTS delivery_notifications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          delivery_partner_id INT NOT NULL,
          title VARCHAR(160) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'info',
          is_read TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Safe column migrations for users (Google Auth & Customer Status Metadata)
      try { await p.query("ALTER TABLE users MODIFY COLUMN email VARCHAR(191) NOT NULL UNIQUE"); } catch (e) {}
      try { await p.query("ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NULL UNIQUE"); } catch (e) {}
      try { await p.query("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(191) NULL UNIQUE"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'LOCAL'"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN email_verified TINYINT(1) DEFAULT 0"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN status VARCHAR(40) DEFAULT 'ACTIVE'"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN blocked_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN blocked_by VARCHAR(120) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN block_reason VARCHAR(255) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN block_note TEXT NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN suspended_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN suspended_until DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN suspended_by VARCHAR(120) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN suspension_reason TEXT NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN deleted_by VARCHAR(120) NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE users ADD COLUMN deletion_reason TEXT NULL"); } catch (e) {}
      try { await p.query("ALTER TABLE auth_otps MODIFY COLUMN purpose VARCHAR(50) NOT NULL"); } catch (e) {}

      // Create admin audit logs table
      await p.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          admin_id INT NULL,
          admin_name VARCHAR(120) NULL,
          customer_id INT NULL,
          customer_email VARCHAR(191) NULL,
          action VARCHAR(50) NOT NULL,
          reason VARCHAR(255) NULL,
          metadata TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create deleted customers audit table
      await p.query(`
        CREATE TABLE IF NOT EXISTS deleted_customers_audit (
          id INT PRIMARY KEY AUTO_INCREMENT,
          customer_id INT NOT NULL,
          formatted_customer_id VARCHAR(50) NOT NULL,
          customer_name VARCHAR(120) NOT NULL,
          customer_email VARCHAR(191) NOT NULL,
          customer_phone VARCHAR(20) NULL,
          deleted_by VARCHAR(120) NOT NULL,
          deletion_reason TEXT NULL,
          previous_status VARCHAR(40) NULL,
          total_orders INT DEFAULT 0,
          total_spent DECIMAL(10,2) DEFAULT 0.00,
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create stock_transactions table
      await p.query(`
        CREATE TABLE IF NOT EXISTS stock_transactions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          medicine_id INT NOT NULL,
          type VARCHAR(40) NOT NULL,
          quantity INT NOT NULL,
          previous_stock INT NOT NULL,
          new_stock INT NOT NULL,
          reason VARCHAR(255) NULL,
          order_id INT NULL,
          customer_id INT NULL,
          supplier_id INT NULL,
          batch_number VARCHAR(100) NULL,
          purchase_cost DECIMAL(10,2) NULL,
          expiry_date DATE NULL,
          admin_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_stock_trans_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
        );
      `);

      // Ensure primary accounts always exist with correct password hash
      const defaultAdminHash = await bcrypt.hash("Sourav@12345", 10);
      const defaultCustomerHash = await bcrypt.hash("customer123", 10);

      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash, business_name, business_address, verification_document)
         VALUES ('admin', 'System Admin', 'souravsenapati408@gmail.com', '9999999999', ?, 'Pharmacy Store HQ', '123 Healthcare Blvd', 'DOC-ADMIN-001')
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
        [defaultAdminHash]
      );

      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash, business_name, business_address, verification_document)
         VALUES ('admin', 'Pharmacy Admin', 'admin@pharmacy.com', '9999999998', ?, 'Pharmacy Store HQ', '123 Healthcare Blvd', 'DOC-ADMIN-002')
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
        [defaultAdminHash]
      );

      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash)
         VALUES ('customer', 'Demo Customer', 'customer@pharmacy.com', '9876543210', ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [defaultCustomerHash]
      );

      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash)
         VALUES ('customer', 'John Doe', 'john.doe@example.com', '9811223344', ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [defaultCustomerHash]
      );

      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash)
         VALUES ('customer', 'Priya Patel', 'priya.patel@example.com', '9822334455', ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [defaultCustomerHash]
      );

      await mysqlService.ensureDefaultAdminAccounts();

      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash)
         VALUES ('customer', 'Rahul Singh', 'rahul.singh@example.com', '9833445566', ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [defaultCustomerHash]
      );

      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash)
         VALUES ('customer', 'Anita Gupta', 'anita.gupta@example.com', '9844556677', ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [defaultCustomerHash]
      );

      // Seed medicines if empty
      const [medsRows] = await p.query("SELECT COUNT(*) AS count FROM medicines");
      if (medsRows[0].count === 0) {
        for (const med of SEED_MEDICINES) {
          await p.query(
            `INSERT INTO medicines (id, name, category, description, image_url, price, discount_percent, stock, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [med.id, med.name, med.category, med.description, med.image_url, med.price, med.discount_percent, med.stock, med.is_active]
          );
        }
      } else {
        // Update image URLs for existing records to fix broken via.placeholder.com
        for (const med of SEED_MEDICINES) {
          await p.query(
            `UPDATE medicines SET image_url = ? WHERE id = ? AND (image_url LIKE '%via.placeholder%' OR image_url IS NULL OR image_url = '')`,
            [med.image_url, med.id]
          );
        }
        // Insert any new medicines (ids 16-20) that may not exist yet
        for (const med of SEED_MEDICINES.filter((m) => m.id >= 16)) {
          await p.query(
            `INSERT IGNORE INTO medicines (id, name, category, description, image_url, price, discount_percent, stock, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [med.id, med.name, med.category, med.description, med.image_url, med.price, med.discount_percent, med.stock, med.is_active]
          );
        }
      }

      // Seed delivery partners if empty or missing delivery_id
      const defaultHash = await bcrypt.hash("password123", 10);
      const seedPartners = [
        { id: 1, delivery_id: "DEL1001", name: "Ravi Kumar", phone: "9876543210", email: "ravi@pharmacare.com", address: "Durgapur, West Bengal", active_order_count: 2, completed_order_count: 18, is_active: 1, is_online: 1 },
        { id: 2, delivery_id: "DEL1002", name: "Priya Sharma", phone: "9876543211", email: "priya@pharmacare.com", address: "Kolkata, West Bengal", active_order_count: 1, completed_order_count: 12, is_active: 1, is_online: 1 },
        { id: 3, delivery_id: "DEL1003", name: "Amit Patel", phone: "9876543212", email: "amit@pharmacare.com", address: "Asansol, West Bengal", active_order_count: 3, completed_order_count: 25, is_active: 1, is_online: 1 },
        { id: 4, delivery_id: "DEL1004", name: "Sunita Rao", phone: "9876543213", email: "sunita@pharmacare.com", address: "Siliguri, West Bengal", active_order_count: 0, completed_order_count: 9, is_active: 1, is_online: 0 },
        { id: 5, delivery_id: "DEL1005", name: "Deepak Verma", phone: "9876543214", email: "deepak@pharmacare.com", address: "Howrah, West Bengal", active_order_count: 1, completed_order_count: 14, is_active: 1, is_online: 1 },
      ];

      const [delRows] = await p.query("SELECT COUNT(*) AS count FROM delivery_partners");
      if (delRows[0].count === 0) {
        for (const d of seedPartners) {
          await p.query(
            `INSERT INTO delivery_partners (id, delivery_id, name, phone, email, address, password_hash, active_order_count, completed_order_count, is_active, is_online, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [d.id, d.delivery_id, d.name, d.phone, d.email, d.address, defaultHash, d.active_order_count, d.completed_order_count, d.is_active, d.is_online]
          );
        }
      } else {
        // Migration update for existing seed rows missing delivery_id or password_hash
        for (const d of seedPartners) {
          await p.query(
            `UPDATE delivery_partners
             SET delivery_id = COALESCE(delivery_id, ?),
                 email = COALESCE(email, ?),
                 address = COALESCE(address, ?),
                 password_hash = COALESCE(password_hash, ?),
                 status = COALESCE(status, 'ACTIVE')
             WHERE id = ?`,
            [d.delivery_id, d.email, d.address, defaultHash, d.id]
          );
        }
      }

      // Seed vendor partners if empty
      const [venRows] = await p.query("SELECT COUNT(*) AS count FROM vendor_partners");
      if (venRows[0].count === 0) {
        for (const v of SEED_VENDOR_PARTNERS) {
          await p.query(
            `INSERT INTO vendor_partners (id, vendor_type, name, phone, location, rating, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [v.id, v.vendor_type, v.name, v.phone, v.location, v.rating, v.is_active]
          );
        }
      }

      console.log(`✅ MySQL Database initialized successfully on target database: "${config.database}"`);
      return;
    } catch (err) {
      console.warn(`⚠️ MySQL Connection attempt ${i}/${retries} failed (${err.message}). Retrying in ${delayMs / 1000}s...`);
      if (i === retries) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

function mapMedicineRow(r) {
  if (!r) return null;
  const price = Number(r.price || 0);
  const mrp = Number(r.mrp || (price > 0 ? (price * 1.15).toFixed(2) : 0));
  const stock = Number(r.stock || 0);
  const minStock = Number(r.minimum_stock || 20);
  
  let stockStatus = "In Stock";
  if (stock === 0) stockStatus = "Out of Stock";
  else if (stock <= minStock) stockStatus = "Low Stock";

  return {
    ...r,
    id: r.id,
    name: r.name,
    strength: r.strength || "500mg",
    category: r.category || "General Care",
    manufacturer: r.manufacturer || "PharmaCare Labs",
    description: r.description || "",
    image_url: r.image_url || "",
    image: r.image_url || "",
    price,
    mrp,
    discount_percent: Number(r.discount_percent || 0),
    discount: Number(r.discount_percent || 0),
    stock,
    minimum_stock: minStock,
    units_sold: Number(r.units_sold || 0),
    stockStatus,
    is_active: Number(r.is_active !== undefined ? r.is_active : 1),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export const mysqlService = {
  // ─────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────
  async ensureDefaultAdminAccounts() {
    const p = getPool();
    const expectedPassword = process.env.ADMIN_PASSWORD || "Sourav@12345";
    const defaultAdminHash = await bcrypt.hash(expectedPassword, 10);

    const adminAccounts = [
      {
        role: "admin",
        name: "System Admin",
        email: "souravsenapati408@gmail.com",
        phone: "9999999999",
        businessName: "Pharmacy Store HQ",
        businessAddress: "123 Healthcare Blvd",
        verificationDocument: "DOC-ADMIN-001",
      },
      {
        role: "admin",
        name: "Pharmacy Admin",
        email: "admin@pharmacy.com",
        phone: "9999999998",
        businessName: "Pharmacy Store HQ",
        businessAddress: "123 Healthcare Blvd",
        verificationDocument: "DOC-ADMIN-002",
      },
    ];

    for (const account of adminAccounts) {
      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash, business_name, business_address, verification_document, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE
           role = VALUES(role),
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           business_name = COALESCE(NULLIF(VALUES(business_name), ''), business_name),
           business_address = COALESCE(NULLIF(VALUES(business_address), ''), business_address),
           verification_document = COALESCE(NULLIF(VALUES(verification_document), ''), verification_document),
           status = 'ACTIVE'`,
        [
          account.role,
          account.name,
          account.email,
          account.phone,
          defaultAdminHash,
          account.businessName,
          account.businessAddress,
          account.verificationDocument,
        ]
      );
    }

    await p.query(
      `UPDATE users SET password_hash = ? WHERE role = 'admin' AND LOWER(TRIM(email)) IN (?, ?)`,
      [defaultAdminHash, ...adminAccounts.map((account) => account.email.toLowerCase())]
    );
  },

  async checkAndUpdateSuspension(userRow) {
    if (!userRow) return null;
    if (userRow.status === "SUSPENDED" && userRow.suspended_until) {
      const until = new Date(userRow.suspended_until);
      if (until <= new Date()) {
        const p = getPool();
        await p.query(
          `UPDATE users SET status = 'ACTIVE', suspended_at = NULL, suspended_until = NULL, suspended_by = NULL, suspension_reason = NULL WHERE id = ?`,
          [userRow.id]
        );
        await this.logAdminAudit({
          admin_id: null,
          admin_name: "SYSTEM_AUTO_RESTORE",
          customer_id: userRow.id,
          customer_email: userRow.email,
          action: "CUSTOMER_RESTORED",
          reason: "Suspension period expired automatically",
        });
        userRow.status = "ACTIVE";
        userRow.suspended_until = null;
      }
    }
    return userRow;
  },

  async touchUserLastLogin(id) {
    if (!id) return;
    const p = getPool();
    await p.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [id]);
  },

  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();
    const p = getPool();
    const [rows] = await p.query(
      "SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND status != 'DELETED' LIMIT 1",
      [cleanEmail]
    );
    if (!rows[0]) return null;
    return await this.checkAndUpdateSuspension(rows[0]);
  },

  async findUserByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = String(phone).trim();
    const p = getPool();
    const [rows] = await p.query(
      "SELECT * FROM users WHERE phone = ? AND status != 'DELETED' LIMIT 1",
      [cleanPhone]
    );
    if (!rows[0]) return null;
    return await this.checkAndUpdateSuspension(rows[0]);
  },

  async findUserByGoogleId(googleId) {
    if (!googleId) return null;
    const p = getPool();
    const [rows] = await p.query(
      "SELECT * FROM users WHERE google_id = ? AND status != 'DELETED' LIMIT 1",
      [googleId]
    );
    if (!rows[0]) return null;
    return await this.checkAndUpdateSuspension(rows[0]);
  },

  async findUserById(id) {
    if (!id) return null;
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return null;
    return await this.checkAndUpdateSuspension(rows[0]);
  },

  async logAdminAudit({ admin_id = null, admin_name = "Admin", customer_id = null, customer_email = null, action, reason = null, metadata = null }) {
    const p = getPool();
    await p.query(
      `INSERT INTO admin_audit_logs (admin_id, admin_name, customer_id, customer_email, action, reason, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        admin_id ? Number(admin_id) : null,
        admin_name ? String(admin_name) : "Admin",
        customer_id ? Number(customer_id) : null,
        customer_email ? String(customer_email) : null,
        action,
        reason ? String(reason) : null,
        metadata ? (typeof metadata === "object" ? JSON.stringify(metadata) : String(metadata)) : null,
      ]
    );
  },

  async blockCustomer(id, { blocked_by = "Admin", block_reason = "Admin decision", block_note = "" }) {
    const p = getPool();
    const user = await this.findUserById(id);
    if (!user) throw new Error("Customer not found.");

    await p.query(
      `UPDATE users
       SET status = 'BLOCKED',
           blocked_at = NOW(),
           blocked_by = ?,
           block_reason = ?,
           block_note = ?
       WHERE id = ?`,
      [blocked_by, block_reason, block_note, id]
    );

    await this.logAdminAudit({
      admin_name: blocked_by,
      customer_id: id,
      customer_email: user.email,
      action: "CUSTOMER_BLOCKED",
      reason: block_reason,
      metadata: { note: block_note },
    });

    return await this.findUserById(id);
  },

  async unblockCustomer(id, { unblocked_by = "Admin" }) {
    const p = getPool();
    const user = await this.findUserById(id);
    if (!user) throw new Error("Customer not found.");

    await p.query(
      `UPDATE users
       SET status = 'ACTIVE',
           blocked_at = NULL,
           blocked_by = NULL,
           block_reason = NULL,
           block_note = NULL
       WHERE id = ?`,
      [id]
    );

    await this.logAdminAudit({
      admin_name: unblocked_by,
      customer_id: id,
      customer_email: user.email,
      action: "CUSTOMER_UNBLOCKED",
      reason: "Account unblocked by admin",
    });

    return await this.findUserById(id);
  },

  async suspendCustomer(id, { suspended_by = "Admin", suspension_reason = "Policy violation", duration = "24h" }) {
    const p = getPool();
    const user = await this.findUserById(id);
    if (!user) throw new Error("Customer not found.");

    let suspendedUntil = null;
    const now = new Date();
    if (duration === "24h") {
      suspendedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (duration === "7d") {
      suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (duration === "30d") {
      suspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const formattedUntil = suspendedUntil ? suspendedUntil.toISOString().slice(0, 19).replace('T', ' ') : null;

    await p.query(
      `UPDATE users
       SET status = 'SUSPENDED',
           suspended_at = NOW(),
           suspended_until = ?,
           suspended_by = ?,
           suspension_reason = ?
       WHERE id = ?`,
      [formattedUntil, suspended_by, suspension_reason, id]
    );

    await this.logAdminAudit({
      admin_name: suspended_by,
      customer_id: id,
      customer_email: user.email,
      action: "CUSTOMER_SUSPENDED",
      reason: suspension_reason,
      metadata: { duration, suspended_until: formattedUntil },
    });

    return await this.findUserById(id);
  },

  async restoreCustomer(id, { restored_by = "Admin" }) {
    const p = getPool();
    const user = await this.findUserById(id);
    if (!user) throw new Error("Customer not found.");

    await p.query(
      `UPDATE users
       SET status = 'ACTIVE',
           suspended_at = NULL,
           suspended_until = NULL,
           suspended_by = NULL,
           suspension_reason = NULL
       WHERE id = ?`,
      [id]
    );

    await this.logAdminAudit({
      admin_name: restored_by,
      customer_id: id,
      customer_email: user.email,
      action: "CUSTOMER_RESTORED",
      reason: "Suspension manually restored by admin",
    });

    return await this.findUserById(id);
  },

  async deleteCustomer(id, { deleted_by = "Admin", deletion_reason = "Admin decision" }) {
    const p = getPool();
    const user = await this.findUserById(id);
    if (!user) throw new Error("Customer not found.");

    const [orderStats] = await p.query(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_spent FROM orders WHERE user_id = ?`,
      [id]
    );
    const totalOrders = orderStats[0]?.total_orders || 0;
    const totalSpent = Number(orderStats[0]?.total_spent || 0);

    const formattedId = `CUS-${1000 + Number(id)}`;

    await p.query(
      `INSERT INTO deleted_customers_audit (customer_id, formatted_customer_id, customer_name, customer_email, customer_phone, deleted_by, deletion_reason, previous_status, total_orders, total_spent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        formattedId,
        user.name,
        user.email,
        user.phone || null,
        deleted_by,
        deletion_reason,
        user.status || 'ACTIVE',
        totalOrders,
        totalSpent,
      ]
    );

    await this.logAdminAudit({
      admin_name: deleted_by,
      customer_id: id,
      customer_email: user.email,
      action: "CUSTOMER_DELETED",
      reason: deletion_reason,
      metadata: { formatted_id: formattedId, previous_status: user.status },
    });

    const archivedEmail = `deleted_${id}_${user.email}`;
    await p.query(
      `UPDATE users
       SET status = 'DELETED',
           email = ?,
           phone = NULL,
           google_id = NULL,
           password_hash = NULL,
           deleted_at = NOW(),
           deleted_by = ?,
           deletion_reason = ?
       WHERE id = ?`,
      [archivedEmail, deleted_by, deletion_reason, id]
    );

    return { message: "Customer account permanently deleted and archived.", customerId: id, formattedId };
  },

  async getAllCustomersWithStats() {
    const p = getPool();
    const [rows] = await p.query(`
      SELECT 
        u.id,
        u.role,
        u.name,
        u.email,
        u.phone,
        u.password_hash,
        u.google_id,
        u.auth_provider,
        u.email_verified,
        u.profile_photo,
        u.status,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        u.blocked_at,
        u.blocked_by,
        u.block_reason,
        u.block_note,
        u.suspended_at,
        u.suspended_until,
        u.suspended_by,
        u.suspension_reason,
        COALESCE(o.total_orders, 0) as total_orders,
        COALESCE(o.total_spent, 0.00) as total_spent
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_orders, SUM(total) as total_spent
        FROM orders
        GROUP BY user_id
      ) o ON u.id = o.user_id
      WHERE u.role = 'customer' AND u.status != 'DELETED'
      ORDER BY u.id DESC
    `);

    return rows.map((r) => {
      const authMethods = [];
      if (r.password_hash) authMethods.push("Password");
      authMethods.push("Email OTP");
      if (r.google_id) authMethods.push("Google");

      return {
        id: r.id,
        formattedId: `CUS-${1000 + Number(r.id)}`,
        name: r.name,
        email: r.email,
        phone: r.phone || "Not set",
        authMethods,
        authProvider: r.auth_provider || "LOCAL",
        googleLinked: Boolean(r.google_id),
        emailVerified: Boolean(r.email_verified),
        profilePhoto: r.profile_photo || "",
        status: r.status || "ACTIVE",
        createdAt: r.created_at,
        lastLoginAt: r.last_login_at,
        totalOrders: Number(r.total_orders || 0),
        totalSpent: Number(r.total_spent || 0),
        blockedAt: r.blocked_at,
        blockedBy: r.blocked_by,
        blockReason: r.block_reason,
        blockNote: r.block_note,
        suspendedAt: r.suspended_at,
        suspendedUntil: r.suspended_until,
        suspendedBy: r.suspended_by,
        suspensionReason: r.suspension_reason,
      };
    });
  },

  async getCustomerStatsSummary() {
    const p = getPool();
    const [rows] = await p.query(`
      SELECT 
        COUNT(CASE WHEN role = 'customer' AND status != 'DELETED' THEN 1 END) as total_customers,
        COUNT(CASE WHEN role = 'customer' AND status = 'ACTIVE' THEN 1 END) as active_customers,
        COUNT(CASE WHEN role = 'customer' AND status = 'BLOCKED' THEN 1 END) as blocked_customers,
        COUNT(CASE WHEN role = 'customer' AND status = 'SUSPENDED' THEN 1 END) as suspended_customers,
        COUNT(CASE WHEN role = 'customer' AND status != 'DELETED' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month
      FROM users
    `);

    const [deletedRows] = await p.query(`SELECT COUNT(*) as deleted_records FROM deleted_customers_audit`);

    const stat = rows[0] || {};
    return {
      totalCustomers: Number(stat.total_customers || 0),
      activeCustomers: Number(stat.active_customers || 0),
      blockedCustomers: Number(stat.blocked_customers || 0),
      suspendedCustomers: Number(stat.suspended_customers || 0),
      newThisMonth: Number(stat.new_this_month || 0),
      deletedRecordsCount: Number(deletedRows[0]?.deleted_records || 0),
    };
  },

  async getDeletedCustomersAudit() {
    const p = getPool();
    const [rows] = await p.query(`SELECT * FROM deleted_customers_audit ORDER BY id DESC`);
    return rows.map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      formattedCustomerId: r.formatted_customer_id,
      name: r.customer_name,
      email: r.customer_email,
      phone: r.customer_phone,
      deletedBy: r.deleted_by,
      deletionReason: r.deletion_reason,
      previousStatus: r.previous_status,
      totalOrders: Number(r.total_orders || 0),
      totalSpent: Number(r.total_spent || 0),
      deletedAt: r.deleted_at,
    }));
  },

  async getCustomerDetails(id) {
    const p = getPool();
    const user = await this.findUserById(id);
    if (!user) throw new Error("Customer not found.");

    const [orderRows] = await p.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC`,
      [id]
    );

    const [auditRows] = await p.query(
      `SELECT * FROM admin_audit_logs WHERE customer_id = ? ORDER BY id DESC`,
      [id]
    );

    const authMethods = [];
    if (user.password_hash) authMethods.push("Password");
    authMethods.push("Email OTP");
    if (user.google_id) authMethods.push("Google");

    const totalSpent = orderRows.reduce((acc, o) => acc + Number(o.total || 0), 0);

    return {
      user: {
        id: user.id,
        formattedId: `CUS-${1000 + Number(user.id)}`,
        name: user.name,
        email: user.email,
        phone: user.phone || "Not set",
        role: user.role,
        authMethods,
        authProvider: user.auth_provider || "LOCAL",
        googleLinked: Boolean(user.google_id),
        emailVerified: Boolean(user.email_verified),
        profilePhoto: user.profile_photo || "",
        status: user.status || "ACTIVE",
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        hasPassword: Boolean(user.password_hash),
        blockedAt: user.blocked_at,
        blockedBy: user.blocked_by,
        blockReason: user.block_reason,
        blockNote: user.block_note,
        suspendedAt: user.suspended_at,
        suspendedUntil: user.suspended_until,
        suspendedBy: user.suspended_by,
        suspensionReason: user.suspension_reason,
      },
      orders: orderRows.map((o) => ({
        id: o.id,
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        total: Number(o.total),
        createdAt: o.created_at,
        addressLabel: o.address_label,
      })),
      ordersCount: orderRows.length,
      totalSpent,
      auditLogs: auditRows.map((a) => ({
        id: a.id,
        adminName: a.admin_name,
        action: a.action,
        reason: a.reason,
        metadata: a.metadata ? (typeof a.metadata === "string" ? JSON.parse(a.metadata) : a.metadata) : null,
        createdAt: a.created_at,
      })),
    };
  },

  async getAdminAuditLogs() {
    const p = getPool();
    const [rows] = await p.query(`SELECT * FROM admin_audit_logs ORDER BY id DESC LIMIT 200`);
    return rows.map((a) => ({
      id: a.id,
      adminId: a.admin_id,
      adminName: a.admin_name,
      customerId: a.customer_id,
      customerEmail: a.customer_email,
      action: a.action,
      reason: a.reason,
      metadata: a.metadata ? (typeof a.metadata === "string" ? JSON.parse(a.metadata) : a.metadata) : null,
      createdAt: a.created_at,
    }));
  },

  async createGoogleUser(googleData) {
    const p = getPool();
    const role = googleData.role || "customer";
    const name = googleData.name ? String(googleData.name).trim() : "Customer";
    const email = googleData.email ? String(googleData.email).trim().toLowerCase() : "";
    const googleId = googleData.google_id || googleData.googleId;
    const profilePhoto = googleData.picture || googleData.profile_photo || null;

    const [result] = await p.query(
      `INSERT INTO users (role, name, email, phone, password_hash, google_id, auth_provider, email_verified, profile_photo, status)
       VALUES (?, ?, ?, NULL, NULL, ?, 'GOOGLE', 1, ?, 'ACTIVE')`,
      [role, name, email, googleId, profilePhoto]
    );

    return this.findUserById(result.insertId);
  },

  async linkGoogleAccount(userId, googleData) {
    const p = getPool();
    const googleId = googleData.google_id || googleData.googleId;
    const profilePhoto = googleData.picture || googleData.profile_photo || null;

    await p.query(
      `UPDATE users
       SET google_id = ?,
           auth_provider = IF(password_hash IS NOT NULL AND password_hash != '', 'LOCAL_GOOGLE', 'GOOGLE'),
           email_verified = 1,
           profile_photo = COALESCE(profile_photo, ?)
       WHERE id = ?`,
      [googleId, profilePhoto, userId]
    );

    return this.findUserById(userId);
  },

  async updateUserPhone(userId, phone) {
    const p = getPool();
    await p.query("UPDATE users SET phone = ? WHERE id = ?", [phone, userId]);
    return this.findUserById(userId);
  },

  async getUsers() {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM users ORDER BY id ASC");
    return rows;
  },

  async createUser(userData) {
    const p = getPool();
    const role = userData.role || "customer";
    const name = userData.name;
    const email = userData.email;
    const phone = userData.phone;
    const passwordHash = userData.password_hash || userData.passwordHash;
    const profilePhoto = userData.profile_photo || userData.profilePhoto || null;
    const businessName = userData.business_name || userData.businessName || null;
    const businessAddress = userData.business_address || userData.businessAddress || null;
    const verificationDocument = userData.verification_document || userData.verificationDocument || null;

    const [result] = await p.query(
      `INSERT INTO users (role, name, email, phone, password_hash, profile_photo, business_name, business_address, verification_document)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [role, name, email, phone, passwordHash, profilePhoto, businessName, businessAddress, verificationDocument]
    );

    return this.findUserById(result.insertId);
  },

  async updateUser(id, userData) {
    const p = getPool();
    const updates = [];
    const values = [];

    if (userData.role !== undefined) { updates.push("role = ?"); values.push(userData.role); }
    if (userData.name !== undefined) { updates.push("name = ?"); values.push(userData.name); }
    if (userData.email !== undefined) { updates.push("email = ?"); values.push(userData.email); }
    if (userData.phone !== undefined) { updates.push("phone = ?"); values.push(userData.phone); }
    if (userData.password_hash !== undefined) { updates.push("password_hash = ?"); values.push(userData.password_hash); }
    if (userData.profile_photo !== undefined) { updates.push("profile_photo = ?"); values.push(userData.profile_photo); }
    if (userData.email_verified !== undefined) { updates.push("email_verified = ?"); values.push(userData.email_verified ? 1 : 0); }
    if (userData.status !== undefined) { updates.push("status = ?"); values.push(userData.status); }
    if (userData.is_blocked !== undefined) { updates.push("status = ?"); values.push(userData.is_blocked ? "BLOCKED" : "ACTIVE"); }
    if (userData.google_id !== undefined) { updates.push("google_id = ?"); values.push(userData.google_id); }
    if (userData.business_name !== undefined) { updates.push("business_name = ?"); values.push(userData.business_name); }
    if (userData.business_address !== undefined) { updates.push("business_address = ?"); values.push(userData.business_address); }
    if (userData.verification_document !== undefined) { updates.push("verification_document = ?"); values.push(userData.verification_document); }

    if (updates.length > 0) {
      values.push(id);
      await p.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    return this.findUserById(id);
  },

  // ─────────────────────────────────────────────
  // AUTH OTPS
  // ─────────────────────────────────────────────
  async createOtp({ user_id, purpose, otp_code, expires_at }) {
    const p = getPool();
    const [result] = await p.query(
      `INSERT INTO auth_otps (user_id, purpose, otp_code, expires_at) VALUES (?, ?, ?, ?)`,
      [user_id, purpose, otp_code, new Date(expires_at)]
    );
    const [rows] = await p.query("SELECT * FROM auth_otps WHERE id = ?", [result.insertId]);
    return rows[0];
  },

  // Alias used by server/index.js
  async createAuthOtp({ user_id, purpose, otp_code, expires_at }) {
    return this.createOtp({ user_id, purpose, otp_code, expires_at });
  },

  async findValidOtp(userId, purpose, otpCode) {
    const p = getPool();
    const [rows] = await p.query(
      `SELECT * FROM auth_otps
       WHERE user_id = ? AND purpose = ? AND otp_code = ? AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, purpose, otpCode]
    );
    return rows[0] || null;
  },

  async markOtpUsed(otpId) {
    const p = getPool();
    await p.query("UPDATE auth_otps SET used_at = NOW() WHERE id = ?", [otpId]);
  },

  async verifyOtp(identifier, otpCode, purpose) {
    const p = getPool();
    const user = (await this.findUserByEmail(identifier)) || (await this.findUserByPhone(identifier));
    if (!user) return null;

    const record = await this.findValidOtp(user.id, purpose, otpCode);
    if (!record) return null;

    await this.markOtpUsed(record.id);
    return user;
  },

  // ─────────────────────────────────────────────
  // MEDICINES
  // ─────────────────────────────────────────────
  async getMedicines() {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM medicines ORDER BY id ASC");
    return rows.map((r) => mapMedicineRow(r));
  },

  async getMedicineById(id) {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM medicines WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return null;
    return mapMedicineRow(rows[0]);
  },

  async createMedicine(medicineData) {
    const p = getPool();
    const [result] = await p.query(
      `INSERT INTO medicines (name, strength, category, manufacturer, description, image_url, price, mrp, discount_percent, stock, minimum_stock, units_sold, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicineData.name,
        medicineData.strength || "500mg",
        medicineData.category || "General Care",
        medicineData.manufacturer || "PharmaCare Labs",
        medicineData.description || "",
        medicineData.image_url || medicineData.image || "",
        Number(medicineData.price || 0),
        Number(medicineData.mrp || (medicineData.price ? Number(medicineData.price) * 1.15 : 0)),
        Number(medicineData.discount_percent || medicineData.discount || 0),
        Number(medicineData.stock || 0),
        Number(medicineData.minimum_stock || medicineData.minStock || 20),
        Number(medicineData.units_sold || 0),
        medicineData.is_active !== undefined ? (medicineData.is_active ? 1 : 0) : 1,
      ]
    );
    const [rows] = await p.query("SELECT * FROM medicines WHERE id = ?", [result.insertId]);
    return mapMedicineRow(rows[0]);
  },

  async updateMedicine(id, updates) {
    const p = getPool();
    const setClause = [];
    const values = [];

    if (updates.name !== undefined) { setClause.push("name = ?"); values.push(updates.name); }
    if (updates.strength !== undefined) { setClause.push("strength = ?"); values.push(updates.strength); }
    if (updates.category !== undefined) { setClause.push("category = ?"); values.push(updates.category); }
    if (updates.manufacturer !== undefined) { setClause.push("manufacturer = ?"); values.push(updates.manufacturer); }
    if (updates.description !== undefined) { setClause.push("description = ?"); values.push(updates.description); }
    if (updates.image_url !== undefined || updates.image !== undefined) {
      setClause.push("image_url = ?");
      values.push(updates.image_url ?? updates.image);
    }
    if (updates.price !== undefined) { setClause.push("price = ?"); values.push(Number(updates.price)); }
    if (updates.mrp !== undefined) { setClause.push("mrp = ?"); values.push(Number(updates.mrp)); }
    if (updates.discount_percent !== undefined || updates.discount !== undefined) {
      setClause.push("discount_percent = ?");
      values.push(Number(updates.discount_percent ?? updates.discount));
    }
    if (updates.stock !== undefined) { setClause.push("stock = ?"); values.push(Number(updates.stock)); }
    if (updates.minimum_stock !== undefined || updates.minStock !== undefined) {
      setClause.push("minimum_stock = ?");
      values.push(Number(updates.minimum_stock ?? updates.minStock));
    }
    if (updates.units_sold !== undefined) { setClause.push("units_sold = ?"); values.push(Number(updates.units_sold)); }
    if (updates.is_active !== undefined) { setClause.push("is_active = ?"); values.push(updates.is_active ? 1 : 0); }

    if (setClause.length > 0) {
      values.push(id);
      await p.query(`UPDATE medicines SET ${setClause.join(", ")} WHERE id = ?`, values);
    }

    const [rows] = await p.query("SELECT * FROM medicines WHERE id = ?", [id]);
    return mapMedicineRow(rows[0]);
  },

  async addStock(medicineId, data = {}) {
    const p = getPool();
    const conn = await p.getConnection();
    try {
      await conn.beginTransaction();

      const [meds] = await conn.query("SELECT * FROM medicines WHERE id = ? FOR UPDATE", [medicineId]);
      if (!meds[0]) throw new Error("Medicine not found.");

      const previousStock = Number(meds[0].stock || 0);
      const addQty = Math.max(1, Number(data.quantity || 0));
      const newStock = previousStock + addQty;

      await conn.query("UPDATE medicines SET stock = ? WHERE id = ?", [newStock, medicineId]);

      await conn.query(
        `INSERT INTO stock_transactions (medicine_id, type, quantity, previous_stock, new_stock, reason, supplier_id, batch_number, purchase_cost, expiry_date, admin_id)
         VALUES (?, 'STOCK_ADDED', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          medicineId,
          addQty,
          previousStock,
          newStock,
          data.reason || "Supplier Delivery",
          data.supplierId || null,
          data.batchNumber || null,
          data.purchaseCost ? Number(data.purchaseCost) : null,
          data.expiryDate || null,
          data.adminId || null,
        ]
      );

      await conn.commit();
      conn.release();

      const updated = await this.getMedicineById(medicineId);
      return {
        success: true,
        medicine: updated,
        previousStock,
        added: addQty,
        newStock,
      };
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  async reduceStock(medicineId, data = {}) {
    const p = getPool();
    const conn = await p.getConnection();
    try {
      await conn.beginTransaction();

      const [meds] = await conn.query("SELECT * FROM medicines WHERE id = ? FOR UPDATE", [medicineId]);
      if (!meds[0]) throw new Error("Medicine not found.");

      const previousStock = Number(meds[0].stock || 0);
      const reduceQty = Math.max(1, Number(data.quantity || 0));

      if (reduceQty > previousStock) {
        await conn.rollback();
        conn.release();
        const err = new Error(`Insufficient stock. Only ${previousStock} units are available.`);
        err.statusCode = 400;
        throw err;
      }

      const newStock = previousStock - reduceQty;
      const reason = data.reason || "Manual Correction";
      let txType = "STOCK_REMOVED";
      if (reason === "Damaged") txType = "DAMAGED";
      else if (reason === "Expired") txType = "EXPIRED";
      else if (reason === "Returned to Supplier") txType = "RETURNED";

      await conn.query("UPDATE medicines SET stock = ? WHERE id = ?", [newStock, medicineId]);

      await conn.query(
        `INSERT INTO stock_transactions (medicine_id, type, quantity, previous_stock, new_stock, reason, admin_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          medicineId,
          txType,
          -reduceQty,
          previousStock,
          newStock,
          reason + (data.note ? `: ${data.note}` : ""),
          data.adminId || null,
        ]
      );

      await conn.commit();
      conn.release();

      const updated = await this.getMedicineById(medicineId);
      return {
        success: true,
        medicine: updated,
        previousStock,
        removed: reduceQty,
        newStock,
      };
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  async getStockHistory(medicineId, filters = {}) {
    const p = getPool();
    let queryStr = `
      SELECT st.*, u.name AS admin_name
      FROM stock_transactions st
      LEFT JOIN users u ON st.admin_id = u.id
      WHERE st.medicine_id = ?
    `;
    const params = [medicineId];

    if (filters.type && filters.type !== "All") {
      queryStr += " AND st.type = ?";
      params.push(filters.type);
    }
    if (filters.startDate) {
      queryStr += " AND st.created_at >= ?";
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      queryStr += " AND st.created_at <= ?";
      params.push(filters.endDate);
    }

    queryStr += " ORDER BY st.created_at DESC";
    const [rows] = await p.query(queryStr, params);
    return rows;
  },

  async getMedicineCustomers(medicineId) {
    const p = getPool();
    const queryStr = `
      SELECT DISTINCT
        u.id AS customer_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.id AS order_id,
        oi.quantity,
        o.created_at AS order_date,
        o.updated_at AS delivery_date,
        o.status AS order_status
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE oi.medicine_id = ?
      ORDER BY o.created_at DESC
    `;
    const [rows] = await p.query(queryStr, [medicineId]);
    return rows;
  },

  async updateMedicineDiscount(id, discountPercent) {
    return this.updateMedicine(id, { discount_percent: Number(discountPercent) });
  },

  async updateMedicineStock(id, stock) {
    return this.updateMedicine(id, { stock: Number(stock) });
  },

  async deleteMedicine(id) {
    const p = getPool();
    await p.query("DELETE FROM medicines WHERE id = ?", [id]);
    return { success: true };
  },

  // ─────────────────────────────────────────────
  // DELIVERY PARTNERS
  // ─────────────────────────────────────────────
  async getDeliveryPartners() {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM delivery_partners ORDER BY id ASC");
    return rows.map((r) => ({
      ...r,
      active_order_count: Number(r.active_order_count),
      completed_order_count: Number(r.completed_order_count),
      is_active: Number(r.is_active),
    }));
  },

  async createDeliveryPartner(partnerData) {
    const p = getPool();
    const [result] = await p.query(
      `INSERT INTO delivery_partners (name, phone, active_order_count, completed_order_count, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        partnerData.name,
        partnerData.phone,
        Number(partnerData.active_order_count || 0),
        Number(partnerData.completed_order_count || 0),
        partnerData.is_active !== undefined ? (partnerData.is_active ? 1 : 0) : 1,
      ]
    );
    const [rows] = await p.query("SELECT * FROM delivery_partners WHERE id = ?", [result.insertId]);
    return rows[0];
  },

  async deleteDeliveryPartner(id) {
    const p = getPool();
    // Nullify references in orders before deleting
    await p.query("UPDATE orders SET delivery_partner_id = NULL WHERE delivery_partner_id = ?", [id]);
    await p.query("DELETE FROM delivery_partners WHERE id = ?", [id]);
    return { success: true };
  },

  // ─────────────────────────────────────────────
  // VENDOR PARTNERS
  // ─────────────────────────────────────────────
  async getVendorPartners(vendorType = null) {
    const p = getPool();
    let query = "SELECT * FROM vendor_partners";
    const params = [];
    if (vendorType) {
      query += " WHERE vendor_type = ?";
      params.push(vendorType);
    }
    query += " ORDER BY id ASC";
    const [rows] = await p.query(query, params);
    return rows.map((r) => ({
      ...r,
      rating: Number(r.rating),
      is_active: Number(r.is_active),
    }));
  },

  async findVendorById(id) {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM vendor_partners WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return null;
    return { ...rows[0], rating: Number(rows[0].rating), is_active: Number(rows[0].is_active) };
  },

  async createVendorPartner(vendorData) {
    const p = getPool();
    const [result] = await p.query(
      `INSERT INTO vendor_partners (vendor_type, name, phone, location, rating, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        vendorData.vendor_type || "wholesaler",
        vendorData.name,
        vendorData.phone || "",
        vendorData.location || "",
        Number(vendorData.rating || 4.5),
        vendorData.is_active !== undefined ? (vendorData.is_active ? 1 : 0) : 1,
      ]
    );
    const [rows] = await p.query("SELECT * FROM vendor_partners WHERE id = ?", [result.insertId]);
    return rows[0];
  },

  // ─────────────────────────────────────────────
  // ORDERS
  // ─────────────────────────────────────────────
  async getOrders(userId = null) {
    const p = getPool();
    let queryStr = `
      SELECT 
        o.id, o.user_id, o.delivery_partner_id, o.delivery_status, o.status, o.payment_method, o.payment_status,
        o.subtotal, o.discount_total, o.delivery_fee, o.total, o.address_label, o.address_details,
        o.notes, o.created_at, o.updated_at,
        u.name AS customer_name, u.email AS customer_email,
        dp.name AS delivery_partner_name, dp.phone AS delivery_partner_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN delivery_partners dp ON o.delivery_partner_id = dp.id
    `;
    const queryParams = [];

    if (userId) {
      queryStr += " WHERE o.user_id = ?";
      queryParams.push(userId);
    }
    queryStr += " ORDER BY o.created_at DESC";

    const [ordersRows] = await p.query(queryStr, queryParams);

    const resultOrders = [];
    for (const o of ordersRows) {
      const [itemsRows] = await p.query("SELECT * FROM order_items WHERE order_id = ?", [o.id]);
      resultOrders.push({
        id: o.id,
        user_id: o.user_id,
        delivery_partner_id: o.delivery_partner_id,
        delivery_status: o.delivery_status || o.status || 'ORDER_PLACED',
        status: o.status,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        subtotal: Number(o.subtotal),
        discount_total: Number(o.discount_total),
        delivery_fee: Number(o.delivery_fee),
        total: Number(o.total),
        address_label: o.address_label,
        address_details: o.address_details,
        notes: o.notes || "",
        created_at: o.created_at,
        updated_at: o.updated_at,
        customer_name: o.customer_name || "Customer",
        customer_email: o.customer_email || "",
        delivery_partner_name: o.delivery_partner_name || "Unassigned",
        delivery_partner_phone: o.delivery_partner_phone || "",
        items: itemsRows.map((it) => ({
          id: it.id,
          order_id: it.order_id,
          medicine_id: it.medicine_id,
          medicine_name: it.medicine_name,
          unit_price: Number(it.unit_price),
          discount_percent: Number(it.discount_percent),
          quantity: Number(it.quantity),
          total_price: Number(it.total_price),
        })),
      });
    }

    return resultOrders;
  },

  async getAllOrderItems() {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM order_items ORDER BY id ASC");
    return rows.map((r) => ({
      ...r,
      unit_price: Number(r.unit_price),
      discount_percent: Number(r.discount_percent),
      quantity: Number(r.quantity),
      total_price: Number(r.total_price),
    }));
  },

  async createOrder(orderData, itemsData) {
    const p = getPool();
    const conn = await p.getConnection();

    try {
      await conn.beginTransaction();

      // Leave delivery_partner_id as NULL so order enters the open pool for all delivery boys
      const assignedPartnerId = null;

      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, delivery_partner_id, delivery_status, status, payment_method, payment_status, subtotal, discount_total, delivery_fee, total, address_label, address_details, notes)
         VALUES (?, ?, 'ORDER_PLACED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderData.user_id,
          assignedPartnerId,
          orderData.status || "Processing",
          orderData.payment_method,
          orderData.payment_status || "pending",
          Number(orderData.subtotal),
          Number(orderData.discount_total || 0),
          Number(orderData.delivery_fee || 0),
          Number(orderData.total),
          orderData.address_label || "Home",
          orderData.address_details || "",
          orderData.notes || "",
        ]
      );

      const orderId = orderResult.insertId;

      for (const item of itemsData) {
        await conn.query(
          `INSERT INTO order_items (order_id, medicine_id, medicine_name, unit_price, discount_percent, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.medicine_id,
            item.medicine_name,
            Number(item.unit_price),
            Number(item.discount_percent || 0),
            Number(item.quantity),
            Number(item.total_price),
          ]
        );

        // Update medicine stock
        await conn.query("UPDATE medicines SET stock = GREATEST(0, stock - ?) WHERE id = ?", [
          Number(item.quantity),
          item.medicine_id,
        ]);
      }

      if (assignedPartnerId) {
        await conn.query(
          "UPDATE delivery_partners SET active_order_count = active_order_count + 1 WHERE id = ?",
          [assignedPartnerId]
        );
      }

      await conn.commit();
      conn.release();

      const createdOrders = await this.getOrders();
      return createdOrders.find((o) => o.id === orderId);
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  async updateOrderStatus(orderId, status) {
    const p = getPool();
    const [existingRows] = await p.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    if (existingRows.length === 0) return null;

    const oldStatus = existingRows[0].status;
    const partnerId = existingRows[0].delivery_partner_id;

    const isCancelling = (status.toLowerCase() === "cancelled" || status.toLowerCase() === "canceled");
    const newStatusStr = isCancelling ? "Cancelled" : status;

    if (isCancelling) {
      await p.query("UPDATE orders SET status = 'Cancelled', delivery_status = 'CANCELLED' WHERE id = ?", [orderId]);
    } else {
      await p.query("UPDATE orders SET status = ? WHERE id = ?", [newStatusStr, orderId]);
    }

    if (isCancelling && oldStatus !== "Cancelled") {
      // Refund item count back to medicine inventory database
      const [orderItems] = await p.query(
        "SELECT medicine_id, quantity FROM order_items WHERE order_id = ?",
        [orderId]
      );
      for (const item of orderItems) {
        if (item.medicine_id && Number(item.quantity) > 0) {
          await p.query("UPDATE medicines SET stock = stock + ? WHERE id = ?", [
            Number(item.quantity),
            item.medicine_id,
          ]);
        }
      }
      if (partnerId) {
        await p.query(
          `UPDATE delivery_partners SET active_order_count = GREATEST(0, active_order_count - 1) WHERE id = ?`,
          [partnerId]
        );
      }
    } else if (partnerId && oldStatus !== "Delivered" && status === "Delivered") {
      await p.query(
        `UPDATE delivery_partners 
         SET active_order_count = GREATEST(0, active_order_count - 1), 
             completed_order_count = completed_order_count + 1 
         WHERE id = ?`,
        [partnerId]
      );
    }

    const allOrders = await this.getOrders();
    return allOrders.find((o) => o.id === Number(orderId));
  },

  async updateOrderPaymentStatus(orderId, status) {
    const p = getPool();
    await p.query("UPDATE orders SET payment_status = ? WHERE id = ?", [status, orderId]);
    const allOrders = await this.getOrders();
    return allOrders.find((o) => o.id === Number(orderId));
  },

  // ─────────────────────────────────────────────
  // PROCUREMENT ORDERS
  // ─────────────────────────────────────────────
  async getProcurementOrders(source = null) {
    const p = getPool();
    let queryStr = `
      SELECT po.*, vp.name AS vendor_name, vp.location AS vendor_location
      FROM procurement_orders po
      LEFT JOIN vendor_partners vp ON po.vendor_id = vp.id
    `;
    const params = [];
    if (source) {
      queryStr += " WHERE po.source = ?";
      params.push(source);
    }
    queryStr += " ORDER BY po.created_at DESC";

    const [rows] = await p.query(queryStr, params);

    const results = [];
    for (const po of rows) {
      const [items] = await p.query("SELECT * FROM procurement_order_items WHERE procurement_order_id = ?", [po.id]);
      results.push({
        id: po.id,
        vendor_id: po.vendor_id,
        vendor_type: po.vendor_type,
        vendor_name: po.vendor_name || "",
        vendor_location: po.vendor_location || "",
        source: po.source,
        status: po.status,
        urgency: po.urgency || null,
        total: Number(po.total),
        notes: po.notes || "",
        created_by_user_id: po.created_by_user_id,
        created_at: po.created_at,
        updated_at: po.updated_at,
        items: items.map((it) => ({
          id: it.id,
          procurement_order_id: it.procurement_order_id,
          medicine_id: it.medicine_id,
          medicine_name: it.medicine_name,
          unit_price: Number(it.unit_price),
          quantity: Number(it.quantity),
          total_price: Number(it.total_price),
        })),
      });
    }

    return results;
  },

  async createProcurementOrder(orderData, itemsData) {
    const p = getPool();
    const conn = await p.getConnection();

    try {
      await conn.beginTransaction();

      const [orderResult] = await conn.query(
        `INSERT INTO procurement_orders (vendor_id, vendor_type, source, status, urgency, total, notes, created_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderData.vendor_id,
          orderData.vendor_type,
          orderData.source,
          orderData.status || "Pending",
          orderData.urgency || null,
          Number(orderData.total),
          orderData.notes || "",
          orderData.created_by_user_id ? Number(orderData.created_by_user_id) : null,
        ]
      );

      const orderId = orderResult.insertId;

      for (const item of itemsData) {
        await conn.query(
          `INSERT INTO procurement_order_items (procurement_order_id, medicine_id, medicine_name, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.medicine_id,
            item.medicine_name,
            Number(item.unit_price),
            Number(item.quantity),
            Number(item.total_price),
          ]
        );
      }

      await conn.commit();
      conn.release();

      const allPOs = await this.getProcurementOrders();
      return allPOs.find((po) => po.id === orderId);
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  // ─────────────────────────────────────────────
  // BULK DISCOUNTS & CAMPAIGNS
  // ─────────────────────────────────────────────
  async createDiscountCampaign(campaignData, itemsData) {
    const p = getPool();
    const conn = await p.getConnection();

    try {
      await conn.beginTransaction();

      const [res] = await conn.query(
        `INSERT INTO discount_campaigns (title, discount_type, discount_value, min_quantity, valid_until, promo_code)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          campaignData.title,
          campaignData.discount_type,
          Number(campaignData.discount_value),
          campaignData.min_quantity ? Number(campaignData.min_quantity) : null,
          campaignData.valid_until || null,
          campaignData.promo_code || null,
        ]
      );

      for (const item of itemsData) {
        await conn.query("UPDATE medicines SET discount_percent = ? WHERE id = ?", [
          Number(item.applied_discount_percent),
          item.medicine_id,
        ]);
      }

      await conn.commit();
      conn.release();

      const [rows] = await p.query("SELECT * FROM discount_campaigns WHERE id = ?", [res.insertId]);
      return rows[0];
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  // ─────────────────────────────────────────────
  // DELIVERY MANAGEMENT SYSTEM
  // ─────────────────────────────────────────────

  async findDeliveryPartnerByDeliveryId(deliveryId) {
    if (!deliveryId) return null;
    const p = getPool();
    const cleanId = String(deliveryId).trim().toUpperCase();
    const [rows] = await p.query("SELECT * FROM delivery_partners WHERE UPPER(TRIM(delivery_id)) = ? LIMIT 1", [cleanId]);
    return rows[0] || null;
  },

  async findDeliveryPartnerByPhone(phone) {
    if (!phone) return null;
    const p = getPool();
    const cleanPhone = String(phone).trim();
    const [rows] = await p.query("SELECT * FROM delivery_partners WHERE phone = ? LIMIT 1", [cleanPhone]);
    return rows[0] || null;
  },

  async findDeliveryPartnerById(id) {
    if (!id) return null;
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM delivery_partners WHERE id = ? LIMIT 1", [id]);
    return rows[0] || null;
  },

  async createDeliveryPartnerData({ name, phone, email, address = "", profile_image = "", delivery_id = null, password }) {
    const p = getPool();
    const passwordHash = await bcrypt.hash(password, 10);

    let finalDeliveryId = delivery_id ? String(delivery_id).trim().toUpperCase() : null;
    if (!finalDeliveryId) {
      const [countRow] = await p.query("SELECT COUNT(*) as cnt FROM delivery_partners");
      const nextNum = 1001 + (countRow[0]?.cnt || 0);
      finalDeliveryId = `DEL${nextNum}`;
    }

    const [res] = await p.query(
      `INSERT INTO delivery_partners (delivery_id, name, phone, email, address, profile_image, password_hash, status, is_online, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, 1)`,
      [finalDeliveryId, name, phone, email || null, address, profile_image, passwordHash]
    );

    return await this.findDeliveryPartnerById(res.insertId);
  },

  async updateDeliveryPartnerData(id, updateFields) {
    const p = getPool();
    const allowed = ["name", "phone", "email", "address", "profile_image", "status", "is_active"];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (updateFields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(updateFields[key]);
      }
    }

    if (updateFields.password) {
      const hash = await bcrypt.hash(updateFields.password, 10);
      updates.push("password_hash = ?");
      values.push(hash);
    }

    if (updates.length === 0) return await this.findDeliveryPartnerById(id);

    values.push(id);
    await p.query(`UPDATE delivery_partners SET ${updates.join(", ")} WHERE id = ?`, values);
    return await this.findDeliveryPartnerById(id);
  },

  async toggleDeliveryPartnerOnline(id, isOnline) {
    const p = getPool();
    const onlineVal = isOnline ? 1 : 0;
    await p.query(
      "UPDATE delivery_partners SET is_online = ?, last_active_at = NOW() WHERE id = ?",
      [onlineVal, id]
    );
    return await this.findDeliveryPartnerById(id);
  },

  async updateDeliveryPartnerLocation(id, lat, lng, locationName = null) {
    const p = getPool();
    await p.query(
      "UPDATE delivery_partners SET latitude = ?, longitude = ?, current_location_name = ?, last_active_at = NOW() WHERE id = ?",
      [lat, lng, locationName, id]
    );
    await p.query(
      "INSERT INTO delivery_locations (delivery_partner_id, latitude, longitude, location_name) VALUES (?, ?, ?, ?)",
      [id, lat, lng, locationName]
    );
  },

  async deleteDeliveryPartnerData(id) {
    const p = getPool();
    await p.query("DELETE FROM delivery_partners WHERE id = ?", [id]);
    return { success: true, message: "Delivery partner deleted successfully." };
  },

  async getAvailableOrders() {
    const p = getPool();
    const [rows] = await p.query(`
      SELECT 
        o.id,
        o.user_id,
        u.name as customer_name,
        u.phone as customer_phone,
        o.delivery_partner_id,
        COALESCE(o.delivery_status, 'ORDER_PLACED') as delivery_status,
        o.status as order_status,
        o.payment_method,
        o.payment_status,
        o.total,
        o.address_label,
        o.address_details,
        o.notes,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE (o.delivery_partner_id IS NULL OR o.delivery_status IN ('ORDER_PLACED', 'UNASSIGNED', 'Processing'))
        AND (o.delivery_status IS NULL OR o.delivery_status NOT IN ('ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'))
      GROUP BY o.id
      ORDER BY o.id DESC
    `);
    return rows.map(r => ({
      id: r.id,
      orderIdFormatted: `PC${10000 + Number(r.id)}`,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      deliveryAddress: `${r.address_label}: ${r.address_details}`,
      itemsCount: Number(r.item_count || 1),
      totalAmount: Number(r.total || 0),
      paymentMethod: r.payment_method,
      deliveryStatus: r.delivery_status,
      createdAt: r.created_at,
    }));
  },

  async getDeliveryNotifications(partnerId) {
    const p = getPool();
    const [rows] = await p.query(
      "SELECT * FROM delivery_notifications WHERE delivery_partner_id = ? ORDER BY created_at DESC LIMIT 30",
      [partnerId]
    );

    if (rows.length === 0) {
      return [
        { id: 1, title: "Welcome to Express Logistics!", message: "Your delivery account DEL1001 is active and ready to accept orders.", type: "system", isRead: false, createdAt: new Date() },
        { id: 2, title: "Online Status Enabled", message: "You are currently online. New available delivery assignments will appear on your dashboard.", type: "info", isRead: false, createdAt: new Date() },
      ];
    }

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      isRead: Boolean(r.is_read),
      createdAt: r.created_at,
    }));
  },

  async addDeliveryNotification(partnerId, title, message, type = "info") {
    const p = getPool();
    await p.query(
      "INSERT INTO delivery_notifications (delivery_partner_id, title, message, type) VALUES (?, ?, ?, ?)",
      [partnerId, title, message, type]
    );
  },

  async markDeliveryNotificationRead(notificationId) {
    const p = getPool();
    await p.query("UPDATE delivery_notifications SET is_read = 1 WHERE id = ?", [notificationId]);
  },

  async getDeliveryEarningsBreakdown(partnerId) {
    const p = getPool();

    // Today
    const [todayRes] = await p.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(delivery_fee), 0) as fees
      FROM orders WHERE delivery_partner_id = ? AND delivery_status = 'DELIVERED' AND delivered_at >= CURDATE()
    `, [partnerId]);

    // This Week
    const [weekRes] = await p.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(delivery_fee), 0) as fees
      FROM orders WHERE delivery_partner_id = ? AND delivery_status = 'DELIVERED' AND delivered_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `, [partnerId]);

    // This Month
    const [monthRes] = await p.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(delivery_fee), 0) as fees
      FROM orders WHERE delivery_partner_id = ? AND delivery_status = 'DELIVERED' AND delivered_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `, [partnerId]);

    // Total Overall
    const [totalRes] = await p.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(delivery_fee), 0) as fees
      FROM orders WHERE delivery_partner_id = ? AND delivery_status = 'DELIVERED'
    `, [partnerId]);

    const cToday = Number(todayRes[0]?.count || 0);
    const cWeek = Number(weekRes[0]?.count || 0);
    const cMonth = Number(monthRes[0]?.count || 0);
    const cTotal = Number(totalRes[0]?.count || 0);

    const todayEarnings = (cToday * 50) + Number(todayRes[0]?.fees || 0);
    const weekEarnings = (cWeek * 50) + Number(weekRes[0]?.fees || 0);
    const monthEarnings = (cMonth * 50) + Number(monthRes[0]?.fees || 0);
    const totalEarnings = (cTotal * 50) + Number(totalRes[0]?.fees || 0);

    return {
      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalEarnings,
      todayCount: cToday,
      weekCount: cWeek,
      monthCount: cMonth,
      totalCount: cTotal,
    };
  },

  async getDeliveryDashboardStats(partnerId) {
    const p = getPool();
    
    // Delivered today count & earnings
    const [todayRows] = await p.query(`
      SELECT 
        COUNT(*) as completed_today,
        COALESCE(SUM(delivery_fee), 0) as delivery_fees_today,
        COALESCE(SUM(total), 0) as total_order_value_today
      FROM orders
      WHERE delivery_partner_id = ?
        AND delivery_status = 'DELIVERED'
        AND delivered_at >= CURDATE()
    `, [partnerId]);

    // Overall completed deliveries & earnings
    const [overallRows] = await p.query(`
      SELECT 
        COUNT(*) as completed_total,
        COALESCE(SUM(delivery_fee), 0) as delivery_fees_overall,
        COALESCE(SUM(total), 0) as total_order_value_overall
      FROM orders
      WHERE delivery_partner_id = ?
        AND delivery_status = 'DELIVERED'
    `, [partnerId]);

    const [activeCountRows] = await p.query(`
      SELECT COUNT(*) as active_count
      FROM orders
      WHERE delivery_partner_id = ?
        AND delivery_status IN ('ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY')
    `, [partnerId]);
    const activeOrdersCount = Number(activeCountRows[0]?.active_count || 0);

    const partnerRow = await this.findDeliveryPartnerById(partnerId);
    const completedToday = Number(todayRows[0]?.completed_today || 0);
    const completedTotal = Number(overallRows[0]?.completed_total || partnerRow?.completed_order_count || 0);
    
    const deliveryFeesToday = Number(todayRows[0]?.delivery_fees_today || 0);
    const totalEarningsToday = (completedToday * 50) + (deliveryFeesToday > 0 ? deliveryFeesToday : completedToday * 20);

    const deliveryFeesOverall = Number(overallRows[0]?.delivery_fees_overall || 0);
    const totalEarningsOverall = (completedTotal * 50) + (deliveryFeesOverall > 0 ? deliveryFeesOverall : completedTotal * 20);

    return {
      completedToday,
      completedTotal,
      activeOrders: activeOrdersCount,
      totalEarningsToday,
      totalEarningsOverall,
      isOnline: Boolean(partnerRow?.is_online),
      status: partnerRow?.status || "ACTIVE",
    };
  },

  async getDeliveryHistory(partnerId) {
    const p = getPool();
    const [rows] = await p.query(`
      SELECT 
        o.id,
        o.user_id,
        u.name as customer_name,
        u.phone as customer_phone,
        o.delivery_partner_id,
        COALESCE(o.delivery_status, 'DELIVERED') as delivery_status,
        o.status as order_status,
        o.payment_method,
        o.payment_status,
        o.subtotal,
        o.discount_total,
        o.delivery_fee,
        o.total,
        o.address_label,
        o.address_details,
        o.notes,
        o.created_at,
        o.accepted_at,
        o.picked_up_at,
        o.out_for_delivery_at,
        o.delivered_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.delivery_partner_id = ?
        AND o.delivery_status = 'DELIVERED'
      ORDER BY o.delivered_at DESC, o.id DESC
    `, [partnerId]);

    const result = [];
    for (const r of rows) {
      const [items] = await p.query("SELECT * FROM order_items WHERE order_id = ?", [r.id]);
      const payout = 50 + Number(r.delivery_fee || 20);

      result.push({
        id: r.id,
        orderIdFormatted: `PC${10000 + Number(r.id)}`,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        deliveryAddress: `${r.address_label}: ${r.address_details}`,
        totalAmount: Number(r.total || 0),
        payoutAmount: payout,
        paymentMethod: r.payment_method,
        paymentStatus: r.payment_status,
        deliveryStatus: r.delivery_status,
        createdAt: r.created_at,
        deliveredAt: r.delivered_at || r.created_at,
        itemsCount: items.length,
        items: items.map(i => ({
          medicineName: i.medicine_name,
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
          totalPrice: Number(i.total_price),
        })),
      });
    }
    return result;
  },

  async getActiveDeliveryOrders(partnerId) {
    const p = getPool();
    const [rows] = await p.query(`
      SELECT 
        o.id,
        o.user_id,
        u.name as customer_name,
        u.phone as customer_phone,
        o.delivery_partner_id,
        COALESCE(o.delivery_status, 'ACCEPTED') as delivery_status,
        o.status as order_status,
        o.payment_method,
        o.payment_status,
        o.total,
        o.address_label,
        o.address_details,
        o.notes,
        o.created_at,
        o.assigned_at,
        o.accepted_at,
        o.picked_up_at,
        o.out_for_delivery_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.delivery_partner_id = ?
        AND o.delivery_status IN ('ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY')
      ORDER BY o.id DESC
    `, [partnerId]);

    const result = [];
    for (const r of rows) {
      const [items] = await p.query("SELECT * FROM order_items WHERE order_id = ?", [r.id]);
      result.push({
        id: r.id,
        orderIdFormatted: `PC${10000 + Number(r.id)}`,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        deliveryAddress: `${r.address_label}: ${r.address_details}`,
        itemsCount: items.length,
        items: items.map(i => ({ medicineName: i.medicine_name, quantity: i.quantity, totalPrice: Number(i.total_price) })),
        totalAmount: Number(r.total || 0),
        paymentMethod: r.payment_method,
        paymentStatus: r.payment_status,
        deliveryStatus: r.delivery_status,
        createdAt: r.created_at,
        acceptedAt: r.accepted_at,
        pickedUpAt: r.picked_up_at,
        outForDeliveryAt: r.out_for_delivery_at,
      });
    }
    return result;
  },

  async getActiveDeliveryOrder(partnerId) {
    const orders = await this.getActiveDeliveryOrders(partnerId);
    return orders[0] || null;
  },

  async acceptDeliveryOrderAtomic(orderId, partnerId) {
    const p = getPool();

    const [partner] = await p.query("SELECT * FROM delivery_partners WHERE id = ?", [partnerId]);
    if (!partner[0] || partner[0].status !== 'ACTIVE' || !partner[0].is_online) {
      throw new Error("You must be an active and online delivery partner to accept orders.");
    }

    // Atomic SQL UPDATE with concurrency check
    const [result] = await p.query(
      `UPDATE orders
       SET delivery_partner_id = ?,
           delivery_status = 'ACCEPTED',
           accepted_at = NOW()
       WHERE id = ?
         AND (delivery_partner_id IS NULL OR delivery_partner_id = ?)
         AND (delivery_status IS NULL OR delivery_status IN ('ORDER_PLACED', 'UNASSIGNED', 'Processing', 'PENDING', 'CONFIRMED', 'ASSIGNED'))`,
      [partnerId, orderId, partnerId]
    );

    if (result.affectedRows === 0) {
      throw new Error("This order has already been accepted by another delivery partner.");
    }

    // Increment partner active order count
    await p.query("UPDATE delivery_partners SET active_order_count = active_order_count + 1 WHERE id = ?", [partnerId]);

    // Insert history log
    await p.query(
      "INSERT INTO delivery_status_history (order_id, delivery_partner_id, status, notes) VALUES (?, ?, 'ACCEPTED', 'Delivery partner accepted order')",
      [orderId, partnerId]
    );

    return await this.getActiveDeliveryOrder(partnerId);
  },

  async updateDeliveryOrderStatus(orderId, partnerId, newStatus, notes = "", location = "") {
    const p = getPool();
    const [orderRows] = await p.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    if (!orderRows[0]) throw new Error("Order not found.");

    const currentStatus = orderRows[0].delivery_status || 'ORDER_PLACED';

    // Strict Backend State Machine Validation
    const allowedTransitions = {
      'ORDER_PLACED': ['CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'CANCELLED'],
      'CONFIRMED': ['ASSIGNED', 'ACCEPTED', 'CANCELLED'],
      'ASSIGNED': ['ACCEPTED', 'CANCELLED'],
      'ACCEPTED': ['PICKED_UP', 'CANCELLED'],
      'PICKED_UP': ['OUT_FOR_DELIVERY', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
    };

    if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}.`);
    }

    let timestampColumn = "";
    if (newStatus === 'PICKED_UP') timestampColumn = ", picked_up_at = NOW()";
    else if (newStatus === 'OUT_FOR_DELIVERY') timestampColumn = ", out_for_delivery_at = NOW()";
    else if (newStatus === 'DELIVERED') timestampColumn = ", delivered_at = NOW()";

    await p.query(
      `UPDATE orders SET delivery_status = ? ${timestampColumn} WHERE id = ?`,
      [newStatus, orderId]
    );

    if (newStatus === 'DELIVERED') {
      await p.query(
        "UPDATE delivery_partners SET active_order_count = GREATEST(0, active_order_count - 1), completed_order_count = completed_order_count + 1 WHERE id = ?",
        [partnerId]
      );
      await p.query("UPDATE orders SET status = 'Delivered', payment_status = 'paid' WHERE id = ?", [orderId]);
    } else if (newStatus === 'CANCELLED') {
      await p.query("UPDATE orders SET status = 'Cancelled' WHERE id = ?", [orderId]);
      if (partnerId) {
        await p.query(
          "UPDATE delivery_partners SET active_order_count = GREATEST(0, active_order_count - 1) WHERE id = ?",
          [partnerId]
        );
      }
      if (orderRows[0].status !== 'Cancelled') {
        // Refund medicine stock
        const [orderItems] = await p.query("SELECT medicine_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
        for (const item of orderItems) {
          if (item.medicine_id && Number(item.quantity) > 0) {
            await p.query("UPDATE medicines SET stock = stock + ? WHERE id = ?", [Number(item.quantity), item.medicine_id]);
          }
        }
      }
    }

    await p.query(
      "INSERT INTO delivery_status_history (order_id, delivery_partner_id, status, notes, location) VALUES (?, ?, ?, ?, ?)",
      [orderId, partnerId, newStatus, notes, location]
    );

    return { orderId, deliveryStatus: newStatus, timestamp: new Date() };
  },

  async assignOrderDeliveryPartner(orderId, partnerId) {
    const p = getPool();
    const partner = await this.findDeliveryPartnerById(partnerId);
    if (!partner) throw new Error("Delivery partner not found.");

    await p.query(
      "UPDATE orders SET delivery_partner_id = ?, delivery_status = 'ASSIGNED', assigned_at = NOW() WHERE id = ?",
      [partnerId, orderId]
    );

    await p.query(
      "INSERT INTO delivery_status_history (order_id, delivery_partner_id, status, notes) VALUES (?, ?, 'ASSIGNED', ?)",
      [orderId, partnerId, `Manually assigned to ${partner.name} (${partner.delivery_id || 'DEL'})`]
    );

    return { orderId, partnerId, partnerName: partner.name };
  },

  async autoAssignOrderDeliveryPartner(orderId) {
    const p = getPool();
    const [rows] = await p.query(
      "SELECT * FROM delivery_partners WHERE is_active = 1 AND is_online = 1 AND status = 'ACTIVE' ORDER BY active_order_count ASC, id ASC LIMIT 1"
    );

    if (!rows[0]) throw new Error("No online and available delivery partners at the moment.");

    const partner = rows[0];
    await this.assignOrderDeliveryPartner(orderId, partner.id);
    return partner;
  },

  async getAdminDeliveryOverview() {
    const p = getPool();
    const [partnerStats] = await p.query(`
      SELECT 
        COUNT(*) as total_partners,
        COUNT(CASE WHEN is_online = 1 THEN 1 END) as online_partners,
        COUNT(CASE WHEN is_online = 0 THEN 1 END) as offline_partners
      FROM delivery_partners WHERE status != 'DEACTIVATED'
    `);

    const [orderStats] = await p.query(`
      SELECT 
        COUNT(CASE WHEN delivery_status IN ('ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY') THEN 1 END) as active_deliveries,
        COUNT(CASE WHEN delivery_status IN ('ORDER_PLACED', 'CONFIRMED', 'ASSIGNED') OR delivery_partner_id IS NULL THEN 1 END) as pending_deliveries,
        COUNT(CASE WHEN delivery_status = 'DELIVERED' AND delivered_at >= CURDATE() THEN 1 END) as completed_today,
        COUNT(CASE WHEN delivery_status = 'CANCELLED' THEN 1 END) as cancelled_deliveries
      FROM orders
    `);

    const ps = partnerStats[0] || {};
    const os = orderStats[0] || {};

    return {
      totalPartners: Number(ps.total_partners || 0),
      onlinePartners: Number(ps.online_partners || 0),
      offlinePartners: Number(ps.offline_partners || 0),
      activeDeliveries: Number(os.active_deliveries || 0),
      pendingDeliveries: Number(os.pending_deliveries || 0),
      completedToday: Number(os.completed_today || 0),
      cancelledDeliveries: Number(os.cancelled_deliveries || 0),
      delayedDeliveries: 0,
    };
  },

  async getAdminDeliveryPartnersList() {
    const p = getPool();
    const [rows] = await p.query(`
      SELECT 
        dp.id,
        dp.delivery_id,
        dp.name,
        dp.phone,
        dp.email,
        dp.address,
        dp.profile_image,
        dp.status,
        dp.is_online,
        dp.last_active_at,
        dp.latitude,
        dp.longitude,
        dp.current_location_name,
        dp.active_order_count,
        dp.completed_order_count
      FROM delivery_partners dp
      ORDER BY dp.id ASC
    `);

    return rows.map(r => {
      const total = r.completed_order_count + r.active_order_count;
      const successRate = total > 0 ? Math.round((r.completed_order_count / total) * 100) : 100;
      return {
        id: r.id,
        deliveryId: r.delivery_id || `DEL${1000 + r.id}`,
        name: r.name,
        phone: r.phone,
        email: r.email || "No email",
        address: r.address || "Not set",
        profileImage: r.profile_image || "",
        status: r.status || "ACTIVE",
        isOnline: Boolean(r.is_online),
        lastActiveAt: r.last_active_at,
        latitude: r.latitude ? Number(r.latitude) : null,
        longitude: r.longitude ? Number(r.longitude) : null,
        locationName: r.current_location_name || "Location unknown",
        activeOrders: Number(r.active_order_count || 0),
        completedDeliveries: Number(r.completed_order_count || 0),
        successRate,
      };
    });
  },

  async getAdminDeliveryAnalytics() {
    const p = getPool();
    const [statusDist] = await p.query(`
      SELECT COALESCE(delivery_status, 'ORDER_PLACED') as status, COUNT(*) as count
      FROM orders
      GROUP BY COALESCE(delivery_status, 'ORDER_PLACED')
    `);

    const [dailyDel] = await p.query(`
      SELECT DATE(delivered_at) as date, COUNT(*) as count
      FROM orders
      WHERE delivery_status = 'DELIVERED' AND delivered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(delivered_at)
      ORDER BY date ASC
    `);

    return {
      statusDistribution: statusDist.map(s => ({ status: s.status, count: Number(s.count) })),
      dailyDeliveries: dailyDel.map(d => ({ date: d.date, count: Number(d.count) })),
    };
  },

  async getOrderDeliveryTimeline(orderId) {
    const p = getPool();
    const [orderRows] = await p.query(`
      SELECT 
        o.id,
        o.delivery_partner_id,
        COALESCE(o.delivery_status, 'ORDER_PLACED') as delivery_status,
        o.created_at,
        o.assigned_at,
        o.accepted_at,
        o.picked_up_at,
        o.out_for_delivery_at,
        o.delivered_at,
        dp.name as partner_name,
        dp.phone as partner_phone,
        dp.delivery_id as partner_delivery_id
      FROM orders o
      LEFT JOIN delivery_partners dp ON o.delivery_partner_id = dp.id
      WHERE o.id = ?
    `, [orderId]);

    if (!orderRows[0]) return null;
    const r = orderRows[0];

    const [history] = await p.query("SELECT * FROM delivery_status_history WHERE order_id = ? ORDER BY id ASC", [orderId]);

    return {
      orderId: r.id,
      orderIdFormatted: `PC${10000 + Number(r.id)}`,
      deliveryStatus: r.delivery_status,
      deliveryPartner: r.delivery_partner_id ? {
        id: r.delivery_partner_id,
        deliveryId: r.partner_delivery_id || `DEL${1000 + r.delivery_partner_id}`,
        name: r.partner_name,
        phone: r.partner_phone,
      } : null,
      timestamps: {
        placedAt: r.created_at,
        assignedAt: r.assigned_at,
        acceptedAt: r.accepted_at,
        pickedUpAt: r.picked_up_at,
        outForDeliveryAt: r.out_for_delivery_at,
        deliveredAt: r.delivered_at,
      },
      historyLogs: history.map(h => ({ status: h.status, notes: h.notes, location: h.location, timestamp: h.timestamp })),
    };
  },

  async updateAdminCredentials(userId, email, newPassword = "") {
    const p = getPool();
    const [existing] = await p.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (!existing[0]) throw new Error("Admin account not found.");

    const cleanEmail = email.trim().toLowerCase();
    const [dup] = await p.query("SELECT id FROM users WHERE email = ? AND id != ?", [cleanEmail, userId]);
    if (dup.length > 0) {
      throw new Error("This email address is already registered to another user.");
    }

    if (newPassword && newPassword.trim().length > 0) {
      const hash = await bcrypt.hash(newPassword.trim(), 10);
      await p.query("UPDATE users SET email = ?, password_hash = ? WHERE id = ?", [cleanEmail, hash, userId]);
    } else {
      await p.query("UPDATE users SET email = ? WHERE id = ?", [cleanEmail, userId]);
    }

    const [updatedUser] = await p.query("SELECT id, role, name, email, phone, status FROM users WHERE id = ?", [userId]);
    return updatedUser[0];
  },
};

export default mysqlService;
