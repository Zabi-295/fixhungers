import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Shield, User, Send, ArrowLeft, CheckCircle2, Image as ImageIcon, Loader2, Check, CheckCheck, Search } from "lucide-react";
import { useSupport, SupportTicket } from "@/context/SupportContext";

const SupportRequests = () => {
  const { tickets, replyToTicket, closeTicket, markAsSeen } = useSupport();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMsg, setReplyMsg] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  // Mark as seen
  useEffect(() => {
    if (selectedTicket && selectedTicket.unreadCountAdmin > 0) {
      markAsSeen(selectedTicket._id);
    }
  }, [selectedTicket]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg.trim() || !selectedTicket) return;
    await replyToTicket(selectedTicket._id, replyMsg);
    setReplyMsg("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicket) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await replyToTicket(selectedTicket._id, "", base64);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const currentTicket = selectedTicket ? tickets.find(t => t._id === selectedTicket._id) : null;

  const filteredTickets = tickets.filter(t => 
    t.userName.toLowerCase().includes(search.toLowerCase()) || 
    t.userRole.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start sm:items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Support Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage issues and error reports from Providers and NGOs.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0 h-[75vh]">
        
        {/* Ticket List (Left Panel) */}
        <div className="w-full md:w-1/3 bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-secondary/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search users or roles..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/50 custom-scrollbar">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic text-sm">No chats found.</div>
            ) : (
              filteredTickets.map(ticket => (
                <button 
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors flex gap-3 items-center ${selectedTicket?._id === ticket._id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 relative">
                    <User className="w-5 h-5 text-muted-foreground" />
                    {ticket.status === 'Open' && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card"></span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-foreground text-sm truncate pr-2">{ticket.userName}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {new Date(ticket.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center w-full mt-1">
                      <span className="text-xs text-muted-foreground truncate pr-2">{ticket.lastMessage || 'Sent an image'}</span>
                      {ticket.unreadCountAdmin > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {ticket.unreadCountAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface (Right Panel) */}
        <div className="w-full md:w-2/3 bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm relative">
          {currentTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{currentTicket.userName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">{currentTicket.userRole}</span>
                      ID: {currentTicket._id.substring(0,8)}...
                    </p>
                  </div>
                </div>
                {currentTicket.status === 'Open' && (
                  <button 
                    onClick={() => closeTicket(currentTicket._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition text-xs font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Close Ticket
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-secondary/20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay">
                {currentTicket.messages.map((m, i) => {
                  const isAdmin = m.role === "Admin";
                  return (
                    <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-2xl p-3 shadow-sm ${isAdmin ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-border text-foreground rounded-tl-none'}`}>
                          
                          {m.imageUrl && (
                            <img src={m.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-2 object-cover max-h-60" />
                          )}
                          
                          {m.message && <p className="text-sm leading-relaxed break-words">{m.message}</p>}
                          
                          <div className={`flex items-center gap-1 mt-1.5 text-[10px] uppercase font-bold tracking-wide opacity-70 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {isAdmin && (
                              m.seen ? <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/90" /> : <Check className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-card border-t border-border z-10">
                {currentTicket.status === 'Closed' && (
                  <div className="text-center text-xs text-muted-foreground mb-3 bg-secondary py-1.5 rounded-lg">
                    Ticket is closed. Reply to reopen.
                  </div>
                )}
                <form onSubmit={handleReply} className="flex gap-2 items-end">
                  <div className="flex-1 bg-secondary border border-border rounded-xl flex items-end p-1.5 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <label className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg cursor-pointer transition">
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    <textarea
                      value={replyMsg}
                      onChange={(e) => setReplyMsg(e.target.value)}
                      placeholder="Type your reply to the user..."
                      className="flex-1 bg-transparent border-none resize-none px-2 py-2.5 text-sm focus:outline-none max-h-32 min-h-[44px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReply(e);
                        }
                      }}
                    />
                  </div>
                  <button type="submit" disabled={!replyMsg.trim() && !uploading} className="h-[52px] w-[52px] sm:w-auto sm:px-6 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-medium gap-2 hover:opacity-90 transition disabled:opacity-50 flex-shrink-0">
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline">Reply</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 p-8 bg-secondary/10">
              <MessageCircle className="w-20 h-20 text-muted-foreground opacity-50" />
              <div>
                <h3 className="font-bold text-xl text-foreground mb-1">No Ticket Selected</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Select a ticket from the left panel to view the conversation and reply.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SupportRequests;
