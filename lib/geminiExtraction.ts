import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { ExtractedInventoryData, ExtractionResult } from "@/types/inventory";
import { readFileSync, existsSync, statSync } from "fs";

// Zod schema for inventory item extraction
const InventoryItemSchema = z.object({
  serialNum: z.string().nullable().describe("Serial number (e.g., '11333-1', '11333-2')"),
  barcode: z.string().nullable().describe("Barcode/ES number (e.g., 'ES91820575')"),
  bundle: z.string().nullable().describe("Bundle info (e.g., '1/15', '2/15')"),
  block: z.string().nullable().describe("Block identifier (e.g., 'D-10138')"),
  slabNumber: z.string().nullable().describe("Slab dimensions or number (e.g., '38\" X 79\" = 75.71\"')"),
  description: z.string().nullable().describe("Material/item description (e.g., 'Calacatta Umi MQ 3CM')"),
  quantity: z.string().nullable().describe("Full quantity string as shown"),
  quantitySf: z.number().nullable().describe("Numeric square feet value only"),
  quantitySlabs: z.number().nullable().describe("Numeric slab count only"),
  itemCode: z.string().nullable().describe("Item code/SKU if shown"),
  itemName: z.string().nullable().describe("Item name if different from description"),
  bin: z.string().nullable().describe("Bin/location if shown"),
  unitPrice: z.number().nullable().describe("Unit price (number only)"),
  totalPrice: z.number().nullable().describe("Total price (number only)"),
});

const ExtractionSchema = z.object({
  transferNumber: z.string().nullable().describe("Document/transfer/order number"),
  transferDate: z.string().nullable().describe("Date on the document"),
  vendorName: z.string().nullable().describe("Vendor/supplier company or person name"),
  vendorAddress: z.string().nullable().describe("Full vendor address"),
  vendorPhone: z.string().nullable().describe("Vendor phone number"),
  vendorFax: z.string().nullable().describe("Vendor fax number"),
  transferredTo: z.string().nullable().describe("Destination company/person name"),
  destinationAddress: z.string().nullable().describe("Full destination address"),
  destinationPhone: z.string().nullable().describe("Destination phone"),
  destinationEmail: z.string().nullable().describe("Destination email"),
  reqShipDate: z.string().nullable().describe("Required/requested ship date"),
  deliveryMethod: z.string().nullable().describe("How it will be delivered"),
  shipmentTerms: z.string().nullable().describe("Shipping terms"),
  freightCarrier: z.string().nullable().describe("Carrier/shipper name"),
  weight: z.string().nullable().describe("Total weight"),
  invoiceNumber: z.string().nullable().describe("Invoice number if shown"),
  items: z.array(InventoryItemSchema).describe("All items/rows from the document table"),
});

type ExtractedData = z.infer<typeof ExtractionSchema>;

// Lazy initialization of the Google AI provider
let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getGoogleProvider() {
  if (!googleProvider) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }

    googleProvider = createGoogleGenerativeAI({
      apiKey,
    });

    console.log("✅ Google AI provider initialized");
  }
  return googleProvider;
}

/**
 * Get MIME type from file type string
 */
function getMimeType(fileType: string): "application/pdf" | "image/png" | "image/jpeg" {
  if (fileType.includes("pdf")) return "application/pdf";
  if (fileType.includes("png")) return "image/png";
  if (fileType.includes("jpeg") || fileType.includes("jpg")) return "image/jpeg";
  return "application/pdf"; // default
}

/**
 * Convert null values to undefined for our schema
 */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Extraction prompt for the AI model
 */
const EXTRACTION_PROMPT = `You are a document extraction specialist. Analyze this document (PDF or image) and extract ALL visible data exactly as it appears.

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of text, number, and data EXACTLY as displayed
2. For tables: extract EVERY ROW - do not skip any rows
3. Keep exact number formatting (commas, decimals, units)
4. If a field is not present in the document, use null

Look for and extract these fields:

HEADER/DOCUMENT INFO:
- transferNumber: Document/transfer/order number (look for "Transfer#", "Order#", "Document#", etc.)
- transferDate: Date on the document
- invoiceNumber: Invoice number if shown

VENDOR/FROM SECTION (look for "From:", "Transferred From:", "Vendor:", "Supplier:"):
- vendorName: Company or person name
- vendorAddress: Full address
- vendorPhone: Phone number (may have "P:" or "Phone:" prefix)
- vendorFax: Fax number (may have "F:" or "Fax:" prefix)

DESTINATION/TO SECTION (look for "To:", "Transferred To:", "Ship To:", "Deliver To:"):
- transferredTo: Destination company/person name
- destinationAddress: Full destination address
- destinationPhone: Destination phone
- destinationEmail: Destination email

SHIPPING INFO:
- reqShipDate: Required/requested ship date
- deliveryMethod: How it will be delivered
- shipmentTerms: Shipping terms
- freightCarrier: Carrier/shipper name
- weight: Total weight

ITEMS TABLE - THIS IS THE MOST IMPORTANT PART:
Extract EVERY row from the items table. For each item/row, capture all available fields including serialNum, barcode, bundle, block, slabNumber, description, quantity, quantitySf, quantitySlabs, itemCode, itemName, bin, unitPrice, totalPrice.

IMPORTANT:
- Extract ALL items/rows from tables - count them and make sure you have every one
- Use null for missing fields`;

/**
 * Extract inventory data using Gemini 2.5 Flash with Vercel AI SDK generateObject
 */
