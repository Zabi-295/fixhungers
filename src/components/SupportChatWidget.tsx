import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Shield, User, Check, CheckCheck, Wifi, WifiOff, Paperclip } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useSocket from "@/hooks/useSocket";
import apiFetch from "@/lib/api";
import { useLocation } from "react-router-dom";

interface SupportMessage {
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

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const SupportChatWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch admin user ID
  useEffect(() => {
    if (!currentUser) return;
    const fetchAdmin = async () => {
      try {
        const data = await apiFetch("/chats/admin-user");
        setAdminUser(data);
      } catch (err) {
        console.error("Failed to fetch admin user:", err);
      }
    };
    fetchAdmin();
  }, [currentUser]);

  // Load chat history with admin
  const loadHistory = useCallback(async () => {
    if (!adminUser) return;
    try {
      const data = await apiFetch(`/chats/${adminUser._id}`);
      setMessages(data.messages || []);
      // Count unread from admin
      const unread = (data.messages || []).filter(
        (m: SupportMessage) => m.senderId === adminUser._id && !m.read
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to load support history:", err);
    }
  }, [adminUser]);

  useEffect(() => {
    if (adminUser) loadHistory();
  }, [adminUser, loadHistory]);

  // Mark as read when opening
  useEffect(() => {
    if (isOpen && adminUser) {
      apiFetch(`/chats/${adminUser._id}/read`, { method: "PUT" }).catch(() => {});
      setUnreadCount(0);
    }
  }, [isOpen, adminUser]);

  // Scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  // Socket listeners for real-time
  useEffect(() => {
    if (!socket || !adminUser) return;

    const handleReceiveMessage = (msg: SupportMessage) => {
      // Only handle messages from admin
      if (msg.senderId === adminUser._id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        } else {
          // Auto-mark as read
          apiFetch(`/chats/${adminUser._id}/read`, { method: "PUT" }).catch(() => {});
        }
      }
    };

    const handleMessageSent = (msg: SupportMessage) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
    };

    const handleMessagesRead = () => {
      setMessages((prev) =>
        prev.map((m) => (m.senderId === currentUser?.id ? { ...m, read: true } : m))
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, adminUser, isOpen, currentUser]);

  // Polling fallback
  useEffect(() => {
    if (!adminUser) return;
    const interval = setInterval(loadHistory, 15000); // Optimized to 15 seconds
    return () => clearInterval(interval);
  }, [adminUser, loadHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !adminUser) return;

    if (socket && isConnected) {
      socket.emit("sendMessage", {
        sender: currentUser!.id,
        receiver: adminUser._id,
        content: msg.trim(),
      });
    } else {
      // Fallback to REST
      await apiFetch(`/chats/${adminUser._id}`, {
        method: "POST",
        body: JSON.stringify({ message: msg.trim() }),
      });
      loadHistory();
    }
    setMsg("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminUser) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (socket && isConnected) {
        socket.emit("sendMessage", {
          sender: currentUser!.id,
          receiver: adminUser._id,
          content: "",
          file_url: base64,
          file_type: file.type,
          file_name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPortalPage = location.pathname.startsWith("/provider") || location.pathname.startsWith("/ngo");
  if (!currentUser || currentUser.role === "Admin" || !isPortalPage) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform hover:scale-105 z-50"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          style={{ height: "500px", maxHeight: "80vh" }}
        >
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <Shield className="w-4 h-4" /> Admin Support
              </h3>
              <p className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
                {isConnected ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Live Chat
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-200" /> Cloud Sync
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="opacity-80 hover:opacity-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/30">
            {messages.length > 0 ? (
              messages.map((m, i) => {
                const isAdmin = m.role === "Admin" || m.senderId === adminUser?._id;
                const isMine = m.senderId === currentUser?.id;
                return (
                  <div key={m._id || i} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
                        isAdmin
                          ? "bg-card border border-border text-foreground rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      } ${m.deleted_for_everyone ? "opacity-60 italic" : ""}`}
                    >
                      <div className="flex items-center gap-1 mb-1 opacity-70 text-[10px]">
                        {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span className="font-semibold">{m.senderName}</span>
                        <span className="ml-auto">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {/* File preview */}
                      {m.file_url && !m.deleted_for_everyone && (
                        m.file_type?.startsWith("image/") ? (
                          <img src={m.file_url} alt="attachment" className="rounded-lg max-w-full mt-1" />
                        ) : (
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block">
                            📎 {m.file_name || "Download"}
                          </a>
                        )
                      )}

                      {m.message && <p>{m.message}</p>}

                      {/* Ticks */}
                      {isMine && (
                        <div className="flex justify-end mt-0.5">
                          {m.read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                          ) : m.delivered ? (
                            <CheckCheck className="w-3.5 h-3.5 opacity-60" />
                          ) : (
                            <Check className="w-3.5 h-3.5 opacity-50" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                <MessageCircle className="w-12 h-12" />
                <p className="text-sm">
                  Need help?<br />Send a message to chat with Admin!
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2 items-center">
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
            <button
              type="submit"
              disabled={!msg.trim()}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4 ml-1" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;
