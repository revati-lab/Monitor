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

    // Handle pool-level errors to prevent uncaught exceptions
    ssePool.on("error", (err) => {
      console.error("SSE pool error:", err);
      // Don't throw - just log it
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
            // Try to unlisten - connection might already be closed, which is fine
            await client.query("UNLISTEN inventory_changes").catch(() => {
              // Ignore unlisten errors - connection might already be closed
              // This is expected when connections are terminated unexpectedly
            });
          } catch (err) {
            // Ignore cleanup errors - connection might already be closed
            // This is expected when connections are terminated unexpectedly
          } finally {
            try {
              client.release();
            } catch (err) {
              // Client might already be released or destroyed
              // This is expected and safe to ignore
            }
          }
        }
      };

      // Handle client disconnect
      request.signal.addEventListener("abort", async () => {
        isControllerClosed = true;
        try {
          await cleanup();
        } catch (err) {
          // Cleanup errors are expected and safe to ignore
          console.debug("Cleanup error on abort (expected):", err);
        }
      });

      try {
        client = await getSsePool().connect();

        // Subscribe to inventory changes channel
        try {
          await client.query("LISTEN inventory_changes");
        } catch (listenErr) {
          console.error("Failed to LISTEN on inventory_changes:", listenErr);
          // Release the client if LISTEN fails
          try {
            client.release();
          } catch {
            // Ignore release errors
          }
          client = null;
          throw listenErr;
        }

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
          try {
            await cleanup();
          } catch (cleanupErr) {
            // Cleanup errors are expected when connection is already broken
            console.debug("Cleanup error in error handler (expected):", cleanupErr);
          }
          try {
            controller.close();
          } catch {
            // Controller may already be closed
          }
        });

        // Handle connection end events
        client.on("end", () => {
          console.debug("SSE client connection ended");
          clearInterval(heartbeatInterval);
          isControllerClosed = true;
        });
      } catch (error) {
        console.error("SSE connection error:", error);
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Connection failed" })}\n\n`
            )
          );
        } catch {
          // Controller may already be closed
        }
        try {
          await cleanup();
        } catch (cleanupErr) {
          // Cleanup errors are expected
          console.debug("Cleanup error in catch block (expected):", cleanupErr);
        }
        try {
          controller.close();
        } catch {
          // Controller may already be closed
        }
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
