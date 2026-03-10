import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const WS_URL = (() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return base.replace(/^http/, 'ws') + '/ws';
})();

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch {
        setLastMessage({ type: 'raw', data: event.data });
      }
    };
    setSocket(ws);
    return () => ws.close();
  }, []);

  const send = useCallback((payload) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
  }, [socket]);

  const value = { socket, send, lastMessage, connected };
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
