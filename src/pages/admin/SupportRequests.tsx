import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Shield, User, Send, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSupport, SupportTicket } from "@/context/SupportContext";

const SupportRequests = () => {
  const { tickets, replyToTicket, closeTicket } = useSupport();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMsg, setReplyMsg] = useState("");

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg.trim() || !selectedTicket) return;
    await replyToTicket(selectedTicket._id, replyMsg);
    setReplyMsg("");
    
    // Refresh selected ticket from updated tickets list
    // It will be updated automatically by the interval, but doing it manually feels snappier if we could, 
    // but React handles it via re-render of `tickets` state anyway.
  };

  // Find the fresh version of the selected ticket after an update
  const currentTicket = selectedTicket ? tickets.find(t => t._id === selectedTicket._id) : null;

  return (
    <div className="p-4 sm:p-8 space-y-6 min-h-screen bg-background">
      {/* Header */}
      <div className="flex justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Support Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage issues and error reports from Providers and NGOs.</p>
        </div>
        <Link to="/admin/dashboard" className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition bg-secondary px-4 py-2 rounded-lg">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
        
        {/* Ticket List (Left Panel) */}
        <div className="w-full md:w-1/3 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/50">
            <h2 className="font-bold text-foreground flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> Active Chats ({tickets.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic text-sm">No support tickets found.</div>
            ) : (
              tickets.map(ticket => (
                <button 
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors flex flex-col gap-1 ${selectedTicket?._id === ticket._id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-foreground text-sm truncate">{ticket.userName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ticket.status === 'Open' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center w-full mt-1">
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{ticket.userRole}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface (Right Panel) */}
        <div className="w-full md:w-2/3 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
          {currentTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-secondary/50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-foreground">{currentTicket.userName} <span className="text-xs font-normal text-muted-foreground ml-2">({currentTicket.userRole})</span></h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Ticket ID: {currentTicket._id}</p>
                </div>
                {currentTicket.status === 'Open' && (
                  <button 
                    onClick={() => closeTicket(currentTicket._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition text-xs font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve & Close
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/20">
                {currentTicket.messages.map((m, i) => {
                  const isAdmin = m.role === "Admin";
                  return (
                    <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${isAdmin ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-border text-foreground rounded-tl-none'}`}>
                        <div className="flex items-center gap-1.5 mb-2 opacity-80 text-[11px] uppercase tracking-wider font-bold">
                          {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <p className="text-sm leading-relaxed">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleReply} className="p-4 bg-card border-t border-border flex gap-3 items-center">
                <input
                  type="text"
                  value={replyMsg}
                  onChange={(e) => setReplyMsg(e.target.value)}
                  placeholder={currentTicket.status === 'Closed' ? "Ticket is closed. Reply to reopen..." : "Type your reply to the user..."}
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition"
                />
                <button type="submit" disabled={!replyMsg.trim()} className="h-11 px-5 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-medium gap-2 hover:opacity-90 transition disabled:opacity-50">
                  <Send className="w-4 h-4" /> Reply
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 p-8">
              <MessageCircle className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1">No Ticket Selected</h3>
                <p className="text-sm text-muted-foreground">Select a ticket from the left panel to view the conversation and reply.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SupportRequests;
