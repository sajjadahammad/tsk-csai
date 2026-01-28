type WebSocketInstance = {
  ws: WebSocket;
  url: string;
  subscribers: Set<(data: any) => void>;
  statusSubscribers: Set<(status: { isConnected: boolean; isConnecting: boolean; error: Error | null }) => void>;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  lastMessages: any[];
  maxMessages: number;
};

class WebSocketManager {
  private connections: Map<string, WebSocketInstance> = new Map();

  connect(url: string): WebSocketInstance {
    if (this.connections.has(url)) {
      const instance = this.connections.get(url)!;
      
      if (instance.ws.readyState === WebSocket.OPEN) {
        return instance;
      }
      
      if (instance.ws.readyState === WebSocket.CONNECTING) {
        return instance;
      }
      
      this.connections.delete(url);
    }

    const ws = new WebSocket(url);
    const instance: WebSocketInstance = {
      ws,
      url,
      subscribers: new Set(),
      statusSubscribers: new Set(),
      isConnected: false,
      isConnecting: true,
      error: null,
      lastMessages: [],
      maxMessages: 100,
    };

    ws.onopen = () => {
      console.log(`[WebSocketManager] Connected to ${url}`);
      instance.isConnected = true;
      instance.isConnecting = false;
      instance.error = null;
      this.notifyStatusSubscribers(instance);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        instance.lastMessages.push(data);
        if (instance.lastMessages.length > instance.maxMessages) {
          instance.lastMessages.shift();
        }
        
        instance.subscribers.forEach((callback) => callback(data));
      } catch (err) {
        console.error('[WebSocketManager] Failed to parse message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error(`[WebSocketManager] Error on ${url}:`, event);
      instance.error = new Error('WebSocket connection error');
      instance.isConnecting = false;
      this.notifyStatusSubscribers(instance);
    };

    ws.onclose = (event) => {
      console.log(`[WebSocketManager] Closed ${url}:`, event.code, event.reason);
      instance.isConnected = false;
      instance.isConnecting = false;
      this.notifyStatusSubscribers(instance);
      
      this.connections.delete(url);
      
      if (!event.wasClean) {
        console.log(`[WebSocketManager] Reconnecting to ${url} in 2s...`);
        setTimeout(() => {
          this.connect(url);
        }, 2000);
      }
    };

    this.connections.set(url, instance);
    return instance;
  }

  subscribe(url: string, callback: (data: any) => void, replayLast: boolean = false): () => void {
    const instance = this.connect(url);
    instance.subscribers.add(callback);
    
    if (replayLast && instance.lastMessages.length > 0) {
      setTimeout(() => {
        instance.lastMessages.forEach((msg) => callback(msg));
      }, 0);
    }
    
    return () => {
      instance.subscribers.delete(callback);
    };
  }

  subscribeToStatus(
    url: string,
    callback: (status: { isConnected: boolean; isConnecting: boolean; error: Error | null }) => void
  ): () => void {
    const instance = this.connect(url);
    instance.statusSubscribers.add(callback);
    
    callback({
      isConnected: instance.isConnected,
      isConnecting: instance.isConnecting,
      error: instance.error,
    });
    
    return () => {
      instance.statusSubscribers.delete(callback);
    };
  }

  send(url: string, data: any): void {
    const instance = this.connections.get(url);
    if (instance && instance.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      instance.ws.send(message);
    } else {
      console.warn(`[WebSocketManager] Cannot send to ${url} - not connected`);
    }
  }

  disconnect(url: string): void {
    const instance = this.connections.get(url);
    if (instance) {
      instance.ws.close(1000, 'Client disconnect');
      this.connections.delete(url);
    }
  }

  private notifyStatusSubscribers(instance: WebSocketInstance): void {
    const status = {
      isConnected: instance.isConnected,
      isConnecting: instance.isConnecting,
      error: instance.error,
    };
    instance.statusSubscribers.forEach((callback) => callback(status));
  }

  getStatus(url: string): { isConnected: boolean; isConnecting: boolean; error: Error | null } {
    const instance = this.connections.get(url);
    if (!instance) {
      return { isConnected: false, isConnecting: false, error: null };
    }
    return {
      isConnected: instance.isConnected,
      isConnecting: instance.isConnecting,
      error: instance.error,
    };
  }
}

export const wsManager = new WebSocketManager();
