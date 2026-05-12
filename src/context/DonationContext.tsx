import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useAuth, type UserProfile as AuthUserProfile } from "@/context/AuthContext";
import apiFetch from "@/lib/api";
import {
  calculateDistanceKm,
  isDonationAcceptedByUser,
  normalizeQuantityUnit,
  resolveExpiryDate,
  toIsoDateString,
} from "@/lib/donation-utils";

const MAX_NGO_RADIUS_KM = 50;

export interface Donation {
  _id?: string;
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  expiryDate: string;
  status: "Pending" | "Completed" | "In Transit" | "Collected" | "Accepted";
  createdAt: string;
  notes: string;
  emoji: string;
  image?: string;
  providerId?: string;
  providerName?: string;
  providerAddress?: string;
  providerPhone?: string;
  providerLat?: number;
  providerLng?: number;
  acceptedBy?: string;
  acceptedById?: string;
  acceptedAt?: string;
  distance?: string;
}

export interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  donationId?: string;
}

export interface ProviderProfile {
  orgName: string;
  orgType: string;
  email: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  pickupConfirmations: boolean;
  volunteerTracking: boolean;
  dailySummary: boolean;
}

export interface NGOProfile {
  fullName: string;
  email: string;
  phone: string;
  vehicleType: string;
  location: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  joinedDate: string;
  newRescueAlerts: boolean;
  pushNotifications: boolean;
  weeklyReport: boolean;
}

