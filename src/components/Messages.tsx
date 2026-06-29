import React, { useState, useEffect, useRef } from "react";
import { useChat, Conversation, ChatUser, ChatMessage } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import {
  Search, Send, MessageSquare, Plus, ArrowLeft,
  User, Phone, MapPin, MessageCircle, X, Check, CheckCheck,
  Paperclip, Image as ImageIcon, FileText, Trash2, MoreVertical,
  Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// --- Tick Component ---
const MessageTicks = ({ message, isCurrentUser }: { message: ChatMessage; isCurrentUser: boolean }) => {
  if (!isCurrentUser) return null;

  if (message.read) {
    return <CheckCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  }
  if (message.delivered) {
    return <CheckCheck className="w-3.5 h-3.5 opacity-60 shrink-0" />;
  }
  return <Check className="w-3.5 h-3.5 opacity-50 shrink-0" />;
};

// --- File Preview Component ---
const FilePreview = ({ message }: { message: ChatMessage }) => {
  if (!message.file_url || message.deleted_for_everyone) return null;

  if (message.file_type?.startsWith("image/")) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden max-w-[240px]">
        <img src={message.file_url} alt={message.file_name || "Image"} className="w-full h-auto rounded-lg" />
      </div>
    );
  }

  return (
    <a
      href={message.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 bg-background/30 rounded-lg px-3 py-2 text-xs hover:bg-background/50 transition"
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate">{message.file_name || "Download File"}</span>
    </a>
  );
};

