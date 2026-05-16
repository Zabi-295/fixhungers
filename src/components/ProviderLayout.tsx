import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Mic, History, Settings, User, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ThemeToggle } from "./ThemeToggle";
import SupportChatWidget from "./SupportChatWidget";

import SupportPage from "../pages/SupportPage";
import { MessageCircle } from "lucide-react";

const navItems = [
  { to: "/provider/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/provider/donate", icon: Mic, label: "Donate Food (Voice)" },
  { to: "/provider/history", icon: History, label: "Donation History" },
  { to: "/provider/support", icon: MessageCircle, label: "Support Chat" },
  { to: "/provider/settings", icon: Settings, label: "Settings" },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">✓</span>
          </div>
          <div>
            <div className="font-bold text-sm text-foreground">Fix Hunger</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Food Provider</div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border-l-[3px] border-primary -ml-[3px] pl-[15px]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-5 space-y-1">
        <NavLink
          to="/provider/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted"
        >
          <User className="w-4 h-4" />
          Profile & Settings
        </NavLink>
        <button
          onClick={() => { onNavigate?.(); navigate("/login"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

const ProviderLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted">
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[260px]">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">✓</span>
            </div>
            <span className="font-bold text-sm text-foreground">Fix Hunger</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
        <SupportChatWidget />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 bg-card border-r border-border flex flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>
      <main className="flex-1 ml-56 min-h-screen">{children}</main>
    </div>
  );
};

export default ProviderLayout;
