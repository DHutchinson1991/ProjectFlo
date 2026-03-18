"use client";

import React, { useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { format as fnsFormat } from "date-fns";
import { C, SEASONS, EVENT_LABELS } from "../../constants";
import { fadeInUp } from "../../animations";
import { NACtx } from "../../types";
import { DateCal } from "../Shared";

const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2, THIS_YEAR + 3];

const singularName = (key: string) => {
    const label = EVENT_LABELS[key];
    if (label) return label.replace(/^An?\s+/i, "");
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/s$/, "");
};

const glowPulse = keyframes`
    0%, 100% { box-shadow: 0 0 20px ${alpha("#7c4dff", 0.15)}, 0 0 40px ${alpha("#7c4dff", 0.05)}; }
    50% { box-shadow: 0 0 25px ${alpha("#7c4dff", 0.25)}, 0 0 50px ${alpha("#7c4dff", 0.1)}; }
`;

const SEASON_COLORS: Record<string, { c1: string; c2: string }> = {
    Spring: { c1: "#f472b6", c2: "#fb923c" },
    Summer: { c1: "#fbbf24", c2: "#f97316" },
    Autumn: { c1: "#f97316", c2: "#dc2626" },
    Winter: { c1: "#38bdf8", c2: "#818cf8" },
};

