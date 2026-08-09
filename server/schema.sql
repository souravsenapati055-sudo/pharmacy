CREATE DATABASE IF NOT EXISTS pharmacy_app;
USE pharmacy_app;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
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

CREATE TABLE IF NOT EXISTS auth_otps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  purpose ENUM('login', 'password_reset') NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_otps_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  delivery_partner_id INT NULL,
  status ENUM('Processing', 'Out for Delivery', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Processing',
  payment_method ENUM('cod', 'upi', 'card') NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  address_label VARCHAR(80) NOT NULL,
  address_details VARCHAR(255) NOT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_orders_delivery_partner
    FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id)
    ON DELETE SET NULL
);

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
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS procurement_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  vendor_type VARCHAR(80) NOT NULL,
  source VARCHAR(80) NOT NULL,
  status ENUM('Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  urgency VARCHAR(40) NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes VARCHAR(255) NULL,
  created_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_procurement_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendor_partners(id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS procurement_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  procurement_order_id INT NOT NULL,
  medicine_id INT NOT NULL,
  medicine_name VARCHAR(160) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_procurement_items_order
    FOREIGN KEY (procurement_order_id) REFERENCES procurement_orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_procurement_items_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    ON DELETE RESTRICT
);

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

CREATE TABLE IF NOT EXISTS stock_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('SALE', 'STOCK_ADDED', 'STOCK_REMOVED', 'DAMAGED', 'EXPIRED', 'RETURNED', 'CORRECTION') NOT NULL,
  medicine_id INT NOT NULL,
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
  CONSTRAINT fk_stock_trans_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  label VARCHAR(50) NOT NULL DEFAULT 'Home',
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  address_line TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  landmark VARCHAR(120) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_addresses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  gateway_payment_id VARCHAR(100) NULL,
  gateway_order_id VARCHAR(100) NULL,
  gateway_signature VARCHAR(255) NULL,
  payment_method ENUM('upi', 'card', 'netbanking', 'wallet', 'cod') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('created', 'pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'created',
  error_code VARCHAR(50) NULL,
  error_description VARCHAR(255) NULL,
  card_network VARCHAR(50) NULL,
  card_last4 VARCHAR(4) NULL,
  upi_vpa VARCHAR(100) NULL,
  bank_name VARCHAR(100) NULL,
  wallet_name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  attempt_number INT NOT NULL DEFAULT 1,
  gateway VARCHAR(50) NOT NULL DEFAULT 'Razorpay',
  gateway_order_id VARCHAR(100) NULL,
  gateway_payment_id VARCHAR(100) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'initiated',
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_attempts_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refunds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id INT NOT NULL,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  gateway_refund_id VARCHAR(100) NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('requested', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'requested',
  reason VARCHAR(255) NULL,
  initiated_by_user_id INT NULL,
  processed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refunds_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_refunds_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  max_discount_amount DECIMAL(10,2) NULL,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  valid_until DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  user_name VARCHAR(120) NULL,
  user_email VARCHAR(191) NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100) NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(100) NOT NULL,
  gateway VARCHAR(50) NOT NULL DEFAULT 'Razorpay',
  payload JSON NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'received',
  processed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

