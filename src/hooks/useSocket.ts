import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    // Strip /api from the URL to get the base server URL
    return import.meta.env.VITE_API_URL.replace(/\/api$/, "");
  }
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return "http://localhost:5000";
};

export const useSocket = () => {
  const { currentUser } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setIsConnected(true);
      // Join private room with user's MongoDB _id
      socket.emit("join", currentUser.id);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("🔌 Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [currentUser?.id]);

  return { socket: socketRef.current, isConnected };
};

export default useSocket;
