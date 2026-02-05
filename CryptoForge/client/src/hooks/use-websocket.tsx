import { useEffect, useRef, useState } from "react";

export interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [onMessage]);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return {
    connected,
    lastMessage,
    sendMessage,
  };
}