export async function extractWithGemini(
  filePath: string,
  fileType: string
): Promise<ExtractionResult> {
  try {
    console.log(`🤖 Starting Gemini extraction with AI SDK for: ${filePath}`);
    console.log(`📄 File type: ${fileType}`);

    // Check if file exists
    if (!existsSync(filePath)) {
      return {
        success: false,
        data: { items: [] },
        error: `File not found: ${filePath}`,
        errorCode: "FILE_UPLOAD_FAILED",
      };
    }

    const mimeType = getMimeType(fileType);
    const fileStats = statSync(filePath);
    const fileSizeKB = Math.round(fileStats.size / 1024);

    console.log(`📦 File size: ${fileSizeKB} KB, MIME type: ${mimeType}`);

    // Read file and convert to base64
    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    console.log(`📤 File loaded (${base64Data.length} base64 characters)`);

    // Get the AI provider
    let provider;
    try {
      provider = getGoogleProvider();
    } catch (error: any) {
      return {
        success: false,
        data: { items: [] },
        error: error.message,
        errorCode: "API_KEY_MISSING",
      };
    }

    console.log(`🚀 Calling Gemini 2.5 Flash via Vercel AI Gateway with generateObject...`);

    // Use generateObject for structured output
    const { object: extractedData } = await generateObject({
      model: provider("gemini-2.5-flash"),
      schema: ExtractionSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            {
              type: "file",
              data: `data:${mimeType};base64,${base64Data}`,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    console.log(`✅ Gemini response received via generateObject`);
    console.log(`📋 Extracted header data:`, {
      transferNumber: extractedData.transferNumber,
      transferDate: extractedData.transferDate,
      vendorName: extractedData.vendorName,
      transferredTo: extractedData.transferredTo,
      itemCount: extractedData.items?.length || 0,
    });

    // Transform the response to match our schema (convert null to undefined)
    const result: ExtractedInventoryData = {
      transferNumber: nullToUndefined(extractedData.transferNumber),
      transferDate: nullToUndefined(extractedData.transferDate),
      vendorName: nullToUndefined(extractedData.vendorName),
      vendorAddress: nullToUndefined(extractedData.vendorAddress),
      vendorPhone: nullToUndefined(extractedData.vendorPhone),
      vendorFax: nullToUndefined(extractedData.vendorFax),
      transferredTo: nullToUndefined(extractedData.transferredTo),
      destinationAddress: nullToUndefined(extractedData.destinationAddress),
      destinationPhone: nullToUndefined(extractedData.destinationPhone),
      destinationEmail: nullToUndefined(extractedData.destinationEmail),
      reqShipDate: nullToUndefined(extractedData.reqShipDate),
      deliveryMethod: nullToUndefined(extractedData.deliveryMethod),
      shipmentTerms: nullToUndefined(extractedData.shipmentTerms),
      freightCarrier: nullToUndefined(extractedData.freightCarrier),
      weight: nullToUndefined(extractedData.weight),
      invoiceNumber: nullToUndefined(extractedData.invoiceNumber),
      items: (extractedData.items || []).map((item) => ({
        itemCode: nullToUndefined(item.itemCode),
        itemName: nullToUndefined(item.itemName),
        description: nullToUndefined(item.description),
        serialNum: nullToUndefined(item.serialNum),
        barcode: nullToUndefined(item.barcode),
        bundle: nullToUndefined(item.bundle),
        slabNumber: nullToUndefined(item.slabNumber),
        block: nullToUndefined(item.block),
        bin: nullToUndefined(item.bin),
        quantity: nullToUndefined(item.quantity),
        quantitySf: nullToUndefined(item.quantitySf),
        quantitySlabs: nullToUndefined(item.quantitySlabs),
        unitPrice: nullToUndefined(item.unitPrice),
        totalPrice: nullToUndefined(item.totalPrice),
      })),
    };

    console.log(`✅ Gemini extraction complete: ${result.items.length} items extracted`);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error(`❌ Gemini extraction error:`, error);
    console.error(`Error message:`, error.message);

    // Check for common error types
    const errorMessage = error.message || "Unknown error";

    if (errorMessage.includes("API key") || errorMessage.includes("401")) {
      return {
        success: false,
        data: { items: [] },
        error: "Invalid or missing API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY.",
        errorCode: "API_KEY_MISSING",
        details: errorMessage,
      };
    }

    if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return {
        success: false,
        data: { items: [] },
        error: "API quota exceeded or rate limited. Please try again later.",
        errorCode: "API_ERROR",
        details: errorMessage,
      };
    }

    return {
      success: false,
      data: { items: [] },
      error: `Extraction failed: ${errorMessage}`,
      errorCode: "UNKNOWN",
      details: error.stack,
    };
  }
}

/**
 * Extract inventory data - main entry point
 * Uses Gemini 2.5 Flash with Vercel AI SDK generateObject
 */
export async function extractInventoryData(
  filePath: string,
  fileType: string
): Promise<ExtractionResult> {
  console.log(`📁 Starting Gemini extraction for: ${filePath}`);
  console.log(`📄 File type: ${fileType}`);

  // Gemini handles both PDFs and images
  const supportedTypes = ["pdf", "jpeg", "jpg", "png", "image"];
  const isSupported = supportedTypes.some((type) => fileType.toLowerCase().includes(type));

  if (!isSupported) {
    console.warn(`⚠️ Unsupported file type: ${fileType}. Only PDF, JPEG, and PNG are supported.`);
    return {
      success: false,
      data: { items: [] },
      error: `Unsupported file type: ${fileType}. Only PDF, JPEG, and PNG are supported.`,
      errorCode: "UNSUPPORTED_FILE",
    };
  }

  return extractWithGemini(filePath, fileType);
}

// Alias for backward compatibility
export const extractInventoryDataWithGemini = extractInventoryData;
