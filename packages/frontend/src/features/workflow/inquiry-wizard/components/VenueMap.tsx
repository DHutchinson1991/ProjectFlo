"use client";

import React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

/* ── Fix default Leaflet marker icons in Next.js ──────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

/* ── Green pin to match brand accent ─────────────────────────── */
const greenPin = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface VenueMapProps {
    lat: number;
    lng: number;
    height?: number | string;
    interactive?: boolean;
}

export default function VenueMap({ lat, lng, height = 300, interactive = false }: VenueMapProps) {
    return (
        <div style={{ height, width: "100%" }}>
            <style>{`
                .venue-map-dark .leaflet-tile-pane {
                    filter: brightness(0.85) saturate(0.7);
                }
            `}</style>
            <MapContainer
                center={[lat, lng]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                className="venue-map-dark"
                zoomControl={interactive}
                attributionControl={false}
                dragging={interactive}
                scrollWheelZoom={interactive}
                doubleClickZoom={interactive}
                touchZoom={interactive}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={19}
                />
                <Marker position={[lat, lng]} icon={greenPin} />
            </MapContainer>
        </div>
    );
}
