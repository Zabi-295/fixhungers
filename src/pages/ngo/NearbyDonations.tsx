import { useDonations } from "@/context/DonationContext";
import { X as XIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActivityMap from "@/components/ActivityMap";
import { calculateDistanceKm } from "@/lib/donation-utils";

const MAX_RADIUS_KM = 50;
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const NearbyDonations = () => {
  const { donations, acceptDonation, ngoProfile } = useDonations();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const available = donations.filter((d) => {
    if (d.status !== "Pending") return false;
    const hasNgoLoc = typeof ngoProfile.lat === "number" && typeof ngoProfile.lng === "number";
    const hasProvLoc = typeof d.providerLat === "number" && typeof d.providerLng === "number";
    if (!hasNgoLoc || !hasProvLoc) return true;
    const distanceKm = calculateDistanceKm(ngoProfile.lat, ngoProfile.lng, d.providerLat, d.providerLng);
    return distanceKm <= MAX_RADIUS_KM;
  });

  const mapMarkers = [
    {
      id: "ngo-self",
      label: ngoProfile.fullName || currentUser?.email || "Your Location",
      description: ngoProfile.location || "Volunteer location",
      lat: ngoProfile.lat ?? 31.5497,
      lng: ngoProfile.lng ?? 74.3436,
      tone: "ngo" as const,
    },
    ...available.map((donation) => ({
      id: donation.id,
      label: donation.providerName || donation.name,
      description: `${donation.name} • ${donation.quantity} ${donation.unit}`,
      lat: donation.providerLat ?? 31.5204,
      lng: donation.providerLng ?? 74.3587,
      tone: "provider" as const,
    })),
  ];

  const handleAccept = async (donationId: string) => {
    await acceptDonation(donationId, ngoProfile.fullName || currentUser?.email || "NGO Volunteer");
    toast.success("Pickup Accepted!", { description: "Pickup details opened successfully." });
    navigate(`/ngo/donation/${donationId}`);
  };

  if (userProfile && userProfile.status === false) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <XIcon className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Account Inactive</h2>
          <p className="text-muted-foreground text-sm max-w-sm">Your account has been deactivated by the admin. You cannot view donation requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nearby Donations</h1>
        <p className="text-sm text-muted-foreground">Browse all available food donations near you</p>
      </div>

      {/* Live Map */}
      <ActivityMap markers={mapMarkers} height="300px" />

      {/* List */}
      <div className="space-y-3">
        {available.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No nearby donations available right now</p>
          </div>
        ) : (
          available.map((d) => (
            <div key={d.id} className="bg-card rounded-xl border border-border p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {d.image ? (
                  <img src={d.image} className="w-full h-full object-cover" alt={d.name} />
                ) : (
                  <span className="text-2xl">{d.emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                  {d.quantity} {d.unit} • {calculateDistanceKm(ngoProfile.lat, ngoProfile.lng, d.providerLat, d.providerLng)} km away • {d.providerName}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => navigate(`/ngo/donation/${d.id}`)}>Details</Button>
                 <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => handleAccept(d.id)}>
                  Accept
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NearbyDonations;
