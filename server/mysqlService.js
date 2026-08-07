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

      // Ensure primary accounts always exist with correct password hash on any DB startup (e.g. Railway / Cloud DB)
      const defaultAdminHash = await bcrypt.hash("admin123", 10);
      const defaultCustomerHash = await bcrypt.hash("customer123", 10);

      await p.query(
        `INSERT INTO users (role, name, email, phone, password_hash, business_name, business_address, verification_document)
         VALUES ('admin', 'System Admin', 'admin@gmail.com', '9999999999', ?, 'Pharmacy Store HQ', '123 Healthcare Blvd', 'DOC-ADMIN-001')
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
      }

      // Seed delivery partners if empty
      const [delRows] = await p.query("SELECT COUNT(*) AS count FROM delivery_partners");
      if (delRows[0].count === 0) {
        for (const d of SEED_DELIVERY_PARTNERS) {
          await p.query(
            `INSERT INTO delivery_partners (id, name, phone, active_order_count, completed_order_count, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [d.id, d.name, d.phone, d.active_order_count, d.completed_order_count, d.is_active]
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

export const mysqlService = {
  // USERS
  async findUserByEmail(email) {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [email]);
    return rows[0] || null;
  },

  async findUserByPhone(phone) {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM users WHERE phone = ? LIMIT 1", [phone]);
    return rows[0] || null;
  },

  async findUserById(id) {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    return rows[0] || null;
  },

  async createUser(userData) {
    const p = getPool();
    const role = userData.role || "customer";
    const name = userData.name;
    const email = userData.email;
    const phone = userData.phone;
    const passwordHash = userData.password_hash || userData.passwordHash;
    const businessName = userData.business_name || userData.businessName || null;
    const businessAddress = userData.business_address || userData.businessAddress || null;
    const verificationDocument = userData.verification_document || userData.verificationDocument || null;

    const [result] = await p.query(
      `INSERT INTO users (role, name, email, phone, password_hash, business_name, business_address, verification_document)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [role, name, email, phone, passwordHash, businessName, businessAddress, verificationDocument]
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
    if (userData.business_name !== undefined) { updates.push("business_name = ?"); values.push(userData.business_name); }
    if (userData.business_address !== undefined) { updates.push("business_address = ?"); values.push(userData.business_address); }
    if (userData.verification_document !== undefined) { updates.push("verification_document = ?"); values.push(userData.verification_document); }

    if (updates.length > 0) {
      values.push(id);
      await p.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    return this.findUserById(id);
  },

  // AUTH OTPS
  async createOtp({ user_id, purpose, otp_code, expires_at }) {
    const p = getPool();
    const [result] = await p.query(
      `INSERT INTO auth_otps (user_id, purpose, otp_code, expires_at) VALUES (?, ?, ?, ?)`,
      [user_id, purpose, otp_code, new Date(expires_at)]
    );
    const [rows] = await p.query("SELECT * FROM auth_otps WHERE id = ?", [result.insertId]);
    return rows[0];
  },

  async verifyOtp(identifier, otpCode, purpose) {
    const p = getPool();
    const user = (await this.findUserByEmail(identifier)) || (await this.findUserByPhone(identifier));
    if (!user) return null;

    const [rows] = await p.query(
      `SELECT * FROM auth_otps 
       WHERE user_id = ? AND purpose = ? AND otp_code = ? AND used_at IS NULL AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, purpose, otpCode]
    );

    if (rows.length === 0) return null;

    const otpRecord = rows[0];
    await p.query("UPDATE auth_otps SET used_at = NOW() WHERE id = ?", [otpRecord.id]);
    return user;
  },

  // MEDICINES
  async getMedicines() {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM medicines ORDER BY id ASC");
    return rows.map((r) => ({
      ...r,
      price: Number(r.price),
      discount_percent: Number(r.discount_percent),
      stock: Number(r.stock),
      is_active: Number(r.is_active),
    }));
  },

  async getMedicineById(id) {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM medicines WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...r,
      price: Number(r.price),
      discount_percent: Number(r.discount_percent),
      stock: Number(r.stock),
      is_active: Number(r.is_active),
    };
  },

  async createMedicine(medicineData) {
    const p = getPool();
    const [result] = await p.query(
      `INSERT INTO medicines (name, category, description, image_url, price, discount_percent, stock, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicineData.name,
        medicineData.category,
        medicineData.description || "",
        medicineData.image_url || medicineData.image || "",
        Number(medicineData.price || 0),
        Number(medicineData.discount_percent || medicineData.discount || 0),
        Number(medicineData.stock || 0),
        medicineData.is_active !== undefined ? (medicineData.is_active ? 1 : 0) : 1,
      ]
    );
    const [rows] = await p.query("SELECT * FROM medicines WHERE id = ?", [result.insertId]);
    return rows[0];
  },

  async updateMedicine(id, updates) {
    const p = getPool();
    const setClause = [];
    const values = [];

    if (updates.name !== undefined) { setClause.push("name = ?"); values.push(updates.name); }
    if (updates.category !== undefined) { setClause.push("category = ?"); values.push(updates.category); }
    if (updates.description !== undefined) { setClause.push("description = ?"); values.push(updates.description); }
    if (updates.image_url !== undefined || updates.image !== undefined) {
      setClause.push("image_url = ?");
      values.push(updates.image_url ?? updates.image);
    }
    if (updates.price !== undefined) { setClause.push("price = ?"); values.push(Number(updates.price)); }
    if (updates.discount_percent !== undefined || updates.discount !== undefined) {
      setClause.push("discount_percent = ?");
      values.push(Number(updates.discount_percent ?? updates.discount));
    }
    if (updates.stock !== undefined) { setClause.push("stock = ?"); values.push(Number(updates.stock)); }
    if (updates.is_active !== undefined) { setClause.push("is_active = ?"); values.push(updates.is_active ? 1 : 0); }

    if (setClause.length > 0) {
      values.push(id);
      await p.query(`UPDATE medicines SET ${setClause.join(", ")} WHERE id = ?`, values);
    }

    const [rows] = await p.query("SELECT * FROM medicines WHERE id = ?", [id]);
    return rows[0] || null;
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

  // DELIVERY PARTNERS
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

  // VENDOR PARTNERS
  async getVendorPartners() {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM vendor_partners ORDER BY id ASC");
    return rows.map((r) => ({
      ...r,
      rating: Number(r.rating),
      is_active: Number(r.is_active),
    }));
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

  // ORDERS
  async getOrders(userId = null) {
    const p = getPool();
    let queryStr = `
      SELECT 
        o.id, o.user_id, o.delivery_partner_id, o.status, o.payment_method, o.payment_status,
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

  async createOrder(orderData, itemsData) {
    const p = getPool();
    const conn = await p.getConnection();

    try {
      await conn.beginTransaction();

      // Pick next available delivery partner if available
      const [availablePartners] = await conn.query(
        "SELECT id FROM delivery_partners WHERE is_active = 1 ORDER BY active_order_count ASC LIMIT 1"
      );
      const assignedPartnerId = availablePartners.length > 0 ? availablePartners[0].id : null;

      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, delivery_partner_id, status, payment_method, payment_status, subtotal, discount_total, delivery_fee, total, address_label, address_details, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    await p.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);

    if (partnerId) {
      if (oldStatus !== "Delivered" && status === "Delivered") {
        await p.query(
          `UPDATE delivery_partners 
           SET active_order_count = GREATEST(0, active_order_count - 1), 
               completed_order_count = completed_order_count + 1 
           WHERE id = ?`,
          [partnerId]
        );
      } else if (oldStatus !== "Cancelled" && status === "Cancelled") {
        await p.query(
          `UPDATE delivery_partners SET active_order_count = GREATEST(0, active_order_count - 1) WHERE id = ?`,
          [partnerId]
        );
      }
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

  // PROCUREMENT ORDERS
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

  // BULK DISCOUNTS & CAMPAIGNS
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
};

export default mysqlService;
