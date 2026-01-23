export type {
  ConsignmentItem,
  NewConsignmentItem,
  OwnSlabItem,
  NewOwnSlabItem,
  SlabItem
} from "@/drizzle/schema";

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
  // Determines which table to use
  targetTable?: 'consignment' | 'own_slabs';
  error?: string;
  errorCode?: 'API_KEY_MISSING' | 'API_ERROR' | 'FILE_UPLOAD_FAILED' | 'PARSE_ERROR' | 'UNSUPPORTED_FILE' | 'INVALID_CONTENT' | 'UNKNOWN';
  details?: string;
}

// Helper to determine target table based on extracted data
export function determineTargetTable(data: ExtractedInventoryData): 'consignment' | 'own_slabs' {
  // If has transfer number, it's consignment
  if (data.transferNumber) {
    return 'consignment';
  }
  // If has invoice number, it's own slabs
  if (data.invoiceNumber) {
    return 'own_slabs';
  }
  // Default to consignment if unclear
  return 'consignment';
}