interface DonationContextType {
  donations: Donation[];
  providerDonations: Donation[];
  ngoAcceptedDonations: Donation[];
  addDonation: (donation: Omit<Donation, "id" | "createdAt" | "status">) => Promise<void>;
  deleteDonation: (id: string) => Promise<void>;
  updateDonationStatus: (id: string, status: Donation["status"]) => Promise<void>;
  acceptDonation: (id: string, ngoName: string) => Promise<void>;
  profile: ProviderProfile;
  updateProfile: (profile: ProviderProfile) => Promise<void>;
  ngoProfile: NGOProfile;
  updateNGOProfile: (profile: NGOProfile) => Promise<void>;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const buildDefaultProfile = (userProfile?: AuthUserProfile | null): ProviderProfile => ({
  orgName: userProfile?.name || "",
  orgType: "restaurant",
  email: userProfile?.email || "",
  phone: "",
  address: "Lahore, Pakistan",
  lat: 31.5204,
  lng: 74.3587,
  pickupConfirmations: true,
  volunteerTracking: true,
  dailySummary: false,
});

const buildDefaultNGOProfile = (userProfile?: AuthUserProfile | null): NGOProfile => ({
  fullName: userProfile?.name || "",
  email: userProfile?.email || "",
  phone: "",
  vehicleType: "SUV / Crossover",
  location: "Lahore, Pakistan",
  lat: 31.5497,
  lng: 74.3436,
  isOnline: true,
  joinedDate: new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" }),
  newRescueAlerts: true,
  pushNotifications: true,
  weeklyReport: false,
});

const categoryEmojis: Record<string, string> = {
  Produce: "🍎",
  Bakery: "🍞",
  Dairy: "🥛",
  "Prepared Meals": "🥣",
  Meat: "🥩",
  Beverages: "🥤",
  Grains: "🌾",
  Other: "📦",
};

const DonationContext = createContext<DonationContextType | undefined>(undefined);

export const DonationProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, userProfile, refreshUser } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [profile, setProfile] = useState<ProviderProfile>(buildDefaultProfile(userProfile));
  const [ngoProfile, setNGOProfile] = useState<NGOProfile>(buildDefaultNGOProfile(userProfile));
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const fetchDonations = async () => {
    try {
      const items = await apiFetch('/donations');
      const normalizedDonations = items
        .map((item: any) => {
          const createdAt = toIsoDateString(item.createdAt || new Date().toISOString());
          const normalizedQuantity = normalizeQuantityUnit(item.quantity, item.unit);

          return {
            id: String(item._id || item.id),
            name: item.name || "Untitled Donation",
            category: item.category || "Other",
            quantity: normalizedQuantity.quantity,
            unit: normalizedQuantity.unit,
            expiryDate: resolveExpiryDate(item.expiryDate || item.expiryAt, createdAt),
            status: item.status || "Pending",
            createdAt,
            notes: item.notes || "",
            emoji: item.emoji || categoryEmojis[item.category] || "📦",
            image: item.image,
            providerId: String(item.providerId),
            providerName: item.providerName || "Provider",
            providerAddress: item.providerAddress || "Lahore, Pakistan",
            providerPhone: item.providerPhone || "",
            providerLat: typeof item.providerLat === "number" ? item.providerLat : 31.5204,
            providerLng: typeof item.providerLng === "number" ? item.providerLng : 74.3587,
            acceptedBy: item.acceptedBy,
            acceptedById: item.acceptedById ? String(item.acceptedById) : undefined,
            acceptedAt: item.acceptedAt ? toIsoDateString(item.acceptedAt, createdAt) : undefined,
            distance: item.distance,
          } as Donation;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log("Fetched donations count:", normalizedDonations.length);
      if (normalizedDonations.length > 0) {
        console.log("Current User UID:", currentUser?.uid);
        console.log("Example Donation providerId:", normalizedDonations[0].providerId);
      }
      setDonations(normalizedDonations);
    } catch (err) {
      console.error("Failed to fetch donations:", err);
    }
  };

  useEffect(() => {
    fetchDonations();
    const interval = setInterval(fetchDonations, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setProfile(buildDefaultProfile(userProfile));
      setNGOProfile(buildDefaultNGOProfile(userProfile));
      return;
    }

    if (userProfile?.profile) {
      if (userProfile.role === "Provider") {
        setProfile({
          ...buildDefaultProfile(userProfile),
          ...userProfile.profile,
          orgName: userProfile.profile.orgName || userProfile.name
        });
      } else if (userProfile.role === "NGO") {
        setNGOProfile({
          ...buildDefaultNGOProfile(userProfile),
          ...userProfile.profile,
          fullName: userProfile.profile.fullName || userProfile.name
        });
      }
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    if (!currentUser) {
      setReadNotificationIds([]);
      return;
    }

    const savedReadIds = localStorage.getItem(`ngoNotificationReads:${currentUser.uid}`);
    setReadNotificationIds(savedReadIds ? JSON.parse(savedReadIds) : []);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`ngoNotificationReads:${currentUser.uid}`, JSON.stringify(readNotificationIds));
  }, [currentUser, readNotificationIds]);

  const notifications = useMemo(
    () =>
      donations
        .filter((donation) => donation.status === "Pending")
        .filter((donation) => {
          if (userProfile?.role !== "NGO") return true;
          const hasNgoLoc = typeof ngoProfile.lat === "number" && typeof ngoProfile.lng === "number";
          const hasProvLoc = typeof donation.providerLat === "number" && typeof donation.providerLng === "number";
          if (!hasNgoLoc || !hasProvLoc) return true;
          const distanceKm = calculateDistanceKm(
            ngoProfile.lat,
            ngoProfile.lng,
            donation.providerLat,
            donation.providerLng
          );
          return distanceKm <= MAX_NGO_RADIUS_KM;
        })
        .map((donation) => ({
          id: donation.id,
          message: `🍽️ New food available: ${donation.name} from ${donation.providerName || "Provider"}`,
          time: donation.createdAt,
          read: readNotificationIds.includes(donation.id),
          donationId: donation.id,
        })),
    [donations, readNotificationIds, userProfile?.role, ngoProfile.lat, ngoProfile.lng]
  );

  const providerDonations = useMemo(() => {
    if (!currentUser?.uid) return [];
    return donations.filter((donation) => {
      // Use both _id and id for compatibility
      const match = donation.providerId === currentUser.uid || donation.providerId === currentUser.id;
      return match;
    });
  }, [currentUser, donations]);

  const ngoAcceptedDonations = useMemo(() => {
    if (!currentUser?.uid) return [];
    return donations.filter((donation) =>
      isDonationAcceptedByUser(donation, currentUser.uid, ngoProfile.fullName) ||
      isDonationAcceptedByUser(donation, currentUser.id, ngoProfile.fullName)
    );
  }, [currentUser, donations, ngoProfile.fullName]);


  const addDonation = async (donation: Omit<Donation, "id" | "createdAt" | "status">) => {
    if (!currentUser) return;

    const normalizedQuantity = normalizeQuantityUnit(donation.quantity, donation.unit);
    const createdAt = new Date().toISOString();

    await apiFetch('/donations', {
      method: 'POST',
      body: JSON.stringify({
        ...donation,
        quantity: normalizedQuantity.quantity,
        unit: normalizedQuantity.unit,
        expiryDate: resolveExpiryDate(donation.expiryDate, createdAt),
        status: "Pending",
        emoji: categoryEmojis[donation.category] || "📦",
        providerName: profile.orgName || userProfile?.name || currentUser.email || "Provider",
        providerAddress: profile.address || "Lahore, Pakistan",
        providerPhone: profile.phone || "",
        providerLat: profile.lat,
        providerLng: profile.lng,
      }),
    });
    fetchDonations();
  };

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const clearNotifications = () => {
    setReadNotificationIds(notifications.map((notification) => notification.id));
  };

  const deleteDonation = async (id: string) => {
    await apiFetch(`/donations/${id}`, { method: 'DELETE' });
    fetchDonations();
  };

  const updateDonationStatus = async (id: string, status: Donation["status"]) => {
    await apiFetch(`/donations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    fetchDonations();
  };

  const acceptDonation = async (id: string, ngoName: string) => {
    if (!currentUser) return;

    await apiFetch(`/donations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        acceptedAt: new Date().toISOString(),
        acceptedBy: ngoName,
        acceptedById: currentUser.uid,
        status: "Accepted",
      }),
    });
    fetchDonations();
  };

  const updateProfile = async (newProfile: ProviderProfile) => {
    setProfile(newProfile);
    if (!currentUser) return;

    await apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(newProfile),
    });
    await refreshUser();
  };

  const updateNGOProfile = async (newProfile: NGOProfile) => {
    setNGOProfile(newProfile);
    if (!currentUser) return;

    await apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(newProfile),
    });
    await refreshUser();
  };

  return (
    <DonationContext.Provider
      value={{
        donations,
        providerDonations,
        ngoAcceptedDonations,
        addDonation,
        deleteDonation,
        updateDonationStatus,
        acceptDonation,
        profile,
        updateProfile,
        ngoProfile,
        updateNGOProfile,
        notifications,
        markNotificationRead,
        clearNotifications,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
};

export const useDonations = () => {
  const ctx = useContext(DonationContext);
  if (!ctx) throw new Error("useDonations must be used within DonationProvider");
  return ctx;
};

