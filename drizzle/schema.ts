import { pgTable, uuid, varchar, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { InferSelectModel, InferInsertModel } from "drizzle-orm"

export const sales = pgTable("sales", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	documentType: varchar("document_type", { length: 50 }).notNull(),
	vendorName: varchar("vendor_name", { length: 255 }),
	vendorAddress: varchar("vendor_address", { length: 500 }),
	vendorPhone: varchar("vendor_phone", { length: 100 }),
	vendorFax: varchar("vendor_fax", { length: 100 }),
	transferredTo: varchar("transferred_to", { length: 255 }),
	destinationAddress: varchar("destination_address", { length: 500 }),
	destinationPhone: varchar("destination_phone", { length: 100 }),
	destinationEmail: varchar("destination_email", { length: 255 }),
	reqShipDate: varchar("req_ship_date", { length: 100 }),
	deliveryMethod: varchar("delivery_method", { length: 100 }),
	shipmentTerms: varchar("shipment_terms", { length: 100 }),
	freightCarrier: varchar("freight_carrier", { length: 255 }),
	weight: varchar({ length: 100 }),
	serialNum: varchar("serial_num", { length: 255 }),
	barcode: varchar({ length: 255 }),
	bundle: varchar({ length: 100 }),
	block: varchar({ length: 255 }),
	slabNumber: varchar("slab_number", { length: 100 }),
	slabName: varchar("slab_name", { length: 500 }),
	quantity: varchar({ length: 255 }),
	quantitySf: numeric("quantity_sf", { precision: 10, scale: 2 }),
	quantitySlabs: integer("quantity_slabs"),
	itemCode: varchar("item_code", { length: 255 }),
	itemName: varchar("item_name", { length: 255 }),
	bin: varchar({ length: 100 }),
	unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
	totalPrice: numeric("total_price", { precision: 10, scale: 2 }),
	sourceImageUrl: varchar("source_image_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isBroken: boolean("is_broken").default(false).notNull(),
	transferNumber: varchar("transfer_number", { length: 255 }),
	transferDate: varchar("transfer_date", { length: 100 }),
	invoiceNumber: varchar("invoice_number", { length: 255 }),
	invoiceDate: varchar("invoice_date", { length: 100 }),
	purchaseDate: varchar("purchase_date", { length: 100 }),
});

// Type exports for the sales table
export type SalesItem = InferSelectModel<typeof sales>;
export type NewSalesItem = InferInsertModel<typeof sales>;

// Legacy type aliases for backward compatibility
export type SlabItem = SalesItem;
export type ConsignmentItem = SalesItem;
export type OwnSlabItem = SalesItem;
export type NewConsignmentItem = NewSalesItem;
export type NewOwnSlabItem = NewSalesItem;
