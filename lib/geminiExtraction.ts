import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { ExtractedInventoryData, ExtractionResult } from "@/types/inventory";
import { readFileSync, existsSync, statSync } from "fs";

// Performance timing utility
const perf = {
  start: () => process.hrtime.bigint(),
  end: (start: bigint) => {
    const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // Convert to ms
    return elapsed < 1000 ? `${elapsed.toFixed(2)}ms` : `${(elapsed / 1000).toFixed(2)}s`;
  },
};

// Zod schema for inventory item extraction
const InventoryItemSchema = z.object({
  serialNum: z.string().nullable().describe("Serial number (e.g., '11333-1', '11333-2')"),
  barcode: z.string().nullable().describe("Barcode/ES number (e.g., 'ES91820575')"),
  bundle: z.string().nullable().describe("Bundle info (e.g., '1/15', '2/15')"),
  block: z.string().nullable().describe("Block identifier (e.g., 'D-10138')"),
  slabNumber: z.string().nullable().describe("Slab dimensions or number (e.g., '38\" X 79\" = 75.71\"')"),
  slabName: z.string().nullable().describe("Slab/material name or description (e.g., 'Calacatta Umi MQ 3CM', 'White Marble')"),
  quantity: z.string().nullable().describe("EXACT quantity text as displayed in the document - preserve all formatting, dimensions, units, quotes, and special characters exactly as shown (e.g., '138\" X 79\" = 75.71', '1,135.65 SF (15 Slabs)')"),
  quantitySf: z.number().nullable().describe("Numeric square feet value only - extract just the number"),
  quantitySlabs: z.number().nullable().describe("Numeric slab count only - extract just the number"),
  itemCode: z.string().nullable().describe("Item code/SKU if shown"),
  itemName: z.string().nullable().describe("Item name if different from slab name"),
  bin: z.string().nullable().describe("Bin/location if shown"),
  unitPrice: z.number().nullable().describe("Unit price (number only)"),
  totalPrice: z.number().nullable().describe("Total price (number only)"),
});

// Schema for document validation - checks if document contains natural stone data
const ValidationSchema = z.object({
  isNaturalStoneDocument: z.boolean().describe("True if the document contains natural stone materials data (marble, granite, quartz, quartzite, onyx, travertine, limestone, slate, sandstone, soapstone, or other natural stone slabs/tiles). Look for stone names, slab dimensions, SF measurements, bundle numbers, block numbers, or stone-related terminology."),
  confidence: z.number().min(0).max(100).describe("Confidence level (0-100) that this is a natural stone inventory/packing/invoice document"),
  documentType: z.string().nullable().describe("Type of document detected: 'packing_list', 'invoice', 'transfer_worksheet', 'inventory_list', 'quote', or 'unknown'"),
  rejectionReason: z.string().nullable().describe("If not a natural stone document, explain what type of document it appears to be"),
});

