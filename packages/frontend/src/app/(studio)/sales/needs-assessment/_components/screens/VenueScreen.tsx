"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Box, CircularProgress, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    Close as CloseIcon,
    LocationOn as LocationOnIcon,
    Search as SearchIcon,
    EditLocationAlt as ChangeIcon,
    CheckCircle as CheckCircleIcon,
    Public as GlobeIcon,
} from "@mui/icons-material";
import dynamic from "next/dynamic";
import { ClickAwayListener } from "@mui/material";
import { C } from "../../constants";
import { fadeInUp } from "../../animations";
import { NACtx, NominatimResult } from "../../types";
import { searchNominatim, formatShortAddress } from "../../utils";

const UKRegionMap = dynamic(() => import("../UKRegionMap"), { ssr: false, loading: () => (
    <Box sx={{ height: 480, borderRadius: "20px", bgcolor: "#e8e2d9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} sx={{ color: alpha(C.accent, 0.5) }} />
    </Box>
) });

const VenueMap = dynamic(() => import("../VenueMap"), { ssr: false, loading: () => (
    <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha("#f5f3ef", 0.06) }}>
        <CircularProgress size={24} sx={{ color: alpha("#34d399", 0.5) }} />
    </Box>
) });

const glowPulse = keyframes`
    0%, 100% { box-shadow: 0 0 12px ${alpha("#34d399", 0.15)}; }
    50% { box-shadow: 0 0 24px ${alpha("#34d399", 0.25)}; }
`;

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
        const portalBg = typeof document !== "undefined" ? createPortal(
            <Box
                data-venue-bg
                sx={{
                    position: "fixed", inset: 0, zIndex: 0,
                    pointerEvents: "none",
                    opacity: satLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease-in-out",
                }}
            >
                {/* Satellite — low opacity, subtle bg hint */}
                <Box sx={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${satBg})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.18,
                }} />
                {/* Heavy dark overlay — keeps it very faint */}
                <Box sx={{
                    position: "absolute", inset: 0,
                    background: [
                        "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(12,12,16,0.4) 0%, rgba(12,12,16,0.85) 100%)",
                        "linear-gradient(180deg, rgba(12,12,16,0.6) 0%, rgba(12,12,16,0.25) 25%, rgba(12,12,16,0.25) 75%, rgba(12,12,16,0.6) 100%)",
                    ].join(", "),
                }} />
                {/* Purple colour tint */}
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
                {/* ── Floating content ───────────────────── */}
                <Box sx={{
                    position: "relative", zIndex: 10, width: "100%", maxWidth: 620,
                    mx: "auto", py: { xs: 3, md: 5 }, px: { xs: 2, md: 0 },
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5,
                    animation: `${mapFadeIn} 0.5s ease-out both`,
                }}>
                    {/* ── Venue name ──────────────────────── */}
                    <Box sx={{ textAlign: "center" }}>
                        <Typography sx={{
                            color: "#fff", fontWeight: 700,
                            fontSize: { xs: "1.3rem", md: "1.6rem" },
                            lineHeight: 1.2, letterSpacing: "-0.01em",
                        }}>
                            {responses.venue_name || responses.venue_details}
                        </Typography>
                        {responses.venue_details && (
                            <Typography sx={{
                                color: alpha("#fff", 0.4), fontSize: "0.82rem", mt: 0.8,
                                lineHeight: 1.5,
                            }}>
                                {responses.venue_details}
                            </Typography>
                        )}
                    </Box>

                    {/* ── Interactive map card ────────────── */}
                    <Box sx={{
                        width: { xs: 320, md: 380 }, height: { xs: 360, md: 420 },
                        borderRadius: "20px", overflow: "hidden",
                        bgcolor: C.card,
                        border: `1px solid ${alpha("#fff", 0.08)}`,
                        boxShadow: `0 20px 60px ${alpha("#000", 0.5)}, inset 0 1px 0 ${alpha("#fff", 0.05)}`,
                        animation: `${glowPulse} 4s ease-in-out infinite`,
                        display: "flex", flexDirection: "column",
                        "& .leaflet-control-zoom": {
                            border: "none !important",
                            boxShadow: `0 2px 12px ${alpha("#000", 0.3)} !important`,
                        },
                        "& .leaflet-control-zoom a": {
                            bgcolor: `${alpha(C.card, 0.85)} !important`,
                            color: `${C.text} !important`,
                            backdropFilter: "blur(12px)",
                            border: `1px solid ${alpha("#fff", 0.1)} !important`,
                            "&:hover": { bgcolor: `${alpha(C.card, 0.95)} !important` },
                        },
                    }}>
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <VenueMap lat={venueLat} lng={venueLng} height="100%" interactive />
                        </Box>
                        {/* Hint */}
                        <Box sx={{
                            px: 2.5, py: 1.2, display: "flex", alignItems: "center", justifyContent: "center",
                            borderTop: `1px solid ${alpha("#fff", 0.05)}`,
                        }}>
                            <Typography sx={{ color: alpha(C.muted, 0.35), fontSize: "0.7rem", fontWeight: 500 }}>
                                Scroll to zoom · drag to explore
                            </Typography>
                        </Box>
                    </Box>

                    {/* ── Change venue link ───────────────── */}
                    <Box
                        onClick={handleClear}
                        sx={{
                            display: "flex", alignItems: "center", gap: 0.8,
                            cursor: "pointer", transition: "all 0.2s",
                            "&:hover .change-text": { color: C.accent },
                            "&:hover .change-icon": { color: C.accent },
                        }}>
                        <ChangeIcon className="change-icon" sx={{ fontSize: 15, color: alpha(C.muted, 0.35), transition: "color 0.2s" }} />
                        <Typography className="change-text" sx={{
                            color: alpha(C.muted, 0.35), fontSize: "0.78rem", fontWeight: 500, transition: "color 0.2s",
                        }}>
                            Change venue
                        </Typography>
                    </Box>
                </Box>
            </>
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
                    <Box sx={{
                        borderRadius: "22px", overflow: "hidden",
                        bgcolor: alpha(C.card, 0.55), backdropFilter: "blur(24px) saturate(1.8)",
                        border: `1.5px solid ${alpha("#38bdf8", 0.25)}`,
                        animation: `${mapFadeIn} 0.4s ease-out both`,
                    }}>
                        <Box sx={{ px: 3, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{
                                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: `linear-gradient(135deg, ${alpha("#38bdf8", 0.15)}, ${alpha("#818cf8", 0.1)})`,
                            }}>
                                <GlobeIcon sx={{ color: "#38bdf8", fontSize: 24 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{
                                    color: alpha(C.muted, 0.5), fontSize: "0.68rem", fontWeight: 600,
                                    letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.3,
                                }}>
                                    General area
                                </Typography>
                                <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "1.15rem", lineHeight: 1.3 }}>
                                    {responses.venue_region}
                                </Typography>
                            </Box>
                            <CheckCircleIcon sx={{ color: "#38bdf8", fontSize: 22, flexShrink: 0 }} />
                        </Box>
                        <Box
                            onClick={() => handleChange("venue_region", null)}
                            sx={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8,
                                py: 1.5, cursor: "pointer", transition: "all 0.2s",
                                borderTop: `1px solid ${alpha(C.border, 0.15)}`,
                                "&:hover": { bgcolor: alpha(C.text, 0.03) },
                                "&:hover .change-text": { color: C.accent },
                            }}>
                            <ChangeIcon sx={{ fontSize: 16, color: alpha(C.muted, 0.45), transition: "color 0.2s" }} />
                            <Typography className="change-text" sx={{
                                color: alpha(C.muted, 0.45), fontSize: "0.78rem", fontWeight: 500, transition: "color 0.2s",
                            }}>
                                Change location
                            </Typography>
                        </Box>
                    </Box>

                /* ═══ VENUE SEARCH MODE ═══ */
                ) : mode === "search" ? (
                    <ClickAwayListener onClickAway={() => setVenueDropdownOpen(false)}>
                        <Box sx={{ position: "relative" }}>
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
                                <Box sx={{
                                    width: 64, height: 64, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: `linear-gradient(135deg, ${alpha("#34d399", 0.12)}, ${alpha("#38bdf8", 0.08)})`,
                                    border: `1.5px solid ${alpha("#34d399", 0.15)}`,
                                }}>
                                    <LocationOnIcon sx={{ fontSize: 30, color: "#34d399" }} />
                                </Box>
                            </Box>

                            <TextField
                                value={venueQuery}
                                placeholder="Search venue name, address, or city…"
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => venueResults.length > 0 && setVenueDropdownOpen(true)}
                                fullWidth autoFocus
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        color: C.text, borderRadius: "18px", fontSize: "1.05rem",
                                        py: 0.8, px: 1,
                                        bgcolor: alpha(C.card, 0.6), backdropFilter: "blur(12px)",
                                        "& fieldset": { borderColor: alpha(C.border, 0.5), borderWidth: "1.5px" },
                                        "&:hover fieldset": { borderColor: alpha(C.accent, 0.4) },
                                        "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: "2px" },
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: alpha(C.muted, 0.5), fontSize: 22 }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: venueLoading ? (
                                        <InputAdornment position="end">
                                            <CircularProgress size={20} sx={{ color: alpha(C.accent, 0.6) }} />
                                        </InputAdornment>
                                    ) : venueQuery ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={handleClear} sx={{
                                                color: alpha(C.muted, 0.4), "&:hover": { color: C.text },
                                            }}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                }}
                            />

                            {/* Dropdown results */}
                            {venueDropdownOpen && venueResults.length > 0 && (
                                <Box sx={{
                                    position: "absolute", top: "100%", left: 0, right: 0, mt: 1, zIndex: 20,
                                    bgcolor: alpha(C.card, 0.95), backdropFilter: "blur(20px)",
                                    border: `1.5px solid ${alpha(C.accent, 0.2)}`, borderRadius: "18px",
                                    maxHeight: 320, overflowY: "auto", py: 0.5,
                                    boxShadow: `0 12px 40px ${alpha("#000", 0.4)}`,
                                    "&::-webkit-scrollbar": { width: 5 },
                                    "&::-webkit-scrollbar-thumb": { bgcolor: alpha(C.accent, 0.25), borderRadius: 3 },
                                }}>
                                    {venueResults.map((r, idx) => (
                                        <Box key={r.place_id} onClick={() => handleSelect(r)} sx={{
                                            px: 2.5, py: 1.8, cursor: "pointer",
                                            display: "flex", alignItems: "flex-start", gap: 1.8,
                                            borderBottom: idx < venueResults.length - 1
                                                ? `1px solid ${alpha(C.border, 0.12)}` : "none",
                                            transition: "all 0.15s ease",
                                            "&:hover": { bgcolor: alpha(C.accent, 0.08) },
                                        }}>
                                            <Box sx={{
                                                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                bgcolor: alpha(C.accent, 0.08), mt: 0.2,
                                            }}>
                                                <LocationOnIcon sx={{ color: C.accent, fontSize: 20 }} />
                                            </Box>
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography sx={{ color: C.text, fontSize: "0.95rem", fontWeight: 500, lineHeight: 1.3 }}>
                                                    {r.name || formatShortAddress(r)}
                                                </Typography>
                                                <Typography sx={{
                                                    color: alpha(C.muted, 0.55), fontSize: "0.78rem", mt: 0.3,
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {r.display_name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {venueQuery.length >= 1 && venueQuery.length < 3 && !venueLoading && (
                                <Typography sx={{
                                    color: alpha(C.muted, 0.35), fontSize: "0.78rem", mt: 1.5, textAlign: "center",
                                }}>
                                    Keep typing to search…
                                </Typography>
                            )}

                            {!venueQuery && (
                                <Box sx={{ mt: 3.5, textAlign: "center" }}>
                                    <Typography sx={{
                                        color: alpha(C.muted, 0.3), fontSize: "0.75rem", fontWeight: 500,
                                        letterSpacing: "0.06em", textTransform: "uppercase", mb: 1.5,
                                    }}>
                                        Try searching for
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
                                        {["Hotel name", "Church or chapel", "Restaurant", "Barn or estate"].map((hint) => (
                                            <Box key={hint} sx={{
                                                px: 2, py: 0.8, borderRadius: "12px",
                                                bgcolor: alpha(C.text, 0.03),
                                                border: `1px solid ${alpha(C.border, 0.15)}`,
                                            }}>
                                                <Typography sx={{ color: alpha(C.muted, 0.4), fontSize: "0.76rem" }}>
                                                    {hint}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Switch to no-venue mode */}
                            <Typography
                                onClick={switchToNoVenue}
                                sx={{
                                    color: alpha(C.muted, 0.5), fontSize: "0.82rem", fontWeight: 500,
                                    mt: 3.5, textAlign: "center", cursor: "pointer",
                                    transition: "color 0.2s",
                                    textDecoration: "underline", textDecorationColor: alpha(C.muted, 0.2),
                                    textUnderlineOffset: "4px",
                                    "&:hover": { color: C.accent, textDecorationColor: alpha(C.accent, 0.4) },
                                }}>
                                I don&apos;t have a venue yet
                            </Typography>
                        </Box>
                    </ClickAwayListener>

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
