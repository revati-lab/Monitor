import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Define schema inline to avoid import issues
const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transferNumber: varchar("transfer_number", { length: 255 }),
  transferDate: varchar("transfer_date", { length: 100 }),
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
  weight: varchar("weight", { length: 100 }),
  itemCode: varchar("item_code", { length: 255 }),
  itemName: varchar("item_name", { length: 255 }),
  description: varchar("description", { length: 500 }),
  serialNum: varchar("serial_num", { length: 255 }),
  barcode: varchar("barcode", { length: 255 }),
  bundle: varchar("bundle", { length: 100 }),
  slabNumber: varchar("slab_number", { length: 100 }),
  block: varchar("block", { length: 255 }),
  bin: varchar("bin", { length: 100 }),
  quantity: varchar("quantity", { length: 255 }),
  quantitySf: decimal("quantity_sf", { precision: 10, scale: 2 }),
  quantitySlabs: integer("quantity_slabs"),
  invoiceNumber: varchar("invoice_number", { length: 255 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  sourceImageUrl: varchar("source_image_url", { length: 500 }),
  extractedData: jsonb("extracted_data"),
});

interface CsvRow {
  transferNumber: string;
  transferDate: string;
  vendorName: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorFax: string;
  transferredTo: string;
  destinationAddress: string;
  destinationPhone: string;
  destinationEmail: string;
  reqShipDate: string;
  deliveryMethod: string;
  shipmentTerms: string;
  freightCarrier: string;
  weight: string;
  invoiceNumber: string;
  serialNum: string;
  barcode: string;
  bundle: string;
  block: string;
  slabNumber: string;
  description: string;
  quantity: string;
  quantitySf: string;
  quantitySlabs: string;
  itemCode: string;
  itemName: string;
  bin: string;
  unitPrice: string;
  totalPrice: string;
}

// CSV parser that handles quoted multiline fields
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ",") {
        // End of field
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        // End of row
        if (char === "\r") i++;
        currentRow.push(currentField.trim());
        if (currentRow.length > 1 || currentRow[0] !== "") {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else if (char !== "\r") {
        currentField += char;
      }
    }
  }

  // Handle last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 1 || currentRow[0] !== "") {
      rows.push(currentRow);
    }
  }

  return rows;
}

function mapRowToInventoryItem(headers: string[], values: string[]): CsvRow {
  const headerMap: Record<string, keyof CsvRow> = {
    "Transfer Number": "transferNumber",
    "Transfer Date": "transferDate",
    "Vendor Name": "vendorName",
    "Vendor Address": "vendorAddress",
    "Vendor Phone": "vendorPhone",
    "Vendor Fax": "vendorFax",
    "Transferred To": "transferredTo",
    "Destination Address": "destinationAddress",
    "Destination Phone": "destinationPhone",
    "Destination Email": "destinationEmail",
    "Req Ship Date": "reqShipDate",
    "Delivery Method": "deliveryMethod",
    "Shipment Terms": "shipmentTerms",
    "Freight Carrier": "freightCarrier",
    Weight: "weight",
    "Invoice Number": "invoiceNumber",
    "Serial Num": "serialNum",
    Barcode: "barcode",
    Bundle: "bundle",
    Block: "block",
    "Slab Number": "slabNumber",
    Description: "description",
    Quantity: "quantity",
    "Quantity SF": "quantitySf",
    "Quantity Slabs": "quantitySlabs",
    "Item Code": "itemCode",
    "Item Name": "itemName",
    Bin: "bin",
    "Unit Price": "unitPrice",
    "Total Price": "totalPrice",
  };

  const row: Partial<CsvRow> = {};

  headers.forEach((header, index) => {
    const key = headerMap[header];
    if (key && index < values.length) {
      row[key] = values[index] || "";
    }
  });

  return row as CsvRow;
}

async function ingestCSV(csvFilePath: string) {
  console.log(`Reading CSV file: ${csvFilePath}`);

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });

  const db = drizzle(pool);

  const absolutePath = path.resolve(csvFilePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const rows = parseCSV(content);

  if (rows.length < 2) {
    throw new Error(
      "CSV file must have a header row and at least one data row"
    );
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  console.log(`Found ${dataRows.length} data rows`);
  console.log(`Headers: ${headers.join(", ")}`);

  const insertedItems: (typeof inventoryItems.$inferInsert)[] = [];

  for (const values of dataRows) {
    const csvRow = mapRowToInventoryItem(headers, values);

    const item: typeof inventoryItems.$inferInsert = {
      transferNumber: csvRow.transferNumber || null,
      transferDate: csvRow.transferDate || null,
      vendorName: csvRow.vendorName || null,
      vendorAddress: csvRow.vendorAddress || null,
      vendorPhone: csvRow.vendorPhone || null,
      vendorFax: csvRow.vendorFax || null,
      transferredTo: csvRow.transferredTo || null,
      destinationAddress: csvRow.destinationAddress || null,
      destinationPhone: csvRow.destinationPhone || null,
      destinationEmail: csvRow.destinationEmail || null,
      reqShipDate: csvRow.reqShipDate || null,
      deliveryMethod: csvRow.deliveryMethod || null,
      shipmentTerms: csvRow.shipmentTerms || null,
      freightCarrier: csvRow.freightCarrier || null,
      weight: csvRow.weight || null,
      invoiceNumber: csvRow.invoiceNumber || null,
      serialNum: csvRow.serialNum || null,
      barcode: csvRow.barcode || null,
      bundle: csvRow.bundle || null,
      block: csvRow.block || null,
      slabNumber: csvRow.slabNumber || null,
      description: csvRow.description || null,
      quantity: csvRow.quantity || null,
      quantitySf: csvRow.quantitySf ? csvRow.quantitySf : null,
      quantitySlabs: csvRow.quantitySlabs
        ? parseInt(csvRow.quantitySlabs, 10)
        : null,
      itemCode: csvRow.itemCode || null,
      itemName: csvRow.itemName || null,
      bin: csvRow.bin || null,
      unitPrice: csvRow.unitPrice ? csvRow.unitPrice : null,
      totalPrice: csvRow.totalPrice ? csvRow.totalPrice : null,
    };

    insertedItems.push(item);
  }

  console.log(`Inserting ${insertedItems.length} items into database...`);

  // Insert in batches of 100 for better performance
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < insertedItems.length; i += batchSize) {
    const batch = insertedItems.slice(i, i + batchSize);
    await db.insert(inventoryItems).values(batch);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${insertedItems.length} items`);
  }

  console.log(`Successfully ingested ${insertedItems.length} inventory items`);

  // Close the pool
  await pool.end();
}

// Get CSV file path from command line argument or use default
const csvFilePath =
  process.argv[2] ||
  "/home/revat/Path-genai/Monitor/public/exports/1768669863480-Transfer_Receiving_Worksheet_-__15782.csv";

ingestCSV(csvFilePath)
  .then(() => {
    console.log("CSV ingestion completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error ingesting CSV:", error);
    process.exit(1);
  });
