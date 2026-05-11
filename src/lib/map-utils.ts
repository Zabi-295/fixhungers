export const DEFAULT_PAKISTAN_CENTER = {
  lat: 31.5204,
  lng: 74.3587,
};

export const MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const MAP_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO';

export interface ReverseGeocodeResult {
  city: string;
  country: string;
  fullAddress: string;
  shortLabel: string;
}

export const reverseGeocodeLocation = async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  );

  if (!response.ok) {
    throw new Error("Unable to fetch address for this location.");
  }

  const data = await response.json();
  const city = data.city || data.locality || data.principalSubdivision || "";
  const country = data.countryName || "Pakistan";
  const parts = [data.locality || data.city, data.principalSubdivision, country].filter(Boolean);
  const fullAddress = parts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const shortLabel = [city, country].filter(Boolean).join(", ") || country;

  return {
    city,
    country,
    fullAddress,
    shortLabel,
  };
};

export const buildGoogleDirectionsUrl = (fromLat: number, fromLng: number, toLat: number, toLng: number) =>
  `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;