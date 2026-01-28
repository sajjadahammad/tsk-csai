import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../hooks/use-websocket';
import { io } from 'socket.io-client';

vi.mock('socket.io-client');

describe('useWebSocket', () => {
    let mockSocket: any;
    let eventHandlers: Record<string, Function>;

    beforeEach(() => {
        eventHandlers = {};
        mockSocket = {
            on: vi.fn((event, handler) => {
                eventHandlers[event] = handler;
            }),
            off: vi.fn(),
            emit: vi.fn(),
            disconnect: vi.fn(),
            connect: vi.fn(),
            connected: false,
        };
        (io as any).mockReturnValue(mockSocket);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should connect on mount', () => {
        renderHook(() => useWebSocket({ url: 'http://localhost:3000' }));
        expect(io).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
    });

    it('should disconnect on unmount', () => {
        const { unmount } = renderHook(() => useWebSocket({ url: 'http://localhost:3000' }));
        unmount();
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should track connection status', () => {
        const { result } = renderHook(() => useWebSocket({ url: 'http://localhost:3000' }));

        expect(result.current.isConnected).toBe(false);

        act(() => {
            eventHandlers['connect']();
        });
        expect(result.current.isConnected).toBe(true);

        act(() => {
            eventHandlers['disconnect']('transport close');
        });
        expect(result.current.isConnected).toBe(false);
    });

    it('should track connecting status', () => {
        const { result } = renderHook(() => useWebSocket({ url: 'http://localhost:3000' }));

        expect(result.current.isConnecting).toBe(false);

        act(() => {
            eventHandlers['connecting']();
        });
        expect(result.current.isConnecting).toBe(true);

        act(() => {
            eventHandlers['connect']();
        });
        expect(result.current.isConnecting).toBe(false);
    });

    it('should emit events', () => {
        mockSocket.connected = true;
        const { result } = renderHook(() => useWebSocket({ url: 'http://localhost:3000' }));

        result.current.emit('test-event', { foo: 'bar' });
        expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { foo: 'bar' });
    });

    it('should allow subscription to events', () => {
        const { result } = renderHook(() => useWebSocket({ url: 'http://localhost:3000' }));
        const callback = vi.fn();

        act(() => {
            result.current.on('my-event', callback);
        });
        expect(mockSocket.on).toHaveBeenCalledWith('my-event', callback);

        act(() => {
            result.current.off('my-event', callback);
        });
        expect(mockSocket.off).toHaveBeenCalledWith('my-event', callback);
    });

    it('should handle manual connect', () => {
        const { result } = renderHook(() => useWebSocket({ url: 'http://localhost:3000', autoConnect: false }));

        act(() => {
            result.current.connect();
        });
        expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should handle manual disconnect', () => {
        mockSocket.connected = true;
        const { result } = renderHook(() => useWebSocket({ url: 'http://localhost:3000' }));

        act(() => {
            result.current.disconnect();
        });
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });
});
