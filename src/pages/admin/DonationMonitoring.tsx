import { useState } from "react";
import { useDonations } from "@/context/DonationContext";
import { Search, Bell, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ActivityMap from "@/components/ActivityMap";
import { getExpiryState } from "@/lib/donation-utils";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Accepted: "bg-blue-100 text-blue-700",
  "In Transit": "bg-primary/10 text-primary",
  Collected: "bg-primary/10 text-primary",
  Completed: "bg-primary/10 text-primary",
};

const DonationMonitoring = () => {
  const { donations, updateDonationStatus } = useDonations();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = donations.filter((d) => {
    if (filter !== "all" && d.status.toLowerCase() !== filter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !(d.providerName || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const onRoute = donations.filter((d) => d.status === "In Transit" || d.status === "Accepted").length;
  const awaiting = donations.filter((d) => d.status === "Pending").length;
  const expiring = donations.filter((d) => {
    if (!d.expiryDate) return false;
    return getExpiryState(d.expiryDate).urgent;
  }).length;

  const monitoringMarkers = donations
    .filter((donation) => typeof donation.providerLat === "number" && typeof donation.providerLng === "number")
    .map((donation) => ({
      id: donation.id,
      label: donation.name,
      description: `${donation.providerName || "Provider"} • ${donation.status}`,
      lat: donation.providerLat as number,
      lng: donation.providerLng as number,
      tone: donation.status === "Pending" ? "provider" as const : "active" as const,
    }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Real-time Donation Monitoring</h1>
          <p className="text-sm text-primary">Oversee active food rescues and volunteer logistics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 rounded-lg border border-border text-sm bg-card w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {awaiting > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">{awaiting}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
        {/* Filters */}
        <div className="flex-1 bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-primary font-semibold uppercase mb-3">Quick Filters</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All Rescue Ops" },
              { key: "pending", label: "Pending" },
              { key: "accepted", label: "Picked Up" },
              { key: "completed", label: "Completed" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f.key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mini map */}
        <div className="w-full sm:w-[260px] h-[140px] rounded-xl overflow-hidden border border-border relative hidden sm:block">
          <ActivityMap markers={monitoringMarkers} height="140px" className="border-0 rounded-none" />
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
            <span className="text-[10px] bg-card/90 px-2 py-1 rounded text-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" /> {donations.length} Active
            </span>
            <span className="text-[10px] bg-card/90 px-2 py-1 rounded text-foreground flex items-center gap-1">
              Expand Map <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 mb-4 sm:mb-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Food Rescue Item</th>
              <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Quantity</th>
              <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Provider</th>
              <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Volunteer</th>
              <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Status</th>
              <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No donations found</td></tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-border hover:bg-muted/30 transition">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{d.emoji}</span>
                    <span className="font-semibold text-foreground">{d.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-muted-foreground">{d.quantity} {d.unit}</td>
                <td className="py-3 px-3 text-muted-foreground">{d.providerName || "Unknown"}</td>
                <td className="py-3 px-3">
                  {d.acceptedBy ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">{d.acceptedBy[0]}</div>
                      <span className="text-muted-foreground">{d.acceptedBy}</span>
                    </div>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="py-3 px-3">
                  <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase ${statusColors[d.status] || "bg-muted text-muted-foreground"}`}>
                    {d.status}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary cursor-pointer hover:underline">Details</span>
                    {d.status !== "Completed" && (
                      <button
                        onClick={async () => updateDonationStatus(d.id, "Completed")}
                        className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/ngo/donation/${d.id}`)}
                      className="text-xs text-primary cursor-pointer hover:underline"
                    >
                      Open
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-xs text-primary">Showing {filtered.length} of {donations.length} active rescues</div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-primary/10 rounded-xl p-5">
          <p className="text-[10px] text-primary uppercase font-semibold">On Route</p>
          <p className="text-2xl font-bold text-foreground">{String(onRoute).padStart(2, "0")}</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-5">
          <p className="text-[10px] text-primary uppercase font-semibold">Awaiting Pick-up</p>
          <p className="text-2xl font-bold text-foreground">{String(awaiting).padStart(2, "0")}</p>
        </div>
        <div className="bg-destructive/5 rounded-xl p-5">
          <p className="text-[10px] text-destructive uppercase font-semibold">Critical (Expiring)</p>
          <p className="text-2xl font-bold text-foreground">{String(expiring).padStart(2, "0")}</p>
        </div>
      </div>
    </div>
  );
};

export default DonationMonitoring;
