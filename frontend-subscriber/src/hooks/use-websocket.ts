"use client";

import { useEffect, useRef, useCallback } from "react";
import { wsService } from "@/services/websocket.service";
import type { WebSocketEventMap, WebSocketEventName } from "@/lib/types";

type EventCallback<K extends WebSocketEventName> = (data: WebSocketEventMap[K]) => void;

/**
 * Connect to the WebSocket on mount (if authenticated) and disconnect on
 * unmount. Meant to be called once in the dashboard layout.
 */
export function useWebSocket() {
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    wsService.connect(token);

    return () => wsService.disconnect();
  }, []);
}

/**
 * Subscribe to a specific WebSocket event for the lifetime of the calling
 * component. The callback reference is kept stable via a ref so callers
 * don't need to memoize it.
 */
export function useWebSocketEvent<K extends WebSocketEventName>(
  event: K,
  callback: EventCallback<K>,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Stable handler that delegates to the latest callback ref
  const handler = useCallback(
    (data: WebSocketEventMap[K]) => callbackRef.current(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event],
  );

  useEffect(() => {
    wsService.on(event, handler);
    return () => wsService.off(event, handler);
  }, [event, handler]);
}
