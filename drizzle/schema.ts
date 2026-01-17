import { pgTable, uuid, varchar, decimal, timestamp, jsonb, integer, bigint } from "drizzle-orm/pg-core";

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Transfer/Receiving Worksheet fields
  transferNumber: varchar("transfer_number", { length: 255 }),
  transferDate: varchar("transfer_date", { length: 100 }),
  // Vendor/Supplier information
  vendorName: varchar("vendor_name", { length: 255 }),
  vendorAddress: varchar("vendor_address", { length: 500 }),
  vendorPhone: varchar("vendor_phone", { length: 100 }),
  vendorFax: varchar("vendor_fax", { length: 100 }),
  // Destination information
  transferredTo: varchar("transferred_to", { length: 255 }),
  destinationAddress: varchar("destination_address", { length: 500 }),
  destinationPhone: varchar("destination_phone", { length: 100 }),
  destinationEmail: varchar("destination_email", { length: 255 }),
  // Shipping information
  reqShipDate: varchar("req_ship_date", { length: 100 }),
  deliveryMethod: varchar("delivery_method", { length: 100 }),
  shipmentTerms: varchar("shipment_terms", { length: 100 }),
  freightCarrier: varchar("freight_carrier", { length: 255 }),
  weight: varchar("weight", { length: 100 }),
  // Item details
  itemCode: varchar("item_code", { length: 255 }),
  itemName: varchar("item_name", { length: 255 }),
  description: varchar("description", { length: 500 }),
  serialNum: varchar("serial_num", { length: 255 }),
  barcode: varchar("barcode", { length: 255 }),
  bundle: varchar("bundle", { length: 100 }),
  slabNumber: varchar("slab_number", { length: 100 }),
  block: varchar("block", { length: 255 }),
  bin: varchar("bin", { length: 100 }),
  quantity: varchar("quantity", { length: 255 }), // Changed to varchar to handle "1,135.65 SF (15 Slabs)"
  quantitySf: decimal("quantity_sf", { precision: 10, scale: 2 }),
  quantitySlabs: integer("quantity_slabs"),
  // Legacy fields for backward compatibility
  invoiceNumber: varchar("invoice_number", { length: 255 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  sourceImageUrl: varchar("source_image_url", { length: 500 }),
  extractedData: jsonb("extracted_data"),
});

export const fileUploads = pgTable("file_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processed: timestamp("processed"),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
export type FileUpload = typeof fileUploads.$inferSelect;
export type NewFileUpload = typeof fileUploads.$inferInsert;
