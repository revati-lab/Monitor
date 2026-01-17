import { GoogleGenerativeAI, GenerativeModel, FileDataPart } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { ExtractedInventoryData, ExtractionResult } from "@/types/inventory";
import { statSync, existsSync } from "fs";

// Lazy initialization to ensure environment variables are loaded
let genAI: GoogleGenerativeAI | null = null;
let fileManager: GoogleAIFileManager | null = null;
let model: GenerativeModel | null = null;

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }
  return apiKey;
}

function getModel(): GenerativeModel {
  if (!model) {
    const apiKey = getApiKey();
    genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash-lite for multimodal extraction (supports PDF and images)
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    console.log("✅ Gemini 2.5 Flash Lite model initialized for extraction");
  }
  return model;
}

function getFileManager(): GoogleAIFileManager {
  if (!fileManager) {
    const apiKey = getApiKey();
    fileManager = new GoogleAIFileManager(apiKey);
    console.log("✅ Google AI File Manager initialized");
  }
  return fileManager;
}

/**
 * Extraction prompt that instructs Gemini to preserve exact formatting
 */
const EXTRACTION_PROMPT = `You are a document extraction specialist. Analyze this document (PDF or image) and extract ALL visible data exactly as it appears.

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of text, number, and data EXACTLY as displayed
2. For tables: extract EVERY ROW - do not skip any rows
3. Keep exact number formatting (commas, decimals, units)
4. If a field is not present in the document, use null

Look for and extract these fields (use null if not found):

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
Extract EVERY row from the items table. For each item/row, capture:
- serialNum: Serial number (e.g., "11333-1", "11333-2")
- barcode: Barcode/ES number (e.g., "ES91820575")
- bundle: Bundle info (e.g., "1/15", "2/15")
- block: Block identifier (e.g., "D-10138")
- slabNumber: Slab dimensions or number (e.g., "38" X 79" = 75.71")
- description: Material/item description (e.g., "Calacatta Umi MQ 3CM")
- quantity: Full quantity string as shown
- quantitySf: Numeric square feet value only
- quantitySlabs: Numeric slab count only
- itemCode: Item code/SKU if shown
- itemName: Item name if different from description
- bin: Bin/location if shown
- unitPrice: Unit price (number only)
- totalPrice: Total price (number only)

Return this exact JSON structure:
{
  "transferNumber": "string or null",
  "transferDate": "string or null",
  "vendorName": "string or null",
  "vendorAddress": "string or null",
  "vendorPhone": "string or null",
  "vendorFax": "string or null",
  "transferredTo": "string or null",
  "destinationAddress": "string or null",
  "destinationPhone": "string or null",
  "destinationEmail": "string or null",
  "reqShipDate": "string or null",
  "deliveryMethod": "string or null",
  "shipmentTerms": "string or null",
  "freightCarrier": "string or null",
  "weight": "string or null",
  "invoiceNumber": "string or null",
  "items": [
    {
      "serialNum": "string or null",
      "barcode": "string or null",
      "bundle": "string or null",
      "block": "string or null",
      "slabNumber": "string or null",
      "description": "string or null",
      "quantity": "string or null",
      "quantitySf": number or null,
      "quantitySlabs": number or null,
      "itemCode": "string or null",
      "itemName": "string or null",
      "bin": "string or null",
      "unitPrice": number or null,
      "totalPrice": number or null
    }
  ]
}

IMPORTANT:
- Extract ALL items/rows from tables - count them and make sure you have every one
- Return ONLY the JSON object, no markdown code blocks, no explanations
- Use null for missing fields, not empty strings`;

/**
 * Get MIME type from file type string
 */
function getMimeType(fileType: string): string {
  if (fileType.includes("pdf")) return "application/pdf";
  if (fileType.includes("png")) return "image/png";
  if (fileType.includes("jpeg") || fileType.includes("jpg")) return "image/jpeg";
  return "application/octet-stream";
}

/**
 * Parse numeric value from string (handles commas and units)
 */
