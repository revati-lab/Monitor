import { pgTable, uuid, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";

// Base columns shared by both consignment and own_slabs tables
const baseSlabColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  // Vendor information
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
  serialNum: varchar("serial_num", { length: 255 }),
  barcode: varchar("barcode", { length: 255 }),
  bundle: varchar("bundle", { length: 100 }),
  block: varchar("block", { length: 255 }),
  slabNumber: varchar("slab_number", { length: 100 }),
  slabName: varchar("slab_name", { length: 500 }),
  quantity: varchar("quantity", { length: 255 }),
  quantitySf: decimal("quantity_sf", { precision: 10, scale: 2 }),
  quantitySlabs: integer("quantity_slabs"),
  itemCode: varchar("item_code", { length: 255 }),
  itemName: varchar("item_name", { length: 255 }),
  bin: varchar("bin", { length: 100 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  // Source tracking
  sourceImageUrl: varchar("source_image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  // Status tracking
  isBroken: boolean("is_broken").default(false).notNull(),
};

// Consignment table - for items received on consignment (has transfer number)
export const consignment = pgTable("consignment", {
  ...baseSlabColumns,
  // Transfer/Receiving Worksheet fields specific to consignment
  transferNumber: varchar("transfer_number", { length: 255 }),
  transferDate: varchar("transfer_date", { length: 100 }),
});

// Own Slabs table - for purchased/owned slabs (has invoice number)
export const ownSlabs = pgTable("own_slabs", {
  ...baseSlabColumns,
  // Invoice fields specific to owned slabs
  invoiceNumber: varchar("invoice_number", { length: 255 }),
  invoiceDate: varchar("invoice_date", { length: 100 }),
  purchaseDate: varchar("purchase_date", { length: 100 }),
});

// Type exports
export type ConsignmentItem = typeof consignment.$inferSelect;
export type NewConsignmentItem = typeof consignment.$inferInsert;
export type OwnSlabItem = typeof ownSlabs.$inferSelect;
export type NewOwnSlabItem = typeof ownSlabs.$inferInsert;

// Combined type for UI display (union of both types)
export type SlabItem = ConsignmentItem | OwnSlabItem;
