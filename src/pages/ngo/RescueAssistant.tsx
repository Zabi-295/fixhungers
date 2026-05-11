import { useState, useRef, useEffect } from "react";
import { useDonations } from "@/context/DonationContext";
import { Send, Mic, Search, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  buttons?: { label: string; action: string }[];
}

const RescueAssistant = () => {
  const { donations, ngoProfile } = useDonations();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello ${ngoProfile.fullName.split(" ")[0]}! I'm your Rescue Assistant. I can help you find the best routes, identify high-impact donations, or analyze local rescue trends. How can I assist you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateResponse = (userMessage: string): { content: string; buttons?: { label: string; action: string }[] } => {
    const lower = userMessage.toLowerCase();
    const pending = donations.filter((d) => d.status === "Pending");
    const accepted = donations.filter((d) => d.acceptedBy === ngoProfile.fullName);
    const providers = [...new Set(donations.map((d) => d.providerName).filter(Boolean))];

    if (lower.includes("donor") || lower.includes("provider") || lower.includes("who")) {
      const topProvider = donations.reduce((acc, d) => {
        const name = d.providerName || "Unknown";
        acc[name] = (acc[name] || 0) + parseFloat(d.quantity || "0");
        return acc;
      }, {} as Record<string, number>);
      const sorted = Object.entries(topProvider).sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      return {
        content: `There are currently **${providers.length} active donors** in your area today.\n\n${top ? `**${top[0]}** is the top donor, having contributed over **${top[1]}kg of food** across their pickup locations.` : "No donors have posted yet."}`,
        buttons: [
          { label: "Show donor locations", action: "show_locations" },
          { label: "See top items", action: "top_items" },
        ],
      };
    }

    if (lower.includes("nearby") || lower.includes("available") || lower.includes("food")) {
      return {
        content: `There are **${pending.length} food donations** available near you right now.\n\n${pending.slice(0, 3).map((d) => `• **${d.name}** - ${d.quantity} ${d.unit} from ${d.providerName || "a provider"} (${d.distance || "1.0"} mi away)`).join("\n")}`,
        buttons: [
          { label: "View all donations", action: "view_all" },
          { label: "Accept nearest", action: "accept_nearest" },
        ],
      };
    }

    if (lower.includes("my") || lower.includes("pickup") || lower.includes("accepted") || lower.includes("status")) {
      return {
        content: `You have **${accepted.length} accepted pickups**.\n\n${accepted.length > 0 ? accepted.map((d) => `• **${d.name}** - Status: ${d.status} at ${d.providerName}`).join("\n") : "No active pickups. Check the dashboard for available donations!"}`,
        buttons: [{ label: "Go to dashboard", action: "dashboard" }],
      };
    }

    if (lower.includes("route") || lower.includes("direction") || lower.includes("map")) {
      const activePickup = accepted.find((d) => d.status === "Accepted" || d.status === "In Transit");
      return {
        content: activePickup
          ? `Your active pickup is at **${activePickup.providerName}** (${activePickup.providerAddress}). Distance: ${activePickup.distance || "1.2"} mi.\n\nHead to the pickup location and confirm arrival!`
          : "No active pickups to navigate to. Accept a donation first!",
      };
    }

    if (lower.includes("impact") || lower.includes("stats") || lower.includes("how much")) {
      const totalWeight = accepted.reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);
      return {
        content: `📊 **Your Impact Summary:**\n\n• Total Rescues: **${accepted.length}**\n• Food Saved: **${totalWeight} kg**\n• Estimated Meals: **${Math.round(totalWeight * 2.5)}**\n• You're in the **Top 10%** of volunteers!`,
      };
    }

    return {
      content: `I can help you with:\n\n• Finding **nearby donations**\n• Checking **your pickup status**\n• Getting **route directions**\n• Viewing **your impact stats**\n• Finding **top donors** in your area\n\nWhat would you like to know?`,
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(input);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        ...response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Rescue Assistant</h1>
            <p className="text-xs text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Online & Ready to help
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              placeholder="Search history..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background w-36 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        <div className="text-center">
          <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase">Today</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <MessageSquare className="w-4 h-4" />
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[70%] ${msg.role === "user" ? "order-first" : ""}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary/10 text-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-1" : ""}>
                    {line.split("**").map((part, j) =>
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                  </p>
                ))}
              </div>
              {msg.buttons && (
                <div className="flex gap-2 mt-2">
                  {msg.buttons.map((btn) => (
                    <button
                      key={btn.action}
                      className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition"
                      onClick={() => setInput(btn.label)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-1">
                {ngoProfile.fullName.charAt(0)}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Mic className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" />
          </div>
          <Button
            className="w-12 h-12 rounded-xl bg-primary text-primary-foreground p-0"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase text-center mt-2">
          AI can make mistakes. Verify critical route info.
        </p>
      </div>
    </div>
  );
};

export default RescueAssistant;
