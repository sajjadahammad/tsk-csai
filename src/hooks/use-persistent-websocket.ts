import { useEffect, useState, useCallback } from 'react';
import { wsManager } from '../lib/websocket-manager';

export interface UsePersistentWebSocketOptions {
  url: string;
  replayOnMount?: boolean;
}

export interface UsePersistentWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  send: (data: any) => void;
  lastMessage: any;
}

export const usePersistentWebSocket = (
  options: UsePersistentWebSocketOptions
): UsePersistentWebSocketReturn => {
  const { url, replayOnMount = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const unsubscribeMessages = wsManager.subscribe(url, (data) => {
      setLastMessage(data);
    }, replayOnMount);

    const unsubscribeStatus = wsManager.subscribeToStatus(url, (status) => {
      setIsConnected(status.isConnected);
      setIsConnecting(status.isConnecting);
      setError(status.error);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
    };
  }, [url, replayOnMount]);

  const send = useCallback(
    (data: any) => {
      wsManager.send(url, data);
    },
    [url]
  );

  return {
    isConnected,
    isConnecting,
    error,
    send,
    lastMessage,
  };
};
