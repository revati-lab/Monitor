import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/drizzle/schema";

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const newPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  // Handle pool errors to prevent crashes
  newPool.on("error", (err) => {
    console.error("Unexpected database pool error:", err.message);
    // Reset pool on error so next request creates a fresh connection
    pool = null;
    dbInstance = null;
  });

  return newPool;
}

function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

// Lazy initialization - only connects when actually used
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop as keyof typeof db];
    // Ensure methods are bound to the correct context
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  },
});

// Export pool getter for direct PostgreSQL operations (e.g., LISTEN/NOTIFY)
export function getPoolInstance(): Pool {
  return getPool();
}
