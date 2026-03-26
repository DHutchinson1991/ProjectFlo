"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Check as CheckIcon, MovieFilter as MovieFilterIcon, AutoAwesome as AutoAwesomeIcon, Videocam as VideocamIcon } from "@mui/icons-material";
import { C } from '../constants/wizard-config';
import { checkPop, filmStagger } from '../constants/animations';
import type { EventDayActivity } from "@/features/catalog/event-types/types";

const filmCol: Record<string, string> = {
    FEATURE: "#648CFF",
    ACTIVITY: "#10b981",
    MONTAGE: "#a78bfa",
};

function CheckDot({ color }: { color: string }) {
    return (
        <Box sx={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, bgcolor: alpha(color, 0.15), border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckIcon sx={{ fontSize: 13, color }} />
        </Box>
    );
}

interface Props {
    selectedPresets: EventDayActivity[];
    isFSel: (type: string, presetId?: number) => boolean;
    toggleFilm: (film: { type: string; activityPresetId?: number; activityName?: string }) => void;
}

export function BuilderFilmsStep({ selectedPresets, isFSel, toggleFilm }: Props) {
    const featureSel = isFSel("FEATURE");
    const montageSel = isFSel("MONTAGE");

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
                <Typography sx={{ color: alpha(C.muted, 0.5), fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", mb: 2 }}>
                    Your story
                </Typography>
                {/* Feature Film */}
                <Box onClick={() => toggleFilm({ type: "FEATURE" })} sx={{
                    position: "relative", overflow: "hidden", borderRadius: 3, cursor: "pointer", mb: 1.5,
                    p: "1.5px",
                    background: featureSel ? `linear-gradient(135deg, ${alpha(filmCol.FEATURE, 0.5)}, ${alpha(filmCol.FEATURE, 0.15)})` : alpha(C.border, 0.25),
                    animation: `${filmStagger} 0.35s ease-out 0.05s both`,
                    transition: "all 0.25s",
                    "&:hover": { transform: "translateY(-2px)" },
                }}>
                    <Box sx={{ borderRadius: 2.8, p: 3, bgcolor: featureSel ? alpha(C.card, 0.95) : alpha(C.card, 0.88) }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: featureSel ? alpha(filmCol.FEATURE, 0.12) : alpha(C.border, 0.1), border: `1px solid ${featureSel ? alpha(filmCol.FEATURE, 0.25) : alpha(C.border, 0.15)}`, transition: "all 0.3s" }}>
                                <MovieFilterIcon sx={{ fontSize: 24, color: featureSel ? filmCol.FEATURE : alpha(C.muted, 0.45), transition: "color 0.3s" }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ color: featureSel ? C.text : alpha(C.text, 0.8), fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>Feature Film</Typography>
                                <Typography sx={{ color: C.muted, fontSize: "0.74rem", mt: 0.4, lineHeight: 1.4 }}>Your wedding story, cinematic and beautifully crafted</Typography>
                            </Box>
                            {featureSel && <Box sx={{ animation: `${checkPop} 0.3s ease-out both` }}><CheckDot color={filmCol.FEATURE} /></Box>}
                        </Box>
                    </Box>
                </Box>
                {/* Highlight Reel */}
                <Box onClick={() => toggleFilm({ type: "MONTAGE" })} sx={{
                    position: "relative", overflow: "hidden", borderRadius: 3, cursor: "pointer",
                    p: "1.5px",
                    background: montageSel ? `linear-gradient(135deg, ${alpha(filmCol.MONTAGE, 0.5)}, ${alpha(filmCol.MONTAGE, 0.15)})` : alpha(C.border, 0.25),
                    animation: `${filmStagger} 0.35s ease-out 0.1s both`,
                    transition: "all 0.25s",
                    "&:hover": { transform: "translateY(-2px)" },
                }}>
                    <Box sx={{ borderRadius: 2.8, p: 3, bgcolor: montageSel ? alpha(C.card, 0.95) : alpha(C.card, 0.88) }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: montageSel ? alpha(filmCol.MONTAGE, 0.12) : alpha(C.border, 0.1), border: `1px solid ${montageSel ? alpha(filmCol.MONTAGE, 0.25) : alpha(C.border, 0.15)}`, transition: "all 0.3s" }}>
                                <AutoAwesomeIcon sx={{ fontSize: 24, color: montageSel ? filmCol.MONTAGE : alpha(C.muted, 0.45), transition: "color 0.3s" }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ color: montageSel ? C.text : alpha(C.text, 0.8), fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>Highlight Reel</Typography>
                                <Typography sx={{ color: C.muted, fontSize: "0.74rem", mt: 0.4, lineHeight: 1.4 }}>A cinematic highlight reel of your best moments</Typography>
                            </Box>
                            {montageSel && <Box sx={{ animation: `${checkPop} 0.3s ease-out both` }}><CheckDot color={filmCol.MONTAGE} /></Box>}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {selectedPresets.length > 0 && (
                <Box sx={{ height: "1px", mx: 2, background: `linear-gradient(90deg, transparent, ${alpha(C.border, 0.25)}, transparent)` }} />
            )}

            {selectedPresets.length > 0 && (
                <Box>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
                        <Typography sx={{ color: alpha(C.muted, 0.5), fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Full coverage</Typography>
                        <Typography sx={{ color: alpha(C.muted, 0.3), fontSize: "0.58rem", fontStyle: "italic" }}>Uncut recordings of each activity</Typography>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                        {selectedPresets.map((p: EventDayActivity, idx: number) => {
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
    );
}
