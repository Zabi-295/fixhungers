import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import useSocket from "@/hooks/useSocket";
import apiFetch from "@/lib/api";
import {
  Search, Send, MessageSquare, ArrowLeft, Shield,
  User, Phone, MapPin, MessageCircle, Check, CheckCheck,
  Paperclip, FileText, Trash2, MoreVertical, Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
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

interface ChatUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  profile?: any;
}

interface ConversationItem {
  _id: string;
  participants: ChatUser[];
  lastMessage?: string;
  unreadCount?: number;
  updatedAt: string;
}

const AdminMessages = () => {
  const { currentUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMobileChat, setViewMobileChat] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: ChatMessage } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedUserRef = useRef(selectedUser);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch all conversations for admin
  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiFetch("/chats");
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch admin conversations:", err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000); // Optimized to 15 seconds
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Load chat with selected user
  const loadChatWithUser = useCallback(async (userId: string) => {
    try {
      const data = await apiFetch(`/chats/${userId}`);
      setMessages(data.messages || []);
      // Mark as read
      await apiFetch(`/chats/${userId}/read`, { method: "PUT" });
      fetchConversations();
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  }, [fetchConversations]);

  // Select a conversation
  const handleSelectConversation = async (user: ChatUser) => {
    setSelectedUser(user);
    setViewMobileChat(true);
    await loadChatWithUser(user._id);
  };

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close context menu
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleReceiveMessage = (msg: ChatMessage) => {
      const currentSelectedUser = selectedUserRef.current;
      if (currentSelectedUser && msg.senderId === currentSelectedUser._id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
        // Auto mark as read
        apiFetch(`/chats/${currentSelectedUser._id}/read`, { method: "PUT" }).catch(() => {});
      }
      fetchConversations();
    };

    const handleMessageSent = (msg: ChatMessage) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
      fetchConversations();
    };

    const handleMessagesRead = () => {
      setMessages((prev) =>
        prev.map((m) => (m.senderId === currentUser.id ? { ...m, read: true } : m))
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
  }, [socket, currentUser, fetchConversations]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    if (socket && isConnected) {
      socket.emit("sendMessage", {
        sender: currentUser!.id,
        receiver: selectedUser._id,
        content: inputText.trim(),
      });
    } else {
      await apiFetch(`/chats/${selectedUser._id}`, {
        method: "POST",
        body: JSON.stringify({ message: inputText.trim() }),
      });
      loadChatWithUser(selectedUser._id);
    }
    setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (socket && isConnected) {
        socket.emit("sendMessage", {
          sender: currentUser!.id,
          receiver: selectedUser._id,
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

  const handleDeleteForMe = async (messageId: string) => {
    try {
      await apiFetch(`/chats/messages/${messageId}/delete-for-me`, { method: "PUT" });
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    try {
      await apiFetch(`/chats/messages/${messageId}/delete-for-everyone`, { method: "PUT" });
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, message: "This message was deleted", deleted_for_everyone: true, file_url: undefined } : m))
      );
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const getOtherUser = (conv: ConversationItem): ChatUser | undefined => {
    return conv.participants.find((p) => p._id !== currentUser?.id);
  };

  const filteredConversations = (conversations || []).filter((conv) => {
    if (!searchQuery) return true;
    const other = getOtherUser(conv);
    return (other?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (other?.email || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Support Messages
        </h1>
        <p className="text-muted-foreground text-sm">
          Reply to support requests from Providers and NGOs.
        </p>
      </div>

      <div className="flex h-[calc(100vh-220px)] min-h-[450px] bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        {/* LEFT SIDEBAR */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card/60 ${viewMobileChat ? "hidden md:flex" : "flex"}`}>
          {/* Header */}
          <div className="p-4 border-b border-border bg-card">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> All Chats
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              {isConnected ? (
                <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
                </span>
              ) : (
                <span className="flex items-center gap-1 text-blue-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Cloud Sync
                </span>
              )}
            </p>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-border bg-card/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-background border-border"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredConversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                <MessageCircle className="w-12 h-12 mb-2 text-muted-foreground" />
                <p className="text-sm font-semibold">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Users will appear here when they contact support.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const otherUser = getOtherUser(conv);
                if (!otherUser) return null;
                const isSelected = selectedUser?._id === otherUser._id;
                const lastMsg = conv.lastMessage || "No messages yet";
                const time = conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(otherUser)}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition ${
                      isSelected ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/40 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-border">
                      {otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-sm text-foreground truncate">{otherUser.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 font-medium ${
                            otherUser.role === "Provider"
                              ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                              : "text-purple-600 bg-purple-50 dark:bg-purple-950/20"
                          }`}
                        >
                          {otherUser.role}
                        </Badge>
                        {conv.unreadCount && conv.unreadCount > 0 ? (
                          <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{lastMsg}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT CHAT AREA */}
        <div className={`flex-1 flex flex-col bg-background/30 ${!viewMobileChat ? "hidden md:flex" : "flex"}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="md:hidden p-0 w-8 h-8 rounded-full"
                    onClick={() => setViewMobileChat(false)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-border">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      {selectedUser.name}
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 font-medium ${
                          selectedUser.role === "Provider"
                            ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                            : "text-purple-600 bg-purple-50 dark:bg-purple-950/20"
                        }`}
                      >
                        {selectedUser.role}
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/15">
                {messages.length > 0 ? (
                  messages.map((m, i) => {
                    const isMe = m.senderId === currentUser?.id;
                    return (
                      <div
                        key={m._id || i}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, message: m });
                        }}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm relative group ${
                            isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border text-foreground rounded-tl-none"
                          } ${m.deleted_for_everyone ? "opacity-60 italic" : ""}`}
                        >
                          {!m.deleted_for_everyone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({ x: e.clientX, y: e.clientY, message: m });
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-black/10"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="flex items-center justify-between gap-4 mb-1 opacity-70 text-[9px]">
                            <span className="font-semibold">{m.senderName}</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>

                          {/* File */}
                          {m.file_url && !m.deleted_for_everyone && (
                            m.file_type?.startsWith("image/") ? (
                              <img src={m.file_url} alt="attachment" className="rounded-lg max-w-full mt-1 mb-1" />
                            ) : (
                              <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline mt-1">
                                <FileText className="w-3 h-3" /> {m.file_name || "Download"}
                              </a>
                            )
                          )}

                          {m.message && <p className="leading-relaxed break-words">{m.message}</p>}

                          {isMe && (
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
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <MessageSquare className="w-12 h-12 mb-2 text-muted-foreground" />
                    <p className="text-sm font-semibold">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Reply to start the conversation</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2 items-center">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition shrink-0">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Reply to ${selectedUser.name}...`}
                  className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 border border-border">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Admin Support Inbox</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Select a conversation from the sidebar to reply to support requests from users.
              </p>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-[100] bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 text-foreground transition"
              onClick={() => { handleDeleteForMe(contextMenu.message._id!); setContextMenu(null); }}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" /> Delete for me
            </button>
            {contextMenu.message.senderId === currentUser?.id && !contextMenu.message.deleted_for_everyone && (
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-destructive/10 flex items-center gap-2 text-destructive transition"
                onClick={() => { handleDeleteForEveryone(contextMenu.message._id!); setContextMenu(null); }}
              >
                <Trash2 className="w-4 h-4" /> Delete for everyone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
