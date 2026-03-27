"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    Check as CheckIcon,
    PersonOutlineRounded as PersonIcon,
} from "@mui/icons-material";
import { C } from '../../constants/wizard-config';
import { fadeInUp } from '../../constants/animations';
import { NACtx } from '../../types';

/* Subtle glow pulse on selected card */
const glowPulse = keyframes`
    0%, 100% { box-shadow: 0 0 20px ${alpha("#7c4dff", 0.08)}, 0 8px 32px ${alpha("#000", 0.3)}; }
    50%      { box-shadow: 0 0 30px ${alpha("#7c4dff", 0.15)}, 0 8px 32px ${alpha("#000", 0.3)}; }
`;

/* Arc gauge — renders a semicircle SVG arc */
function ArcGauge({ fill, active }: { fill: number; active: boolean }) {
    const r = 32, cx = 40, cy = 40, sw = 4;
    const circ = Math.PI * r; // semicircle
    const offset = circ * (1 - fill);
    return (
        <svg width={80} height={48} viewBox="0 0 80 48" style={{ display: "block" }}>
            {/* Track */}
            <path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" stroke={alpha(C.text, 0.06)} strokeWidth={sw}
                strokeLinecap="round"
            />
            {/* Fill */}
            <path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none"
                stroke={active ? C.accent : alpha(C.muted, 0.15)}
                strokeWidth={sw} strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
            />
        </svg>
    );
}

/* Dot cluster — shows proportional number of person icons */
function PersonCluster({ count, active }: { count: number; active: boolean }) {
    return (
        <Box sx={{ display: "flex", gap: 0.3, alignItems: "center", justifyContent: "center" }}>
            {Array.from({ length: count }).map((_, i) => (
                <PersonIcon key={i} sx={{
                    fontSize: 16,
                    color: active ? alpha(C.accent, 0.7) : alpha(C.muted, 0.2),
                    transition: "color 0.3s ease",
                }} />
            ))}
        </Box>
    );
}

export default function GuestsScreen({ ctx }: { ctx: NACtx }) {
    const { eventConfig, responses, singleSelect } = ctx;
    const opts = eventConfig.guestsOptions;

    /* Person icon counts scale with option index: 1, 2, 3, 4 */
    const personCounts = opts.map((_, i) => Math.min(i + 1, 5));

    return (
        <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            py: { xs: 3, md: 5 }, maxWidth: 700, mx: "auto", width: "100%",
        }}>
            {/* Title */}
            <Box sx={{ textAlign: "center", mb: 0.5 }}>
                <Typography sx={{
                    fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 200, color: C.text,
                    letterSpacing: "-0.02em", lineHeight: 1.15,
                }}>
                    {eventConfig.guestsLabel}
                </Typography>
                <Typography sx={{
                    color: alpha(C.muted, 0.55), fontSize: "0.85rem", mt: 1,
                }}>
                    This helps us plan the right crew size
                </Typography>
            </Box>

            {/* Options — single row */}
            <Box sx={{
                display: "flex", gap: { xs: 1, md: 1.5 }, width: "100%",
                animation: `${fadeInUp} 0.35s ease-out 0.1s both`,
            }}>
                {opts.map((opt, idx) => {
                    const sel = responses.guest_count === opt.value;
                    const fill = (idx + 1) / opts.length;
                    return (
                        <Box key={opt.value}
                            onClick={() => singleSelect("guest_count", opt.value)}
                            sx={{
                                position: "relative", flex: 1, overflow: "hidden",
                                display: "flex", flexDirection: "column", alignItems: "center",
                                pt: 3, pb: 2.5, px: 1.5,
                                borderRadius: "18px", cursor: "pointer", userSelect: "none",
                                border: `1.5px solid ${sel ? alpha(C.accent, 0.4) : alpha(C.border, 0.1)}`,
                                bgcolor: sel ? alpha(C.accent, 0.05) : alpha(C.card, 0.3),
                                transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                                animation: sel
                                    ? `${fadeInUp} 0.4s ease-out ${0.07 * idx}s both, ${glowPulse} 3s ease-in-out infinite`
                                    : `${fadeInUp} 0.4s ease-out ${0.07 * idx}s both`,
                                /* Subtle radial glow behind selected card */
                                "&::before": sel ? {
                                    content: '""', position: "absolute", inset: "-1px",
                                    borderRadius: "18px", zIndex: -1,
                                    background: `radial-gradient(ellipse at 50% 0%, ${alpha(C.accent, 0.15)} 0%, transparent 70%)`,
                                } : {},
                                "&:hover": {
                                    borderColor: alpha(C.accent, 0.25),
                                    bgcolor: alpha(C.accent, 0.03),
                                    transform: "translateY(-3px)",
                                    boxShadow: `0 10px 32px ${alpha("#000", 0.3)}`,
                                },
                            }}>
                            {/* Check badge */}
                            {sel && (
                                <Box sx={{
                                    position: "absolute", top: 10, right: 10,
                                    width: 20, height: 20, borderRadius: "50%",
                                    bgcolor: C.accent, display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    <CheckIcon sx={{ fontSize: 13, color: "#fff" }} />
                                </Box>
                            )}

                            {/* Arc gauge */}
                            <ArcGauge fill={fill} active={sel} />

                            {/* Person icons */}
                            <Box sx={{ mt: -0.5, mb: 1.5 }}>
                                <PersonCluster count={personCounts[idx]} active={sel} />
                            </Box>

                            {/* Desc (range) */}
                            <Typography sx={{
                                fontSize: { xs: "0.95rem", md: "1.1rem" },
                                fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2,
                                color: sel ? "#fff" : alpha(C.text, 0.75),
                                textAlign: "center",
                                transition: "color 0.2s",
                                mb: 0.5,
                            }}>
                                {opt.desc}
                            </Typography>

                            {/* Label */}
                            <Typography sx={{
                                fontSize: "0.68rem", fontWeight: 500,
                                color: sel ? alpha(C.accent, 0.8) : alpha(C.muted, 0.35),
                                letterSpacing: "0.08em", textTransform: "uppercase",
                                transition: "color 0.2s",
                            }}>
                                {opt.label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
