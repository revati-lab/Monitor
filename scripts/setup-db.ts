import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log("Setting up database tables...\n");

  try {
    // Create sales table if not exists
    console.log("Creating sales table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sales" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar(255) NOT NULL,
        "document_type" varchar(50) NOT NULL,
        "vendor_name" varchar(255),
        "vendor_address" varchar(500),
        "vendor_phone" varchar(100),
        "vendor_fax" varchar(100),
        "transferred_to" varchar(255),
        "destination_address" varchar(500),
        "destination_phone" varchar(100),
        "destination_email" varchar(255),
        "req_ship_date" varchar(100),
        "delivery_method" varchar(100),
        "shipment_terms" varchar(100),
        "freight_carrier" varchar(255),
        "weight" varchar(100),
        "serial_num" varchar(255),
        "barcode" varchar(255),
        "bundle" varchar(100),
        "block" varchar(255),
        "slab_number" varchar(100),
        "slab_name" varchar(500),
        "quantity" varchar(255),
        "quantity_sf" numeric(10, 2),
        "quantity_slabs" integer,
        "item_code" varchar(255),
        "item_name" varchar(255),
        "bin" varchar(100),
        "unit_price" numeric(10, 2),
        "total_price" numeric(10, 2),
        "source_image_url" varchar(500),
        "created_at" timestamp DEFAULT now(),
        "is_broken" boolean DEFAULT false NOT NULL,
        "transfer_number" varchar(255),
        "transfer_date" varchar(100),
        "invoice_number" varchar(255),
        "invoice_date" varchar(100),
        "purchase_date" varchar(100)
      );
    `);
    console.log("Sales table ready.\n");

    // Add user_id column if it doesn't exist (for existing tables)
    console.log("Ensuring user_id column exists...");
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'sales' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "sales" ADD COLUMN "user_id" varchar(255);
        END IF;
      END $$;
    `);
    console.log("user_id column ready.\n");

    console.log("Database setup complete!");

  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
