import { Pool, PoolClient, Notification } from "pg";

// Create a dedicated pool for SSE connections (separate from the main app pool)
// Lazy initialization to avoid build-time errors
let ssePool: Pool | null = null;

function getSsePool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!ssePool) {
    ssePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 0, // Disable idle timeout for long-lived connections
      max: 5, // Limit SSE connections
    });
  }

  return ssePool;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let client: PoolClient | null = null;
      let isControllerClosed = false;

      const cleanup = async () => {
        if (client) {
          try {
            await client.query("UNLISTEN inventory_changes");
            client.release();
          } catch {
            // Ignore cleanup errors
          }
        }
      };

      // Handle client disconnect
      request.signal.addEventListener("abort", async () => {
        isControllerClosed = true;
        await cleanup();
      });

      try {
        client = await getSsePool().connect();

        // Subscribe to inventory changes channel
        await client.query("LISTEN inventory_changes");

        // Send initial connection success message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
          )
        );

        // Set up notification handler
        client.on("notification", (msg: Notification) => {
          if (isControllerClosed) return;

          try {
            const payload = msg.payload ? JSON.parse(msg.payload) : {};
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "inventory_update", ...payload })}\n\n`
              )
            );
          } catch {
            // Ignore parse errors
          }
        });

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (isControllerClosed) {
            clearInterval(heartbeatInterval);
            return;
          }
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`
              )
            );
          } catch {
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // Handle client errors
        client.on("error", async (err: Error) => {
          console.error("SSE client error:", err);
          clearInterval(heartbeatInterval);
          isControllerClosed = true;
          await cleanup();
          try {
            controller.close();
          } catch {
            // Controller may already be closed
          }
        });
      } catch (error) {
        console.error("SSE connection error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Connection failed" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for nginx
    },
  });
}
