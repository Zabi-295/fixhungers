import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MapPin, History, User, LogOut, MessageSquare, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDonations } from "@/context/DonationContext";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/ngo/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/ngo/nearby", icon: MapPin, label: "Nearby Donations" },
  { to: "/ngo/history", icon: History, label: "History" },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ngoProfile } = useDonations();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">✓</span>
          </div>
          <div>
            <div className="font-bold text-sm text-foreground">Fix Hunger</div>
            <div className="text-[10px] text-primary uppercase tracking-wider font-semibold">Volunteer Portal</div>
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

      <div className="px-3 pb-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-3 mb-2">Account</div>
        <NavLink
          to="/ngo/profile"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            location.pathname === "/ngo/profile"
              ? "bg-primary/10 text-primary border-l-[3px] border-primary -ml-[3px] pl-[15px]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <User className="w-4 h-4" />
          Profile
        </NavLink>
        <button
          onClick={() => { onNavigate?.(); navigate("/login"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="px-3 pb-4 mt-1">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {ngoProfile.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">{ngoProfile.fullName}</div>
            <div className="text-[10px] text-primary">Gold Rescuer</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NGOLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
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
        <button
          onClick={() => navigate("/ngo/assistant")}
          className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition z-40"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 bg-card border-r border-border flex flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>
      <main className="flex-1 ml-56 min-h-screen">{children}</main>
      <button
        onClick={() => navigate("/ngo/assistant")}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition z-40"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
};

export default NGOLayout;
