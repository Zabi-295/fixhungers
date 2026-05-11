import { useParams, useNavigate } from "react-router-dom";
import { useDonations } from "@/context/DonationContext";
import { ArrowLeft, Clock, MapPin, Phone, Package, ExternalLink, Share2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import RouteMap from "@/components/RouteMap";
import LocationMap from "@/components/LocationMap";
import { buildGoogleDirectionsUrl } from "@/lib/map-utils";
import { getExpiryState, isDonationAcceptedByUser, getNumericQuantity } from "@/lib/donation-utils";
import { useAuth } from "@/context/AuthContext";

const DonationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { donations, acceptDonation, updateDonationStatus, ngoProfile } = useDonations();
  const { currentUser } = useAuth();
  const [showRoute, setShowRoute] = useState(false);

  const donation = donations.find((d) => d.id === id);

  // Use NGO's saved location
  const ngoLat = ngoProfile.lat ?? 31.5497;
  const ngoLng = ngoProfile.lng ?? 74.3436;

  if (!donation) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-muted-foreground">Donation not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/ngo/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const providerLat = donation.providerLat || 31.5204;
  const providerLng = donation.providerLng || 74.3587;

  const expiry = getExpiryState(donation.expiryDate);

  const handleAccept = async () => {
    await acceptDonation(donation.id, ngoProfile.fullName || currentUser?.email || "NGO Volunteer");
    setShowRoute(true);
    toast({ title: "Pickup Accepted!", description: "Route directions are now showing on the map." });
  };

  const handleStartPickup = async () => {
    await updateDonationStatus(donation.id, "In Transit");
    toast({ title: "Pickup Started!", description: "Follow the route to the pickup location." });
  };

  const handleArrived = async () => {
    await updateDonationStatus(donation.id, "Collected");
    toast({ title: "Arrived!", description: "Confirm collection with the provider." });
  };

  const handleComplete = async () => {
    await updateDonationStatus(donation.id, "Completed");
    toast({ title: "Pickup Completed!", description: "Thank you for rescuing this food!" });
    navigate("/ngo/history");
  };

  const handleGetDirections = () => {
    window.open(buildGoogleDirectionsUrl(ngoLat, ngoLng, providerLat, providerLng), "_blank", "noopener,noreferrer");
  };

  const isAccepted = isDonationAcceptedByUser(donation, currentUser?.uid, ngoProfile.fullName);
  const isUrgent = expiry.urgent;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            Dashboard &rsaquo; Donation #{donation.id.slice(0, 8).toUpperCase()}
          </div>
          <button
            onClick={() => navigate("/ngo/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${donation.status === "Pending" ? "bg-primary" : donation.status === "In Transit" ? "bg-blue-500" : "bg-primary"}`} />
          Live Status: {donation.status}
        </Badge>
      </div>

      {/* Hero image */}
      <div className="relative rounded-2xl overflow-hidden h-64 bg-muted">
        {donation.image ? (
          <img src={donation.image} alt={donation.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl bg-primary/5">{donation.emoji}</div>
        )}
        {isUrgent && (
          <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
              URGENT - {expiry.label}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{donation.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Package className="w-4 h-4 text-primary" /> {donation.quantity} {donation.unit}</span>
            <span>•</span>
            <span>{donation.category}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Donation ID</div>
          <div className="text-lg font-bold text-foreground">#{donation.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>

      {/* Location + Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Pickup Location</div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">🏪</div>
                <div>
                  <div className="font-semibold text-foreground">{donation.providerName || "Provider"}</div>
                  <div className="text-sm text-muted-foreground">{donation.providerAddress || "Address not available"}</div>
                  <button
                    className="text-xs text-primary font-medium flex items-center gap-1 mt-1 hover:underline"
                    onClick={handleGetDirections}
                  >
                    <ExternalLink className="w-3 h-3" /> Get Directions in Google Maps
                  </button>
                </div>
              </div>
            </div>
          </div>

          {donation.notes && (
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Provider Notes</div>
              <div className="bg-card rounded-xl border border-border p-4 border-l-4 border-l-primary">
                <p className="text-sm text-muted-foreground italic">"{donation.notes}"</p>
              </div>
            </div>
          )}

          {donation.providerPhone && (
            <Button variant="outline" className="gap-2 w-full" onClick={() => window.open(`tel:${donation.providerPhone}`)}>
              <Phone className="w-4 h-4" />
              Contact Provider: {donation.providerPhone}
            </Button>
          )}
        </div>

        {/* Map - shows route if accepted, static location if not */}
        <div>
          {(isAccepted || showRoute) ? (
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold mb-2 flex items-center gap-1.5">
                <Navigation className="w-3 h-3" /> Route to Pickup Location
              </div>
              <RouteMap
                fromLat={ngoLat}
                fromLng={ngoLng}
                toLat={providerLat}
                toLng={providerLng}
                fromLabel="📍 Your Location"
                toLabel={`🏪 ${donation.providerName || "Provider"}`}
              />
            </div>
          ) : (
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Provider Location</div>
              <LocationMap lat={providerLat} lng={providerLng} label={donation.providerName || "Provider"} />
              <div className="mt-2 p-3 text-center text-xs text-muted-foreground bg-card border border-border rounded-lg">
                Accept pickup to see route directions
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!isAccepted && donation.status === "Pending" && (
          <Button className="flex-1 bg-primary text-primary-foreground h-14 text-base font-semibold gap-2 rounded-xl" onClick={handleAccept}>
            ▶ ACCEPT PICKUP
          </Button>
        )}
        {isAccepted && donation.status === "Accepted" && (
          <Button className="flex-1 bg-primary text-primary-foreground h-14 text-base font-semibold gap-2 rounded-xl" onClick={handleStartPickup}>
            ▶ START PICKUP
          </Button>
        )}
        {isAccepted && donation.status === "In Transit" && (
          <Button className="flex-1 bg-primary text-primary-foreground h-14 text-base font-semibold gap-2 rounded-xl" onClick={handleArrived}>
            ✓ Arrived at Location
          </Button>
        )}
        {isAccepted && donation.status === "Collected" && (
          <Button className="flex-1 bg-primary text-primary-foreground h-14 text-base font-semibold gap-2 rounded-xl" onClick={handleComplete}>
            ✓ Complete Pickup
          </Button>
        )}
        {isAccepted && (
          <Button variant="outline" className="h-14 px-6 gap-2 rounded-xl" onClick={handleGetDirections}>
            <Navigation className="w-4 h-4" /> Open in Maps
          </Button>
        )}
        <Button variant="outline" className="h-14 px-6 gap-2 rounded-xl">
          <Share2 className="w-4 h-4" /> Transfer Task
        </Button>
      </div>

      {/* Tags */}
      <div className="flex gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
         {getNumericQuantity(donation.quantity) >= 15 && (
          <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">🚛 HEAVY LOAD ({donation.quantity}+)</span>
        )}
        <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">❄️ TEMP SENSITIVE</span>
      </div>
    </div>
  );
};

export default DonationDetail;
