import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socketInstance = null;

/**
 * Hook to connect to Socket.io and join/leave session rooms.
 * Memoizes the socket to prevent reconnection on re-renders.
 */
export function useSocket(sessionId) {
  const handlersRef = useRef({});

  useEffect(() => {
    // Create singleton socket; reset if previously disconnected
    if (!socketInstance || socketInstance.disconnected) {
      if (socketInstance) {
        socketInstance.removeAllListeners();
      }
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        // Function form re-reads the token on every (re)connect attempt,
        // so a rotated/refreshed access token is picked up automatically.
        auth: (cb) => cb({ token: sessionStorage.getItem('labscan_token') }),
      });
    }

    const socket = socketInstance;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      if (sessionId) {
        socket.emit('join_session_room', sessionId);
      }
    });

    if (socket.connected && sessionId) {
      socket.emit('join_session_room', sessionId);
    }

    return () => {
      if (sessionId) {
        socket.emit('leave_session_room', sessionId);
      }
      // Remove all listeners registered via this hook instance
      Object.entries(handlersRef.current).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      handlersRef.current = {};
    };
  }, [sessionId]);

  const on = useCallback((event, handler) => {
    if (!socketInstance) return;
    handlersRef.current[event] = handler;
    socketInstance.on(event, handler);
  }, []);

  const off = useCallback((event, _handler) => {
    // _handler parameter accepted for API compatibility but we always
    // remove the handler registered via on() to guarantee cleanup.
    if (!socketInstance) return;
    const handler = handlersRef.current[event];
    if (handler) {
      socketInstance.off(event, handler);
      delete handlersRef.current[event];
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (!socketInstance) return;
    socketInstance.emit(event, data);
  }, []);

  return { on, off, emit };
}
