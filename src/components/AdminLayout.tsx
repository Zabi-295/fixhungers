import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ClipboardList, BarChart3, User, Settings, LogOut, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "User Management", icon: Users, path: "/admin/users" },
  { label: "Donation Monitoring", icon: ClipboardList, path: "/admin/donations" },
  { label: "Analytics & Reports", icon: BarChart3, path: "/admin/analytics" },
];

const accountItems = [
  { label: "Profile", icon: User, path: "/admin/profile" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">FixHunger Admin</p>
              <p className="text-[10px] text-muted-foreground">Super Admin</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="px-3 pt-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 pt-6 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Accounts</p>
        </div>
        <nav className="px-3 space-y-1">
          {accountItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 pb-5">
        <button
          onClick={() => { onNavigate?.(); navigate("/login"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 w-full transition"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
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
              <span className="text-primary-foreground text-xs font-bold">R</span>
            </div>
            <span className="font-bold text-sm text-foreground">Admin Panel</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="p-4 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-[220px] bg-card border-r border-border flex flex-col justify-between fixed h-screen">
        <SidebarContent />
      </aside>
      <main className="flex-1 ml-[220px] p-6 overflow-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
