/**
 * Utility for generating professional Pharmacy PDF Invoices and Reports.
 * Uses a hidden iframe + print fallback so browser popup blockers will NEVER block PDF generation.
 */

function getPrintIframe() {
  let iframe = document.getElementById("pdf-print-iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "pdf-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);
  }
  return iframe;
}

function printHTMLContent(htmlContent, title) {
  // Try popup window first; if blocked, fallback to hidden iframe
  try {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try { printWindow.print(); } catch (e) {}
      }, 300);
      return;
    }
  } catch (e) {}

  // Fallback: Hidden iframe printing
  const iframe = getPrintIframe();
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error("Iframe print error:", e);
    }
  }, 350);
}

export function generateOrderInvoicePDF(order) {
  if (!order) return;

  const orderId = order.id || Math.floor(100000 + Math.random() * 900000);
  const customerName = order.customerName || order.userName || "Valued Customer";
  const customerPhone = order.customerPhone || order.phone || "+91 98765 43210";
  const address = order.address || order.address_details || "Standard Pharmacy Delivery Address, Main Branch";
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");
  const paymentMethod = (order.paymentMethod || order.payment_method || "UPI").toUpperCase();
  const paymentStatus = (order.paymentStatus || order.payment_status || "PAID").toUpperCase();
  const deliveryStatus = order.status || "Processing";
  const items = order.items && Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [{ name: order.medicine || "Prescription Medicines", qty: 1, price: order.totalPrice || order.total || 150 }];

  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  const deliveryFee = order.delivery_fee ?? 7;
  const discountTotal = order.discount_total ?? 0;
  const grandTotal = order.totalPrice || order.total || subtotal - discountTotal + deliveryFee;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice_#${orderId}_PharmaCare</title>
        <style>
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.4;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 32px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #087ea4;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .brand-logo {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-icon {
            width: 36px;
            height: 36px;
            background: #087ea4;
            color: #ffffff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #087ea4;
            margin: 0;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin: 2px 0 0;
          }
          .invoice-title-block {
            text-align: right;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .invoice-no {
            font-size: 13px;
            font-weight: 700;
            color: #087ea4;
            margin: 4px 0 0;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background: #f8fafc;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .meta-block h4 {
            margin: 0 0 6px;
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
          }
          .meta-block p {
            margin: 0;
            font-weight: 600;
            color: #0f172a;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-paid { background: #dcfce7; color: #15803d; }
          .badge-pending { background: #fef3c7; color: #b45309; }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .items-table th {
            background: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #0f172a;
          }
          .summary-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .summary-table {
            width: 280px;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 6px 12px;
            text-align: right;
          }
          .summary-table .grand-total {
            border-top: 2px solid #087ea4;
            font-size: 16px;
            font-weight: 800;
            color: #087ea4;
            padding-top: 10px;
          }
          .footer-stamp {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
          }
          .stamp-box {
            border: 2px solid #16a34a;
            color: #16a34a;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 12px;
            display: inline-block;
            transform: rotate(-3deg);
          }
          .sign-box {
            text-align: center;
          }
          .sign-line {
            width: 150px;
            border-top: 1px solid #0f172a;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="invoice-header">
            <div class="brand-logo">
              <div class="brand-icon">💊</div>
              <div>
                <h1 class="brand-title">PharmaCare</h1>
                <p class="brand-sub">Healthcare & Pharmacy Management System · Reg #PH-2026-9872</p>
              </div>
            </div>
            <div class="invoice-title-block">
              <h2 class="invoice-title">Tax Invoice</h2>
              <div class="invoice-no">#ORD-${orderId}</div>
              <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">Date: ${orderDate}</p>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-block">
              <h4>Customer Information</h4>
              <p style="font-size: 14px; margin-bottom: 2px;">${customerName}</p>
              <p style="font-size: 12px; color: #475569;">📞 ${customerPhone}</p>
              <p style="font-size: 12px; color: #475569; margin-top: 4px;">📍 ${address}</p>
            </div>
            <div class="meta-block">
              <h4>Order & Payment Summary</h4>
              <p style="margin-bottom: 4px;">Payment Method: <strong>${paymentMethod}</strong></p>
              <p style="margin-bottom: 4px;">Payment Status: <span class="badge ${paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}">${paymentStatus}</span></p>
              <p>Delivery Status: <strong>${deliveryStatus}</strong></p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine / Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${item.name || item.medicine || 'Medicine'}</strong></td>
                  <td style="text-align: center;">${item.qty || 1}</td>
                  <td style="text-align: right;">₹${Number(item.price || 0).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 700;">₹${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="summary-container">
            <table class="summary-table">
              <tr>
                <td style="color: #64748b;">Subtotal:</td>
                <td style="font-weight: 600;">₹${subtotal.toFixed(2)}</td>
              </tr>
              ${
                discountTotal > 0
                  ? `<tr>
                <td style="color: #b45309;">Discount Savings:</td>
                <td style="font-weight: 600; color: #b45309;">-₹${discountTotal.toFixed(2)}</td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="color: #64748b;">Delivery Charge:</td>
                <td style="font-weight: 600;">₹${deliveryFee.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="border-top: 2px solid #087ea4; font-size: 16px; font-weight: 800; color: #087ea4; padding-top: 10px;">Grand Total:</td>
                <td style="border-top: 2px solid #087ea4; font-size: 16px; font-weight: 800; color: #087ea4; padding-top: 10px;">₹${grandTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer-stamp">
            <div class="stamp-box">
              ✓ Verified & Dispatched
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <p style="margin: 0; font-size: 11px; font-weight: 700; color: #475569;">Authorized Pharmacist</p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">PharmaCare Admin License</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  printHTMLContent(html, `Invoice_#${orderId}`);
}

export function generateMedicineReportPDF(medicines = [], reportTitle = "Medicine Stock Audit Report", filterCriteria = null) {
  const generatedDate = new Date().toLocaleString("en-IN");
  const totalItems = medicines.length;
  const totalStockUnits = medicines.reduce((sum, m) => sum + Number(m.stock || 0), 0);
  const lowStockCount = medicines.filter((m) => Number(m.stock || 0) < 20 && Number(m.stock || 0) > 0).length;
  const outOfStockCount = medicines.filter((m) => Number(m.stock || 0) === 0).length;
  const totalStockValue = medicines.reduce((sum, m) => sum + (Number(m.price || 0) * Number(m.stock || 0)), 0);

  const filterSummary = filterCriteria
    ? `Category: <strong>${filterCriteria.category || 'All'}</strong> | Status: <strong>${filterCriteria.status || 'All'}</strong> | Exported Items: <strong>${totalItems}</strong>`
    : `Showing all <strong>${totalItems}</strong> inventory items`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            font-size: 11.5px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #087ea4;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .title-group h1 { margin: 0; font-size: 20px; color: #087ea4; font-weight: 800; }
          .title-group p { margin: 2px 0 0; color: #64748b; font-size: 11px; }
          .filter-bar {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 6px 12px;
            margin-bottom: 12px;
            font-size: 11px;
            color: #334155;
          }
          .kpi-row {
            display: flex;
            gap: 10px;
            margin-bottom: 14px;
          }
          .kpi-card {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 10px;
          }
          .kpi-card-title { font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; }
          .kpi-card-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; }
          .report-table {
            width: 100%;
            border-collapse: collapse;
          }
          .report-table th {
            background: #087ea4;
            color: #ffffff;
            text-align: left;
            padding: 7px 8px;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .report-table td {
            padding: 7px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .badge-instock { background: #dcfce7; color: #15803d; }
          .badge-lowstock { background: #fef3c7; color: #b45309; }
          .badge-outstock { background: #fee2e2; color: #b91c1c; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-group">
            <h1>PharmaCare — ${reportTitle}</h1>
            <p>Generated on: ${generatedDate} · Official Master Inventory Audit Document</p>
          </div>
          <div style="text-align: right; font-weight: 700; color: #087ea4;">
            CONFIDENTIAL ADMIN REPORT
          </div>
        </div>

        <div class="filter-bar">
          Active Filters Applied: ${filterSummary}
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-card-title">Total Products</div>
            <div class="kpi-card-val">${totalItems} Items</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-title">Total Live Stock</div>
            <div class="kpi-card-val">${totalStockUnits.toLocaleString("en-IN")} Units</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-title">Low Stock Alert</div>
            <div class="kpi-card-val" style="color: #d97706;">${lowStockCount} Items</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-title">Out of Stock</div>
            <div class="kpi-card-val" style="color: #dc2626;">${outOfStockCount} Items</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-title">Inventory Valuation</div>
            <div class="kpi-card-val" style="color: #16a34a;">₹${totalStockValue.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Medicine Name</th>
              <th>Strength</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>MRP</th>
              <th>Price</th>
              <th>Live Stock</th>
              <th>Units Sold</th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            ${medicines
              .map((m, idx) => {
                const stock = Number(m.stock || 0);
                const price = Number(m.price || 0);
                const mrp = Number(m.mrp || (price * 1.15).toFixed(0));
                const minStock = Number(m.minimum_stock || 20);

                const statusBadge =
                  stock === 0
                    ? `<span class="badge badge-outstock">Out of Stock</span>`
                    : stock <= minStock
                    ? `<span class="badge badge-lowstock">Low Stock (${stock})</span>`
                    : `<span class="badge badge-instock">In Stock</span>`;

                return `
                <tr>
                  <td>#${m.id || (idx + 1)}</td>
                  <td><strong>${m.name}</strong></td>
                  <td>${m.strength || '500mg'}</td>
                  <td>${m.category || 'General'}</td>
                  <td>${m.manufacturer || 'PharmaCare Labs'}</td>
                  <td style="color: #94a3b8; text-decoration: line-through;">₹${mrp}</td>
                  <td style="font-weight: 700; color: #087ea4;">₹${price}</td>
                  <td style="font-weight: 800; color: #0f172a;">${stock} units</td>
                  <td>${m.units_sold || 0} sold</td>
                  <td>${statusBadge}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printHTMLContent(html, reportTitle);
}

export function generateSingleMedicinePDFReport(medicine, history = [], customers = []) {
  if (!medicine) return;

  const generatedDate = new Date().toLocaleString("en-IN");
  const totalAdded = history
    .filter((h) => h.type === "STOCK_ADDED")
    .reduce((sum, h) => sum + Number(h.quantity || 0), 0);
  const totalRemoved = Math.abs(
    history
      .filter((h) => h.type === "DAMAGED" || h.type === "EXPIRED" || h.type === "STOCK_REMOVED")
      .reduce((sum, h) => sum + Number(h.quantity || 0), 0)
  );

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Medicine_Report_${medicine.name.replace(/\s+/g, "_")}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body {
            font-family: 'Segoe UI', Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            font-size: 12.5px;
            line-height: 1.4;
          }
          .report-box {
            max-width: 800px;
            margin: auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #087ea4;
            padding-bottom: 14px;
            margin-bottom: 20px;
          }
          .brand-title { font-size: 22px; font-weight: 800; color: #087ea4; margin: 0; }
          .brand-sub { font-size: 11px; color: #64748b; margin: 2px 0 0; }
          .med-overview-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .overview-block h4 { margin: 0 0 6px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .overview-block p { margin: 0 0 4px; font-weight: 600; color: #0f172a; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; }
          .badge-green { background: #dcfce7; color: #15803d; }
          .badge-amber { background: #fef3c7; color: #b45309; }
          .badge-red { background: #fee2e2; color: #b91c1c; }
          .section-heading {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin: 20px 0 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .data-table th {
            background: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
          }
          .data-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
        </style>
      </head>
      <body>
        <div class="report-box">
          <div class="header">
            <div>
              <h1 class="brand-title">PharmaCare</h1>
              <p class="brand-sub">Medicine Inventory & Audit Report · Confidential Document</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0; font-size: 16px; color: #0f172a;">${medicine.name}</h3>
              <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">Report Date: ${generatedDate}</p>
            </div>
          </div>

          <div class="med-overview-grid">
            <div class="overview-block">
              <h4>Medicine Profile</h4>
              <p style="font-size: 15px; color: #087ea4;">${medicine.name} (${medicine.strength || '500mg'})</p>
              <p>Category: <strong>${medicine.category || 'General'}</strong></p>
              <p>Manufacturer: <strong>${medicine.manufacturer || 'PharmaCare Labs'}</strong></p>
              <p>Selling Price: <strong>₹${Number(medicine.price).toFixed(2)}</strong> (MRP ₹${Number(medicine.mrp || medicine.price * 1.15).toFixed(2)})</p>
            </div>
            <div class="overview-block">
              <h4>Stock & Consumption Metrics</h4>
              <p>Current Stock: <strong style="font-size: 14px; color: #0f172a;">${medicine.stock} units</strong></p>
              <p>Stock Status: 
                <span class="badge ${medicine.stock === 0 ? 'badge-red' : medicine.stock < 20 ? 'badge-amber' : 'badge-green'}">
                  ${medicine.stock === 0 ? 'Out of Stock' : medicine.stock < 20 ? 'Low Stock' : 'In Stock'}
                </span>
              </p>
              <p>Total Units Sold: <strong>${medicine.units_sold || 0} units</strong></p>
              <p>Stock Added (Lifetime): <strong>+${totalAdded} units</strong> | Removed: <strong>-${totalRemoved} units</strong></p>
            </div>
          </div>

          <div class="section-heading">Stock Audit History Timeline</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Transaction Type</th>
                <th>Quantity</th>
                <th>Prev Stock</th>
                <th>New Stock</th>
                <th>Reason / Reference</th>
              </tr>
            </thead>
            <tbody>
              ${history.length === 0 ? `<tr><td colSpan="6" style="text-align: center; color: #64748b;">No stock transactions logged.</td></tr>` : 
                history.map((h) => `
                  <tr>
                    <td>${new Date(h.created_at).toLocaleString("en-IN")}</td>
                    <td><strong>${h.type}</strong></td>
                    <td style="font-weight: 700; color: ${h.quantity > 0 ? '#15803d' : '#b91c1c'};">${h.quantity > 0 ? '+' : ''}${h.quantity}</td>
                    <td>${h.previous_stock}</td>
                    <td style="font-weight: 700;">${h.new_stock}</td>
                    <td>${h.reason || 'N/A'} ${h.batch_number ? `(Batch: ${h.batch_number})` : ''}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>

          <div class="section-heading">Customer Orders & Usage History</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Order ID</th>
                <th>Qty</th>
                <th>Order Date</th>
                <th>Delivery Status</th>
              </tr>
            </thead>
            <tbody>
              ${customers.length === 0 ? `<tr><td colSpan="5" style="text-align: center; color: #64748b;">No customer orders recorded for this medicine.</td></tr>` :
                customers.map((c) => `
                  <tr>
                    <td><strong>${c.customer_name}</strong></td>
                    <td>#ORD${c.order_id}</td>
                    <td>${c.quantity} units</td>
                    <td>${new Date(c.order_date).toLocaleDateString("en-IN")}</td>
                    <td><span class="badge ${c.order_status === 'Delivered' ? 'badge-green' : 'badge-amber'}">${c.order_status}</span></td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>

          <div class="footer">
            <div>
              <p style="margin: 0; font-weight: 700;">PharmaCare Inventory Audit System</p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">Automated report generated for Admin</p>
            </div>
            <div style="text-align: center;">
              <div style="width: 140px; border-top: 1px solid #0f172a; margin-bottom: 4px;"></div>
              <p style="margin: 0; font-size: 11px; font-weight: 700;">Pharmacy Admin Signature</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  printHTMLContent(html, `Medicine_Report_${medicine.name}`);
}

export function generateFinancialDashboardPDF(data = {}) {
  const generatedDate = new Date().toLocaleString("en-IN");
  const {
    filters = {},
    kpis = [],
    deliveryPartners = [],
    transactions = []
  } = data;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>PharmaCare_Financial_Operations_Report</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body {
            font-family: 'Segoe UI', Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5px solid #087ea4;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-title { font-size: 22px; font-weight: 800; color: #087ea4; margin: 0; }
          .brand-sub { font-size: 11px; color: #64748b; margin: 2px 0 0; }
          .filter-bar {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 11px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
          }
          .kpi-title { font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .kpi-value { font-size: 16px; font-weight: 800; color: #0f172a; margin: 4px 0 2px; }
          .kpi-sub { font-size: 10px; color: #16a34a; font-weight: 700; }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin: 16px 0 10px;
            text-transform: uppercase;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .data-table th {
            background: #087ea4;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 7px 8px;
            text-align: left;
          }
          .data-table td {
            padding: 7px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 800;
          }
          .badge-green { background: #dcfce7; color: #15803d; }
          .badge-amber { background: #fef3c7; color: #b45309; }
          .badge-red { background: #fee2e2; color: #b91c1c; }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">PharmaCare</h1>
            <p class="brand-sub">Enterprise Financial & Operations Audit Report · Master Executive Summary</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: 800; color: #087ea4; font-size: 13px;">OFFICIAL ADMIN REPORT</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">Generated: ${generatedDate}</p>
          </div>
        </div>

        <div class="filter-bar">
          <strong>Applied Filter Parameters:</strong> Date Range: <u>${filters.dateRange || 'This Month'}</u> | Branch: <u>${filters.branch || 'All Branches'}</u> | Report Type: <u>${filters.reportType || 'Financial Overview'}</u> | Delivery Status: <u>${filters.deliveryStatus || 'All'}</u>
        </div>

        <div class="kpi-grid">
          ${kpis.map(k => `
            <div class="kpi-card">
              <div class="kpi-title">${k.title}</div>
              <div class="kpi-value">${k.value}</div>
              <div class="kpi-sub">${k.change} (${k.period})</div>
            </div>
          `).join('')}
        </div>

        ${deliveryPartners.length > 0 ? `
          <div class="section-title">Delivery Partner Wise Performance & COD Reconciliation</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Partner Name</th>
                <th>Phone</th>
                <th>Assigned</th>
                <th>Delivered</th>
                <th>Pending</th>
                <th>Failed</th>
                <th>COD Collected</th>
                <th>COD Settled</th>
                <th>COD Pending (Driver)</th>
                <th>SLA Rate</th>
              </tr>
            </thead>
            <tbody>
              ${deliveryPartners.map(dp => `
                <tr>
                  <td><strong>${dp.name}</strong></td>
                  <td>${dp.phone}</td>
                  <td>${dp.assigned}</td>
                  <td style="color: #16a34a; font-weight: 700;">${dp.delivered}</td>
                  <td>${dp.pending}</td>
                  <td style="color: #dc2626;">${dp.failed}</td>
                  <td style="font-weight: 700;">₹${dp.codCollected}</td>
                  <td style="color: #16a34a;">₹${dp.codSettled}</td>
                  <td style="color: #d97706; font-weight: 700;">₹${dp.codPending}</td>
                  <td><span class="badge badge-green">${dp.successRate}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="section-title">Recent Financial Transactions Audit Ledger</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Payment Method</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 15).map(t => `
              <tr>
                <td><strong>${t.txnId}</strong></td>
                <td>${t.orderId}</td>
                <td>${t.customer}</td>
                <td>${t.method}</td>
                <td style="font-weight: 700;">₹${t.amount}</td>
                <td>${t.type}</td>
                <td><span class="badge ${t.status === 'Completed' ? 'badge-green' : t.status === 'Pending' ? 'badge-amber' : 'badge-red'}">${t.status}</span></td>
                <td>${t.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <p style="margin: 0; font-weight: 700;">PharmaCare Financial Systems</p>
            <p style="margin: 0; font-size: 10px; color: #64748b;">Generated from Railway MySQL Database Sync</p>
          </div>
          <div style="text-align: center;">
            <div style="width: 140px; border-top: 1px solid #0f172a; margin-bottom: 4px;"></div>
            <p style="margin: 0; font-size: 11px; font-weight: 700;">Chief Administrative Signature</p>
          </div>
        </div>
      </body>
    </html>
  `;

  printHTMLContent(html, `PharmaCare_Financial_Report_${Date.now()}`);
}

export function generateDeliveryPartnerPDF(partnerData = {}) {
  const generatedDate = new Date().toLocaleString("en-IN");
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Delivery_Partner_Report_${(partnerData.name || 'Driver').replace(/\s+/g, '_')}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 20px; font-size: 12px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #087ea4; padding-bottom: 10px; margin-bottom: 16px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
          .card-title { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
          .card-val { font-size: 18px; font-weight: 800; margin-top: 4px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          .table th { background: #087ea4; color: #fff; padding: 8px; font-size: 11px; text-align: left; }
          .table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin: 0; color: #087ea4;">PharmaCare Logistics</h1>
            <p style="margin: 2px 0 0; color: #64748b;">Delivery Partner Audit & Performance Report</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0;">${partnerData.name || 'Delivery Partner'}</h3>
            <p style="margin: 0; font-size: 11px; color: #64748b;">Phone: ${partnerData.phone || 'N/A'} | Date: ${generatedDate}</p>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Assigned Deliveries</div>
            <div class="card-val">${partnerData.assigned || 0}</div>
          </div>
          <div class="card">
            <div class="card-title">Successfully Delivered</div>
            <div class="card-val" style="color: #16a34a;">${partnerData.delivered || 0}</div>
          </div>
          <div class="card">
            <div class="card-title">SLA Success Rate</div>
            <div class="card-val" style="color: #0284c7;">${partnerData.successRate || '100%'}</div>
          </div>
          <div class="card">
            <div class="card-title">COD Cash Collected</div>
            <div class="card-val">₹${partnerData.codCollected || '0'}</div>
          </div>
          <div class="card">
            <div class="card-title">COD Settled to Bank</div>
            <div class="card-val" style="color: #16a34a;">₹${partnerData.codSettled || '0'}</div>
          </div>
          <div class="card">
            <div class="card-title">COD Pending (In-Hand)</div>
            <div class="card-val" style="color: #d97706;">₹${partnerData.codPending || '0'}</div>
          </div>
        </div>

        <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Assigned Delivery Log</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Avg Time</th>
            </tr>
          </thead>
          <tbody>
            ${(partnerData.orders || []).map(o => `
              <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customer}</td>
                <td>₹${o.amount}</td>
                <td>${o.method}</td>
                <td>${o.status}</td>
                <td>${o.time}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  printHTMLContent(html, `Delivery_Boy_${(partnerData.name || 'Driver').replace(/\s+/g, '_')}`);
}


