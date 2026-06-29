import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import apiFetch from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface ChatMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  role: string;
  message: string;
  createdAt: string;
}

export interface ChatUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: "Provider" | "NGO" | "Admin";
  isActive: boolean;
  profile?: any;
}

export interface Conversation {
  _id: string;
  participants: ChatUser[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  conversations: Conversation[];
  contacts: ChatUser[];
  activeChat: Conversation | null;
  activeContact: ChatUser | null;
  loading: boolean;
  fetchConversations: () => Promise<void>;
  fetchContacts: () => Promise<void>;
  selectChatWithUser: (userId: string) => Promise<void>;
  sendMessageToUser: (userId: string, message: string) => Promise<void>;
  setActiveChat: (chat: Conversation | null) => void;
  setActiveContact: (contact: ChatUser | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [activeContact, setActiveContact] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const data = await apiFetch("/chats");
      setConversations(data);
      
      // Update activeChat if it's currently open to see new messages
      if (activeChat) {
        const updated = data.find((c: Conversation) => c._id === activeChat._id);
        if (updated) {
          setActiveChat(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  const fetchContacts = async () => {
    if (!currentUser) return;
    try {
      const data = await apiFetch("/users/contacts");
      setContacts(data);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    }
  };

  const fetchConversationsRef = useRef(fetchConversations);
  useEffect(() => {
    fetchConversationsRef.current = fetchConversations;
  });

  useEffect(() => {
    if (currentUser) {
      fetchConversationsRef.current();
      fetchContacts();
      const interval = setInterval(() => {
        fetchConversationsRef.current();
      }, 2000); // 2 seconds polling for real-time chat feel
      return () => clearInterval(interval);
    } else {
      setConversations([]);
      setContacts([]);
      setActiveChat(null);
      setActiveContact(null);
    }
  }, [currentUser]);

  const selectChatWithUser = async (userId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/chats/${userId}`);
      setActiveChat(data);
      const otherUser = data.participants.find((p: ChatUser) => p._id === userId || p.id === userId);
      if (otherUser) {
        setActiveContact(otherUser);
      }
      await fetchConversations();
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToUser = async (userId: string, message: string) => {
    try {
      const data = await apiFetch(`/chats/${userId}`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setActiveChat(data);
      await fetchConversations();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        contacts,
        activeChat,
        activeContact,
        loading,
        fetchConversations,
        fetchContacts,
        selectChatWithUser,
        sendMessageToUser,
        setActiveChat,
        setActiveContact,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
