'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ------------------------------------------------------------------ */
/*  Custom marker icon with centered glow                              */
/* ------------------------------------------------------------------ */
const PIN_SIZE = 32;
const GLOW_SIZE = 64;

function createMarkerIcon() {
    // The glow is absolutely positioned so its center aligns with the
    // pin's tip (bottom-center of the icon).  The overall icon box is
    // sized to the pin; the glow overflows intentionally.
    return new L.DivIcon({
        className: 'venue-map-marker',
        html: `
            <div style="position:relative;width:${PIN_SIZE}px;height:${PIN_SIZE}px;">
                <!-- glow centered on pin tip -->
                <div style="
                    position:absolute;
                    width:${GLOW_SIZE}px;
                    height:${GLOW_SIZE}px;
                    left:${(PIN_SIZE - GLOW_SIZE) / 2}px;
                    top:${PIN_SIZE - GLOW_SIZE / 2}px;
                    border-radius:50%;
                    background:radial-gradient(circle, rgba(219,39,119,0.38) 0%, rgba(124,58,237,0.22) 36%, transparent 68%);
                    pointer-events:none;
                    filter:blur(4px);
                "></div>
                <!-- pin shape -->
                <div style="
                    position:absolute;
                    width:${PIN_SIZE}px;
                    height:${PIN_SIZE}px;
                    background:linear-gradient(135deg, #8b5cf6, #ec4899);
                    border:2.5px solid rgba(255,255,255,0.92);
                    border-radius:50% 50% 50% 0;
                    transform:rotate(-45deg);
                    box-shadow:0 4px 16px rgba(0,0,0,0.45), 0 0 20px rgba(168,85,247,0.3);
                ">
                    <div style="
                        width:10px;height:10px;
                        background:#fff;
                        border-radius:50%;
                        margin:8px auto;
                    "></div>
                </div>
            </div>`,
        iconSize: [PIN_SIZE, PIN_SIZE],
        iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
        popupAnchor: [0, -PIN_SIZE],
    });
}

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
            <style>{`
                .venue-map-shell {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: #1e2433;
                }
                .venue-map-container {
                    background: #1e2433;
                }
                /* Invert light Positron tiles into a readable dark theme */
                .venue-map-container .leaflet-tile-pane {
                    filter: invert(1) hue-rotate(180deg) brightness(1.65) contrast(1.2) saturate(0.3);
                }
                /* Un-invert the marker layer so pin colors stay correct */
                .venue-map-container .leaflet-marker-pane {
                    filter: none !important;
                }
                .venue-map-container .leaflet-control-zoom a {
                    background: rgba(28, 33, 48, 0.9) !important;
                    color: #cbd5e1 !important;
                    border-color: rgba(148, 163, 184, 0.14) !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                    backdrop-filter: blur(8px);
                }
                .venue-map-container .leaflet-control-zoom a:hover {
                    background: rgba(45, 52, 70, 0.94) !important;
                    color: #f1f5f9 !important;
                }
                .venue-map-container .leaflet-control-attribution {
                    background: rgba(20, 25, 38, 0.82) !important;
                    color: #64748b !important;
                    font-size: 9px !important;
                    backdrop-filter: blur(6px);
                }
                .venue-map-container .leaflet-control-attribution a {
                    color: #94a3b8 !important;
                }
                .venue-map-marker {
                    background: transparent !important;
                    border: none !important;
                    overflow: visible !important;
                }
            `}</style>
            <div
                className="venue-map-shell"
                style={{
                    height,
                    width: '100%',
                    borderRadius: 12,
                    overflow: 'hidden',
                }}
            >
                <MapContainer
                    center={[lat, lng]}
                    zoom={14}
                    scrollWheelZoom={false}
                    zoomControl={true}
                    attributionControl={true}
                    className="venue-map-container"
                    style={{
                        height: '100%',
                        width: '100%',
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={[lat, lng]} icon={createMarkerIcon()} />
                    <Recenter lat={lat} lng={lng} />
                </MapContainer>
            </div>
        </>
    );
};

export default VenueMap;