function parseNumeric(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;

  // Remove commas and extract numeric part
  const numStr = value.replace(/,/g, "").match(/[\d.]+/);
  if (numStr) {
    const parsed = parseFloat(numStr[0]);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Upload file using the File API and wait for processing
 * This is more reliable for larger files, especially PDFs
 */
async function uploadFile(filePath: string, mimeType: string, displayName: string) {
  const fm = getFileManager();

  console.log(`📤 Uploading file to Gemini File API: ${displayName}`);

  const uploadResult = await fm.uploadFile(filePath, {
    mimeType,
    displayName,
  });

  console.log(`📤 Upload initiated. File name: ${uploadResult.file.name}`);

  // Wait for file to be processed (ACTIVE state)
  let file = uploadResult.file;
  while (file.state === "PROCESSING") {
    console.log(`⏳ File is processing... waiting 2 seconds`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fm.getFile(file.name);
  }

  if (file.state === "FAILED") {
    throw new Error(`File processing failed: ${file.name}`);
  }

  console.log(`✅ File ready: ${file.name} (${file.state})`);
  return file;
}

/**
 * Delete uploaded file after processing (cleanup)
 */
async function deleteFile(fileName: string) {
  try {
    const fm = getFileManager();
    await fm.deleteFile(fileName);
    console.log(`🗑️ Cleaned up uploaded file: ${fileName}`);
  } catch (error) {
    console.warn(`⚠️ Could not delete file ${fileName}:`, error);
  }
}

/**
 * Extract inventory data using Gemini 2.0 Flash with File API
 * File API is more reliable for larger files (up to 2GB)
 */
export async function extractWithGemini(
  filePath: string,
  fileType: string
): Promise<ExtractionResult> {
  let uploadedFileName: string | null = null;

  try {
    console.log(`🤖 Starting Gemini extraction for: ${filePath}`);
    console.log(`📄 File type: ${fileType}`);

    // Check if file exists
    if (!existsSync(filePath)) {
      return {
        success: false,
        data: { items: [] },
        error: `File not found: ${filePath}`,
        errorCode: 'FILE_UPLOAD_FAILED',
      };
    }

    const mimeType = getMimeType(fileType);
    const fileStats = statSync(filePath);
    const fileSizeKB = Math.round(fileStats.size / 1024);

    console.log(`📦 File size: ${fileSizeKB} KB`);

    // Upload file using File API (better for large files)
    const displayName = filePath.split("/").pop() || "document";
    let uploadedFile;
    try {
      uploadedFile = await uploadFile(filePath, mimeType, displayName);
      uploadedFileName = uploadedFile.name;
    } catch (uploadError: any) {
      console.error(`❌ File upload to Gemini failed:`, uploadError);
      return {
        success: false,
        data: { items: [] },
        error: `Failed to upload file to Gemini: ${uploadError.message}`,
        errorCode: 'FILE_UPLOAD_FAILED',
        details: uploadError.message,
      };
    }

    // Create file reference for Gemini
    const filePart: FileDataPart = {
      fileData: {
        mimeType: uploadedFile.mimeType,
        fileUri: uploadedFile.uri,
      },
    };

    // Call Gemini with the uploaded file
    console.log(`🚀 Sending to Gemini 2.0 Flash...`);
    let geminiModel;
    try {
      geminiModel = getModel();
    } catch (modelError: any) {
      return {
        success: false,
        data: { items: [] },
        error: modelError.message,
        errorCode: 'API_KEY_MISSING',
      };
    }

    let result;
    try {
      result = await geminiModel.generateContent([EXTRACTION_PROMPT, filePart]);
    } catch (apiError: any) {
      console.error(`❌ Gemini API call failed:`, apiError);
      const errorMessage = apiError.message || 'Unknown API error';

      // Check for common error types
      if (errorMessage.includes('API key')) {
        return {
          success: false,
          data: { items: [] },
          error: 'Invalid or missing Gemini API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY.',
          errorCode: 'API_KEY_MISSING',
          details: errorMessage,
        };
      }
      if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        return {
          success: false,
          data: { items: [] },
          error: 'API quota exceeded or rate limited. Please try again later.',
          errorCode: 'API_ERROR',
          details: errorMessage,
        };
      }
      if (errorMessage.includes('not found') || errorMessage.includes('not available')) {
        return {
          success: false,
          data: { items: [] },
          error: 'Gemini model not available. The model may not be accessible in your region.',
          errorCode: 'API_ERROR',
          details: errorMessage,
        };
      }

      return {
        success: false,
        data: { items: [] },
        error: `Gemini API error: ${errorMessage}`,
        errorCode: 'API_ERROR',
        details: errorMessage,
      };
    }

    const response = result.response;
    const text = response.text();

    console.log(`✅ Gemini response received (${text.length} characters)`);
    console.log(`📝 ========== FULL GEMINI RESPONSE ==========`);
    console.log(text);
    console.log(`📝 ========== END GEMINI RESPONSE ==========`);

    // Parse the JSON response
    let extractedJson: any;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      let jsonStr = text;

      // Remove markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      // Also try to find raw JSON object
      const rawJsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (rawJsonMatch) {
        jsonStr = rawJsonMatch[0];
      }

      extractedJson = JSON.parse(jsonStr);
      console.log(`✅ Successfully parsed JSON response`);
    } catch (parseError: any) {
      console.error(`❌ Failed to parse Gemini response as JSON:`, parseError);
      console.error(`Raw response:`, text);
      return {
        success: false,
        data: { items: [] },
        error: 'Failed to parse Gemini response. The AI returned an invalid format.',
        errorCode: 'PARSE_ERROR',
        details: `Parse error: ${parseError.message}. Response preview: ${text.substring(0, 200)}...`,
      };
    }

    // Helper to convert null/undefined to undefined
    const toUndefined = (val: any) => (val === null || val === undefined || val === "null") ? undefined : val;

    // Transform the response to match our schema
    const extractedData: ExtractedInventoryData = {
      transferNumber: toUndefined(extractedJson.transferNumber),
      transferDate: toUndefined(extractedJson.transferDate),
      vendorName: toUndefined(extractedJson.vendorName),
      vendorAddress: toUndefined(extractedJson.vendorAddress),
      vendorPhone: toUndefined(extractedJson.vendorPhone),
      vendorFax: toUndefined(extractedJson.vendorFax),
      transferredTo: toUndefined(extractedJson.transferredTo),
      destinationAddress: toUndefined(extractedJson.destinationAddress),
      destinationPhone: toUndefined(extractedJson.destinationPhone),
      destinationEmail: toUndefined(extractedJson.destinationEmail),
      reqShipDate: toUndefined(extractedJson.reqShipDate),
      deliveryMethod: toUndefined(extractedJson.deliveryMethod),
      shipmentTerms: toUndefined(extractedJson.shipmentTerms),
      freightCarrier: toUndefined(extractedJson.freightCarrier),
      weight: toUndefined(extractedJson.weight),
      invoiceNumber: toUndefined(extractedJson.invoiceNumber),
      items: [],
    };

    console.log(`📋 Extracted header data:`, {
      transferNumber: extractedData.transferNumber,
      transferDate: extractedData.transferDate,
      vendorName: extractedData.vendorName,
      transferredTo: extractedData.transferredTo,
    });

    // Process items
    if (extractedJson.items && Array.isArray(extractedJson.items)) {
      console.log(`📊 Found ${extractedJson.items.length} items in Gemini response`);

      for (let i = 0; i < extractedJson.items.length; i++) {
        const item = extractedJson.items[i];
        console.log(`📝 Processing item ${i + 1}:`, JSON.stringify(item, null, 2));

        const processedItem = {
          itemCode: toUndefined(item.itemCode),
          itemName: toUndefined(item.itemName),
          description: toUndefined(item.description),
          serialNum: toUndefined(item.serialNum),
          barcode: toUndefined(item.barcode),
          bundle: toUndefined(item.bundle),
          slabNumber: toUndefined(item.slabNumber),
          block: toUndefined(item.block),
          bin: toUndefined(item.bin),
          quantity: toUndefined(item.quantity),
          quantitySf: parseNumeric(item.quantitySf),
          quantitySlabs: item.quantitySlabs !== undefined && item.quantitySlabs !== null ? parseInt(item.quantitySlabs) : undefined,
          unitPrice: parseNumeric(item.unitPrice),
          totalPrice: parseNumeric(item.totalPrice),
        };

        // Add ALL items - don't filter, let the database handle it
        extractedData.items.push(processedItem);
        console.log(`  ✅ Added item ${i + 1}: serialNum=${processedItem.serialNum}, description=${processedItem.description}`);
      }
    } else {
      console.log(`⚠️ No items array found in Gemini response or it's not an array`);
      console.log(`Items value:`, extractedJson.items);
    }

    console.log(`✅ Gemini extraction complete: ${extractedData.items.length} items extracted`);
    console.log(`📋 Summary:`, {
      transferNumber: extractedData.transferNumber,
      transferDate: extractedData.transferDate,
      vendorName: extractedData.vendorName,
      itemCount: extractedData.items.length,
    });

    return {
      success: true,
      data: extractedData,
    };
  } catch (error: any) {
    console.error(`❌ Gemini extraction error:`, error);
    console.error(`Error message:`, error.message);
    if (error.stack) {
      console.error(`Stack trace:`, error.stack);
    }

    return {
      success: false,
      data: { items: [] },
      error: `Extraction failed: ${error.message}`,
      errorCode: 'UNKNOWN',
      details: error.stack,
    };
  } finally {
    // Cleanup: delete uploaded file from Gemini servers
    if (uploadedFileName) {
      await deleteFile(uploadedFileName);
    }
  }
}

/**
 * Extract inventory data - main entry point
 * Uses Gemini 2.0 Flash with File API for reliable processing
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
      errorCode: 'UNSUPPORTED_FILE',
    };
  }

  return extractWithGemini(filePath, fileType);
}

// Alias for backward compatibility
export const extractInventoryDataWithGemini = extractInventoryData;
