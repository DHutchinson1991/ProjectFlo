"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { Check as CheckIcon } from "@mui/icons-material";
import { C } from "../../constants";
import { fadeInUp } from "../../animations";
import { NACtx } from "../../types";

/* warm / cool palette per card position */
const CARD_THEMES = [
    { g1: "#7c4dff", g2: "#b47cff", g3: "#5c2ecf" },   // purple
    { g1: "#f97316", g2: "#fbbf24", g3: "#c2410c" },   // amber
    { g1: "#06b6d4", g2: "#67e8f9", g3: "#0e7490" },   // cyan
    { g1: "#ec4899", g2: "#f9a8d4", g3: "#be185d" },   // pink
];

const softBounce = keyframes`
    0%   { transform: scale(1); }
    50%  { transform: scale(1.06); }
    100% { transform: scale(1); }
`;

export default function EventTypeScreen({ ctx }: { ctx: NACtx }) {
    const { eventTypeOptions, eventType, singleSelect } = ctx;

    return (
        <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            py: { xs: 3, md: 4 }, maxWidth: 680, mx: "auto", width: "100%",
        }}>
            <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography sx={{
                    fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 200, color: C.text,
                    letterSpacing: "-0.02em", lineHeight: 1.15,
                }}>What&rsquo;s the occasion?</Typography>
                <Typography sx={{
                    color: alpha(C.muted, 0.6), fontSize: "0.85rem", mt: 1.25,
                }}>Every great film starts with a moment worth capturing</Typography>
            </Box>

            <Box sx={{
                display: "flex", flexWrap: "wrap", gap: 2.5, justifyContent: "center",
                width: "100%",
                animation: `${fadeInUp} 0.35s ease-out 0.1s both`,
            }}>
                {eventTypeOptions.map((opt, idx) => {
                    const sel = eventType === opt.key;
                    const theme = CARD_THEMES[idx % CARD_THEMES.length];
                    return (
                        <Box key={opt.key} onClick={() => singleSelect("event_type", opt.key)}
                            sx={{
                                position: "relative", overflow: "hidden",
                                borderRadius: "22px", cursor: "pointer",
                                minWidth: 210, maxWidth: 250,
                                flex: "1 1 210px", userSelect: "none",
                                border: `2px solid ${sel ? alpha(theme.g1, 0.7) : alpha(C.border, 0.25)}`,
                                bgcolor: alpha(C.card, 0.5),
                                boxShadow: sel
                                    ? `0 8px 36px ${alpha(theme.g1, 0.25)}`
                                    : `0 2px 16px ${alpha("#000", 0.2)}`,
                                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                                "&:hover": {
                                    borderColor: alpha(theme.g1, 0.5),
                                    transform: "translateY(-5px)",
                                    boxShadow: `0 16px 48px ${alpha(theme.g1, 0.2)}`,
                                    "& .evt-hero": { transform: "scale(1.03)" },
                                    "& .evt-emoji-wrap": { animation: `${softBounce} 0.6s ease` },
                                },
                            }}>
                            {/* ── Coloured hero zone ── */}
                            <Box className="evt-hero" sx={{
                                position: "relative",
                                height: 130, display: "flex", alignItems: "center", justifyContent: "center",
                                background: `linear-gradient(135deg, ${alpha(theme.g1, sel ? 0.28 : 0.14)} 0%, ${alpha(theme.g2, sel ? 0.15 : 0.06)} 100%)`,
                                transition: "all 0.4s ease, transform 0.4s ease",
                                overflow: "hidden",
                            }}>
                                {/* Large decorative blur orbs */}
                                <Box sx={{
                                    position: "absolute", top: -20, left: -20,
                                    width: 120, height: 120, borderRadius: "50%",
                                    background: `radial-gradient(circle, ${alpha(theme.g1, 0.2)} 0%, transparent 70%)`,
                                    filter: "blur(20px)", pointerEvents: "none",
                                }} />
                                <Box sx={{
                                    position: "absolute", bottom: -30, right: -10,
                                    width: 100, height: 100, borderRadius: "50%",
                                    background: `radial-gradient(circle, ${alpha(theme.g2, 0.15)} 0%, transparent 70%)`,
                                    filter: "blur(16px)", pointerEvents: "none",
                                }} />
                                {/* Pattern overlay - subtle grid dots */}
                                <Box sx={{
                                    position: "absolute", inset: 0, opacity: 0.12,
                                    backgroundImage: `radial-gradient(circle, ${alpha("#fff", 0.5)} 1px, transparent 1px)`,
                                    backgroundSize: "16px 16px",
                                    pointerEvents: "none",
                                }} />

                                {/* Emoji */}
                                <Box className="evt-emoji-wrap" sx={{
                                    position: "relative", zIndex: 1,
                                    width: 72, height: 72, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    bgcolor: alpha(C.bg, 0.6),
                                    border: `2px solid ${alpha(theme.g1, sel ? 0.4 : 0.2)}`,
                                    boxShadow: `0 4px 20px ${alpha(theme.g1, 0.2)}`,
                                    backdropFilter: "blur(8px)",
                                    transition: "all 0.3s ease",
                                }}>
                                    <Typography sx={{ fontSize: "2.2rem", lineHeight: 1 }}>
                                        {opt.emoji}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* ── Text zone ── */}
                            <Box sx={{ px: 3, py: 2.5, textAlign: "center", position: "relative" }}>
                                <Typography sx={{
                                    color: sel ? C.text : alpha(C.text, 0.92),
                                    fontSize: "1.08rem", fontWeight: 700,
                                    letterSpacing: "-0.01em", mb: 0.5,
                                }}>
                                    {opt.label}
                                </Typography>
                                {opt.desc && (
                                    <Typography sx={{
                                        color: sel ? alpha(C.muted, 0.7) : alpha(C.muted, 0.45),
                                        fontSize: "0.76rem", lineHeight: 1.55,
                                    }}>{opt.desc}</Typography>
                                )}
                            </Box>

                            {/* ── Selection check badge ── */}
                            {sel && (
                                <Box sx={{
                                    position: "absolute", top: 12, right: 12,
                                    width: 28, height: 28, borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${theme.g1}, ${theme.g2})`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: `0 2px 12px ${alpha(theme.g1, 0.4)}`,
                                    animation: `${fadeInUp} 0.3s ease-out`,
                                }}>
                                    <CheckIcon sx={{ fontSize: "1rem", color: "#fff" }} />
                                </Box>
                            )}
                        </Box>
                    );
                })}
                {eventTypeOptions.length === 0 && (
                    <Typography sx={{ color: C.muted, fontSize: "0.85rem" }}>No event types configured yet.</Typography>
                )}
            </Box>
        </Box>
    );
}
