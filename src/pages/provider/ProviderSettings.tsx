import { Building2, MapPin, Bell, LogOut, Save, CheckCircle, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDonations } from "@/context/DonationContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationMap from "@/components/LocationMap";
import { reverseGeocodeLocation } from "@/lib/map-utils";

const ProviderSettings = () => {
  const { profile, updateProfile } = useDonations();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState(profile.orgName);
  const [orgType, setOrgType] = useState(profile.orgType);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [lat, setLat] = useState(profile.lat ?? 31.5204);
  const [lng, setLng] = useState(profile.lng ?? 74.3587);
  const [pickupConfirmations, setPickupConfirmations] = useState(profile.pickupConfirmations);
  const [volunteerTracking, setVolunteerTracking] = useState(profile.volunteerTracking);
  const [dailySummary, setDailySummary] = useState(profile.dailySummary);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setOrgName(profile.orgName || "");
    setOrgType(profile.orgType || "restaurant");
    setEmail(profile.email || "");
    setPhone(profile.phone || "");
    setAddress(profile.address || "Lahore, Pakistan");
    setLat(typeof profile.lat === "number" ? profile.lat : 31.5204);
    setLng(typeof profile.lng === "number" ? profile.lng : 74.3587);
    setPickupConfirmations(profile.pickupConfirmations);
    setVolunteerTracking(profile.volunteerTracking);
    setDailySummary(profile.dailySummary);
  }, [profile]);

  const handleSave = async () => {
    if (!orgName.trim() || !email.trim()) {
      toast({ title: "Missing Fields", description: "Organization name and email are required.", variant: "destructive" });
      return;
    }

    await updateProfile({ orgName: orgName.trim(), orgType, email: email.trim(), phone: phone.trim(), address: address.trim(), lat, lng, pickupConfirmations, volunteerTracking, dailySummary });
    toast({ title: "Settings Saved! ✓", description: "Your profile and location have been updated." });
  };

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  const handleShowMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not Supported", description: "Your browser does not support geolocation.", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        // Reverse geocode to fill address
        reverseGeocodeLocation(newLat, newLng)
          .then((location) => {
            setAddress(location.fullAddress);
          })
          .catch(() => {
            setAddress(`${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
          })
          .finally(() => {
            setLocating(false);
            toast({ title: "Location Found! 📍", description: "Map aur address update ho gaya." });
          });
      },
      (err) => {
        setLocating(false);
        toast({ title: "Location Error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Provider Profile & Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your organization details, location, and notification preferences.</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2 w-full sm:w-auto" onClick={handleSave}>
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
        <div className="w-20 h-20 rounded-xl bg-muted border border-border flex items-center justify-center text-2xl">🏪</div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">{orgName}</h2>
            <Badge className="bg-green-100 text-green-700 text-xs gap-1"><CheckCircle className="w-3 h-3" /> VERIFIED</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Member since Oct 2023</p>
        </div>
      </div>

      {/* Organization Info */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2"><Building2 className="w-4 h-4" /> Organization Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Organization Name *</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Organization Type</Label>
            <Select value={orgType} onValueChange={setOrgType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="grocery">Grocery Store</SelectItem>
                <SelectItem value="farm">Farm</SelectItem>
                <SelectItem value="bakery">Bakery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Primary Contact Email *</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Location with Map */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Location Settings</h3>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pickup Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">📍 Pin your exact location on the map (click or drag marker)</Label>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleShowMyLocation} disabled={locating}>
              <Locate className="w-4 h-4" /> {locating ? "Locating..." : "Show My Location"}
            </Button>
          </div>
          <LocationMap lat={lat} lng={lng} onLocationChange={handleLocationChange} draggable label={orgName} />
          <p className="text-xs text-muted-foreground">Coordinates: {(lat ?? 31.5204).toFixed(5)}, {(lng ?? 74.3587).toFixed(5)}</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2"><Bell className="w-4 h-4" /> Notification Preferences</h3>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Pickup Confirmations</p>
              <p className="text-xs text-muted-foreground">Get notified when a volunteer accepts a donation.</p>
            </div>
            <Switch checked={pickupConfirmations} onCheckedChange={setPickupConfirmations} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Real-time Volunteer Tracking</p>
              <p className="text-xs text-muted-foreground">Receive proximity alerts when rescuers are 5 mins away.</p>
            </div>
            <Switch checked={volunteerTracking} onCheckedChange={setVolunteerTracking} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Daily Summary Email</p>
              <p className="text-xs text-muted-foreground">A nightly report of total food rescued and impact stats.</p>
            </div>
            <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
          </div>
        </div>
      </div>

      {/* Account Management */}
      <div className="flex items-center justify-between bg-card rounded-xl border border-border p-5">
        <div>
          <p className="text-sm font-semibold text-destructive">Account Management</p>
          <p className="text-xs text-muted-foreground">Ready to take a break? Your sessions will be ended on all devices.</p>
        </div>
        <Button variant="outline" className="text-destructive border-destructive/30 gap-2" onClick={() => navigate("/login")}>
          <LogOut className="w-4 h-4" /> Logout Securely
        </Button>
      </div>

      <div className="text-center text-xs text-muted-foreground py-4">
        <p>FixHunger v2.4.0 • Terms of Service • Privacy Policy</p>
      </div>
    </div>
  );
};

export default ProviderSettings;
