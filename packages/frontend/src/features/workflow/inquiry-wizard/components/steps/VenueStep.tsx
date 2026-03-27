"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { CheckCircle as CheckCircleIcon, EditLocationAlt as ChangeIcon, Public as GlobeIcon } from "@mui/icons-material";
import dynamic from "next/dynamic";
import { C } from '../../constants/wizard-config';
import { fadeInUp } from '../../constants/animations';
import { NACtx, NominatimResult } from '../../types';
import { searchNominatim, formatShortAddress } from '../../selectors/wizard-navigation';
import { VenueSelectedView } from "../VenueSelectedView";
import { VenueSearchMode } from "../VenueSearchMode";

const UKRegionMap = dynamic(() => import("../UKRegionMap"), { ssr: false });

const mapFadeIn = keyframes`
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
`;

type VenueMode = "search" | "no-venue";

export default function VenueScreen({ ctx }: { ctx: NACtx }) {
    const { eventConfig, responses, handleChange } = ctx;

    // Determine initial mode from saved responses
    const hasVenueSelected = !!(responses.venue_lat && responses.venue_lng);
    const hasRegionSelected = !!(responses.venue_region && !responses.venue_lat);
    const initialMode: VenueMode = hasRegionSelected ? "no-venue" : "search";

    const [mode, setMode] = useState<VenueMode>(initialMode);

    // Venue search state
    const [venueQuery,       setVenueQuery]       = useState(responses.venue_name || responses.venue_details || "");
    const [venueResults,     setVenueResults]     = useState<NominatimResult[]>([]);
    const [venueLoading,     setVenueLoading]     = useState(false);
    const [venueDropdownOpen,setVenueDropdownOpen]= useState(false);
    const debounce = useRef<number | null>(null);
    const satPreloadRef = useRef<string>("");

    const handleSearch = useCallback((q: string) => {
        setVenueQuery(q);
        handleChange("venue_details", q);
        if (debounce.current) clearTimeout(debounce.current);
        if (q.length < 3) { setVenueResults([]); setVenueDropdownOpen(false); return; }
        setVenueLoading(true);
        debounce.current = window.setTimeout(async () => {
            const r = await searchNominatim(q);
            setVenueResults(r);
            setVenueDropdownOpen(r.length > 0);
            setVenueLoading(false);
        }, 500);
    }, [handleChange]);

    /* Build satellite URL from coords (small 400x225 for fast load) */
    const buildSatUrl = useCallback((lat: number, lng: number) =>
        `https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${lng - 0.08},${lat - 0.045},${lng + 0.08},${lat + 0.045}&bboxSR=4326&size=400,225&imageSR=4326&f=image`, []);

    const handleSelect = useCallback((r: NominatimResult) => {
        const short = formatShortAddress(r);
        const name  = r.name || r.display_name.split(",")[0].trim();
        setVenueQuery(name);
        handleChange("venue_name",    name);
        handleChange("venue_details", short);
        handleChange("venue_address", r.display_name);
        handleChange("venue_lat",     parseFloat(r.lat));
        handleChange("venue_lng",     parseFloat(r.lon));
        handleChange("venue_region",  null);
        setVenueDropdownOpen(false);
        /* Eagerly preload satellite image before React re-renders */
        const url = buildSatUrl(parseFloat(r.lat), parseFloat(r.lon));
        satPreloadRef.current = url;
        const img = new Image();
        img.onload = () => setSatLoaded(true);
        img.src = url;
    }, [handleChange, buildSatUrl]);

    const handleClear = useCallback(() => {
        setVenueQuery(""); setVenueResults([]); setVenueDropdownOpen(false);
        handleChange("venue_name", ""); handleChange("venue_details", "");
        handleChange("venue_address", ""); handleChange("venue_lat", null); handleChange("venue_lng", null);
    }, [handleChange]);

    const switchToNoVenue = useCallback(() => {
        handleClear();
        setMode("no-venue");
    }, [handleClear]);

    const switchToSearch = useCallback(() => {
        handleChange("venue_region", null);
        setMode("search");
    }, [handleChange]);

    const hasRegion = !!responses.venue_region;
    /* ── Satellite header background for selected venue ───────── */
    const venueLat = Number(responses.venue_lat);
    const venueLng = Number(responses.venue_lng);
    const satBg = hasVenueSelected ? buildSatUrl(venueLat, venueLng) : "";
    /* ── Subtitle copy ──────────────────────────────────────── */
    const subtitle = hasVenueSelected
        ? "Great choice! Here\u2019s your venue on the map."
        : hasRegion
            ? "We\u2019ll use this to estimate travel for the crew."
            : "This helps us plan travel and logistics for the crew";

    /* ── Preload satellite image and fade in ─────────────────── */
    const [satLoaded, setSatLoaded] = useState(false);
    useEffect(() => {
        if (!satBg) { setSatLoaded(false); return; }
        /* Skip if handleSelect already started preloading this exact URL */
        if (satPreloadRef.current === satBg) return;
        const img = new Image();
        img.onload = () => setSatLoaded(true);
        img.src = satBg;
        return () => { img.onload = null; };
    }, [satBg]);

    /* ── Full-page satellite background when venue is selected ── */
    if (hasVenueSelected) {
        return (
            <VenueSelectedView
                venueName={responses.venue_name || responses.venue_details || ""}
                venueDetails={responses.venue_details || ""}
                venueLat={venueLat}
                venueLng={venueLng}
                satBg={satBg}
                satLoaded={satLoaded}
                handleClear={handleClear}
            />
        );
    }

    return (
        <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            py: { xs: 3, md: 5 }, maxWidth: 620, mx: "auto", width: "100%",
        }}>
            {/* ── Title ─────────────────────────────────── */}
            <Box sx={{ textAlign: "center", mb: 1 }}>
                <Typography sx={{
                    fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 200, color: C.text,
                    letterSpacing: "-0.02em", lineHeight: 1.15,
                }}>
                    {eventConfig.venueLabel}
                </Typography>
                <Typography sx={{
                    color: alpha(C.muted, 0.7), fontSize: "0.88rem", mt: 1.2,
                    maxWidth: 440, mx: "auto", lineHeight: 1.6,
                }}>
                    {subtitle}
                </Typography>
            </Box>

            {/* ── Content ───────────────────────────────── */}
            <Box sx={{ width: "100%", animation: `${fadeInUp} 0.35s ease-out 0.1s both` }}>

                {/* ═══ SELECTED REGION / SEARCH / NO-VENUE ═══ */}
                {hasRegion ? (
                    <Box sx={{ borderRadius: "22px", overflow: "hidden", bgcolor: alpha(C.card, 0.55), backdropFilter: "blur(24px) saturate(1.8)", border: `1.5px solid ${alpha("#38bdf8", 0.25)}`, animation: `${mapFadeIn} 0.4s ease-out both` }}>
                        <Box sx={{ px: 3, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${alpha("#38bdf8", 0.15)}, ${alpha("#818cf8", 0.1)})` }}>
                                <GlobeIcon sx={{ color: "#38bdf8", fontSize: 24 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ color: alpha(C.muted, 0.5), fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.3 }}>General area</Typography>
                                <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "1.15rem", lineHeight: 1.3 }}>{responses.venue_region}</Typography>
                            </Box>
                            <CheckCircleIcon sx={{ color: "#38bdf8", fontSize: 22, flexShrink: 0 }} />
                        </Box>
                        <Box onClick={() => handleChange("venue_region", null)} sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, py: 1.5, cursor: "pointer", transition: "all 0.2s", borderTop: `1px solid ${alpha(C.border, 0.15)}`, "&:hover": { bgcolor: alpha(C.text, 0.03) }, "&:hover .change-text": { color: C.accent } }}>
                            <ChangeIcon sx={{ fontSize: 16, color: alpha(C.muted, 0.45), transition: "color 0.2s" }} />
                            <Typography className="change-text" sx={{ color: alpha(C.muted, 0.45), fontSize: "0.78rem", fontWeight: 500, transition: "color 0.2s" }}>Change location</Typography>
                        </Box>
                    </Box>

                /* ═══ VENUE SEARCH MODE ═══ */
                ) : mode === "search" ? (
                    <VenueSearchMode
                        venueQuery={venueQuery}
                        venueResults={venueResults}
                        venueLoading={venueLoading}
                        venueDropdownOpen={venueDropdownOpen}
                        setVenueDropdownOpen={setVenueDropdownOpen}
                        handleSearch={handleSearch}
                        handleSelect={handleSelect}
                        handleClear={handleClear}
                        switchToNoVenue={switchToNoVenue}
                    />

                /* ═══ NO VENUE — REGION/COUNTRY SEARCH ═══ */
                ) : (
                    /* ═══ NO VENUE — INTERACTIVE UK MAP ═══ */
                    <Box>
                        <Typography sx={{
                            color: alpha(C.muted, 0.6), fontSize: "0.85rem", textAlign: "center", mb: 2, lineHeight: 1.5,
                        }}>
                            No problem — tap the map to pick the general area
                        </Typography>

                        <UKRegionMap
                            onRegionSelect={(name) => {
                                handleChange("venue_region", name);
                                handleChange("venue_name", "");
                                handleChange("venue_details", "");
                                handleChange("venue_address", "");
                                handleChange("venue_lat", null);
                                handleChange("venue_lng", null);
                            }}
                            onCancel={switchToSearch}
                        />

                        {/* Switch back to venue search */}
                        <Typography
                            onClick={switchToSearch}
                            sx={{
                                color: alpha(C.muted, 0.5), fontSize: "0.82rem", fontWeight: 500,
                                mt: 2.5, textAlign: "center", cursor: "pointer",
                                transition: "color 0.2s",
                                textDecoration: "underline", textDecorationColor: alpha(C.muted, 0.2),
                                textUnderlineOffset: "4px",
                                "&:hover": { color: C.accent, textDecorationColor: alpha(C.accent, 0.4) },
                            }}>
                            I have a venue — search for it
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
