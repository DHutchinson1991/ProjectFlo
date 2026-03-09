'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ------------------------------------------------------------------ */
/*  Custom dark-theme marker icon                                      */
/* ------------------------------------------------------------------ */
const venueIcon = new L.DivIcon({
    className: 'venue-map-marker',
    html: `<div style="
        width: 28px; height: 28px;
        background: linear-gradient(135deg, #a855f7, #6366f1);
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 12px rgba(168, 85, 247, 0.5);
    "><div style="
        width: 8px; height: 8px;
        background: #fff;
        border-radius: 50%;
        margin: 7px auto;
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
});

/* ------------------------------------------------------------------ */
/*  Recenter helper — smoothly flies to new coords when they change    */
/* ------------------------------------------------------------------ */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    const prev = useRef({ lat, lng });
    useEffect(() => {
        if (prev.current.lat !== lat || prev.current.lng !== lng) {
            map.flyTo([lat, lng], 14, { duration: 1.2 });
            prev.current = { lat, lng };
        }
    }, [lat, lng, map]);
    return null;
}

/* ------------------------------------------------------------------ */
/*  VenueMap                                                           */
/* ------------------------------------------------------------------ */
interface VenueMapProps {
    lat: number;
    lng: number;
    height?: number | string;
}

const VenueMap: React.FC<VenueMapProps> = ({ lat, lng, height = 180 }) => {
    return (
        <>
            {/* Override Leaflet's default control styling for dark theme */}
            <style>{`
                .venue-map-container .leaflet-control-zoom a {
                    background: rgba(15, 23, 42, 0.9) !important;
                    color: #94a3b8 !important;
                    border-color: rgba(51, 65, 85, 0.5) !important;
                }
                .venue-map-container .leaflet-control-zoom a:hover {
                    background: rgba(30, 41, 59, 0.95) !important;
                    color: #e2e8f0 !important;
                }
                .venue-map-container .leaflet-control-attribution {
                    background: rgba(15, 23, 42, 0.7) !important;
                    color: #475569 !important;
                    font-size: 9px !important;
                }
                .venue-map-container .leaflet-control-attribution a {
                    color: #64748b !important;
                }
                .venue-map-marker {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
            <MapContainer
                center={[lat, lng]}
                zoom={14}
                scrollWheelZoom={false}
                zoomControl={true}
                attributionControl={true}
                className="venue-map-container"
                style={{
                    height,
                    width: '100%',
                    borderRadius: 12,
                    overflow: 'hidden',
                }}
            >
                {/* CartoDB Dark Matter — dark-themed tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[lat, lng]} icon={venueIcon} />
                <Recenter lat={lat} lng={lng} />
            </MapContainer>
        </>
    );
};

export default VenueMap;
