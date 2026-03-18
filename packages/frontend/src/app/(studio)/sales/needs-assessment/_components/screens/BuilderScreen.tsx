"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Check as CheckIcon,
    MovieFilter as MovieFilterIcon,
    AutoAwesome as AutoAwesomeIcon,
    Videocam as VideocamIcon,
    Person as PersonIcon,
} from "@mui/icons-material";
import { C, glassSx } from "../../constants";
import { checkPop, filmStagger } from "../../animations";
import { NACtx } from "../../types";
import { Q } from "../Shared";

export default function BuilderScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, maxVideographers, maxCamerasPerOp } = ctx;

    // --- Resolve activity presets for the selected event type ---
    const etName = (responses.event_type || "").toLowerCase().trim();
    const etCache: any[] = (window as any).__pflo_eventTypes || [];
    let matchedET =
        etCache.find((e: any) => e.name?.toLowerCase().trim() === etName) ||
        etCache.find((e: any) => {
            const n = e.name?.toLowerCase() || "";
            return n.includes(etName) || (etName.length > 2 && etName.includes(n));
        }) ||
        etCache[0];

    const presets: any[] = (() => {
        if (!matchedET?.event_days?.length) return [];
        const days = [...matchedET.event_days].sort(
            (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
        );
        const weddingDay =
            days.find((d: any) => d.event_day_template?.name?.toLowerCase() === "wedding day") ||
            days.find((d: any) => d.event_day_template?.name?.toLowerCase().startsWith("wedding day")) ||
            days.reduce((best: any, d: any) =>
                (d.event_day_template?.activity_presets?.length || 0) >
                (best?.event_day_template?.activity_presets?.length || 0) ? d : best
            , days[0]);
        return weddingDay?.event_day_template?.activity_presets?.filter((p: any) => p.is_active !== false) || [];
    })();

    const builderStep: number = responses.builder_step || 1;
    const selectedIds: number[] = responses.builder_activities || [];
    const selectedFilms: any[] = responses.builder_films || [];
    const opCount: number = responses.operator_count || 0;
    const camCount: number = responses.camera_count || 0;

    // Pre-initialise with defaults on first render
    if (presets.length > 0 && !responses._builder_initialized) {
        const commonNames = ["ceremony", "bridal prep", "couple portraits", "reception"];
        const defaults = presets
            .filter((p: any) => commonNames.some((n) => p.name?.toLowerCase().includes(n)))
            .map((p: any) => p.id);
        handleChange("builder_activities", defaults);
        handleChange("builder_films", [{ type: "FEATURE" }]);
        handleChange("operator_count", 1);
        handleChange("camera_count", 1);
        handleChange("builder_step", 1);
        handleChange("_builder_initialized", true);
        return null;
    }

    const toggleActivity = (id: number) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter((x) => x !== id)
            : [...selectedIds, id];
        handleChange("builder_activities", next);
        if (selectedIds.includes(id)) {
            handleChange("builder_films", selectedFilms.filter(
                (f: any) => !(f.type === "ACTIVITY" && f.activityPresetId === id)
            ));
        }
    };

    const toggleFilm = (film: any) => {
        const idx = selectedFilms.findIndex(
            (f: any) => f.type === film.type && (f.activityPresetId || null) === (film.activityPresetId || null)
        );
        handleChange("builder_films", idx >= 0
            ? selectedFilms.filter((_, i) => i !== idx)
            : [...selectedFilms, film]
        );
    };

    const isFSel = (type: string, presetId?: number) =>
        selectedFilms.some(
            (f: any) => f.type === type && (f.activityPresetId || null) === (presetId || null)
        );

    const totalMins = presets
        .filter((p: any) => selectedIds.includes(p.id))
        .reduce((s: number, p: any) => s + (p.default_duration_minutes || 60), 0);
    const hrs = Math.round((totalMins / 60) * 2) / 2;
    const selectedPresets = presets.filter((p: any) => selectedIds.includes(p.id));

    const editedFilmCount = selectedFilms.filter((f: any) => f.type === "FEATURE" || f.type === "MONTAGE").length;
    const fullFilmCount = selectedFilms.filter((f: any) => f.type === "ACTIVITY").length;

    const filmCol: Record<string, string> = {
        FEATURE: "#648CFF",
        ACTIVITY: "#10b981",
        MONTAGE: "#a78bfa",
    };

    const stepTitles = [
        "What would you like us to film?",
        "What films would you like?",
        "How many videographers?",
    ];
    const stepSubs = [
        "Select every moment you want captured on camera",
        selectedPresets.length
            ? `You've chosen ${selectedPresets.length} moment${selectedPresets.length === 1 ? "" : "s"} to film — now pick the final edits you'd like delivered`
            : "Choose the deliverables that tell your story",
        "Choose your crew and camera setup",
    ];

    const cardSx = (color: string, active: boolean) => ({
        ...glassSx, p: 2.5, cursor: "pointer",
        borderLeft: `4px solid ${color}`,
        borderColor: active ? alpha(color, 0.7) : alpha(C.border, 0.5),
        bgcolor: active ? alpha(color, 0.08) : alpha(C.card, 0.55),
        transition: "all 0.2s",
        "&:hover": { borderColor: alpha(color, 0.5), transform: "translateY(-2px)" },
    });

    const CheckDot = ({ color }: { color: string }) => (
        <Box sx={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            bgcolor: alpha(color, 0.15), border: `2px solid ${color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <CheckIcon sx={{ fontSize: 13, color }} />
        </Box>
    );

    const FilmCard = ({ label, desc, type, presetId }: { label: string; desc: string; type: string; presetId?: number }) => {
        const sel = isFSel(type, presetId);
        const col = filmCol[type] || C.accent;
        const filmObj = presetId
            ? { type, activityPresetId: presetId, activityName: label.replace(" Film", "") }
            : { type };
        return (
            <Box onClick={() => toggleFilm(filmObj)} sx={cardSx(col, sel)}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                        <Typography sx={{ color: C.text, fontSize: "0.9rem", fontWeight: 600 }}>{label}</Typography>
                        <Typography sx={{ color: C.muted, fontSize: "0.72rem", mt: 0.3 }}>{desc}</Typography>
                    </Box>
                    {sel && <CheckDot color={col} />}
                </Box>
            </Box>
        );
    };

    return (
        <Q title={stepTitles[builderStep - 1]} subtitle={stepSubs[builderStep - 1]}>
            <Box sx={{ width: "100%" }}>

                {/* ── Step 1: Activities ── */}
                {builderStep === 1 && (
                    presets.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 5 }}>
                            <Typography sx={{ color: C.muted, fontSize: "0.9rem" }}>
                                No activity presets found for this event type.
                            </Typography>
                            <Typography sx={{ color: alpha(C.muted, 0.6), fontSize: "0.75rem", mt: 1 }}>
                                You can still continue and we'll customise your package.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <Box sx={{ position: "relative", pl: { xs: 3, sm: 4 } }}>
                                {/* Timeline line */}
                                <Box sx={{
                                    position: "absolute", left: { xs: 10, sm: 14 }, top: 8, bottom: 8,
                                    width: 2, bgcolor: alpha(C.border, 0.35),
                                    "&::before": { content: '""', position: "absolute", top: 0, left: -3, width: 8, height: 8, borderRadius: "50%", bgcolor: alpha(C.accent, 0.4) },
                                    "&::after": { content: '""', position: "absolute", bottom: 0, left: -3, width: 8, height: 8, borderRadius: "50%", bgcolor: alpha(C.accent, 0.4) },
                                }} />

                                {presets.map((p: any, i: number) => {
                                    const on = selectedIds.includes(p.id);
                                    const col = p.color || C.accent;
                                    return (
                                        <Box key={p.id} onClick={() => toggleActivity(p.id)} sx={{
                                            position: "relative", mb: i < presets.length - 1 ? 0.5 : 0,
                                            cursor: "pointer", display: "flex", alignItems: "stretch",
                                            transition: "all 0.2s",
                                            "&:hover .timeline-card": { borderColor: alpha(col, 0.5), transform: "translateX(4px)" },
                                        }}>
                                            {/* Timeline node */}
                                            <Box sx={{
                                                position: "absolute", left: { xs: -19, sm: -22 }, top: "50%", transform: "translateY(-50%)",
                                                width: on ? 14 : 10, height: on ? 14 : 10, borderRadius: "50%",
                                                bgcolor: on ? col : "transparent",
                                                border: `2px solid ${on ? col : alpha(C.border, 0.5)}`,
                                                transition: "all 0.25s",
                                                boxShadow: on ? `0 0 12px ${alpha(col, 0.5)}` : "none",
                                                zIndex: 2,
                                            }} />
                                            {/* Card */}
                                            <Box className="timeline-card" sx={{
                                                flex: 1, p: "12px 14px", ml: 1, borderRadius: 2.5,
                                                border: `1px solid ${on ? alpha(col, 0.5) : alpha(C.border, 0.3)}`,
                                                bgcolor: on ? alpha(col, 0.06) : alpha(C.card, 0.4),
                                                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                                                display: "flex", alignItems: "center", gap: 1,
                                            }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Typography sx={{
                                                            color: on ? C.text : alpha(C.text, 0.75),
                                                            fontSize: "0.85rem", fontWeight: on ? 600 : 500, lineHeight: 1.2,
                                                        }}>{p.name}</Typography>
                                                        {on && (
                                                            <Box sx={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, bgcolor: alpha(col, 0.15), border: `1.5px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <CheckIcon sx={{ fontSize: 11, color: col }} />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    {p.description && (
                                                        <Typography sx={{ color: alpha(C.muted, on ? 0.8 : 0.55), fontSize: "0.66rem", mt: 0.2, lineHeight: 1.3 }}>{p.description}</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    )
                )}

                {/* ── Step 2: Films ── */}
                {builderStep === 2 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {/* Your Story */}
                        <Box>
                            <Typography sx={{ color: alpha(C.muted, 0.5), fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mb: 2 }}>
                                Your story
                            </Typography>

                            {/* Feature Film */}
                            {(() => {
                                const sel = isFSel("FEATURE");
                                const col = filmCol.FEATURE;
                                return (
                                    <Box onClick={() => toggleFilm({ type: "FEATURE" })} sx={{
                                        position: "relative", overflow: "hidden", borderRadius: 3, cursor: "pointer", mb: 1.5,
                                        p: "1.5px",
                                        background: sel ? `linear-gradient(135deg, ${alpha(col, 0.5)}, ${alpha(col, 0.15)})` : alpha(C.border, 0.25),
                                        animation: `${filmStagger} 0.35s ease-out 0.05s both`,
                                        transition: "all 0.25s",
                                        "&:hover": { transform: "translateY(-2px)" },
                                    }}>
                                        <Box sx={{ borderRadius: 2.8, p: 3, bgcolor: sel ? alpha(C.card, 0.95) : alpha(C.card, 0.88) }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                                                <Box sx={{ width: 48, height: 48, borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: sel ? alpha(col, 0.12) : alpha(C.border, 0.1), border: `1px solid ${sel ? alpha(col, 0.25) : alpha(C.border, 0.15)}`, transition: "all 0.3s" }}>
                                                    <MovieFilterIcon sx={{ fontSize: 24, color: sel ? col : alpha(C.muted, 0.45), transition: "color 0.3s" }} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ color: sel ? C.text : alpha(C.text, 0.8), fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>Feature Film</Typography>
                                                    <Typography sx={{ color: C.muted, fontSize: "0.74rem", mt: 0.4, lineHeight: 1.4 }}>Your wedding story, cinematic and beautifully crafted</Typography>
                                                </Box>
                                                {sel && <Box sx={{ animation: `${checkPop} 0.3s ease-out both` }}><CheckDot color={col} /></Box>}
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })()}

                            {/* Highlight Reel */}
                            {(() => {
                                const sel = isFSel("MONTAGE");
                                const col = filmCol.MONTAGE;
                                return (
                                    <Box onClick={() => toggleFilm({ type: "MONTAGE" })} sx={{
                                        position: "relative", overflow: "hidden", borderRadius: 3, cursor: "pointer",
                                        p: "1.5px",
                                        background: sel ? `linear-gradient(135deg, ${alpha(col, 0.5)}, ${alpha(col, 0.15)})` : alpha(C.border, 0.25),
                                        animation: `${filmStagger} 0.35s ease-out 0.1s both`,
                                        transition: "all 0.25s",
                                        "&:hover": { transform: "translateY(-2px)" },
                                    }}>
                                        <Box sx={{ borderRadius: 2.8, p: 3, bgcolor: sel ? alpha(C.card, 0.95) : alpha(C.card, 0.88) }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                                                <Box sx={{ width: 48, height: 48, borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: sel ? alpha(col, 0.12) : alpha(C.border, 0.1), border: `1px solid ${sel ? alpha(col, 0.25) : alpha(C.border, 0.15)}`, transition: "all 0.3s" }}>
                                                    <AutoAwesomeIcon sx={{ fontSize: 24, color: sel ? col : alpha(C.muted, 0.45), transition: "color 0.3s" }} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ color: sel ? C.text : alpha(C.text, 0.8), fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>Highlight Reel</Typography>
                                                    <Typography sx={{ color: C.muted, fontSize: "0.74rem", mt: 0.4, lineHeight: 1.4 }}>A cinematic highlight reel of your best moments</Typography>
                                                </Box>
                                                {sel && <Box sx={{ animation: `${checkPop} 0.3s ease-out both` }}><CheckDot color={col} /></Box>}
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })()}
                        </Box>

                        {selectedPresets.length > 0 && (
                            <Box sx={{ height: "1px", mx: 2, background: `linear-gradient(90deg, transparent, ${alpha(C.border, 0.25)}, transparent)` }} />
                        )}

                        {/* Full Coverage */}
                        {selectedPresets.length > 0 && (
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
                                    <Typography sx={{ color: alpha(C.muted, 0.5), fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Full coverage</Typography>
                                    <Typography sx={{ color: alpha(C.muted, 0.3), fontSize: "0.58rem", fontStyle: "italic" }}>Uncut recordings of each activity</Typography>
                                </Box>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                                    {selectedPresets.map((p: any, idx: number) => {
                                        const sel = isFSel("ACTIVITY", p.id);
                                        const col = filmCol.ACTIVITY;
                                        return (
                                            <Box key={p.id} onClick={() => toggleFilm({ type: "ACTIVITY", activityPresetId: p.id, activityName: p.name })} sx={{
                                                borderRadius: 2.5, cursor: "pointer", p: "1.5px",
                                                background: sel ? alpha(col, 0.35) : alpha(C.border, 0.18),
                                                animation: `${filmStagger} 0.35s ease-out ${0.05 + idx * 0.06}s both`,
                                                transition: "all 0.25s",
                                                "&:hover": { transform: "translateY(-2px)" },
                                            }}>
                                                <Box sx={{ borderRadius: 2.3, p: 2, bgcolor: sel ? alpha(C.card, 0.92) : alpha(C.card, 0.85) }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                        <Box sx={{ width: 38, height: 38, borderRadius: 1.5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: sel ? alpha(col, 0.1) : alpha(C.border, 0.08), border: `1px solid ${sel ? alpha(col, 0.2) : alpha(C.border, 0.12)}`, transition: "all 0.3s" }}>
                                                            <VideocamIcon sx={{ fontSize: 19, color: sel ? col : alpha(C.muted, 0.4), transition: "color 0.3s" }} />
                                                        </Box>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography sx={{ color: sel ? C.text : alpha(C.text, 0.75), fontSize: "0.85rem", fontWeight: 600 }}>{p.name} Film</Typography>
                                                            <Typography sx={{ color: alpha(C.muted, 0.6), fontSize: "0.66rem", mt: 0.2 }}>{`Full ${p.name.toLowerCase()}, uncut`}</Typography>
                                                        </Box>
                                                        {sel && <Box sx={{ animation: `${checkPop} 0.3s ease-out both` }}><CheckDot color={col} /></Box>}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {/* ── Step 3: Videographers ── */}
                {builderStep === 3 && (() => {
                    const maxCams = opCount * maxCamerasPerOp;
                    const minCams = opCount;
                    return (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0, alignItems: "center", py: 1 }}>
                            {/* Crew lineup */}
                            <Box sx={{ position: "relative", mb: 2 }}>
                                <Box sx={{
                                    position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
                                    width: maxVideographers * 100 + 40, height: 2,
                                    background: `linear-gradient(90deg, transparent 0%, ${alpha(C.accent, 0.08)} 20%, ${alpha(C.accent, 0.12)} 50%, ${alpha(C.accent, 0.08)} 80%, transparent 100%)`,
                                    borderRadius: 1,
                                }} />
                                <Box sx={{ display: "flex", gap: 2.5, justifyContent: "center", pt: 1 }}>
                                    {Array.from({ length: maxVideographers }, (_, i) => i + 1).map((n) => {
                                        const filled = n <= opCount;
                                        return (
                                            <Box key={n} onClick={() => {
                                                handleChange("operator_count", n);
                                                if (camCount < n) handleChange("camera_count", n);
                                                if (camCount > n * maxCamerasPerOp) handleChange("camera_count", n * maxCamerasPerOp);
                                            }} sx={{
                                                cursor: "pointer", position: "relative",
                                                display: "flex", flexDirection: "column", alignItems: "center",
                                                width: 96, py: 1.5,
                                                animation: `${filmStagger} 0.4s ease-out ${n * 0.08}s both`,
                                                transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                                                "&:hover .person-icon": { color: filled ? C.accent : alpha(C.muted, 0.5), transform: "translateY(-4px) scale(1.05)" },
                                                "&:hover .person-glow": { opacity: filled ? 0.5 : 0.12 },
                                                "&:hover .person-label": { color: filled ? C.accent : alpha(C.muted, 0.45) },
                                            }}>
                                                <Box className="person-glow" sx={{
                                                    position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
                                                    width: 72, height: 24, borderRadius: "50%",
                                                    background: `radial-gradient(ellipse, ${filled ? alpha(C.accent, 0.4) : alpha(C.muted, 0.06)} 0%, transparent 70%)`,
                                                    opacity: filled ? 0.35 : 0, transition: "opacity 0.4s", filter: "blur(8px)",
                                                }} />
                                                <PersonIcon className="person-icon" sx={{
                                                    fontSize: 72,
                                                    color: filled ? C.accent : alpha(C.muted, 0.12),
                                                    transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                                                    filter: filled ? `drop-shadow(0 4px 16px ${alpha(C.accent, 0.3)}) drop-shadow(0 1px 3px ${alpha(C.accent, 0.15)})` : "none",
                                                }} />
                                                <Typography className="person-label" sx={{
                                                    fontSize: "0.65rem", fontWeight: 600,
                                                    color: filled ? alpha(C.accent, 0.65) : alpha(C.muted, 0.18),
                                                    transition: "color 0.3s", mt: 0.5, letterSpacing: "0.06em",
                                                }}>{n}</Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                                <Typography sx={{
                                    color: opCount ? alpha(C.text, 0.75) : alpha(C.muted, 0.3),
                                    fontSize: "0.78rem", textAlign: "center", mt: 0.5, fontWeight: 500, letterSpacing: "0.02em",
                                }}>
                                    {opCount === 0 ? "Tap to choose your crew" : `${opCount} videographer${opCount > 1 ? "s" : ""} selected`}
                                </Typography>
                            </Box>

                            {opCount > 0 && (
                                <Box sx={{ width: 160, height: "1px", my: 3, background: `linear-gradient(90deg, transparent, ${alpha(C.accent, 0.18)} 30%, ${alpha(C.accent, 0.25)} 50%, ${alpha(C.accent, 0.18)} 70%, transparent)` }} />
                            )}

                            {/* Camera angles */}
                            {opCount > 0 && (
                                <Box sx={{ animation: `${filmStagger} 0.35s ease-out both`, position: "relative" }}>
                                    <Box sx={{
                                        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
                                        width: maxCams * 72 + 32, maxWidth: "90vw", height: 2,
                                        background: `linear-gradient(90deg, transparent 0%, ${alpha(C.accent, 0.06)} 20%, ${alpha(C.accent, 0.1)} 50%, ${alpha(C.accent, 0.06)} 80%, transparent 100%)`,
                                        borderRadius: 1,
                                    }} />
                                    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
                                        {Array.from({ length: maxCams }, (_, i) => i + 1).map((c) => {
                                            const filled = c <= camCount;
                                            const manned = c <= minCams;
                                            return (
                                                <Box key={c} onClick={() => {
                                                    if (c < minCams) return;
                                                    handleChange("camera_count", c);
                                                }} sx={{
                                                    cursor: c < minCams ? "default" : "pointer",
                                                    position: "relative", display: "flex", flexDirection: "column", alignItems: "center",
                                                    width: 68, py: 1,
                                                    animation: `${filmStagger} 0.3s ease-out ${c * 0.05}s both`,
                                                    transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                                                    ...(c >= minCams && {
                                                        "&:hover .cam-icon, &:hover .cam-person": { color: filled ? C.accent : alpha(C.muted, 0.45), transform: "translateY(-3px) scale(1.06)" },
                                                        "&:hover .cam-glow": { opacity: filled ? 0.4 : 0.08 },
                                                    }),
                                                }}>
                                                    <Box className="cam-glow" sx={{
                                                        position: "absolute", bottom: manned ? 14 : 20, left: "50%", transform: "translateX(-50%)",
                                                        width: 56, height: 20, borderRadius: "50%",
                                                        background: `radial-gradient(ellipse, ${filled ? alpha(C.accent, 0.35) : alpha(C.muted, 0.04)} 0%, transparent 70%)`,
                                                        opacity: filled ? 0.3 : 0, transition: "opacity 0.4s", filter: "blur(7px)",
                                                    }} />
                                                    {manned ? (
                                                        <Box sx={{ position: "relative", display: "flex", alignItems: "flex-end", transition: "all 0.4s cubic-bezier(.4,0,.2,1)" }}>
                                                            <PersonIcon className="cam-person" sx={{
                                                                fontSize: 42, color: filled ? alpha(C.accent, 0.7) : alpha(C.muted, 0.07),
                                                                transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                                                                filter: filled ? `drop-shadow(0 2px 8px ${alpha(C.accent, 0.15)})` : "none",
                                                                mr: -1.2,
                                                            }} />
                                                            <VideocamIcon className="cam-icon" sx={{
                                                                fontSize: 30, color: filled ? C.accent : alpha(C.muted, 0.09),
                                                                transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                                                                filter: filled ? `drop-shadow(0 2px 10px ${alpha(C.accent, 0.25)})` : "none",
                                                                position: "relative", top: -4,
                                                            }} />
                                                        </Box>
                                                    ) : (
                                                        <VideocamIcon className="cam-icon" sx={{
                                                            fontSize: 48, color: filled ? C.accent : alpha(C.muted, 0.09),
                                                            transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
                                                            filter: filled ? `drop-shadow(0 3px 12px ${alpha(C.accent, 0.25)}) drop-shadow(0 1px 3px ${alpha(C.accent, 0.12)})` : "none",
                                                        }} />
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                    <Typography sx={{ color: alpha(C.text, 0.75), fontSize: "0.78rem", textAlign: "center", mt: 0.5, fontWeight: 500, letterSpacing: "0.02em" }}>
                                        {camCount} camera{camCount !== 1 ? "s" : ""}{camCount > opCount ? ` • ${opCount} manned, ${camCount - opCount} unmanned` : ""}
                                    </Typography>
                                </Box>
                            )}

                            {opCount > 0 && (
                                <Typography sx={{ color: alpha(C.muted, 0.3), fontSize: "0.62rem", textAlign: "center", fontStyle: "italic", maxWidth: 360, mt: 2.5, lineHeight: 1.7, letterSpacing: "0.01em" }}>
                                    Up to {maxCamerasPerOp} cameras per videographer — more angles, more coverage
                                </Typography>
                            )}
                        </Box>
                    );
                })()}

                {/* Step progress dots */}
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 3 }}>
                    {[1, 2, 3].map((s) => (
                        <Box key={s} onClick={() => s < builderStep && handleChange("builder_step", s)} sx={{
                            width: s === builderStep ? 20 : 6, height: 6, borderRadius: 3,
                            bgcolor: s === builderStep ? C.accent : s < builderStep ? alpha(C.accent, 0.4) : alpha(C.muted, 0.25),
                            transition: "all 0.3s",
                            cursor: s < builderStep ? "pointer" : "default",
                        }} />
                    ))}
                </Box>

                {/* Sticky summary bar */}
                <Box sx={{ position: "sticky", bottom: 64, zIndex: 49, mt: 2 }}>
                    <Box sx={{
                        ...glassSx, p: "12px 20px",
                        border: `1px solid ${alpha(C.accent, 0.2)}`,
                        background: `linear-gradient(135deg, ${alpha(C.card, 0.92)}, ${alpha(C.card, 0.82)})`,
                        backdropFilter: "blur(28px) saturate(2)",
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2,
                    }}>
                        <Box sx={{ display: "flex", gap: 3 }}>
                            {[
                                { v: selectedIds.length, l: "activities" },
                                { v: `~${hrs}h`, l: "coverage" },
                                { v: selectedFilms.length, l: (() => {
                                    const parts: string[] = [];
                                    if (editedFilmCount > 0) parts.push(`${editedFilmCount} cinematic`);
                                    if (fullFilmCount > 0) parts.push(`${fullFilmCount} full`);
                                    return parts.length > 0 ? parts.join(" + ") : "films";
                                })() },
                                { v: opCount || 0, l: "videographers" },
                            ].map(({ v, l }) => (
                                <Box key={l} sx={{ textAlign: "center", minWidth: 44 }}>
                                    <Typography sx={{ color: C.accent, fontSize: "1rem", fontWeight: 700, lineHeight: 1 }}>{v}</Typography>
                                    <Typography sx={{ color: C.muted, fontSize: "0.6rem", mt: 0.25 }}>{l}</Typography>
                                </Box>
                            ))}
                        </Box>
                        <Typography sx={{ color: alpha(C.muted, 0.6), fontSize: "0.65rem", fontStyle: "italic" }}>
                            We'll prepare your personalised quote
                        </Typography>
                    </Box>
                </Box>

            </Box>
        </Q>
    );
}
