import { useEffect, useState } from 'react';
import { usePersistentWebSocket } from '../hooks/use-persistent-websocket';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface OrderBookLevel {
  id: number;
  side: 'Buy' | 'Sell';
  size: number;
  price: number;
  symbol: string;
}

export const BitMEXOrderBook = () => {
  const { isConnected, isConnecting, error, send, lastMessage } = usePersistentWebSocket({
    url: 'wss://ws.bitmex.com/realtime',
    replayOnMount: true,
  });

  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  }>({ bids: [], asks: [] });
  
  const [subscribed, setSubscribed] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addDebugMessage = (msg: string) => {
    setDebugMessages((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    if (isConnected && !subscribed) {
      addDebugMessage('Connected! Subscribing to XBTUSD orderbook...');
      send({
        op: 'subscribe',
        args: ['orderBookL2_25:XBTUSD'],
      });
      setSubscribed(true);
    }
  }, [isConnected, subscribed, send]);

  useEffect(() => {
    if (!lastMessage) return;

    console.log('BitMEX message:', lastMessage);

    if (lastMessage.info) {
      addDebugMessage(`Server: ${lastMessage.info}`);
      return;
    }

    if (lastMessage.success) {
      addDebugMessage(`✓ Subscribed to: ${lastMessage.subscribe}`);
      return;
    }

    if (lastMessage.error) {
      addDebugMessage(`✗ Error: ${lastMessage.error}`);
      return;
    }

    if (lastMessage.table === 'orderBookL2_25') {
      const { action, data } = lastMessage;
      addDebugMessage(`Received ${action} with ${data?.length || 0} levels`);

      if (action === 'partial') {
        const bids = data.filter((level: OrderBookLevel) => level.side === 'Buy');
        const asks = data.filter((level: OrderBookLevel) => level.side === 'Sell');
        
        setOrderBook({
          bids: bids.sort((a: OrderBookLevel, b: OrderBookLevel) => b.price - a.price),
          asks: asks.sort((a: OrderBookLevel, b: OrderBookLevel) => a.price - b.price),
        });
      } else if (action === 'update') {
        setOrderBook((prev) => {
          const newBids = [...prev.bids];
          const newAsks = [...prev.asks];

          data.forEach((update: Partial<OrderBookLevel> & { id: number; side: 'Buy' | 'Sell' }) => {
            const list = update.side === 'Buy' ? newBids : newAsks;
            const index = list.findIndex((level) => level.id === update.id);
            
            if (index !== -1) {
              list[index] = { ...list[index], ...update };
            }
          });

          return {
            bids: newBids.sort((a, b) => b.price - a.price),
            asks: newAsks.sort((a, b) => a.price - b.price),
          };
        });
      } else if (action === 'insert') {
        setOrderBook((prev) => {
          const newBids = [...prev.bids];
          const newAsks = [...prev.asks];

          data.forEach((level: OrderBookLevel) => {
            if (level.side === 'Buy') {
              newBids.push(level);
            } else {
              newAsks.push(level);
            }
          });

          return {
            bids: newBids.sort((a, b) => b.price - a.price),
            asks: newAsks.sort((a, b) => a.price - b.price),
          };
        });
      } else if (action === 'delete') {
        setOrderBook((prev) => {
          const newBids = prev.bids.filter(
            (level) => !data.some((d: OrderBookLevel) => d.id === level.id && d.side === 'Buy')
          );
          const newAsks = prev.asks.filter(
            (level) => !data.some((d: OrderBookLevel) => d.id === level.id && d.side === 'Sell')
          );

          return { bids: newBids, asks: newAsks };
        });
      }
    }
  }, [lastMessage]);

  const spread = orderBook.asks[0] && orderBook.bids[0] 
    ? (orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)
    : 'N/A';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">BitMEX Order Book (XBTUSD)</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time Bitcoin perpetual futures orderbook
          </p>
        </div>
        <div className="flex items-center gap-4">
          {orderBook.bids.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Spread: </span>
              <span className="font-mono font-semibold">${spread}</span>
            </div>
          )}
          {isConnecting && (
            <div className="flex items-center gap-2 text-yellow-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent" />
              <span className="text-sm font-medium">Connecting...</span>
            </div>
          )}
          {isConnected && !isConnecting && (
            <div className="flex items-center gap-2 text-green-600">
              <Wifi size={20} />
              <span className="text-sm font-medium">Connected</span>
            </div>
          )}
          {!isConnected && !isConnecting && (
            <div className="flex items-center gap-2 text-red-600">
              <WifiOff size={20} />
              <span className="text-sm font-medium">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {(error || debugMessages.length > 0) && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              Connection Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs font-mono">
              {error && (
                <div className="text-red-600 mb-2">
                  Error: {error.message}
                </div>
              )}
              {debugMessages.map((msg, i) => (
                <div key={i} className="text-muted-foreground">{msg}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {orderBook.bids.length === 0 && orderBook.asks.length === 0 && isConnected && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-4" />
            <p>Waiting for orderbook data...</p>
            <p className="text-xs mt-2">Subscribed to orderBookL2_25:XBTUSD</p>
          </CardContent>
        </Card>
      )}

      {(orderBook.bids.length > 0 || orderBook.asks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asks (Sell Orders) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-red-600">Asks (Sell) - {orderBook.asks.length} levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground pb-2 border-b">
                  <div>Price (USD)</div>
                  <div className="text-right">Size (Contracts)</div>
                  <div className="text-right">Total (USD)</div>
                </div>
                {orderBook.asks.slice(0, 15).reverse().map((level) => (
                  <div
                    key={level.id}
                    className="grid grid-cols-3 gap-2 text-sm font-mono hover:bg-red-50 p-1 rounded transition-colors"
                  >
                    <div className="text-red-600 font-semibold">${level.price.toLocaleString()}</div>
                    <div className="text-right">{level.size.toLocaleString()}</div>
                    <div className="text-right text-muted-foreground">
                      ${(level.size * level.price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bids (Buy Orders) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-600">Bids (Buy) - {orderBook.bids.length} levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground pb-2 border-b">
                  <div>Price (USD)</div>
                  <div className="text-right">Size (Contracts)</div>
                  <div className="text-right">Total (USD)</div>
                </div>
                {orderBook.bids.slice(0, 15).map((level) => (
                  <div
                    key={level.id}
                    className="grid grid-cols-3 gap-2 text-sm font-mono hover:bg-green-50 p-1 rounded transition-colors"
                  >
                    <div className="text-green-600 font-semibold">${level.price.toLocaleString()}</div>
                    <div className="text-right">{level.size.toLocaleString()}</div>
                    <div className="text-right text-muted-foreground">
                      ${(level.size * level.price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
