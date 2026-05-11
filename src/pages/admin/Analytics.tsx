import { useState } from "react";
import { useDonations } from "@/context/DonationContext";
import { useAdmin } from "@/context/AdminContext";
import { Search, Bell, Download, FileText } from "lucide-react";
import ActivityMap from "@/components/ActivityMap";

const Analytics = () => {
  const { donations } = useDonations();
  const { users } = useAdmin();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  const mealsSaved = donations.length;
  const co2Offset = (donations.length * 2.5).toFixed(0);
  const activeVolunteers = users.filter((u) => u.role === "NGO" && u.status).length;
  const rescueHotspots = new Set(donations.map((d) => d.providerAddress).filter(Boolean)).size;

  // Group donations by day of week for chart
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayData = dayNames.map((day, i) => {
    const count = donations.filter((d) => new Date(d.createdAt).getDay() === (i + 1) % 7).length;
    return { day, count };
  });
  const maxDay = Math.max(...dayData.map((d) => d.count), 1);

  // Location-based data from users + donations
  const locationData: Record<string, number> = {};
  users.forEach((u) => {
    const loc = u.location || "Unknown";
    locationData[loc] = (locationData[loc] || 0) + 1;
  });
  donations.forEach((d) => {
    const loc = d.providerAddress?.split(",").slice(-2, -1)[0]?.trim() || "Unknown";
    locationData[loc] = (locationData[loc] || 0) + 1;
  });
  const sortedLocations = Object.entries(locationData).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxLoc = Math.max(...sortedLocations.map(([, v]) => v), 1);

  const activityMarkers = [
    ...users
      .filter((user) => typeof user.lat === "number" && typeof user.lng === "number")
      .map((user) => ({
        id: `user-${user.id}`,
        label: user.name,
        description: `${user.role} • ${user.status ? "Active" : "Inactive"} • ${user.location || "Pakistan"}`,
        lat: user.lat as number,
        lng: user.lng as number,
        tone: !user.status ? "inactive" as const : (user.role === "NGO" ? "ngo" as const : "provider" as const),
      })),
    ...donations
      .filter((donation) => typeof donation.providerLat === "number" && typeof donation.providerLng === "number" && donation.status !== "Completed")
      .map((donation) => ({
        id: `donation-${donation.id}`,
        label: donation.name,
        description: `Food Surplus • ${donation.providerName || "Provider"} • ${donation.status}`,
        lat: donation.providerLat as number,
        lng: donation.providerLng as number,
        tone: "donation" as const,
      })),
  ];

  const stats = [
    { emoji: "🍴", label: "Meals Saved", value: mealsSaved.toLocaleString(), change: "↑ 12%", up: true },
    { emoji: "🌿", label: "CO2 Offset (kg)", value: co2Offset, change: "↑ 8%", up: true },
    { emoji: "🤝", label: "Active Volunteers", value: activeVolunteers.toLocaleString(), change: "↓ 2%", up: false },
    { emoji: "📍", label: "Rescue Hotspots", value: rescueHotspots.toLocaleString(), change: "↑ 15%", up: true },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">System Analytics & Reports</h1>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input placeholder="Search data..." className="pl-9 pr-4 py-2 rounded-lg border border-border text-sm bg-card w-56 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <Bell className="w-5 h-5 text-muted-foreground" />
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">A</div>
        </div>
      </div>

      {/* Period + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex bg-muted rounded-lg p-1">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition">
            <FileText className="w-4 h-4" /> Export Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.emoji}</span>
              <span className={`text-xs font-semibold ${s.up ? "text-primary" : "text-destructive"}`}>{s.change}</span>
            </div>
            <p className="text-xs text-primary">{s.label}</p>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-6">
        {/* Meals Saved Over Time */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Meals Saved Over Time</h2>
            <span className="text-muted-foreground cursor-pointer">•••</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {dayData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                  style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: "4px" }}
                >
                  <div className="absolute bottom-0 w-full bg-primary rounded-t-md" style={{ height: "100%" }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Volunteers Trend */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Active Volunteers Trend</h2>
            <span className="text-muted-foreground cursor-pointer">•••</span>
          </div>
          <div className="space-y-3">
            {sortedLocations.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet. Register users to see trends.</p>}
            {sortedLocations.map(([loc, count], i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 truncate">{loc}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(count / maxLoc) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Donation Hotspots Map */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Donation Hotspots Heatmap</h2>
            <p className="text-sm text-primary">Real-time distribution of surplus food availability</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-0">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Surplus Food</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> NGO/Rescue</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0369a1]" /> Provider</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#dc2626]" /> Inactive</span>
          </div>
        </div>
        <div className="w-full h-[350px] rounded-xl overflow-hidden border border-border">
          <ActivityMap markers={activityMarkers} height="350px" />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-border flex justify-center text-xs text-muted-foreground gap-4">
        <span>© 2024 FixHunger. AI-powered urban logistics for a sustainable future.</span>
        <span className="text-primary cursor-pointer">Privacy Policy</span>
        <span className="text-primary cursor-pointer">Terms of Service</span>
      </footer>
    </div>
  );
};

export default Analytics;
