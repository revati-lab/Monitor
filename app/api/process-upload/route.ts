import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryItems, fileUploads } from "@/drizzle/schema";
import { extractInventoryData } from "@/lib/geminiExtraction";
import { eq } from "drizzle-orm";
import { join } from "path";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileUrl, fileType } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileUrl" },
        { status: 400 }
      );
    }

    // Construct file path from fileUrl
    const filePath = join(process.cwd(), "public", fileUrl);

    // Extract data using Gemini
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

    const extractedData = extractionResult.data;

    // Insert items into database
    const insertedItems = [];
    for (const item of extractedData.items) {
      try {
        // Prepare values with all PDF fields
        const values: any = {
          // Transfer/Receiving Worksheet fields
          transferNumber: extractedData.transferNumber,
          transferDate: extractedData.transferDate,
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
          description: item.description,
          serialNum: item.serialNum,
          barcode: item.barcode,
          bundle: item.bundle,
          slabNumber: item.slabNumber,
          block: item.block,
          bin: item.bin,
          quantity: item.quantity,
          quantitySf: item.quantitySf !== undefined ? item.quantitySf.toString() : undefined,
          quantitySlabs: item.quantitySlabs,
          // Legacy fields
          invoiceNumber: extractedData.invoiceNumber,
          unitPrice: item.unitPrice !== undefined ? item.unitPrice.toString() : undefined,
          totalPrice: item.totalPrice !== undefined ? item.totalPrice.toString() : undefined,
          sourceImageUrl: fileUrl,
          extractedData: extractedData as any,
        };

        // Remove undefined values to avoid database errors
        Object.keys(values).forEach(key => {
          if (values[key] === undefined) {
            delete values[key];
          }
        });

        const [inserted] = await db
          .insert(inventoryItems)
          .values(values)
          .returning();

        insertedItems.push(inserted);
      } catch (insertError: any) {
        console.error(`Error inserting item:`, insertError);
        console.error(`Item data:`, JSON.stringify(item, null, 2));
        // Continue with other items even if one fails
      }
    }

    // Mark file upload as processed
    await db
      .update(fileUploads)
      .set({ processed: new Date() })
      .where(eq(fileUploads.fileUrl, fileUrl));

    // Clean up the uploaded file after successful processing
    if (insertedItems.length > 0) {
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log(`🗑️ Cleaned up uploaded file: ${filePath}`);
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to clean up uploaded file: ${filePath}`, cleanupError);
        // Don't fail the request if cleanup fails
      }
    }

    return NextResponse.json({
      success: true,
      items: insertedItems,
      extractedData,
    });
  } catch (error) {
    console.error("Process upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
