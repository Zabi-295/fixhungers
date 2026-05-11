const HOURS_REGEX = /(\d+(?:\.\d+)?)\s*h(?:ou)?rs?/i;

export const toIsoDateString = (value: unknown, fallback: Date | string = new Date()) => {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (value && typeof value === "object") {
    if ("toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }

    if ("seconds" in value && typeof (value as { seconds: number }).seconds === "number") {
      return new Date((value as { seconds: number }).seconds * 1000).toISOString();
    }
  }

  return new Date(fallback).toISOString();
};

export const resolveExpiryDate = (rawExpiry: unknown, createdAt: string, fallbackHours = 4) => {
  if (typeof rawExpiry === "string") {
    const parsed = new Date(rawExpiry);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    const hoursMatch = rawExpiry.match(HOURS_REGEX);
    if (hoursMatch) {
      return new Date(new Date(createdAt).getTime() + Number(hoursMatch[1]) * 60 * 60 * 1000).toISOString();
    }
  }

  if (typeof rawExpiry === "number" && Number.isFinite(rawExpiry)) {
    return new Date(new Date(createdAt).getTime() + rawExpiry * 60 * 60 * 1000).toISOString();
  }

  return new Date(new Date(createdAt).getTime() + fallbackHours * 60 * 60 * 1000).toISOString();
};

export const formatDonationDate = (value: string) =>
  new Date(toIsoDateString(value)).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const formatDonationShortDate = (value: string) =>
  new Date(toIsoDateString(value)).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const getExpiryState = (value: string) => {
  const expiry = new Date(toIsoDateString(value));
  const diff = expiry.getTime() - Date.now();
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (diff <= 0) {
    return { expired: true, urgent: true, label: "Expired" };
  }

  if (hours < 1) {
    return { expired: false, urgent: true, label: `Expiring in ${Math.max(minutes, 1)}m` };
  }

  if (hours < 6) {
    return { expired: false, urgent: true, label: `Expiring in ${hours}h ${Math.max(minutes, 0)}m` };
  }

  return { expired: false, urgent: false, label: `Expiring in ${hours}h` };
};

export const getNumericQuantity = (value: string | number | null | undefined) => {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const match = String(value).match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

export const normalizeQuantityUnit = (rawQuantity: string | number | null | undefined, rawUnit?: string) => {
  const unit = (rawUnit || "kg").trim() || "kg";
  const value = String(rawQuantity ?? "").trim();

  if (!value) {
    return { quantity: "", unit };
  }

  const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withSameUnit = new RegExp(`\\s*${escapedUnit}$`, "i");
  if (withSameUnit.test(value)) {
    return { quantity: value.replace(withSameUnit, "").trim(), unit };
  }

  if (!rawUnit) {
    const parts = value.split(/\s+/);
    if (parts.length > 1) {
      return {
        quantity: parts[0],
        unit: parts.slice(1).join(" "),
      };
    }
  }

  return { quantity: value, unit };
};

export const calculateDistanceKm = (fromLat?: number, fromLng?: number, toLat?: number, toLng?: number) => {
  if ([fromLat, fromLng, toLat, toLng].some((value) => typeof value !== "number" || Number.isNaN(value))) {
    return 0;
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians((toLat as number) - (fromLat as number));
  const dLng = toRadians((toLng as number) - (fromLng as number));

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat as number)) *
      Math.cos(toRadians(toLat as number)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(1));
};

export const extractCity = (location?: string | null) => {
  if (!location) return "";
  // Take first comma-separated segment, normalize
  const first = String(location).split(",")[0]?.trim().toLowerCase() || "";
  return first;
};

export const isSameCity = (a?: string | null, b?: string | null) => {
  const ca = extractCity(a);
  const cb = extractCity(b);
  if (!ca || !cb) return false;
  return ca === cb;
};

export const isDonationAcceptedByUser = (
  donation: { acceptedBy?: string; acceptedById?: string },
  userId?: string | null,
  userName?: string | null
) => {
  if (donation.acceptedById && userId) {
    return donation.acceptedById === userId;
  }

  return Boolean(userName && donation.acceptedBy === userName);
};