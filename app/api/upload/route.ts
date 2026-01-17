import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { extractInventoryData } from "@/lib/geminiExtraction";

/**
 * Convert extracted data to CSV format
 */
function convertToCSV(extractedData: any): string {
  const rows: string[] = [];

  // CSV Headers
  const headers = [
    "Transfer Number",
    "Transfer Date",
    "Vendor Name",
    "Vendor Address",
    "Vendor Phone",
    "Vendor Fax",
    "Transferred To",
    "Destination Address",
    "Destination Phone",
    "Destination Email",
    "Req Ship Date",
    "Delivery Method",
    "Shipment Terms",
    "Freight Carrier",
    "Weight",
    "Invoice Number",
    "Serial Num",
    "Barcode",
    "Bundle",
    "Block",
    "Slab Number",
    "Description",
    "Quantity",
    "Quantity SF",
    "Quantity Slabs",
    "Item Code",
    "Item Name",
    "Bin",
    "Unit Price",
    "Total Price",
  ];

  rows.push(headers.join(","));

  // Helper to escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // If no items, create a single row with header data
  if (!extractedData.items || extractedData.items.length === 0) {
    const row = [
      escapeCSV(extractedData.transferNumber),
      escapeCSV(extractedData.transferDate),
      escapeCSV(extractedData.vendorName),
      escapeCSV(extractedData.vendorAddress),
      escapeCSV(extractedData.vendorPhone),
      escapeCSV(extractedData.vendorFax),
      escapeCSV(extractedData.transferredTo),
      escapeCSV(extractedData.destinationAddress),
      escapeCSV(extractedData.destinationPhone),
      escapeCSV(extractedData.destinationEmail),
      escapeCSV(extractedData.reqShipDate),
      escapeCSV(extractedData.deliveryMethod),
      escapeCSV(extractedData.shipmentTerms),
      escapeCSV(extractedData.freightCarrier),
      escapeCSV(extractedData.weight),
      escapeCSV(extractedData.invoiceNumber),
      "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    ];
    rows.push(row.join(","));
  } else {
    // Create a row for each item
    for (const item of extractedData.items) {
      const row = [
        escapeCSV(extractedData.transferNumber),
        escapeCSV(extractedData.transferDate),
        escapeCSV(extractedData.vendorName),
        escapeCSV(extractedData.vendorAddress),
        escapeCSV(extractedData.vendorPhone),
        escapeCSV(extractedData.vendorFax),
        escapeCSV(extractedData.transferredTo),
        escapeCSV(extractedData.destinationAddress),
        escapeCSV(extractedData.destinationPhone),
        escapeCSV(extractedData.destinationEmail),
        escapeCSV(extractedData.reqShipDate),
        escapeCSV(extractedData.deliveryMethod),
        escapeCSV(extractedData.shipmentTerms),
        escapeCSV(extractedData.freightCarrier),
        escapeCSV(extractedData.weight),
        escapeCSV(extractedData.invoiceNumber),
        escapeCSV(item.serialNum),
        escapeCSV(item.barcode),
        escapeCSV(item.bundle),
        escapeCSV(item.block),
        escapeCSV(item.slabNumber),
        escapeCSV(item.description),
        escapeCSV(item.quantity),
        escapeCSV(item.quantitySf),
        escapeCSV(item.quantitySlabs),
        escapeCSV(item.itemCode),
        escapeCSV(item.itemName),
        escapeCSV(item.bin),
        escapeCSV(item.unitPrice),
        escapeCSV(item.totalPrice),
      ];
      rows.push(row.join(","));
    }
  }

  return rows.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and PDF are allowed." },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Ensure exports directory exists
    const exportsDir = join(process.cwd(), "public", "exports");
    if (!existsSync(exportsDir)) {
      await mkdir(exportsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${originalName}`;
    const filePath = join(uploadsDir, fileName);

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    // Extract data using Gemini
    let extractedData = null;
    let csvUrl = null;
    let extractionError = null;
    let extractionErrorCode = null;
    let extractionDetails = null;

    console.log(`Processing file: ${originalName} (${file.type})`);
    const extractionResult = await extractInventoryData(filePath, file.type);

    if (!extractionResult.success) {
      // Extraction failed - capture error details
      extractionError = extractionResult.error;
      extractionErrorCode = extractionResult.errorCode;
      extractionDetails = extractionResult.details;
      console.error(`❌ Extraction failed: ${extractionError}`);
      console.error(`Error code: ${extractionErrorCode}`);
      if (extractionDetails) {
        console.error(`Details: ${extractionDetails}`);
      }
      extractedData = extractionResult.data; // Will have empty items
    } else {
      // Extraction succeeded
      extractedData = extractionResult.data;
      console.log(`✅ Extracted ${extractedData.items.length} items from file`);
      console.log(`Extracted data:`, JSON.stringify(extractedData, null, 2));

      // Convert to CSV
      const csvContent = convertToCSV(extractedData);

      // Save CSV file
      const csvFileName = `${timestamp}-${originalName.replace(/\.[^.]+$/, "")}.csv`;
      const csvPath = join(exportsDir, csvFileName);
      await writeFile(csvPath, csvContent, "utf-8");

      csvUrl = `/exports/${csvFileName}`;
      console.log(`✅ CSV saved to: ${csvPath}`);
      console.log(`📊 CSV URL: ${csvUrl}`);
    }

    // Return response with detailed error info if extraction failed
    return NextResponse.json({
      success: extractionResult.success,
      fileName: originalName,
      fileUrl,
      fileType: file.type,
      fileSize: file.size,
      csvUrl,
      itemsCount: extractedData?.items?.length || 0,
      extractedData,
      // Error information
      error: extractionError,
      errorCode: extractionErrorCode,
      errorDetails: extractionDetails,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error.message },
      { status: 500 }
    );
  }
}
