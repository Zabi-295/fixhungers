import { useEffect, useState } from "react";
import { useDonations } from "@/context/DonationContext";
import { User, MapPin, Bell, Save, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import LocationMap from "@/components/LocationMap";
import { reverseGeocodeLocation } from "@/lib/map-utils";

const Profile = () => {
  const { ngoProfile, updateNGOProfile, ngoAcceptedDonations } = useDonations();
  const [form, setForm] = useState(ngoProfile);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setForm(ngoProfile);
  }, [ngoProfile]);

  const myDonations = ngoAcceptedDonations;
  const completedPickups = myDonations.filter((d) => d.status === "Completed" || d.status === "Collected").length;
  const totalWeight = myDonations.reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);
  const volunteerHours = Math.round(completedPickups * 0.7);

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
        // Reverse geocode to fill location field
        reverseGeocodeLocation(newLat, newLng)
          .then((location) => {
            setForm((currentForm) => ({ ...currentForm, lat: newLat, lng: newLng, location: location.shortLabel }));
          })
          .catch(() => {
            setForm((currentForm) => ({ ...currentForm, lat: newLat, lng: newLng }));
          })
          .finally(() => {
            setLocating(false);
            toast({ title: "Location Found! 📍", description: "Map aur location update ho gaya." });
          });
      },
      (err) => {
        setLocating(false);
        toast({ title: "Location Error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    await updateNGOProfile(form);
    toast({ title: "Profile Updated", description: "Your changes have been saved." });
  };

  const handleDiscard = () => {
    setForm(ngoProfile);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Volunteer Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account, track impact, and update your availability.</p>
      </div>

      {/* Profile card + Availability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="md:col-span-2 bg-card rounded-xl border border-border p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              {form.fullName.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{form.fullName}</h2>
              <Badge className="bg-primary/10 text-primary text-[10px]">VERIFIED</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Volunteer since {form.joinedDate}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {form.location}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center justify-center">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-3">Availability Status</div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${!form.isOnline ? "text-foreground" : "text-muted-foreground"}`}>OFFLINE</span>
            <Switch
              checked={form.isOnline}
              onCheckedChange={(val) => setForm({ ...form, isOnline: val })}
            />
            <span className={`text-xs font-medium ${form.isOnline ? "text-primary" : "text-muted-foreground"}`}>ONLINE</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Toggle online to receive real-time food rescue alerts in your area.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completed Pickups</span>
            <span className="text-primary">✓</span>
          </div>
          <div className="text-3xl font-bold text-foreground mt-1">{completedPickups}</div>
          <div className="text-xs text-primary font-medium">Top 5% this month</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Weight Rescued</span>
            <span className="text-primary">📦</span>
          </div>
          <div className="text-3xl font-bold text-foreground mt-1">{totalWeight} <span className="text-lg font-normal text-muted-foreground">kg</span></div>
          <div className="text-xs text-muted-foreground">Approx. {Math.round(totalWeight * 2.5)} meals saved</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Volunteer Hours</span>
            <span className="text-primary">⏰</span>
          </div>
          <div className="text-3xl font-bold text-foreground mt-1">{volunteerHours} <span className="text-lg font-normal text-muted-foreground">h</span></div>
          <div className="text-xs text-muted-foreground">Impact level: {volunteerHours > 20 ? "Gold" : volunteerHours > 10 ? "Silver" : "Bronze"}</div>
        </div>
      </div>

      {/* Personal Info */}
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" /> Personal Information
        </h3>
        <div className="bg-card rounded-xl border border-border p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1.5 block">Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1.5 block">Email Address</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1.5 block">Phone Number</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1.5 block">Vehicle Type</label>
            <select
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option>SUV / Crossover</option>
              <option>Sedan</option>
              <option>Van / Minivan</option>
              <option>Truck</option>
              <option>Bicycle</option>
              <option>On Foot</option>
            </select>
          </div>
        </div>
      </div>

      {/* Location with Map */}
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" /> My Location
        </h3>
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground uppercase font-semibold">📍 Your pickup location (click map or drag marker)</label>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleShowMyLocation} disabled={locating}>
              <Locate className="w-4 h-4" /> {locating ? "Locating..." : "Show My Location"}
            </Button>
          </div>
          <LocationMap
            lat={form.lat ?? 31.5497}
            lng={form.lng ?? 74.3436}
            onLocationChange={(lat, lng) => setForm({ ...form, lat, lng })}
            draggable
            label={form.fullName}
          />
          <p className="text-xs text-muted-foreground">Coordinates: {(form.lat ?? 31.5497).toFixed(5)}, {(form.lng ?? 74.3436).toFixed(5)}</p>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" /> Notification Preferences
        </h3>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="font-medium text-foreground text-sm">New Rescue Alerts</div>
              <div className="text-xs text-muted-foreground">Get notified immediately when food becomes available nearby.</div>
            </div>
            <Switch checked={form.newRescueAlerts} onCheckedChange={(val) => setForm({ ...form, newRescueAlerts: val })} />
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="font-medium text-foreground text-sm">Push Notifications</div>
              <div className="text-xs text-muted-foreground">Receive mobile app updates and reminders.</div>
            </div>
            <Switch checked={form.pushNotifications} onCheckedChange={(val) => setForm({ ...form, pushNotifications: val })} />
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="font-medium text-foreground text-sm">Weekly Impact Report</div>
              <div className="text-xs text-muted-foreground">A summary of your contribution and rescued meals.</div>
            </div>
            <Switch checked={form.weeklyReport} onCheckedChange={(val) => setForm({ ...form, weeklyReport: val })} />
          </div>
        </div>
      </div>

      {/* Save / Discard */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="gap-2" onClick={handleDiscard}>
          Discard Changes
        </Button>
        <Button className="bg-primary text-primary-foreground gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Profile;
