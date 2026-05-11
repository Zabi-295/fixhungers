import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map-utils";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RouteMapProps {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  fromLabel?: string;
  toLabel?: string;
  className?: string;
}

const RouteMap = ({ fromLat, fromLng, toLat, toLng, fromLabel = "You", toLabel = "Pickup", className = "" }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([(fromLat + toLat) / 2, (fromLng + toLng) / 2], 13);
    L.tileLayer(MAP_TILE_URL, {
      attribution: MAP_ATTRIBUTION,
    }).addTo(map);

    // Add markers
    L.marker([fromLat, fromLng], { icon: greenIcon }).addTo(map).bindPopup(fromLabel);
    L.marker([toLat, toLng]).addTo(map).bindPopup(toLabel).openPopup();

    // Fetch route from OSRM (free, no API key)
    fetch(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`)
      .then((r) => r.json())
      .then((data) => {
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
          
          L.polyline(coords, {
            color: "hsl(145, 100%, 42%)",
            weight: 5,
            opacity: 0.8,
          }).addTo(map);

          map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });

          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.ceil(route.duration / 60).toString(),
          });
        }
      })
      .catch(() => {
        // Fallback: just draw straight line
        L.polyline([[fromLat, fromLng], [toLat, toLng]], {
          color: "hsl(145, 100%, 42%)",
          weight: 3,
          dashArray: "10, 10",
        }).addTo(map);
        map.fitBounds([[fromLat, fromLng], [toLat, toLng]], { padding: [40, 40] });
      });

    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [fromLat, fromLng, toLat, toLng]);

  return (
    <div className={className}>
      <div ref={mapRef} className="rounded-xl z-0" style={{ height: "280px", width: "100%" }} />
      {routeInfo && (
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground bg-card border border-border rounded-lg p-3">
          <span className="flex items-center gap-1.5">📏 <strong className="text-foreground">{routeInfo.distance} km</strong></span>
          <span className="flex items-center gap-1.5">🕐 <strong className="text-foreground">{routeInfo.duration} min</strong> drive</span>
        </div>
      )}
    </div>
  );
};

export default RouteMap;