const ExtractionSchema = z.object({
  // IMPORTANT: Only ONE of transferNumber or invoiceNumber should be populated
  transferNumber: z.string().nullable().describe("Transfer number ONLY - use this ONLY for consignment/transfer/receiving worksheet documents. Look for labels like 'Transfer #', 'Transfer Number', 'Receiving Worksheet'. Do NOT use for invoices."),
  transferDate: z.string().nullable().describe("Transfer date - only if this is a transfer/consignment document"),
  invoiceNumber: z.string().nullable().describe("Invoice number ONLY - use this for invoice/purchase/sales documents. Look for labels like 'Invoice #', 'Invoice Number', 'Invoice No', 'Bill Number'. Do NOT use for transfer documents."),
  invoiceDate: z.string().nullable().describe("Invoice date - only if this is an invoice document"),
  purchaseDate: z.string().nullable().describe("Purchase date - only if this is an invoice/purchase document"),
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
 * Validation prompt - checks if document contains natural stone materials
 */
const VALIDATION_PROMPT = `Analyze this document and determine if it contains NATURAL STONE materials data.

NATURAL STONE includes: marble, granite, quartz, quartzite, onyx, travertine, limestone, slate, sandstone, soapstone, porcelain slabs, sintered stone, or any other natural/engineered stone slabs or tiles.

Look for indicators like:
- Stone material names (e.g., "Calacatta", "Carrara", "White Marble", "Black Granite", "Quartzite")
- Slab dimensions (e.g., '138" X 79"', '300cm x 150cm')
- Square footage (SF) measurements
- Bundle/block numbers
- Serial numbers for slabs
- Packing lists, invoices, or inventory lists mentioning stone products

Return your analysis with confidence level.`;

/**
 * Optimized extraction prompt - concise for faster processing
 */
const EXTRACTION_PROMPT = `Extract ALL data from this document exactly as displayed.

DOCUMENT TYPE DETECTION (IMPORTANT):
- If document has "Invoice", "Invoice #", "Invoice Number", "Bill", "Sales Order", or shows pricing/totals → Use invoiceNumber, invoiceDate, purchaseDate
- If document has "Transfer", "Transfer #", "Receiving Worksheet", "Consignment", "Packing List" → Use transferNumber, transferDate
- Only populate ONE type: either invoiceNumber OR transferNumber, not both

RULES:
- Extract EVERY table row - do not skip any
- Keep exact formatting (commas, decimals, units, quotes)
- Use null for missing fields
- quantity field: preserve EXACT text with dimensions (e.g., '138" X 79" = 75.71')
- quantitySf/quantitySlabs: numeric values only

Extract: transferNumber, transferDate, invoiceNumber, invoiceDate, purchaseDate, vendorName, vendorAddress, vendorPhone, vendorFax, transferredTo, destinationAddress, destinationPhone, destinationEmail, reqShipDate, deliveryMethod, shipmentTerms, freightCarrier, weight, and ALL items with their fields.`;

/**
 * Validate if document contains natural stone materials data
 */
async function validateNaturalStoneDocument(
  base64Data: string,
  mimeType: "application/pdf" | "image/png" | "image/jpeg"
): Promise<{ isValid: boolean; reason?: string; documentType?: string }> {
  const validationStart = perf.start();

  try {
    const provider = getGoogleProvider();

    console.log(`🔍 Validating document content...`);

    const { object: validation } = await generateObject({
      model: provider("gemini-2.5-flash"),
      schema: ValidationSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VALIDATION_PROMPT },
            {
              type: "file",
              data: `data:${mimeType};base64,${base64Data}`,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    console.log(`✅ Validation complete in ${perf.end(validationStart)}:`, {
      isNaturalStone: validation.isNaturalStoneDocument,
      confidence: validation.confidence,
      documentType: validation.documentType,
    });

    // Require high confidence (70%+) for natural stone documents
    if (validation.isNaturalStoneDocument && validation.confidence >= 70) {
      return {
        isValid: true,
        documentType: validation.documentType || undefined,
      };
    }

    return {
      isValid: false,
      reason: validation.rejectionReason ||
        `This document does not appear to contain natural stone materials data (confidence: ${validation.confidence}%). Please upload a packing list, invoice, or inventory document for natural stone slabs.`,
      documentType: validation.documentType || undefined,
    };
  } catch (error: any) {
    console.error(`❌ Validation error:`, error.message);
    // On validation error, allow through but log it
    return { isValid: true, reason: "Validation skipped due to error" };
  }
}

/**
 * Extract inventory data using Gemini 2.0 Flash with Vercel AI SDK generateObject
 * Optimized for speed with concise prompts and fast model
 */
export async function extractWithGemini(
  filePath: string,
  fileType: string
): Promise<ExtractionResult> {
  const totalStart = perf.start();

  try {
    console.log(`🤖 Starting optimized Gemini extraction for: ${filePath}`);

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

    // Read file and convert to base64
    const fileLoadStart = perf.start();
    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");
    console.log(`📤 File loaded (${fileSizeKB}KB) in ${perf.end(fileLoadStart)}`);

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

    // Step 1: Validate that document contains natural stone materials
    const validation = await validateNaturalStoneDocument(base64Data, mimeType);
    if (!validation.isValid) {
      console.log(`❌ Document rejected: ${validation.reason}`);
      return {
        success: false,
        data: { items: [] },
        error: validation.reason || "This document does not contain natural stone materials data.",
        errorCode: "INVALID_CONTENT",
        details: `Document type detected: ${validation.documentType || "unknown"}. Only natural stone (marble, granite, quartz, quartzite, etc.) packing lists, invoices, and inventory documents are accepted.`,
      };
    }

    console.log(`✅ Document validated as natural stone content`);
    console.log(`🚀 Calling Gemini 2.5 Flash (optimized for speed)...`);
    const apiStart = perf.start();

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

    console.log(`⚡ Gemini 2.5 Flash responded in ${perf.end(apiStart)}`);

    console.log(`📋 Extracted header data:`, {
      transferNumber: extractedData.transferNumber,
      transferDate: extractedData.transferDate,
      invoiceNumber: extractedData.invoiceNumber,
      invoiceDate: extractedData.invoiceDate,
      purchaseDate: extractedData.purchaseDate,
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
      invoiceDate: nullToUndefined(extractedData.invoiceDate),
      purchaseDate: nullToUndefined(extractedData.purchaseDate),
      items: (extractedData.items || []).map((item) => ({
        itemCode: nullToUndefined(item.itemCode),
        itemName: nullToUndefined(item.itemName),
        slabName: nullToUndefined(item.slabName),
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

    console.log(`✅ Extraction complete: ${result.items.length} items in ${perf.end(totalStart)} total`);

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