export default function DateScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, eventType } = ctx;

    const eventLabel = eventType ? singularName(eventType) : "";
    const title = eventLabel ? `When is the ${eventLabel}?` : "When is it?";

    const [dateMode, setDateMode] = useState<"calendar" | "approx">(
        responses.wedding_date_approx ? "approx" : "calendar",
    );
    const [approxSeason, setApproxSeason] = useState<string>(() => {
        const a = responses.wedding_date_approx as string | undefined;
        return a ? (a.split(" ")[0] || "") : "";
    });
    const [approxYear, setApproxYear] = useState<number>(() => {
        const a = responses.wedding_date_approx as string | undefined;
        if (!a) return THIS_YEAR;
        const y = parseInt(a.split(" ")[1], 10);
        return isNaN(y) ? THIS_YEAR : y;
    });

    const handleApproxPick = useCallback((season: string, year: number) => {
        setApproxSeason(season);
        setApproxYear(year);
        handleChange("wedding_date_approx", `${season} ${year}`);
        const s = SEASONS.find((se) => se.label === season);
        if (s) {
            const firstMonth = s.months[0];
            const actualYear = season === "Winter" && firstMonth === 11 ? year - 1 : year;
            handleChange("wedding_date", fnsFormat(new Date(actualYear, firstMonth, 1), "yyyy-MM-dd"));
        }
    }, [handleChange]);

    return (
        <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5,
            py: { xs: 3, md: 5 }, maxWidth: 560, mx: "auto", width: "100%",
        }}>
            {/* ── Title ────────────────────────────────── */}
            <Box sx={{ textAlign: "center", mb: 1 }}>
                <Typography sx={{
                    fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 200, color: C.text,
                    letterSpacing: "-0.02em", lineHeight: 1.15,
                }}>
                    {title}
                </Typography>
            </Box>

            {/* ── Content ──────────────────────────────── */}
            <Box sx={{ width: "100%", animation: `${fadeInUp} 0.35s ease-out 0.1s both` }}>
                {dateMode === "calendar" ? (
                    <>
                        <DateCal
                            value={responses.wedding_date || ""}
                            onChange={(v) => {
                                handleChange("wedding_date", v);
                                handleChange("wedding_date_approx", null);
                            }}
                            selectedBelow
                        />

                        {/* Switch to approx */}
                        <Typography
                            onClick={() => setDateMode("approx")}
                            sx={{
                                color: alpha(C.muted, 0.55), fontSize: "0.84rem", fontWeight: 500,
                                mt: 3.5, textAlign: "center", cursor: "pointer",
                                transition: "color 0.2s",
                                textDecoration: "underline", textDecorationColor: alpha(C.muted, 0.2),
                                textUnderlineOffset: "4px",
                                "&:hover": { color: C.accent, textDecorationColor: alpha(C.accent, 0.4) },
                            }}>
                            I don&apos;t have an exact date yet
                        </Typography>
                    </>
                ) : (
                    <>
                        {/* Season picker */}
                        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap", mb: 3 }}>
                            {SEASONS.map((s) => {
                                const active = approxSeason === s.label;
                                const sc = SEASON_COLORS[s.label] || SEASON_COLORS.Spring;
                                return (
                                    <Box key={s.label} onClick={() => handleApproxPick(s.label, approxYear)} sx={{
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 0.8,
                                        px: 2.5, py: 2, borderRadius: "18px", cursor: "pointer", userSelect: "none",
                                        textAlign: "center", transition: "all 0.25s ease", minWidth: 100,
                                        bgcolor: active ? alpha(sc.c1, 0.12) : alpha(C.text, 0.03),
                                        border: `1.5px solid ${active ? alpha(sc.c1, 0.5) : alpha(C.border, 0.2)}`,
                                        boxShadow: active ? `0 4px 20px ${alpha(sc.c1, 0.2)}` : "none",
                                        "&:hover": {
                                            bgcolor: alpha(sc.c1, 0.08), borderColor: alpha(sc.c1, 0.3),
                                            transform: "translateY(-2px)",
                                            boxShadow: `0 4px 16px ${alpha(sc.c1, 0.15)}`,
                                        },
                                    }}>
                                        <Box sx={{
                                            width: 44, height: 44, borderRadius: "50%", display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                            background: active
                                                ? `linear-gradient(135deg, ${alpha(sc.c1, 0.2)}, ${alpha(sc.c2, 0.15)})`
                                                : alpha(C.text, 0.04),
                                            transition: "all 0.25s ease",
                                        }}>
                                            <Typography sx={{ fontSize: "1.4rem", lineHeight: 1 }}>{s.emoji}</Typography>
                                        </Box>
                                        <Typography sx={{
                                            fontSize: "0.82rem", fontWeight: active ? 600 : 400,
                                            color: active ? sc.c1 : C.text, transition: "color 0.2s",
                                        }}>{s.label}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* Year picker */}
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
                            {YEAR_OPTIONS.map((y) => {
                                const active = approxYear === y;
                                return (
                                    <Box key={y}
                                        onClick={() => { if (approxSeason) handleApproxPick(approxSeason, y); else setApproxYear(y); }}
                                        sx={{
                                            px: 3, py: 1.2, borderRadius: "14px", cursor: "pointer", userSelect: "none",
                                            transition: "all 0.2s ease",
                                            bgcolor: active ? alpha(C.accent, 0.12) : alpha(C.text, 0.03),
                                            border: `1.5px solid ${active ? alpha(C.accent, 0.4) : alpha(C.border, 0.15)}`,
                                            boxShadow: active ? `0 0 14px ${alpha(C.accent, 0.12)}` : "none",
                                            "&:hover": {
                                                bgcolor: alpha(C.accent, 0.08), borderColor: alpha(C.accent, 0.25),
                                                transform: "translateY(-1px)",
                                            },
                                        }}>
                                        <Typography sx={{
                                            fontSize: "0.88rem", fontWeight: active ? 600 : 400,
                                            color: active ? C.accent : C.text,
                                        }}>{y}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* Approx selection badge */}
                        {approxSeason && (
                            <Box sx={{
                                textAlign: "center", mt: 3, py: 1.8, px: 3, borderRadius: "18px",
                                bgcolor: alpha(C.accent, 0.06),
                                border: `1px solid ${alpha(C.accent, 0.18)}`,
                                animation: `${fadeInUp} 0.3s ease-out both, ${glowPulse} 3s ease-in-out infinite 0.3s`,
                            }}>
                                <Typography sx={{
                                    color: C.accent, fontSize: "0.62rem", fontWeight: 700,
                                    letterSpacing: "0.12em", textTransform: "uppercase", mb: 0.3,
                                }}>
                                    Estimated timeframe
                                </Typography>
                                <Typography sx={{ color: C.text, fontSize: "1.15rem", fontWeight: 300 }}>
                                    {approxSeason} {approxYear}
                                </Typography>
                            </Box>
                        )}

                        {/* Switch to calendar */}
                        <Typography
                            onClick={() => setDateMode("calendar")}
                            sx={{
                                color: alpha(C.muted, 0.45), fontSize: "0.78rem", mt: 3, textAlign: "center",
                                cursor: "pointer", transition: "color 0.2s",
                                "&:hover": { color: C.accent },
                            }}>
                            I know my exact date
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
}
