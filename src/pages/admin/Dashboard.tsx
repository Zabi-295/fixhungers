import { useDonations } from "@/context/DonationContext";
import { useAdmin } from "@/context/AdminContext";
import { Heart, Users, ClipboardList, AlertTriangle, UserPlus, CheckCircle, Clock, FileText } from "lucide-react";

const AdminDashboard = () => {
  const { donations } = useDonations();
  const { users } = useAdmin();

  const totalMeals = donations.length;
  const activeNGOs = users.filter((u) => u.role === "NGO" && u.status).length;
  const totalDonations = donations.length;
  const pendingRequests = donations.filter((d) => d.status === "Pending").length;

  const activities = [
    ...users.slice(0, 3).map((u) => ({
      icon: UserPlus,
      iconBg: "bg-primary/10 text-primary",
      title: "New Registration",
      desc: `${u.name} has joined as ${u.role}${u.location ? ` in ${u.location}` : ""}.`,
      time: timeAgo(u.registeredAt),
      timestamp: new Date(u.registeredAt).getTime(),
    })),
    ...donations.filter((d) => d.status === "Accepted").slice(0, 2).map((d) => ({
      icon: CheckCircle,
      iconBg: "bg-blue-100 text-blue-600",
      title: "Donation Accepted",
      desc: `Donation "${d.name}" accepted by ${d.acceptedBy || "NGO"}.`,
      time: timeAgo(d.acceptedAt || d.createdAt),
      timestamp: new Date(d.acceptedAt || d.createdAt).getTime(),
    })),
    ...donations.filter((d) => d.status === "Pending").slice(0, 2).map((d) => ({
      icon: AlertTriangle,
      iconBg: "bg-yellow-100 text-yellow-600",
      title: "Pending Pickup",
      desc: `"${d.name}" from ${d.providerName} awaiting pickup.`,
      time: timeAgo(d.createdAt),
      timestamp: new Date(d.createdAt).getTime(),
    })),
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  const stats = [
    { icon: Heart, label: "Total Meals Saved", value: totalMeals, change: "+12.4%", color: "text-primary" },
    { icon: Users, label: "Active NGOs", value: activeNGOs, change: "+5.2%", color: "text-primary" },
    { icon: ClipboardList, label: "Total Donations", value: totalDonations, change: "-2.1%", color: "text-destructive" },
    { icon: AlertTriangle, label: "Pending Requests", value: pendingRequests, change: "+18.0%", color: "text-destructive" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">System Overview</h1>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search..."
            className="px-4 py-2 rounded-lg border border-border bg-card text-sm w-40 sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">Admin User</p>
              <p className="text-[10px] text-muted-foreground">System Administrator</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">A</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-xs font-semibold ${s.change.startsWith("+") ? "text-primary" : "text-destructive"}`}>
                {s.change}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">Updated 2m ago</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Recent Activity Feed</h2>
            <span className="text-sm text-primary font-medium cursor-pointer">View All</span>
          </div>
          <div className="space-y-4">
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${a.iconBg}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-lg font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <a href="/admin/users" className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> View Users</span>
                <span>›</span>
              </a>
              <a href="/admin/donations" className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">
                <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> View Donations</span>
                <span>›</span>
              </a>
              <a href="/admin/analytics" className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted transition">
                <FileText className="w-4 h-4" /> Register New Partner
              </a>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-lg font-bold text-foreground mb-3">FixHunger Status</h2>
            <div className="space-y-3">
              {[
                { label: "AI Routing Engine", status: "Active" },
                { label: "Donation Database", status: "Operational" },
                { label: "Volunteer GPS Relay", status: "Active" },
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="flex items-center gap-1 text-primary font-medium text-xs">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-muted-foreground uppercase font-semibold">System Uptime</span>
                <span className="text-primary font-bold">99.98%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "99.98%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 sm:mt-8 pt-4 border-t border-border flex flex-col sm:flex-row justify-between text-[10px] text-muted-foreground uppercase gap-2">
        <span>V2.4.0-Stable | Build 4092</span>
        <div className="flex gap-4">
          <span>Privacy Policy</span>
          <span>System Logs</span>
          <span>Support Portal</span>
        </div>
        <span>© 2024 FixHunger AI Technologies</span>
      </footer>
    </div>
  );
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default AdminDashboard;
