import { sales } from "@/drizzle/schema";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Type for a sales record from the database
export type SalesItem = InferSelectModel<typeof sales>;
export type NewSalesItem = InferInsertModel<typeof sales>;

// Legacy type aliases for backward compatibility
export type SlabItem = SalesItem;
export type ConsignmentItem = SalesItem;
export type OwnSlabItem = SalesItem;
export type NewConsignmentItem = NewSalesItem;
export type NewOwnSlabItem = NewSalesItem;

export interface ExtractedInventoryData {
  // Transfer/Receiving Worksheet fields (for consignment)
  transferNumber?: string;
  transferDate?: string;
  // Invoice fields (for own slabs)
  invoiceNumber?: string;
  invoiceDate?: string;
  purchaseDate?: string;
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
    slabName?: string;
    serialNum?: string;
    barcode?: string;
    bundle?: string;
    slabNumber?: string;
    block?: string;
    bin?: string;
    quantity?: string;
    quantitySf?: number;
    quantitySlabs?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}

export interface ExtractionResult {
  success: boolean;
  data: ExtractedInventoryData;
  // Determines which document type to use
  documentType?: 'consignment' | 'own';
  error?: string;
  errorCode?: 'API_KEY_MISSING' | 'API_ERROR' | 'FILE_UPLOAD_FAILED' | 'PARSE_ERROR' | 'UNSUPPORTED_FILE' | 'INVALID_CONTENT' | 'UNKNOWN';
  details?: string;
}

// Helper to determine document type based on extracted data
export function determineDocumentType(data: ExtractedInventoryData): 'consignment' | 'own' {
  // If has transfer number, it's consignment
  if (data.transferNumber) {
    return 'consignment';
  }
  // If has invoice number, it's own
  if (data.invoiceNumber) {
    return 'own';
  }
  // Default to consignment if unclear
  return 'consignment';
}

// Legacy function alias for backward compatibility
export const determineTargetTable = determineDocumentType;
