import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consignment, ownSlabs } from "@/drizzle/schema";
import { extractInventoryData } from "@/lib/geminiExtraction";
import { determineTargetTable } from "@/types/inventory";
import { join } from "path";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileUrl, fileType, csvUrl, extractedData: preExtractedData } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileUrl" },
        { status: 400 }
      );
    }

    // Construct file path from fileUrl
    const filePath = join(process.cwd(), "public", fileUrl);

    let extractedData;

    // Use pre-extracted data if provided, otherwise extract from file
    if (preExtractedData && preExtractedData.items && preExtractedData.items.length > 0) {
      console.log("📋 Using pre-extracted data from client");
      extractedData = preExtractedData;
    } else {
      // Extract data using Gemini
      console.log("🔄 Extracting data from file...");
      const extractionResult = await extractInventoryData(filePath, fileType || "");

      // Check if extraction failed
      if (!extractionResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: extractionResult.error,
            errorCode: extractionResult.errorCode,
            errorDetails: extractionResult.details,
          },
          { status: 422 }
        );
      }

      extractedData = extractionResult.data;
    }

    // Determine which table to use based on extracted data
    const targetTable = determineTargetTable(extractedData);
    console.log(`📊 Target table: ${targetTable} (transferNumber: ${extractedData.transferNumber || 'none'}, invoiceNumber: ${extractedData.invoiceNumber || 'none'})`);

    // Insert items into the appropriate database table
    const insertedItems = [];
    for (const item of extractedData.items) {
      try {
        // Base values shared by both tables
        const baseValues: any = {
          // Vendor/Supplier information
          vendorName: extractedData.vendorName,
          vendorAddress: extractedData.vendorAddress,
          vendorPhone: extractedData.vendorPhone,
          vendorFax: extractedData.vendorFax,
          // Destination information
          transferredTo: extractedData.transferredTo,
          destinationAddress: extractedData.destinationAddress,
          destinationPhone: extractedData.destinationPhone,
          destinationEmail: extractedData.destinationEmail,
          // Shipping information
          reqShipDate: extractedData.reqShipDate,
          deliveryMethod: extractedData.deliveryMethod,
          shipmentTerms: extractedData.shipmentTerms,
          freightCarrier: extractedData.freightCarrier,
          weight: extractedData.weight,
          // Item details
          itemCode: item.itemCode,
          itemName: item.itemName,
          slabName: item.slabName,
          serialNum: item.serialNum,
          barcode: item.barcode,
          bundle: item.bundle,
          slabNumber: item.slabNumber,
          block: item.block,
          bin: item.bin,
          quantity: item.quantity,
          quantitySf: item.quantitySf !== undefined ? item.quantitySf.toString() : undefined,
          quantitySlabs: item.quantitySlabs,
          unitPrice: item.unitPrice !== undefined ? item.unitPrice.toString() : undefined,
          totalPrice: item.totalPrice !== undefined ? item.totalPrice.toString() : undefined,
          sourceImageUrl: fileUrl,
        };

        // Remove undefined values to avoid database errors
        Object.keys(baseValues).forEach(key => {
          if (baseValues[key] === undefined) {
            delete baseValues[key];
          }
        });

        let inserted;
        if (targetTable === 'consignment') {
          // Add consignment-specific fields
          const consignmentValues = {
            ...baseValues,
            transferNumber: extractedData.transferNumber,
            transferDate: extractedData.transferDate,
          };
          [inserted] = await db
            .insert(consignment)
            .values(consignmentValues)
            .returning();
        } else {
          // Add own_slabs-specific fields
          const ownSlabsValues = {
            ...baseValues,
            invoiceNumber: extractedData.invoiceNumber,
            invoiceDate: extractedData.invoiceDate,
            purchaseDate: extractedData.purchaseDate,
          };
          [inserted] = await db
            .insert(ownSlabs)
            .values(ownSlabsValues)
            .returning();
        }

        insertedItems.push(inserted);
      } catch (insertError: any) {
        console.error(`Error inserting item:`, insertError);
        console.error(`Item data:`, JSON.stringify(item, null, 2));
        // Continue with other items even if one fails
      }
    }

    // Clean up uploaded file and CSV after successful processing
    if (insertedItems.length > 0) {
      // Delete uploaded file
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log(`🗑️ Cleaned up uploaded file: ${filePath}`);
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to clean up uploaded file: ${filePath}`, cleanupError);
        // Don't fail the request if cleanup fails
      }

      // Delete CSV file if it exists
      if (csvUrl) {
        try {
          const csvPath = join(process.cwd(), "public", csvUrl);
          if (existsSync(csvPath)) {
            await unlink(csvPath);
            console.log(`🗑️ Cleaned up CSV file: ${csvPath}`);
          }
        } catch (cleanupError) {
          console.warn(`⚠️ Failed to clean up CSV file: ${csvUrl}`, cleanupError);
          // Don't fail the request if cleanup fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      items: insertedItems,
      extractedData,
      targetTable,
    });
  } catch (error) {
    console.error("Process upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
