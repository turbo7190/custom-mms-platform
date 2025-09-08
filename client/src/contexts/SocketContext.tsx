import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, client } = useAuth();

  useEffect(() => {
    if (user && client) {
      const newSocket = io(
        process.env.REACT_APP_API_URL || "http://localhost:5000",
        {
          transports: ["websocket"],
          autoConnect: true,
        }
      );

      newSocket.on("connect", () => {
        console.log("Socket connected");
        setConnected(true);

        // Join client room for real-time updates
        newSocket.emit("join-client", client.id);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, client]);

  const emit = (event: string, data: any) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  };

  const value: SocketContextType = {
    socket,
    connected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
