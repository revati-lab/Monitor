"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SlabItem } from "@/drizzle/schema";

type InventoryItem = SlabItem & { source?: 'consignment' | 'own_slabs' };

interface SSEMessage {
  type: "connected" | "inventory_update" | "heartbeat" | "error";
  operation?: "INSERT" | "UPDATE" | "DELETE";
  id?: string;
  itemName?: string;
  vendorName?: string;
  timestamp?: string;
  message?: string;
}

interface UseRealtimeInventoryOptions {
  onUpdate?: (message: SSEMessage) => void;
  enabled?: boolean;
}

export function useRealtimeInventory(
  initialItems: InventoryItem[],
  options: UseRealtimeInventoryOptions = {}
) {
  const { onUpdate, enabled = true } = options;
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch fresh data from the server
  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to refetch inventory:", error);
    }
  }, []);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;

    const eventSource = new EventSource("/api/events");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);

        if (message.type === "connected") {
          setIsConnected(true);
        } else if (message.type === "inventory_update") {
          // Refetch data when inventory changes
          refetch();
          onUpdate?.(message);
        } else if (message.type === "heartbeat") {
          // Connection is alive, no action needed
        } else if (message.type === "error") {
          console.error("SSE error:", message.message);
        }
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [enabled, refetch, onUpdate]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update items when initialItems change (e.g., from server-side props)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  return {
    items,
    isConnected,
    lastUpdate,
    refetch,
    disconnect,
    reconnect: connect,
  };
}
