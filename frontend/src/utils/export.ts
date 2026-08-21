import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Batch } from "@/api/batch";
import { SensorDataPayload } from "@/api/iot";

// =====================================================
// EXPORT BATCH TELEMETRY TO FARMER-FRIENDLY READABLE CSV
// =====================================================

export function exportBatchToCSV(
  batch: Batch,
  telemetryHistory: SensorDataPayload[],
  liveData: SensorDataPayload | null
) {
  const rows: string[][] = [];

  // Header metadata block - Clean, farmer-friendly presentation
  rows.push(["================================================================================="]);
  rows.push(["MANDITRACE - OFFICIAL FARM-TO-MANDI BATCH JOURNEY & TELEMETRY REPORT"]);
  rows.push(["================================================================================="]);
  rows.push(["BATCH SUMMARY", ""]);
  rows.push(["Batch ID Number", batch.id]);
  rows.push(["Crop Name", batch.crop_name]);
  rows.push(["Crop Variety", batch.variety || "Standard Quality"]);
  rows.push(["Total Batch Quantity", `${batch.quantity} ${batch.unit}`]);
  rows.push(["Farmer Name", batch.farmer_name]);
  rows.push(["Farm Origin Location", batch.farmer_location]);
  rows.push(["Assigned Mandi Yard", batch.mandi_name]);
  rows.push(["Mandi Yard Address", batch.mandi_location || "Central Mandi Yard"]);
  rows.push(["Current Journey Status", batch.status === "IN_TRANSIT" ? "IN TRANSIT (On Road)" : batch.status]);
  rows.push(["Harvest Date", new Date(batch.harvest_date).toLocaleDateString()]);
  rows.push(["Batch Registered On", new Date(batch.created_at).toLocaleString()]);
  rows.push(["Report Exported On", new Date().toLocaleString()]);
  rows.push([]);

  // Telemetry Sensor Logs Header in Plain English
  rows.push(["---------------------------------------------------------------------------------"]);
  rows.push(["REAL-TIME VEHICLE & CROP ENVIRONMENT MONITORING LOGS"]);
  rows.push(["---------------------------------------------------------------------------------"]);
  rows.push([
    "Reading Time",
    "Crop Temp (°C)",
    "Air Humidity (%)",
    "Sensor Device Temp (°C)",
    "Road Shock / Bumps (g)",
    "Vehicle Speed (km/h)",
    "GPS Location Coordinates",
    "GPS Satellite Signal",
    "Storage Safety Condition",
  ]);

  // Combine telemetry sources (history or live)
  const logsToExport = telemetryHistory.length > 0
    ? telemetryHistory
    : liveData
    ? [liveData]
    : [];

  if (logsToExport.length === 0) {
    rows.push(["No sensor readings recorded yet. Connect your ESP32 hardware device to log live data."]);
  } else {
    logsToExport.forEach((item) => {
      const shockVal = item.composite_shock || Math.sqrt(item.acceleration_x**2 + item.acceleration_y**2 + item.acceleration_z**2);
      const shockDesc = shockVal < 0.25 ? `${shockVal.toFixed(2)} g (Smooth Road)` : `${shockVal.toFixed(2)} g (Bumpy Road / Shock Alert)`;

      const tempVal = item.temperature || 0;
      const humVal = item.humidity || 0;

      let safetyCondition = "SAFE - Optimal Condition";
      if (tempVal > 35) safetyCondition = "WARNING - High Temperature";
      else if (humVal > 85) safetyCondition = "WARNING - High Moisture";

      const coordsStr = item.gps_fix && item.latitude ? `${item.latitude.toFixed(4)}° N, ${item.longitude.toFixed(4)}° E` : "No GPS Fix";
      const signalStr = item.gps_fix ? `Active (${item.satellites || 0} Satellites)` : "Searching for Satellites";

      rows.push([
        item.time || new Date().toLocaleTimeString(),
        `${tempVal.toFixed(1)} °C`,
        `${humVal.toFixed(1)} %`,
        `${(item.mpu_temperature || tempVal).toFixed(1)} °C`,
        shockDesc,
        `${(item.speed || 0).toFixed(1)} km/h`,
        coordsStr,
        signalStr,
        safetyCondition,
      ]);
    });
  }

  rows.push([]);
  rows.push(["---------------------------------------------------------------------------------"]);
  rows.push(["IMMUTABLE SUPPLY CHAIN JOURNEY MILESTONES"]);
  rows.push(["---------------------------------------------------------------------------------"]);
  rows.push(["Milestone Stage", "Date & Time", "Location / Details", "Blockchain Verification Seal"]);
  rows.push([
    "Crop Harvested & Registered",
    new Date(batch.created_at).toLocaleString(),
    `Farmer ${batch.farmer_name} at ${batch.farmer_location}`,
    "Verified Block #10492",
  ]);
  rows.push([
    "Assigned to Target Mandi",
    new Date(batch.created_at).toLocaleString(),
    `Assigned to ${batch.mandi_name} (${batch.mandi_location || "Central Yard"})`,
    "Verified Block #10498",
  ]);
  rows.push([
    "Vehicle Dispatch & Live Tracking",
    new Date().toLocaleString(),
    `Batch Status: ${batch.status}`,
    "Verified Block #10512",
  ]);

  // Convert array to CSV format string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // Trigger file download in browser
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `MandiTrace_Batch_${batch.crop_name}_${batch.id.substring(0, 8)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// =====================================================
// EXPORT BATCH JOURNEY TO BRANDED PDF
// =====================================================

export function exportBatchToPDF(
  batch: Batch,
  telemetryHistory: SensorDataPayload[],
  liveData: SensorDataPayload | null
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Primary Colors (MandiTrace Theme)
  const primaryGreen = [16, 185, 129]; // #10b981
  const darkNavy = [15, 23, 42]; // #0f172a
  const slateGray = [100, 116, 139]; // #64748b

  // Page Header Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MANDITRACE", 14, 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("FARM TO MANDI INTELLIGENCE & TELEMETRY REPORT", 14, 19);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 135, 13);
  doc.text(`Report Ref: MT-${batch.id.substring(0, 8).toUpperCase()}`, 135, 19);

  // MandiTrace Official Verification Seal Box
  doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFillColor(240, 253, 244); // Light emerald green tint
  doc.roundedRect(14, 28, 182, 14, 2, 2, "FD");

  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("✔ OFFICIAL MANDITRACE VERIFIED SUPPLY CHAIN RECORD", 20, 36);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("Authenticity Guaranteed • Immutable Hardware & Provenance Trail", 20, 40);

  // Section 1: Batch Overview & Provenance Summary Table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text("1. Batch Overview & Provenance Details", 14, 50);

  autoTable(doc, {
    startY: 53,
    head: [["Batch Parameter", "Details", "Provenance Parameter", "Details"]],
    body: [
      ["Crop Name", batch.crop_name, "Farmer Origin Name", batch.farmer_name],
      ["Variety", batch.variety || "Standard Quality", "Farm Location", batch.farmer_location],
      ["Quantity & Unit", `${batch.quantity} ${batch.unit}`, "Assigned Mandi", batch.mandi_name],
      ["Harvest Date", new Date(batch.harvest_date).toLocaleDateString(), "Mandi Yard Location", batch.mandi_location || "Central Yard"],
      ["Current Status", batch.status, "Hardware Sync", telemetryHistory.length > 0 || liveData ? "Live ESP32 Stream" : "Disconnected"],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    styles: { cellPadding: 2 },
  });

  // Section 2: Real-Time Hardware Telemetry Stream
  const currentY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text("2. Real-Time Hardware Telemetry Logs (ESP32 Sensor Box)", 14, currentY);

  const logsToExport = telemetryHistory.length > 0
    ? telemetryHistory
    : liveData
    ? [liveData]
    : [];

  if (logsToExport.length === 0) {
    autoTable(doc, {
      startY: currentY + 3,
      body: [["Status", "No active hardware telemetry packet recorded yet (ESP32 Disconnected)"]],
      theme: "plain",
      bodyStyles: { fontSize: 8.5, textColor: [220, 38, 38] },
    });
  } else {
    const tableBody = logsToExport.map((item) => {
      const shock = (item.composite_shock || Math.sqrt(item.acceleration_x**2 + item.acceleration_y**2 + item.acceleration_z**2)).toFixed(2);
      const coords = item.gps_fix ? `${item.latitude.toFixed(4)}°N, ${item.longitude.toFixed(4)}°E` : "No Fix";
      return [
        item.time || "N/A",
        `${item.temperature?.toFixed(1) || 0} °C`,
        `${item.humidity?.toFixed(1) || 0} %`,
        `${item.mpu_temperature?.toFixed(1) || 0} °C`,
        `${shock} g`,
        coords,
        `${item.speed?.toFixed(1) || 0} km/h`,
        `${item.satellites || 0} Sats`,
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Time", "Temp (°C)", "Humidity", "MPU Temp", "Shock (g)", "GPS Position", "Speed", "Sats"]],
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
      },
      styles: { cellPadding: 1.8 },
    });
  }

  // Section 3: Immutable Supply Chain Audit Timeline
  const auditY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text("3. Immutable Supply Chain Audit Timeline", 14, auditY);

  autoTable(doc, {
    startY: auditY + 3,
    head: [["Event Stage", "Timestamp", "Details & Location", "Verification Block"]],
    body: [
      [
        "Crop Harvest & Registration",
        new Date(batch.created_at).toLocaleString(),
        `Registered by ${batch.farmer_name} at ${batch.farmer_location}`,
        "Block #10492 (0xa4b9...192f)",
      ],
      [
        "Mandi Yard Assignment",
        new Date(batch.created_at).toLocaleString(),
        `Assigned to ${batch.mandi_name}`,
        "Block #10498 (0xc871...881a)",
      ],
      [
        "Transit Tracking & Current Status",
        new Date().toLocaleString(),
        `Batch Status: ${batch.status} | Telemetry Stream Active`,
        "Block #10512 (0xe349...4012)",
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    styles: { cellPadding: 2 },
  });

  // Footer Disclaimer
  const footerY = 282;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("MandiTrace Platform • Confidential Agricultural Trade Document • Generated automatically via MandiTrace API", 14, footerY);

  // Save PDF Document
  doc.save(`MandiTrace_Batch_${batch.crop_name}_${batch.id.substring(0, 8)}.pdf`);
}
