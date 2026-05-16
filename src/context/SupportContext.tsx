import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import apiFetch from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface ChatMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  role: string;
  message: string;
  imageUrl?: string;
  seen?: boolean;
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  status: "Open" | "Closed";
  messages: ChatMessage[];
  unreadCountAdmin: number;
  unreadCountUser: number;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportContextType {
  tickets: SupportTicket[];
  activeTicket: SupportTicket | null;
  fetchTickets: () => Promise<void>;
  sendMessage: (msg: string, imageUrl?: string) => Promise<void>;
  replyToTicket: (id: string, msg: string, imageUrl?: string) => Promise<void>;
  closeTicket: (id: string) => Promise<void>;
  markAsSeen: (id: string) => Promise<void>;
  unreadCount: number;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const SupportProvider = ({ children }: { children: ReactNode }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const { currentUser } = useAuth();

  const fetchTickets = async () => {
    try {
      const data = await apiFetch("/support");
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 3000); // Polling faster for real-time feel
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const sendMessage = async (message: string, imageUrl?: string) => {
    await apiFetch("/support", {
      method: "POST",
      body: JSON.stringify({ message, imageUrl }),
    });
    fetchTickets();
  };

  const replyToTicket = async (id: string, message: string, imageUrl?: string) => {
    await apiFetch(`/support/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ message, imageUrl }),
    });
    fetchTickets();
  };

  const closeTicket = async (id: string) => {
    await apiFetch(`/support/${id}/close`, { method: "PUT" });
    fetchTickets();
  };

  const markAsSeen = async (id: string) => {
    await apiFetch(`/support/${id}/seen`, { method: "PUT" });
    fetchTickets();
  };

  const activeTicket = tickets.find((t) => t.status === "Open") || (tickets.length > 0 ? tickets[0] : null);
  
  const unreadCount = tickets.reduce((acc, t) => {
    return acc + (currentUser?.role === "Admin" ? t.unreadCountAdmin : t.unreadCountUser);
  }, 0);

  return (
    <SupportContext.Provider value={{ tickets, activeTicket, fetchTickets, sendMessage, replyToTicket, closeTicket, markAsSeen, unreadCount }}>
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const ctx = useContext(SupportContext);
  if (!ctx) throw new Error("useSupport must be used within SupportProvider");
  return ctx;
};
