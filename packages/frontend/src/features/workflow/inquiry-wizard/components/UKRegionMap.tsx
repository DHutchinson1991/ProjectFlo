"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { C } from '../constants/wizard-config';
import { reverseGeocode } from '@/features/workflow/locations/api/geocoding.api';

/* ── Fix default Leaflet marker icons in Next.js ──────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── Custom purple marker ─────────────────────────────────────── */
const purpleIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

/* ── Click handler component (must live inside MapContainer) ──── */
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

/* ── Props ───────────────────────────────────────────────────── */
interface UKRegionMapProps {
    onRegionSelect: (regionName: string) => void;
    onCancel?: () => void;
}

export default function UKRegionMap({ onRegionSelect }: UKRegionMapProps) {
    const [clickPos, setClickPos]     = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading]       = useState(false);
    const [geocodeError, setGeocodeError] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const handleMapClick = async (lat: number, lng: number) => {
        setClickPos({ lat, lng });
        setGeocodeError(false);
        setLoading(true);
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        const name = await reverseGeocode(lat, lng);
        setLoading(false);
        if (name) {
            onRegionSelect(name);
        } else {
            setGeocodeError(true);
        }
    };

    // Cleanup on unmount
    useEffect(() => () => { abortRef.current?.abort(); }, []);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* ── Map ─────────────────────────────────── */}
            <Box sx={{ position: "relative", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
                <MapContainer
                    center={[54.5, -3.5]}
                    zoom={5}
                    style={{ height: 480, width: "100%", background: "#e8e2d9" }}
                    zoomControl
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        subdomains="abcd"
                        maxZoom={19}
                    />
                    <ClickHandler onMapClick={handleMapClick} />
                    {clickPos && (
                        <Marker position={[clickPos.lat, clickPos.lng]} icon={purpleIcon} />
                    )}
                </MapContainer>

                {/* ── Instruction overlay (shown when nothing clicked) ── */}
                {!clickPos && (
                    <Box sx={{
                        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                        bgcolor: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: "14px", px: 3, py: 1.4, zIndex: 500,
                        pointerEvents: "none", whiteSpace: "nowrap",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    }}>
                        <Typography sx={{ color: "rgba(30,30,40,0.75)", fontSize: "0.85rem", fontWeight: 500 }}>
                            ✦ Tap anywhere on the map to select an area
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── Status text (below the map) ─────────── */}
            {clickPos && (
                <Box sx={{ textAlign: "center", pt: 0.5 }}>
                    {loading ? (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                            <CircularProgress size={14} sx={{ color: C.accent }} />
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                                Detecting area…
                            </Typography>
                        </Box>
                    ) : geocodeError ? (
                        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>
                            Couldn&apos;t detect area — try tapping again
                        </Typography>
                    ) : null}
                </Box>
            )}
        </Box>
    );
}
