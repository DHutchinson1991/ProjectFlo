"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    Check as CheckIcon,
    Inventory2Outlined as PackagesIcon,
    TuneOutlined as CustomIcon,
    ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { C, glassSx } from '../constants/wizard-config';
import { checkPop, selectPulse } from '../constants/animations';
import { NACtx } from '../types';
import { Q } from './QuestionWrapper';

const shimmer = keyframes`
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

export default function ForkScreen({ ctx }: { ctx: NACtx }) {
    const { responses, singleSelect } = ctx;
    const sel = responses.package_path;

    const OptionCard = ({
        path, icon, iconBg, title, badge, description, bullets, cta,
    }: {
        path: string; icon: React.ReactNode; iconBg: string;
        title: string; badge: string;
        description: string; bullets: string[]; cta: string;
    }) => {
        const active = sel === path;
        return (
            <Box onClick={() => singleSelect("package_path", path)} sx={{
                ...glassSx, p: 0, cursor: "pointer", overflow: "hidden", position: "relative",
                display: "flex", flexDirection: "column",
                borderColor: active ? alpha(iconBg, 0.45) : undefined,
                bgcolor: active ? alpha(iconBg, 0.04) : undefined,
                animation: active ? `${selectPulse} 0.6s ease-out` : "none",
                transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                /* Subtle radial glow on active card */
                "&::before": active ? {
                    content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                    background: `radial-gradient(ellipse 80% 100% at 50% -20%, ${alpha(iconBg, 0.1)} 0%, transparent 70%)`,
                    pointerEvents: "none", zIndex: 0,
                } : {},
                "&:hover": {
                    borderColor: alpha(iconBg, 0.3),
                    transform: "translateY(-4px)",
                    boxShadow: `0 16px 48px ${alpha("#000", 0.4)}, 0 0 0 1px ${alpha(iconBg, 0.08)}`,
                },
            }}>
                {/* Top accent gradient bar */}
                <Box sx={{
                    height: active ? 3 : 2,
                    background: active
                        ? `linear-gradient(90deg, ${iconBg}, ${alpha(iconBg, 0.4)}, ${iconBg})`
                        : alpha(C.border, 0.15),
                    backgroundSize: active ? "200% 100%" : undefined,
                    animation: active ? `${shimmer} 3s linear infinite` : undefined,
                    transition: "height 0.3s ease",
                }} />

                <Box sx={{ p: { xs: 3, md: 4 }, display: "flex", flexDirection: "column", flex: 1, position: "relative", zIndex: 1 }}>
                    {/* Header row: icon + badge pill */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
                        <Box sx={{
                            width: 48, height: 48, borderRadius: "14px", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            background: `linear-gradient(135deg, ${alpha(iconBg, active ? 0.2 : 0.08)}, ${alpha(iconBg, active ? 0.08 : 0.02)})`,
                            border: `1px solid ${alpha(iconBg, active ? 0.25 : 0.08)}`,
                            boxShadow: active ? `0 4px 16px ${alpha(iconBg, 0.15)}` : "none",
                            transition: "all 0.3s ease",
                        }}>
                            {icon}
                        </Box>
                        {/* Badge pill / Check */}
                        {active ? (
                            <Box sx={{
                                animation: `${checkPop} 0.3s ease-out both`,
                                width: 26, height: 26, borderRadius: "50%",
                                bgcolor: iconBg, display: "flex",
                                alignItems: "center", justifyContent: "center",
                                boxShadow: `0 2px 8px ${alpha(iconBg, 0.3)}`,
                            }}>
                                <CheckIcon sx={{ fontSize: 15, color: "#fff" }} />
                            </Box>
                        ) : (
                            <Box sx={{
                                px: 1.5, py: 0.4, borderRadius: "100px",
                                border: `1px solid ${alpha(C.border, 0.2)}`,
                            }}>
                                <Typography sx={{
                                    fontSize: "0.62rem", fontWeight: 600,
                                    color: alpha(C.muted, 0.4),
                                    letterSpacing: "0.06em", textTransform: "uppercase",
                                }}>
                                    {badge}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Title */}
                    <Typography sx={{
                        color: C.text, fontSize: { xs: "1.15rem", md: "1.35rem" },
                        fontWeight: 700, lineHeight: 1.2, mb: 0.6,
                    }}>
                        {title}
                    </Typography>
                    {active && (
                        <Typography sx={{
                            color: iconBg,
                            fontSize: "0.68rem", fontWeight: 600,
                            letterSpacing: "0.08em", textTransform: "uppercase", mb: 1.5,
                        }}>
                            {badge}
                        </Typography>
                    )}

                    {/* Description */}
                    <Typography sx={{
                        color: alpha(C.text, active ? 0.6 : 0.45), fontSize: "0.84rem",
                        lineHeight: 1.7, mb: 3,
                        mt: active ? 0 : 1,
                    }}>
                        {description}
                    </Typography>

                    {/* Bullet points */}
                    <Stack spacing={1.3} sx={{ flex: 1 }}>
                        {bullets.map((text, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                <Box sx={{
                                    width: 20, height: 20, borderRadius: "6px", flexShrink: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    bgcolor: active ? alpha(iconBg, 0.12) : alpha(C.text, 0.03),
                                    border: `1px solid ${active ? alpha(iconBg, 0.15) : "transparent"}`,
                                    transition: "all 0.2s",
                                }}>
                                    <CheckIcon sx={{
                                        fontSize: 13,
                                        color: active ? iconBg : alpha(C.muted, 0.2),
                                        transition: "color 0.2s",
                                    }} />
                                </Box>
                                <Typography sx={{
                                    color: active ? alpha(C.text, 0.8) : alpha(C.text, 0.45),
                                    fontSize: "0.82rem", lineHeight: 1.3, fontWeight: 450,
                                    transition: "color 0.2s",
                                }}>
                                    {text}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>

                    {/* CTA button area */}
                    <Box sx={{
                        mt: 3.5, pt: 2.5,
                        borderTop: `1px solid ${alpha(active ? iconBg : C.border, active ? 0.12 : 0.1)}`,
                        display: "flex", alignItems: "center", gap: 1,
                        cursor: "pointer",
                        "&:hover .cta-arrow": { transform: "translateX(4px)" },
                    }}>
                        <Typography sx={{
                            color: active ? iconBg : alpha(C.text, 0.35),
                            fontSize: "0.85rem", fontWeight: 600,
                            transition: "color 0.2s",
                        }}>
                            {cta}
                        </Typography>
                        <ArrowIcon className="cta-arrow" sx={{
                            fontSize: 16,
                            color: active ? iconBg : alpha(C.text, 0.25),
                            transition: "all 0.25s ease",
                        }} />
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <Q title="How would you like to proceed?" subtitle="Two ways to plan your coverage — both lead to a perfect result">
            <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: { xs: 2, md: 2.5 },
                maxWidth: 860, mx: "auto",
            }}>
                <OptionCard
                    path="pick"
                    icon={<PackagesIcon sx={{ fontSize: 24, color: "#a78bfa" }} />}
                    iconBg="#a78bfa"
                    title="Browse Our Packages"
                    badge="Recommended"
                    description="Professionally curated packages designed around what works best for your type of event. Everything's thought out — just pick the one that fits."
                    bullets={[
                        "Pre-built for your event type",
                        "Films, coverage & extras included",
                        "Clear pricing — no surprises",
                        "Quick & easy to choose",
                    ]}
                    cta="See packages"
                />
                <OptionCard
                    path="build"
                    icon={<CustomIcon sx={{ fontSize: 24, color: "#38bdf8" }} />}
                    iconBg="#38bdf8"
                    title="Build Your Own"
                    badge="Full control"
                    description="You're in the driver's seat. Pick the moments that matter, choose your films, and set exactly how much coverage you want — we'll put together a quote based on your choices."
                    bullets={[
                        "Select the moments you care about most",
                        "Hand-pick your films & deliverables",
                        "Decide your own coverage hours",
                        "Get a quote shaped around your choices",
                    ]}
                    cta="Start customising"
                />
            </Box>
        </Q>
    );
}
