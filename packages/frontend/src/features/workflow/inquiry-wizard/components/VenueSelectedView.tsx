"use client";
import React from "react";
import { createPortal } from "react-dom";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { EditLocationAlt as ChangeIcon } from "@mui/icons-material";
import dynamic from "next/dynamic";
import { C } from '../constants/wizard-config';

const VenueMap = dynamic(() => import("./VenueMap"), { ssr: false });

const glowPulse = keyframes`
    0%, 100% { box-shadow: 0 0 12px ${alpha("#34d399", 0.15)}; }
    50% { box-shadow: 0 0 24px ${alpha("#34d399", 0.25)}; }
`;
const mapFadeIn = keyframes`
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
`;

interface Props {
    venueName: string;
    venueDetails: string;
    venueLat: number;
    venueLng: number;
    satBg: string;
    satLoaded: boolean;
    handleClear: () => void;
}

export function VenueSelectedView({ venueName, venueDetails, venueLat, venueLng, satBg, satLoaded, handleClear }: Props) {
    const portalBg = typeof document !== "undefined" ? createPortal(
        <Box
            data-venue-bg
            sx={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: satLoaded ? 1 : 0, transition: "opacity 0.3s ease-in-out" }}
        >
            <Box sx={{ position: "absolute", inset: 0, backgroundImage: `url(${satBg})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.18 }} />
            <Box sx={{
                position: "absolute", inset: 0,
                background: [
                    "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(12,12,16,0.4) 0%, rgba(12,12,16,0.85) 100%)",
                    "linear-gradient(180deg, rgba(12,12,16,0.6) 0%, rgba(12,12,16,0.25) 25%, rgba(12,12,16,0.25) 75%, rgba(12,12,16,0.6) 100%)",
                ].join(", "),
            }} />
            <Box sx={{
                position: "absolute", inset: 0,
                background: [
                    `radial-gradient(ellipse 100% 70% at 50% 40%, ${alpha("#7c4dff", 0.08)} 0%, transparent 70%)`,
                    `radial-gradient(ellipse 60% 80% at 80% 90%, ${alpha("#a855f7", 0.05)} 0%, transparent 60%)`,
                ].join(", "),
            }} />
        </Box>,
        document.body,
    ) : null;

    return (
        <>
            {portalBg}
            <Box sx={{
                position: "relative", zIndex: 10, width: "100%", maxWidth: 620,
                mx: "auto", py: { xs: 3, md: 5 }, px: { xs: 2, md: 0 },
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5,
                animation: `${mapFadeIn} 0.5s ease-out both`,
            }}>
                <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.3rem", md: "1.6rem" }, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                        {venueName}
                    </Typography>
                    {venueDetails && (
                        <Typography sx={{ color: alpha("#fff", 0.4), fontSize: "0.82rem", mt: 0.8, lineHeight: 1.5 }}>
                            {venueDetails}
                        </Typography>
                    )}
                </Box>

                <Box sx={{
                    width: { xs: 320, md: 380 }, height: { xs: 360, md: 420 },
                    borderRadius: "20px", overflow: "hidden", bgcolor: C.card,
                    border: `1px solid ${alpha("#fff", 0.08)}`,
                    boxShadow: `0 20px 60px ${alpha("#000", 0.5)}, inset 0 1px 0 ${alpha("#fff", 0.05)}`,
                    animation: `${glowPulse} 4s ease-in-out infinite`,
                    display: "flex", flexDirection: "column",
                    "& .leaflet-control-zoom": { border: "none !important", boxShadow: `0 2px 12px ${alpha("#000", 0.3)} !important` },
                    "& .leaflet-control-zoom a": {
                        bgcolor: `${alpha(C.card, 0.85)} !important`, color: `${C.text} !important`,
                        backdropFilter: "blur(12px)", border: `1px solid ${alpha("#fff", 0.1)} !important`,
                        "&:hover": { bgcolor: `${alpha(C.card, 0.95)} !important` },
                    },
                }}>
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <VenueMap lat={venueLat} lng={venueLng} height="100%" interactive />
                    </Box>
                    <Box sx={{ px: 2.5, py: 1.2, display: "flex", alignItems: "center", justifyContent: "center", borderTop: `1px solid ${alpha("#fff", 0.05)}` }}>
                        <Typography sx={{ color: alpha(C.muted, 0.35), fontSize: "0.7rem", fontWeight: 500 }}>
                            Scroll to zoom · drag to explore
                        </Typography>
                    </Box>
                </Box>

                <Box onClick={handleClear} sx={{ display: "flex", alignItems: "center", gap: 0.8, cursor: "pointer", transition: "all 0.2s", "&:hover .change-text": { color: C.accent }, "&:hover .change-icon": { color: C.accent } }}>
                    <ChangeIcon className="change-icon" sx={{ fontSize: 15, color: alpha(C.muted, 0.35), transition: "color 0.2s" }} />
                    <Typography className="change-text" sx={{ color: alpha(C.muted, 0.35), fontSize: "0.78rem", fontWeight: 500, transition: "color 0.2s" }}>
                        Change venue
                    </Typography>
                </Box>
            </Box>
        </>
    );
}
