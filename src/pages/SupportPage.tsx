import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, User, Shield, Image as ImageIcon, Loader2, Check, CheckCheck } from "lucide-react";
import { useSupport } from "@/context/SupportContext";
import { useAuth } from "@/context/AuthContext";

const SupportPage = () => {
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const { activeTicket, sendMessage, replyToTicket, markAsSeen } = useSupport();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages]);

  // Mark as seen when opening the page or receiving a new message
  useEffect(() => {
    if (activeTicket && activeTicket.unreadCountUser > 0) {
      markAsSeen(activeTicket._id);
    }
  }, [activeTicket]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;

    if (activeTicket) {
      await replyToTicket(activeTicket._id, msg);
    } else {
      await sendMessage(msg);
    }
    setMsg("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      if (activeTicket) {
        await replyToTicket(activeTicket._id, "", base64);
      } else {
        await sendMessage("", base64);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col h-[85vh] bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Platform Support</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Admin is Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-secondary/30 space-y-6">
        {!activeTicket?.messages.length ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
            <MessageCircle className="w-16 h-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-bold text-lg mb-1">Start a Conversation</h3>
              <p className="text-sm">Send a message to our support team to get help.</p>
            </div>
          </div>
        ) : (
          activeTicket.messages.map((m, i) => {
            const isMe = m.role !== "Admin";
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] sm:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl p-3 sm:p-4 shadow-sm relative group ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-border text-foreground rounded-tl-none'}`}>
                    
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-2 object-cover max-h-60" />
                    )}
                    
                    {m.message && <p className="text-[15px] leading-relaxed break-words">{m.message}</p>}
                    
                    {/* Timestamp & Seen Status */}
                    <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] uppercase font-bold tracking-wide opacity-70 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (
                        m.seen ? <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/90" /> : <Check className="w-3.5 h-3.5" />
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 sm:p-6 bg-card border-t border-border">
        {activeTicket?.status === "Closed" && (
          <div className="text-center text-xs text-muted-foreground mb-4 bg-secondary py-2 rounded-lg">
            This ticket has been marked as resolved. Replying will reopen it.
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-3 items-end">
          <div className="flex-1 bg-secondary border border-border rounded-xl flex items-end p-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <label className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg cursor-pointer transition">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-transparent border-none resize-none px-2 py-2 text-sm focus:outline-none max-h-32 min-h-[44px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
          </div>
          <button 
            type="submit" 
            disabled={(!msg.trim() && !uploading)} 
            className="h-[60px] px-6 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-medium gap-2 hover:opacity-90 transition disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportPage;
