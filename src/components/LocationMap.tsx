import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map-utils";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationMapProps {
  lat: number;
  lng: number;
  onLocationChange?: (lat: number, lng: number) => void;
  draggable?: boolean;
  className?: string;
  label?: string;
}

const LocationMap = ({ lat, lng, onLocationChange, draggable = false, className = "", label }: LocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([lat, lng], 14);
    L.tileLayer(MAP_TILE_URL, {
      attribution: MAP_ATTRIBUTION,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable }).addTo(map);
    if (label) marker.bindPopup(label).openPopup();

    if (draggable && onLocationChange) {
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });
      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onLocationChange(e.latlng.lat, e.latlng.lng);
      });
    }

    markerRef.current = marker;
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstance.current.setView([lat, lng], 14);
    }
  }, [lat, lng]);

  return <div ref={mapRef} className={`rounded-xl z-0 ${className}`} style={{ height: "250px", width: "100%" }} />;
};

export default LocationMap;
