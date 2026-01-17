import { InventoryItem } from "@/drizzle/schema";

export type { InventoryItem, NewInventoryItem } from "@/drizzle/schema";

export interface ExtractedInventoryData {
  // Transfer/Receiving Worksheet fields
  transferNumber?: string;
  transferDate?: string;
  // Vendor/Supplier information
  vendorName?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorFax?: string;
  // Destination information
  transferredTo?: string;
  destinationAddress?: string;
  destinationPhone?: string;
  destinationEmail?: string;
  // Shipping information
  reqShipDate?: string;
  deliveryMethod?: string;
  shipmentTerms?: string;
  freightCarrier?: string;
  weight?: string;
  // Items
  items: Array<{
    itemCode?: string;
    itemName?: string;
    description?: string;
    serialNum?: string;
    barcode?: string;
    bundle?: string;
    slabNumber?: string;
    block?: string;
    bin?: string;
    quantity?: string;
    quantitySf?: number;
    quantitySlabs?: number;
    // Legacy fields
    unitPrice?: number;
    totalPrice?: number;
  }>;
  // Legacy fields for backward compatibility
  invoiceNumber?: string;
}

export interface ExtractionResult {
  success: boolean;
  data: ExtractedInventoryData;
  error?: string;
  errorCode?: 'API_KEY_MISSING' | 'API_ERROR' | 'FILE_UPLOAD_FAILED' | 'PARSE_ERROR' | 'UNSUPPORTED_FILE' | 'UNKNOWN';
  details?: string;
}
