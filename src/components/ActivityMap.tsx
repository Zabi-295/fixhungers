import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_PAKISTAN_CENTER, MAP_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map-utils";

export interface ActivityMapMarker {
  description?: string;
  id: string;
  label: string;
  lat: number;
  lng: number;
  tone?: "provider" | "ngo" | "donation" | "active" | "inactive";
}

interface ActivityMapProps {
  center?: [number, number];
  className?: string;
  height?: string;
  markers: ActivityMapMarker[];
  zoom?: number;
}

const getSemanticColor = (variableName: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;

  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value ? `hsl(${value})` : fallback;
};

const ActivityMap = ({
  markers,
  center = [DEFAULT_PAKISTAN_CENTER.lat, DEFAULT_PAKISTAN_CENTER.lng],
  zoom = 11,
  height = "320px",
  className = "",
}: ActivityMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.LayerGroup | null>(null);

  const palette = useMemo(
    () => ({
      active: getSemanticColor("--primary", "hsl(145 100% 42%)"),
      donation: getSemanticColor("--primary", "hsl(145 100% 42%)"),
      ngo: "hsl(262 83% 58%)", // Purple for NGOs
      provider: "hsl(201 96% 32%)", // Blue for Providers
      inactive: getSemanticColor("--destructive", "hsl(0 84% 60%)"), // Red for Inactive
    }),
    []
  );

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
    }).setView(center, zoom);

    L.tileLayer(MAP_TILE_URL, {
      attribution: MAP_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    layerGroup.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      layerGroup.current = null;
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstance.current || !layerGroup.current) return;

    layerGroup.current.clearLayers();

    const validMarkers = markers.filter(
      (marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng)
    );

    validMarkers.forEach((marker) => {
      const color = palette[marker.tone || "donation"];

      L.circleMarker([marker.lat, marker.lng], {
        color,
        fillColor: color,
        fillOpacity: 0.85,
        radius: 8,
        weight: 2,
      })
        .addTo(layerGroup.current!)
        .bindPopup(
          `<div style="min-width:160px"><strong>${marker.label}</strong>${
            marker.description ? `<br/><span>${marker.description}</span>` : ""
          }</div>`
        );
    });

    if (validMarkers.length === 0) {
      mapInstance.current.setView(center, zoom);
      return;
    }

    if (validMarkers.length === 1) {
      mapInstance.current.setView([validMarkers[0].lat, validMarkers[0].lng], Math.max(zoom, 13));
      return;
    }

    const bounds = L.latLngBounds(validMarkers.map((marker) => [marker.lat, marker.lng] as [number, number]));
    mapInstance.current.fitBounds(bounds, { padding: [30, 30] });
  }, [markers, palette, center, zoom]);

  return <div ref={mapRef} className={`rounded-xl border border-border z-0 ${className}`} style={{ height, width: "100%" }} />;
};

export default ActivityMap;