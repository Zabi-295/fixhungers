import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, Shield } from "lucide-react";
import { useSupport } from "@/context/SupportContext";
import { useAuth } from "@/context/AuthContext";

const SupportChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const { activeTicket, sendMessage, replyToTicket } = useSupport();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, activeTicket?.messages]);

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

  if (!currentUser || currentUser.role === "Admin") return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform hover:scale-105 z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
            <div>
              <h3 className="font-bold">Admin Support Chat</h3>
              <p className="text-xs opacity-80">Report errors or get help</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="opacity-80 hover:opacity-100 transition"><X className="w-5 h-5" /></button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30">
            {activeTicket?.messages.length ? (
              activeTicket.messages.map((m, i) => {
                const isAdmin = m.role === "Admin";
                return (
                  <div key={i} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${isAdmin ? 'bg-card border border-border text-foreground rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none'}`}>
                      <div className="flex items-center gap-1 mb-1 opacity-70 text-[10px]">
                        {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span className="font-semibold">{m.senderName}</span>
                      </div>
                      <p>{m.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                <MessageCircle className="w-12 h-12" />
                <p className="text-sm">No active tickets.<br/>Send a message to start chatting with Admin!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2">
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
            <button type="submit" disabled={!msg.trim()} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
              <Send className="w-4 h-4 ml-1" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;
