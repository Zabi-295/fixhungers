import { useState } from "react";
import { useDonations } from "@/context/DonationContext";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Package, Bell, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { calculateDistanceKm, getExpiryState, isDonationAcceptedByUser, getNumericQuantity } from "@/lib/donation-utils";

const MAX_RADIUS_KM = 50;
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";


const Dashboard = () => {
  const { donations, acceptDonation, ngoProfile, notifications, markNotificationRead, clearNotifications } = useDonations();
  const { requestPermission, permission } = useNotifications();
  const { currentUser, userProfile } = useAuth();

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);

  const isMyPickup = (donation: typeof donations[0]) =>
    isDonationAcceptedByUser(donation, currentUser?.uid, ngoProfile.fullName);

  const availableDonations = donations.filter((d) => {
    const hasNgoLoc = typeof ngoProfile.lat === "number" && typeof ngoProfile.lng === "number";
    const hasProvLoc = typeof d.providerLat === "number" && typeof d.providerLng === "number";
    if (hasNgoLoc && hasProvLoc) {
      const distanceKm = calculateDistanceKm(ngoProfile.lat, ngoProfile.lng, d.providerLat, d.providerLng);
      if (distanceKm > MAX_RADIUS_KM) return false;
    }
    return (
      d.status === "Pending" ||
      ((d.status === "Accepted" || d.status === "In Transit" || d.status === "Collected") && isMyPickup(d))
    );
  });

  const filtered = availableDonations.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      (d.providerName || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || d.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const getStatusBadge = (donation: typeof donations[0]) => {
    if (isMyPickup(donation)) return <Badge className="bg-primary/10 text-primary text-[10px]">ACCEPTED</Badge>;
    const expiry = getExpiryState(donation.expiryDate);
    if (expiry.urgent) return <Badge className="bg-destructive/10 text-destructive text-[10px]">URGENT</Badge>;
    return <Badge className="bg-primary/10 text-primary text-[10px]">AVAILABLE</Badge>;
  };

  const handleAccept = async (id: string) => {
    await acceptDonation(id, ngoProfile.fullName || currentUser?.email || "NGO Volunteer");
    toast({ title: "Pickup Accepted!", description: "You have accepted this food rescue. Check details for directions." });
    navigate(`/ngo/donation/${id}`);
  };

  const completedPickups = donations.filter((d) => isMyPickup(d) && (d.status === "Completed" || d.status === "Collected")).length;
  const totalWeight = donations
    .filter((d) => isMyPickup(d))
    .reduce((acc, d) => acc + getNumericQuantity(d.quantity), 0);

  const categories = ["All", ...new Set(availableDonations.map((d) => d.category))];
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (userProfile && userProfile.status === false) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Account Inactive</h2>
          <p className="text-muted-foreground text-sm max-w-sm">Your account has been deactivated by the admin. You cannot view donation requests at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search donations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Mic className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" />
        </div>
        <Button
          className="bg-primary text-primary-foreground gap-2 rounded-full px-5 hidden sm:flex"
          onClick={() => navigate("/ngo/assistant")}
        >
          <span className="text-base">🤖</span> Rescue Assistant
        </Button>
        <div className="relative">
          <button
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <div className="flex gap-2">
                  {notifications.length > 0 && (
                    <button className="text-xs text-primary hover:underline" onClick={clearNotifications}>Clear all</button>
                  )}
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {permission === "default" && (
                  <div className="p-4 bg-primary/5 border-b border-border">
                    <p className="text-xs text-foreground font-semibold mb-2">Real-time Alerts</p>
                    <p className="text-[10px] text-muted-foreground mb-3">Get notified on your phone/laptop when food is donated near you.</p>
                    <Button size="sm" className="w-full text-[10px] h-8" onClick={requestPermission}>Enable Notifications</Button>
                  </div>
                )}
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No notifications yet</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition ${!n.read ? "bg-primary/5" : ""}`}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.donationId) navigate(`/ngo/donation/${n.donationId}`);
                        setShowNotifications(false);
                      }}
                    >
                      <p className="text-sm text-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.time).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Title + Filter */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Nearby Food Donations</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Real-time rescue opportunities in {ngoProfile.location}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Donation cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No donations available</p>
          <p className="text-sm">Check back soon or adjust your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((donation) => {
            const expiry = getExpiryState(donation.expiryDate);
            const distanceKm = calculateDistanceKm(ngoProfile.lat, ngoProfile.lng, donation.providerLat, donation.providerLng);
            return (
              <div
                key={donation.id}
                className="bg-card rounded-xl border border-border overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition"
              >
                {/* Image */}
                <div className="w-full sm:w-40 h-48 sm:h-auto sm:min-h-[200px] relative bg-muted flex-shrink-0">
                  {donation.image ? (
                    <img src={donation.image} alt={donation.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">{donation.emoji}</div>
                  )}
                  {getStatusBadge(donation)}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-foreground text-lg leading-tight">{donation.name}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-md ml-2 flex-shrink-0 ${
                        expiry.urgent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}>
                        {expiry.label}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-primary" />
                        {donation.quantity} {donation.unit}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {distanceKm > 0 ? `${distanceKm} km away` : "Location available"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-xs">🏪</span>
                        {donation.providerName || "Unknown Provider"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => navigate(`/ngo/donation/${donation.id}`)}
                    >
                      View Details
                    </Button>
                     {!isMyPickup(donation) && donation.status === "Pending" ? (
                      <Button
                        size="sm"
                        className="flex-1 bg-primary text-primary-foreground text-xs"
                        onClick={() => handleAccept(donation.id)}
                      >
                        Accept Pickup
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        variant="secondary"
                        onClick={() => navigate(`/ngo/donation/${donation.id}`)}
                      >
                        View Route
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Impact stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">📦</div>
          <div>
            <div className="text-[10px] text-primary uppercase font-semibold">Your Impact</div>
            <div className="text-2xl font-bold text-foreground">{totalWeight} kg</div>
            <div className="text-xs text-muted-foreground">Food rescued this month</div>
          </div>
        </div>
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">🏆</div>
          <div>
            <div className="text-[10px] text-primary uppercase font-semibold">Ranking</div>
            <div className="text-2xl font-bold text-foreground">
              {ngoProfile.rank > 0 ? `#${ngoProfile.rank}` : "—"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              Rating: {ngoProfile.rating ? ngoProfile.rating.toFixed(1) : "0.0"} ⭐ ({ngoProfile.reviewCount})
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">⏰</div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Next Pickup</div>
            <div className="text-2xl font-bold text-foreground">
               {availableDonations.filter((d) => isMyPickup(d)).length > 0 ? "Now" : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
               {availableDonations.filter((d) => isMyPickup(d)).length > 0
                ? "Active pickup available"
                : "No active pickups"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
