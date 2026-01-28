import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { handleWebSocketError } from "../utils/error-handler";

export interface WebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

export interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler?: (data: any) => void) => void;
}

export const useWebSocket = (
  options: WebSocketOptions
): WebSocketHookReturn => {
  const {
    url,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    reconnectionDelayMax = 30000,
    timeout = 20000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const socket = io(url, {
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      reconnectionDelayMax,
      timeout,
      randomizationFactor: 0.5,
      autoConnect,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    socket.on("connecting", () => {
      setIsConnecting(true);
      setIsConnected(false);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      setIsConnecting(false);
      
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("reconnect_attempt", () => {
      setIsConnecting(true);
      setError(null);
    });

    socket.on("reconnect", (attemptNumber) => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
    });

    socket.on("reconnect_failed", () => {
      setIsConnecting(false);
      const err = new Error(
        `Failed to reconnect after ${reconnectionAttempts} attempts`
      );
      setError(err);
      console.error("WebSocket reconnection failed:", err);
    });

    socket.on("connect_error", (err) => {
      setIsConnected(false);
      setIsConnecting(false);
      const appError = handleWebSocketError(err);
      setError(new Error(appError.message));
      console.error("WebSocket connection error:", appError);
    });

    socket.on("error", (err) => {
      const appError = handleWebSocketError(err);
      setError(new Error(appError.message));
      console.error("WebSocket error:", appError);
    });

    return () => {
      eventHandlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          socket.off(event, handler);
        });
      });
      eventHandlersRef.current.clear();
      socket.disconnect();
    };
  }, [
    url,
    autoConnect,
    reconnection,
    reconnectionAttempts,
    reconnectionDelay,
    reconnectionDelayMax,
    timeout,
  ]);

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      setIsConnecting(true);
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(
        `WebSocket is not connected. Cannot emit event "${event}".`
      );
    }
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (socketRef.current) {
      if (!eventHandlersRef.current.has(event)) {
        eventHandlersRef.current.set(event, new Set());
      }
      eventHandlersRef.current.get(event)!.add(handler);

      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler?: (data: any) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
        eventHandlersRef.current.get(event)?.delete(handler);
      } else {
        const handlers = eventHandlersRef.current.get(event);
        if (handlers) {
          handlers.forEach((h) => {
            socketRef.current?.off(event, h);
          });
          eventHandlersRef.current.delete(event);
        }
      }
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};
