# Location & Map Functionality in Fix Hunger

This document explains the location and mapping architecture implemented in the project. It describes the libraries used, the map style, reverse-geocoding APIs, routing services, and the React components developed.

---

## 1. Core Technology Stack

- **Map Library**: [Leaflet.js](https://leafletjs.com/) (Version `^1.9.4`)
- **Map Tile Provider (Design Layer)**: [CartoDB Positron (Light/Smooth)](https://carto.com/basemaps/)
- **Routing Engine**: [OSRM API (Open Source Routing Machine)](https://project-osrm.org/) (Free driving route API)
- **Reverse Geocoding**: [BigDataCloud API](https://www.bigdatacloud.com/) (Converts coordinates to street addresses)
- **Base Map Data**: [OpenStreetMap (OSM)](https://www.openstreetmap.org/)

---

## 2. Global Configurations (`src/lib/map-utils.ts`)

All map configurations, styles, and utility functions reside in [map-utils.ts](file:///c:/Users/jahan/Downloads/user-portal-main%20%285%29/user-portal-main/src/lib/map-utils.ts):

- **Default Center**: Lahore, Pakistan (`lat: 31.5204`, `lng: 74.3587`).
- **Map Style Tile URL**: CartoDB Positron's clean white theme fits the app's modern UX design.
- **Reverse Geocoding**: An asynchronous function `reverseGeocodeLocation(lat, lng)` that queries the BigDataCloud API to retrieve city, province, and full address from coordinates.
- **Google Directions Link Generator**: `buildGoogleDirectionsUrl(fromLat, fromLng, toLat, toLng)` generates a driving directions URL opening directly in Google Maps for drivers.

---

## 3. Map Components (React)

The maps are rendered using native Leaflet instances binded directly to React `useRef` divs. This avoids rendering conflicts with concurrent React tree updates.

### A. Location Map Component (`LocationMap.tsx`)
- **File Link**: [LocationMap.tsx](file:///c:/Users/jahan/Downloads/user-portal-main%20%285%29/user-portal-main/src/components/LocationMap.tsx)
- **Purpose**: Let users select or view a location (e.g. food donation address, provider store, or NGO office).
- **Features**:
  - Sets up a single pin (marker) representing the target address.
  - Can be made **draggable** by passing the `draggable` prop.
  - Listeners are bound to map clicks and marker drag-ends. Moving the marker automatically triggers `onLocationChange(lat, lng)` to update the parent form state in React.

### B. Route Map Component (`RouteMap.tsx`)
- **File Link**: [RouteMap.tsx](file:///c:/Users/jahan/Downloads/user-portal-main%20%285%29/user-portal-main/src/components/RouteMap.tsx)
- **Purpose**: Show visual driving routes between food providers (donors) and NGOs (receivers).
- **Features**:
  - Automatically queries the OSRM endpoint with origin and destination coordinates.
  - If a route is found, it renders a primary-green colored polyline connecting both points.
  - Calculates and displays the driving distance in kilometers (`km`) and driving duration in minutes (`min`).
  - Automatically fits the view bounds to show the entire route with comfortable padding.
  - Falls back to a clean straight dashed line if the OSRM server fails.

### C. Activity Dashboard Map (`ActivityMap.tsx`)
- **File Link**: [ActivityMap.tsx](file:///c:/Users/jahan/Downloads/user-portal-main%20%285%29/user-portal-main/src/components/ActivityMap.tsx)
- **Purpose**: Displays a dashboard of multiple active points (donations, NGOs, providers) on a single unified map.
- **Features**:
  - Places circle markers on the map, styled according to category semantic colors:
    - **Green**: Active food donations
    - **Purple**: Active NGO locations
    - **Blue**: Active Food providers/restaurants
    - **Red**: Inactive or urgent donation requests
  - Popups display labels and descriptions when markers are clicked.
  - Dynamically calculates the optimal geographic bounds of all active markers to zoom and fit them into screen view automatically.

---

## 4. Why this stack was selected

1. **No API Keys Required**: Leaflet is open-source, OpenStreetMap tile data is free, OSRM requires no subscription key, and BigDataCloud offers a free tier. This makes it extremely easy to run and host.
2. **Superior Performance**: Using vanilla Leaflet wrapper inside React `useEffect` ensures map rendering bypasses React's virtual DOM re-renders, increasing performance and stability.
3. **Clean Aesthetics**: The CartoDB light style removes clutter and details from base maps, keeping attention on markers, routes, and donation centers.