const Messages = () => {
  const {
    conversations,
    contacts,
    activeChat,
    activeContact,
    loading,
    isConnected,
    selectChatWithUser,
    sendMessageToUser,
    markAsRead,
    deleteForMe,
    deleteForEveryone,
    setActiveChat,
    setActiveContact,
  } = useChat();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [searchConversation, setSearchConversation] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [viewMobileChat, setViewMobileChat] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: ChatMessage } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // Close context menu on click anywhere
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // Auto mark as read when opening chat
  useEffect(() => {
    if (activeContact) {
      markAsRead(activeContact._id || activeContact.id);
    }
  }, [activeContact, activeChat?.messages?.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;

    sendMessageToUser(activeContact._id || activeContact.id, inputText.trim());
    setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      sendMessageToUser(
        activeContact._id || activeContact.id,
        "",
        { url: base64, type: file.type, name: file.name }
      );
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleContextMenu = (e: React.MouseEvent, message: ChatMessage) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  };

  const handleStartChat = async (contact: ChatUser) => {
    setShowNewChatModal(false);
    await selectChatWithUser(contact._id || contact.id);
    setViewMobileChat(true);
  };

  const getOtherParticipant = (chat: Conversation) => {
    return chat.participants.find((p) => p._id !== currentUser?.id && p.id !== currentUser?.id);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((chat) => {
    if (!searchConversation) return true;
    const other = getOtherParticipant(chat);
    return other?.name.toLowerCase().includes(searchConversation.toLowerCase());
  });

  // Filter contacts
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchContact.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchContact.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[450px] bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
      {/* LEFT SIDEBAR: Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card/60 ${viewMobileChat ? "hidden md:flex" : "flex"}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-card">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Direct Chats
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {isConnected ? (
                <><Wifi className="w-3 h-3 text-emerald-500" /> Connected</>
              ) : (
                <><WifiOff className="w-3 h-3 text-amber-500" /> Reconnecting...</>
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-8 h-8 p-0"
            onClick={() => setShowNewChatModal(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Conversations Search */}
        <div className="p-3 border-b border-border bg-card/40">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchConversation}
              onChange={(e) => setSearchConversation(e.target.value)}
              className="pl-8 bg-background border-border"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredConversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
              <MessageCircle className="w-12 h-12 mb-2 text-muted-foreground" />
              <p className="text-sm font-semibold">No active conversations</p>
              <p className="text-xs text-muted-foreground mt-1">Start a new chat to connect with Providers/NGOs.</p>
              <Button
                size="sm"
                className="mt-4 bg-primary text-primary-foreground gap-2"
                onClick={() => setShowNewChatModal(true)}
              >
                <Plus className="w-4 h-4" /> New Message
              </Button>
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              if (!otherUser) return null;
              const isSelected = activeContact && (activeContact._id === otherUser._id || activeContact.id === otherUser._id);
              const lastMsg = chat.lastMessage || (chat.messages?.length ? chat.messages[chat.messages.length - 1]?.message : "No messages yet");
              const time = chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

              return (
                <div
                  key={chat._id}
                  onClick={() => {
                    selectChatWithUser(otherUser._id || otherUser.id);
                    setViewMobileChat(true);
                  }}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition ${
                    isSelected ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/40 border-l-4 border-transparent"
                  }`}
                >
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-border">
                    {otherUser.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info details */}
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
                            : otherUser.role === "Admin"
                            ? "text-red-600 bg-red-50 dark:bg-red-950/20"
                            : "text-purple-600 bg-purple-50 dark:bg-purple-950/20"
                        }`}
                      >
                        {otherUser.role}
                      </Badge>
                      {chat.unreadCount && chat.unreadCount > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {chat.unreadCount}
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

      {/* RIGHT CHAT AREA: Message Thread */}
      <div className={`flex-1 flex flex-col bg-background/30 ${!viewMobileChat ? "hidden md:flex" : "flex"}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Back button on mobile */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="md:hidden p-0 w-8 h-8 rounded-full"
                  onClick={() => setViewMobileChat(false)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                {/* Participant details */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-border">
                  {activeContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {activeContact.name}
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 font-medium ${
                        activeContact.role === "Provider"
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                          : activeContact.role === "Admin"
                          ? "text-red-600 bg-red-50 dark:bg-red-950/20"
                          : "text-purple-600 bg-purple-50 dark:bg-purple-950/20"
                      }`}
                    >
                      {activeContact.role}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {isConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Online
                      </>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>

              {/* Extra details */}
              <div className="flex items-center gap-2">
                {activeContact.profile?.phone && (
                  <a href={`tel:${activeContact.profile.phone}`} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {activeContact.profile?.address && (
                  <button
                    onClick={() => toast({ title: "Address Info", description: activeContact.profile.address })}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground transition"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/15">
              {activeChat?.messages && activeChat.messages.length > 0 ? (
                activeChat.messages.map((m, i) => {
                  const isCurrentUser = m.senderId === currentUser?.id || m.senderId === currentUser?.uid;
                  return (
                    <div
                      key={m._id || i}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      onContextMenu={(e) => handleContextMenu(e, m)}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm relative group ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-card border border-border text-foreground rounded-tl-none"
                        } ${m.deleted_for_everyone ? "opacity-60 italic" : ""}`}
                      >
                        {/* Message Actions Button */}
                        {!m.deleted_for_everyone && (
                          <button
                            onClick={(e) => handleContextMenu(e, m)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-black/10"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="flex items-center justify-between gap-4 mb-1 opacity-70 text-[9px]">
                          <span className="font-semibold">{m.senderName}</span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        {/* File Preview */}
                        <FilePreview message={m} />

                        {/* Text Content */}
                        {m.message && <p className="leading-relaxed break-words">{m.message}</p>}

                        {/* Read/Delivered Ticks */}
                        <div className="flex justify-end mt-1">
                          <MessageTicks message={m} isCurrentUser={isCurrentUser} />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <MessageSquare className="w-12 h-12 mb-2 text-muted-foreground" />
                  <p className="text-sm font-semibold">No messages in this chat yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Send a message to start conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2 items-center">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type a message to ${activeContact.name}...`}
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
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Select a Conversation</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Choose an active chat from the sidebar or click New Chat to contact another NGO or Provider.
            </p>
            <Button className="mt-4 bg-primary text-primary-foreground gap-2" onClick={() => setShowNewChatModal(true)}>
              <Plus className="w-4 h-4" /> Start New Conversation
            </Button>
          </div>
        )}
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed z-[100] bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 text-foreground transition"
            onClick={() => {
              deleteForMe(contextMenu.message._id!);
              setContextMenu(null);
            }}
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" /> Delete for me
          </button>
          {(contextMenu.message.senderId === currentUser?.id || contextMenu.message.senderId === currentUser?.uid) &&
            !contextMenu.message.deleted_for_everyone && (
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-destructive/10 flex items-center gap-2 text-destructive transition"
                onClick={() => {
                  deleteForEveryone(contextMenu.message._id!);
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-4 h-4" /> Delete for everyone
              </button>
            )}
        </div>
      )}

      {/* NEW CHAT MODAL / DIALOG */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-border bg-card flex justify-between items-center">
              <div>
                <h3 className="font-bold text-foreground">Start a New Chat</h3>
                <p className="text-xs text-muted-foreground">Select an active contact to message</p>
              </div>
              <Button size="sm" variant="ghost" className="p-0 w-8 h-8 rounded-full" onClick={() => setShowNewChatModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Search */}
            <div className="p-3 border-b border-border bg-card/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  className="pl-8 bg-background border-border"
                />
              </div>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border min-h-[250px]">
              {filteredContacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                  <User className="w-10 h-10 mb-2 text-muted-foreground" />
                  <p className="text-sm font-semibold">No contacts found</p>
                  <p className="text-xs text-muted-foreground mt-1">Make sure you are logged in and other role accounts exist.</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact._id || contact.id}
                    onClick={() => handleStartChat(contact)}
                    className="p-4 flex items-center justify-between hover:bg-muted/40 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-border">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{contact.name}</h4>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{contact.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 font-medium ${
                          contact.role === "Provider"
                            ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                            : "text-purple-600 bg-purple-50 dark:bg-purple-950/20"
                        }`}
                      >
                        {contact.role}
                      </Badge>
                      {contact.isActive && (
                        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
