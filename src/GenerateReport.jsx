import React, { useEffect, useState } from "react";
import "./GenerateReport.css";
import { fetchAdminReport } from "./lib/store";
import { generateMedicineReportPDF } from "./lib/pdfGenerator";

export default function GenerateReport() {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    async function initialLoad() {
      setGenerating(true);
      try {
        const data = await fetchAdminReport({
          reportType,
          dateRange,
          startDate,
          endDate,
          format,
        });
        setReportData(data);
      } catch (error) {
        console.error("Report load failed:", error);
      } finally {
        setGenerating(false);
      }
    }

    initialLoad();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const data = await fetchAdminReport({
        reportType,
        dateRange,
        startDate,
        endDate,
        format,
      });
      setReportData(data);
    } catch (error) {
      console.error("Report load failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  const exportRows = () => {
    if (!reportData?.rows?.length) return;

    const title = reportData?.title || "Pharmacy Report";
    const headers = Object.keys(reportData.rows[0]);
    const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      headers.join(","),
      ...reportData.rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
    ].join("\n");

    if (format === "pdf") {
      const formattedMeds = reportData.rows.map((row, idx) => ({
        id: row.orderId || row.id || idx + 1,
        name: row.medicine || row.name || row.customer || "Item",
        category: row.category || "General",
        price: row.revenue || row.total || row.price || 0,
        discount: 0,
        stock: row.stock !== undefined ? row.stock : (row.orders || 1),
      }));
      generateMedicineReportPDF(formattedMeds, title);
      return;
    }

    let blob;
    let extension;

    if (format === "excel") {
      blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      extension = "csv";
    } else {
      blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      extension = "json";
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportData.title.toLowerCase().replace(/\s+/g, "_")}_${new Date()
      .toISOString()
      .slice(0, 10)}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>Report Generator</h1>
        <p>Select report criteria and click generate to review data before export.</p>
      </div>

      <div className="report-card">
        <h2>Report Options</h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="sales">Sales & Revenue</option>
              <option value="inventory">Inventory & Stock</option>
              <option value="orders">Orders History</option>
              <option value="customers">Customers Summary</option>
              <option value="expiry">Medicine Expiry Alert</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date Range</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="quarterly">This Quarter</option>
              <option value="yearly">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === "custom" && (
            <>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="pdf">PDF (Printable)</option>
              <option value="excel">Excel (CSV)</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? "Loading..." : "Generate Preview"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={exportRows}
            disabled={!reportData?.rows?.length}
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="report-card">
        <h2>Report Preview</h2>
        {reportData ? (
          <div>
            <p className="preview-meta">
              Showing {reportData.totalRecords} records for {reportData.title} ({reportData.dateRange})
            </p>

            {reportData.rows?.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className="report-table">
                  <thead>
                    <tr>
                      {Object.keys(reportData.rows[0]).map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((row, index) => (
                      <tr key={index}>
                        {Object.keys(row).map((header) => (
                          <td key={header}>{String(row[header] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No records found for the selected filter.</p>
            )}
          </div>
        ) : (
          <p>Click "Generate Preview" to inspect the report table before downloading.</p>
        )}
      </div>
    </div>
  );
}
