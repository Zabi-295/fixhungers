import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import apiFetch from "@/lib/api";
import { useAuth } from "./AuthContext";
import useSocket from "@/hooks/useSocket";

// --- Types ---

export interface ChatMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  role: string;
  message: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  read?: boolean;
  delivered?: boolean;
  deleted_for_everyone?: boolean;
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
  lastMessage?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  conversations: Conversation[];
  contacts: ChatUser[];
  activeChat: Conversation | null;
  activeContact: ChatUser | null;
  loading: boolean;
  isConnected: boolean;
  fetchConversations: () => Promise<void>;
  fetchContacts: () => Promise<void>;
  selectChatWithUser: (userId: string) => Promise<void>;
  sendMessageToUser: (userId: string, message: string, file?: { url: string; type: string; name: string }) => void;
  markAsRead: (userId: string) => Promise<void>;
  deleteForMe: (messageId: string) => Promise<void>;
  deleteForEveryone: (messageId: string) => Promise<void>;
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
  const { socket, isConnected } = useSocket();

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const activeContactRef = useRef(activeContact);
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // --- REST API calls ---

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await apiFetch("/chats");
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  }, [currentUser]);

  const fetchContacts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await apiFetch("/users/contacts");
      setContacts(data);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    }
  }, [currentUser]);

  // --- Socket Event Listeners ---

  useEffect(() => {
    if (!socket || !currentUser) return;

    // When a new message arrives from another user
    const handleReceiveMessage = (msg: ChatMessage) => {
      console.log("📩 receiveMessage:", msg);

      // Update active chat if we're chatting with the sender
      const currentActiveContact = activeContactRef.current;
      if (currentActiveContact && (msg.senderId === currentActiveContact._id || msg.senderId === currentActiveContact.id)) {
        setActiveChat((prev) => {
          if (!prev) return prev;
          // Don't add duplicate messages
          const exists = prev.messages.some((m) => m._id === msg._id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, msg],
          };
        });
      }

      // Always refresh conversations list for updated last message / unread count
      fetchConversations();
    };

    // When our sent message is confirmed
    const handleMessageSent = (msg: ChatMessage) => {
      console.log("✅ messageSent:", msg);
      setActiveChat((prev) => {
        if (!prev) return prev;
        const exists = prev.messages.some((m) => m._id === msg._id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [...prev.messages, msg],
        };
      });
      fetchConversations();
    };

    // When someone reads our messages
    const handleMessagesRead = ({ readerId }: { readerId: string }) => {
      console.log("👁️ messagesRead by:", readerId);
      setActiveChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.senderId === currentUser.id ? { ...m, read: true } : m
          ),
        };
      });
    };

    // When messages are delivered
    const handleMessagesDelivered = ({ receiverId }: { receiverId: string }) => {
      console.log("📨 messagesDelivered to:", receiverId);
      setActiveChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.senderId === currentUser.id ? { ...m, delivered: true } : m
          ),
        };
      });
    };

    // When a message is deleted for everyone
    const handleMessageDeletedEveryone = ({ messageId }: { messageId: string }) => {
      console.log("🗑️ messageDeletedEveryone:", messageId);
      setActiveChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m._id === messageId ? { ...m, message: "This message was deleted", deleted_for_everyone: true, file_url: undefined } : m
          ),
        };
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("messagesDelivered", handleMessagesDelivered);
    socket.on("messageDeletedEveryone", handleMessageDeletedEveryone);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("messagesDelivered", handleMessagesDelivered);
      socket.off("messageDeletedEveryone", handleMessageDeletedEveryone);
    };
  }, [socket, currentUser, fetchConversations]);

  // --- Initial data load + lightweight polling fallback ---

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
      fetchContacts();
      // Lightweight polling as fallback in case socket misses an event (e.g. reconnect)
      const interval = setInterval(fetchConversations, 8000);
      return () => clearInterval(interval);
    } else {
      setConversations([]);
      setContacts([]);
      setActiveChat(null);
      setActiveContact(null);
    }
  }, [currentUser, fetchConversations]);

  // Poll active chat messages when socket is disconnected (e.g. on Vercel)
  useEffect(() => {
    const currentUserId = currentUser?.id || currentUser?._id || currentUser?.uid;
    if (currentUserId && !isConnected && activeContact) {
      const targetContactId = activeContact._id || activeContact.id;
      const pollActiveChat = async () => {
        try {
          const data = await apiFetch(`/chats/${targetContactId}`);
          // Ensure we don't overwrite if the active contact changed during request
          const latestContact = activeContactRef.current;
          if (latestContact && (latestContact._id === targetContactId || latestContact.id === targetContactId)) {
            setActiveChat(data);
          }
        } catch (err) {
          console.error("Failed to poll active chat:", err);
        }
      };

      // Poll every 3 seconds for near real-time updates when offline
      const pollInterval = setInterval(pollActiveChat, 3000);
      return () => clearInterval(pollInterval);
    }
  }, [currentUser, isConnected, activeContact]);

  // --- Actions ---

  const selectChatWithUser = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/chats/${userId}`);
      setActiveChat(data);
      const otherUser = data.participants.find((p: ChatUser) => p._id === userId || p.id === userId);
      if (otherUser) {
        setActiveContact(otherUser);
      }
      // Mark messages as read when opening chat
      await apiFetch(`/chats/${userId}/read`, { method: "PUT" });
      await fetchConversations();
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchConversations]);

  const sendMessageToUser = useCallback((userId: string, message: string, file?: { url: string; type: string; name: string }) => {
    if (!currentUser) return;

    // Use socket for real-time delivery
    if (socket && isConnected) {
      socket.emit("sendMessage", {
        sender: currentUser.id,
        receiver: userId,
        content: message,
        file_url: file?.url,
        file_type: file?.type,
        file_name: file?.name,
      });
    } else {
      // Fallback to REST if socket isn't connected
      apiFetch(`/chats/${userId}`, {
        method: "POST",
        body: JSON.stringify({ message, file_url: file?.url, file_type: file?.type, file_name: file?.name }),
      }).then(() => {
        fetchConversations();
        // Reload active chat
        if (activeContactRef.current) {
          apiFetch(`/chats/${userId}`).then(setActiveChat);
        }
      });
    }
  }, [currentUser, socket, isConnected, fetchConversations]);

  const markAsRead = useCallback(async (userId: string) => {
    try {
      await apiFetch(`/chats/${userId}/read`, { method: "PUT" });
      await fetchConversations();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, [fetchConversations]);

  const deleteForMe = useCallback(async (messageId: string) => {
    try {
      await apiFetch(`/chats/messages/${messageId}/delete-for-me`, { method: "PUT" });
      setActiveChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((m) => m._id !== messageId),
        };
      });
    } catch (err) {
      console.error("Failed to delete for me:", err);
    }
  }, []);

  const deleteForEveryone = useCallback(async (messageId: string) => {
    try {
      await apiFetch(`/chats/messages/${messageId}/delete-for-everyone`, { method: "PUT" });
      setActiveChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m._id === messageId ? { ...m, message: "This message was deleted", deleted_for_everyone: true, file_url: undefined } : m
          ),
        };
      });
    } catch (err) {
      console.error("Failed to delete for everyone:", err);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        contacts,
        activeChat,
        activeContact,
        loading,
        isConnected,
        fetchConversations,
        fetchContacts,
        selectChatWithUser,
        sendMessageToUser,
        markAsRead,
        deleteForMe,
        deleteForEveryone,
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
