import { io, Socket } from 'socket.io-client';
import type { WebSocketEventMap, WebSocketEventName } from '@/lib/types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type EventCallback<K extends WebSocketEventName> = (data: WebSocketEventMap[K]) => void;

// Track listeners so we can properly type them
interface ListenerEntry {
  event: WebSocketEventName;
  callback: EventCallback<WebSocketEventName>;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: ListenerEntry[] = [];

  /** Connect to the WebSocket server with an auth token. */
  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      // Re-register listeners after reconnect
      for (const entry of this.listeners) {
        this.socket?.on(entry.event, entry.callback as any);
      }
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('[WebSocket] Connection error:', err.message);
    });

    // Register existing listeners on the new socket
    for (const entry of this.listeners) {
      this.socket.on(entry.event, entry.callback as any);
    }
  }

  /** Disconnect from the WebSocket server. */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /** Subscribe to a typed WebSocket event. */
  on<K extends WebSocketEventName>(
    event: K,
    callback: EventCallback<K>,
  ): void {
    const entry: ListenerEntry = {
      event,
      callback: callback as EventCallback<WebSocketEventName>,
    };
    this.listeners.push(entry);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /** Unsubscribe from a typed WebSocket event. */
  off<K extends WebSocketEventName>(
    event: K,
    callback: EventCallback<K>,
  ): void {
    this.listeners = this.listeners.filter(
      (entry) => !(entry.event === event && entry.callback === callback),
    );

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  /** Check whether the socket is currently connected. */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
