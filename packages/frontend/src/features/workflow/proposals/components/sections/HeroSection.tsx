"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
    useReveal,
} from "@/features/workflow/proposals/utils/portal/animations";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";
import type { PublicProposalBrand, PublicProposalContent } from "@/features/workflow/proposals/types";

/* ── CSS keyframes (only for looping / non-transition effects) ── */

const ampersandGlow = keyframes`
    0%, 100% { opacity: 0.5; text-shadow: 0 0 0 transparent; }
    50%      { opacity: 1; text-shadow: 0 0 30px currentColor; }
`;

const scrollHintBob = keyframes`
    0%, 100% { opacity: 0.3; transform: translateY(0); }
    50%      { opacity: 0.7; transform: translateY(6px); }
`;

/* ── Framer Motion variants ── */

const phaseVariants = {
    enter: {
        opacity: 0,
        scale: 0.98,
        filter: "blur(8px)",
        y: 4,
    },
    center: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
            duration: 0.9,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],  // easeOutQuad
        },
    },
    exit: {
        opacity: 0,
        scale: 1.01,
        filter: "blur(6px)",
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.55, 0.06, 0.68, 0.19] as [number, number, number, number],   // easeInCubic — fast fade
        },
    },
};

const scrollHintVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 1.2, ease: "easeOut" as const },
    },
} as const;

/* Phase 3 gets its own container variant — no blur/scale, children animate individually */
const phase3ContainerVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.2 } },
    exit: {
        opacity: 0,
        scale: 1.02,
        filter: "blur(10px)",
        transition: { duration: 0.8, ease: [0.55, 0.06, 0.68, 0.19] as const },
    },
};

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

interface HeroSectionProps {
    content: PublicProposalContent | null;
    brand: PublicProposalBrand | null;
    clientName: string;
    weddingDate: string | null;
    colors: PortalThemeColors;
    isDark: boolean;
    partnerFirstName?: string | null;
    partnerLastName?: string | null;
    contactLastName?: string | null;
    contactRole?: string | null;
    venueDetails?: string | null;
}

/* ── Helpers ── */

function getHonorific(role: string | null | undefined): { left: string; right: string } {
    const r = (role ?? "").toLowerCase();
    if (r.includes("bride")) return { left: "Mr", right: "Mrs" };
    if (r.includes("groom")) return { left: "Mr", right: "Mrs" };
    return { left: "Mr", right: "Mrs" };
}

function getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function parseDateParts(weddingDate: string | null): { dayName: string; dayOrdinal: string; monthYear: string } | null {
    if (!weddingDate) return null;
    const d = new Date(weddingDate.includes("T") ? weddingDate : weddingDate + "T00:00:00");
    return {
        dayName:    d.toLocaleDateString(undefined, { weekday: "long" }),
        dayOrdinal: getOrdinal(d.getDate()),
        monthYear:  d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
}

/* ------------------------------------------------------------------ */
/* HeroSection                                                         */
/* ------------------------------------------------------------------ */

export default function HeroSection({
    content, brand, clientName, weddingDate, colors, isDark,
    partnerFirstName, partnerLastName, contactLastName, contactRole, venueDetails,
}: HeroSectionProps) {
    const heroReveal = useReveal();
    /**
     * Phase 1: "Sarah & Matthew"           (0.4s)
     * Phase 2: "On Friday, June 26, 2026"   (2.4s)
     * Phase 3: "You become Mr & Mrs Shutter" (4.4s)
     * Phase 4: Studio message               (6.9s)
     * Phase 5: "This is our plan."          (8.9s)
     * Phase 6: Final header                 (10.4s)
     */
    const [phase, setPhase] = useState(0);

    const hasPartner = !!partnerFirstName;
    const sharedLast = contactLastName ?? "";
    const honorific = getHonorific(contactRole);
    const brandName = brand?.name ?? "";

    useEffect(() => {
        if (!heroReveal.visible) return;
        const t1 = setTimeout(() => setPhase(1),   400);  // names
        const t2 = setTimeout(() => setPhase(2),  2800);  // date       (phase 1 dwell: 2400ms)
        const t3 = setTimeout(() => setPhase(3),  6200);  // you become (phase 2 dwell: 3400ms)
        const t4 = setTimeout(() => setPhase(4), 13000);  // "worth remembering" (phase 3 dwell: 6800ms)
        const t5 = setTimeout(() => setPhase(5), 16500);  // "we know"   (phase 4 dwell: 3500ms)
        const t6 = setTimeout(() => setPhase(6), 23000);  // "let us show" (phase 5 dwell: 6500ms)
        const t7 = setTimeout(() => setPhase(7), 28500);  // final header  (phase 6 dwell: 5500ms)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); clearTimeout(t7); };
    }, [heroReveal.visible]);

    const textGradientSx = isDark
        ? {
            background: `linear-gradient(135deg, ${colors.text} 0%, ${alpha(colors.text, 0.55)} 50%, ${colors.text} 100%)`,
            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }
        : { color: colors.text };

    /* ── Phase content renderers ── */

    const renderPhase = () => {
        switch (phase) {
            case 1: return (
                <Typography variant="h1" sx={{
                    fontWeight: 200, letterSpacing: "-0.03em",
                    fontSize: { xs: "2.4rem", sm: "3.2rem", md: "4rem" }, lineHeight: 1.1,
                    whiteSpace: "nowrap", ...textGradientSx,
                }}>
                    {clientName}
                    {hasPartner && (
                        <>
                            <Typography component="span" sx={{
                                display: "inline-block", mx: { xs: 1.5, md: 2 },
                                fontWeight: 100, fontSize: "0.55em", verticalAlign: "middle",
                                color: colors.text, opacity: 0.45,
                                WebkitTextFillColor: colors.text,
                                background: "none", backgroundClip: "unset", WebkitBackgroundClip: "unset",
                            }}>
                                &amp;
                            </Typography>
                            {partnerFirstName}
                        </>
                    )}
                </Typography>
            );

            case 2: {
                const parts = parseDateParts(weddingDate);
                if (!parts) return null;
                return (
                    <Box sx={{ textAlign: "center" }}>
                        {/* "On Friday" — small, muted, appears first */}
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
                        >
                            <Typography sx={{
                                fontWeight: 200, letterSpacing: "0.08em", textTransform: "uppercase",
                                fontSize: { xs: "0.75rem", sm: "0.9rem", md: "1rem" },
                                color: alpha(colors.muted, 0.6), mb: 2,
                            }}>
                                On {parts.dayName}
                            </Typography>
                        </motion.div>

                        {/* "the 26th of June 2026" — hero-sized, materialises below */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }}
                        >
                            <Typography variant="h1" sx={{
                                fontWeight: 200, letterSpacing: "-0.02em",
                                fontSize: { xs: "2rem", sm: "2.8rem", md: "3.6rem" }, lineHeight: 1.1,
                                ...textGradientSx,
                            }}>
                                the {parts.dayOrdinal} of {parts.monthYear}
                            </Typography>
                        </motion.div>
                    </Box>
                );
            }

            case 3: {
                const fadeUp = (delay: number) => ({
                    initial: { opacity: 0, y: 12 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
                });
                return (
                    <>
                        {/* 1. Label */}
                        <motion.div {...fadeUp(0.1)}>
                            <Typography sx={{
                                fontWeight: 200, letterSpacing: "0.08em", textTransform: "uppercase",
                                fontSize: { xs: "0.7rem", sm: "0.85rem", md: "0.95rem" },
                                color: alpha(colors.muted, 0.6), mb: 2,
                            }}>you become</Typography>
                        </motion.div>

                        {/* 2. Framed names — decorative border draws in, then names materialise inside */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            style={{ position: "relative", display: "inline-flex", justifyContent: "center" }}
                        >
                            {/* Decorative frame — thin lines with corner accents */}
                            <Box component="svg" viewBox="0 0 400 120" preserveAspectRatio="none" sx={{
                                position: "absolute", inset: 0, width: "100%", height: "100%",
                                overflow: "visible", pointerEvents: "none",
                            }}>
                                {/* Main border — draws on */}
                                <motion.rect
                                    x="8" y="8" width="384" height="104" rx="0" ry="0"
                                    fill="none"
                                    stroke={alpha(colors.accent, 0.18)}
                                    strokeWidth="0.6"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                                />
                                {/* Corner flourishes — small L-shapes at each corner */}
                                {[
                                    /* top-left */     "M 2,20 L 2,2 L 20,2",
                                    /* top-right */    "M 380,2 L 398,2 L 398,20",
                                    /* bottom-right */ "M 398,100 L 398,118 L 380,118",
                                    /* bottom-left */  "M 20,118 L 2,118 L 2,100",
                                ].map((d, i) => (
                                    <motion.path
                                        key={i} d={d} fill="none"
                                        stroke={alpha(colors.accent, 0.3)}
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 + i * 0.12 }}
                                    />
                                ))}
                            </Box>

                            {/* Name content inside the frame */}
                            <Box sx={{ px: { xs: 3, sm: 5, md: 7 }, py: { xs: 2, sm: 3, md: 3.5 } }}>
                                {hasPartner ? (
                                    <motion.div
                                        initial={{ opacity: 0, filter: "blur(16px)" }}
                                        animate={{ opacity: 1, filter: "blur(0px)" }}
                                        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                                    >
                                        <Typography variant="h1" sx={{
                                            fontWeight: 200, letterSpacing: "-0.02em", whiteSpace: "nowrap",
                                            fontSize: { xs: "2rem", sm: "2.8rem", md: "3.6rem" }, lineHeight: 1.1,
                                            ...textGradientSx,
                                        }}>
                                            {honorific.left}
                                            <Typography component="span" sx={{
                                                display: "inline-block", mx: { xs: "0.35em", md: "0.45em" },
                                                fontWeight: 100, fontSize: "0.55em", verticalAlign: "middle",
                                                color: colors.text, opacity: 0.6,
                                                WebkitTextFillColor: colors.text,
                                                background: "none", backgroundClip: "unset", WebkitBackgroundClip: "unset",
                                                animation: `${ampersandGlow} 4s ease-in-out 2.2s infinite`,
                                            }}>&amp;</Typography>
                                            {honorific.right} {sharedLast}
                                        </Typography>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, filter: "blur(16px)" }}
                                        animate={{ opacity: 1, filter: "blur(0px)" }}
                                        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                                    >
                                        <Typography variant="h1" sx={{
                                            fontWeight: 200, letterSpacing: "-0.02em",
                                            fontSize: { xs: "2rem", sm: "2.8rem", md: "3.6rem" }, lineHeight: 1.1,
                                            ...textGradientSx,
                                        }}>{clientName}</Typography>
                                    </motion.div>
                                )}
                            </Box>
                        </motion.div>

                        {/* 4. Venue — slides in as its own moment */}
                        {venueDetails && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 2.6 }}
                                style={{ marginTop: "32px" }}
                            >
                                <Typography sx={{
                                    fontWeight: 200, letterSpacing: "0.12em", textTransform: "uppercase",
                                    fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.85rem" },
                                    color: alpha(colors.muted, 0.5),
                                }}>at {venueDetails}</Typography>
                            </motion.div>
                        )}
                    </>
                );
            }

            case 4: return (
                <Typography variant="h2" sx={{
                    fontWeight: 200, letterSpacing: "-0.02em", fontStyle: "italic",
                    fontSize: { xs: "1.6rem", sm: "2.2rem", md: "2.8rem" }, lineHeight: 1.2,
                    ...textGradientSx,
                }}>That&rsquo;s a day worth remembering.</Typography>
            );

            case 5: return (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: { xs: 1.5, md: 2 } }}>
                    {/* Line 1 — softer lead-in */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
                    >
                        <Typography sx={{
                            fontWeight: 200, letterSpacing: "0.04em", fontStyle: "italic",
                            fontSize: { xs: "1.1rem", sm: "1.4rem", md: "1.7rem" }, lineHeight: 1.3,
                            color: alpha(colors.muted, 0.6),
                        }}>And we know{" "}
                            <Typography component="span" sx={{
                                fontWeight: 200, letterSpacing: "0.04em", fontStyle: "italic",
                                fontSize: "inherit", color: colors.text,
                            }}>exactly</Typography>
                            {" "}how</Typography>
                    </motion.div>

                    {/* Line 2 — the payoff, larger + accent underline */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.7 }}
                        style={{ position: "relative", display: "inline-block" }}
                    >
                        <Typography sx={{
                            fontWeight: 300, letterSpacing: "-0.01em", fontStyle: "italic",
                            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.4rem" }, lineHeight: 1.2,
                            color: colors.text,
                        }}><Typography component="span" sx={{
                                fontWeight: 300, fontStyle: "italic", fontSize: "inherit",
                                color: alpha(colors.text, 0.4),
                            }}>to tell</Typography>
                            {" "}<Typography component="span" sx={{
                                fontWeight: 300, fontStyle: "italic", fontSize: "inherit",
                                color: colors.accent,
                            }}>that story.</Typography></Typography>
                    </motion.div>

                    {/* Star rating with flanking lines */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 1.8 }}
                        style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "28px" }}
                    >
                        {/* Left line */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 2.0 }}
                            style={{ transformOrigin: "right" }}
                        >
                            <Box sx={{
                                width: { xs: 28, sm: 36, md: 48 }, height: "1px",
                                background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.3)})`,
                            }} />
                        </motion.div>

                        {/* Stars */}
                        <Box sx={{ display: "flex", gap: "6px" }}>
                            {[0, 1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 2.0 + i * 0.12 }}
                                >
                                    <Box component="svg" viewBox="0 0 20 20" sx={{ width: { xs: 16, sm: 18, md: 20 }, height: "auto" }}>
                                        <path
                                            d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.26 5.06 16.7l.94-5.49-4-3.9 5.53-.8L10 1.5z"
                                            fill={colors.accent}
                                            fillOpacity={0.85}
                                        />
                                    </Box>
                                </motion.div>
                            ))}
                        </Box>

                        {/* Right line */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 2.0 }}
                            style={{ transformOrigin: "left" }}
                        >
                            <Box sx={{
                                width: { xs: 28, sm: 36, md: 48 }, height: "1px",
                                background: `linear-gradient(90deg, ${alpha(colors.accent, 0.3)}, transparent)`,
                            }} />
                        </motion.div>
                    </motion.div>

                    {/* Rating attribution */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 2.6 }}
                    >
                        <Typography sx={{
                            fontWeight: 200, fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.72rem" },
                            color: alpha(colors.muted, 0.4), letterSpacing: "0.1em", textTransform: "uppercase",
                        }}>5.0 &middot; Google Reviews</Typography>
                    </motion.div>

                    {/* Stats row — stacked columns with dot separators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 2.8 }}
                        style={{ display: "flex", alignItems: "center", gap: "0px", marginTop: "20px" }}
                    >
                        {[
                            { value: "8", label: "years" },
                            { value: "150+", label: "weddings" },
                            { value: "50+", label: "venues" },
                        ].map((stat, i, arr) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center" }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 3.0 + i * 0.25 }}
                                    style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "80px" }}
                                >
                                    <Typography sx={{
                                        fontWeight: 300, fontSize: { xs: "1.4rem", sm: "1.6rem", md: "1.8rem" },
                                        color: colors.text, letterSpacing: "-0.02em", lineHeight: 1,
                                    }}>{stat.value}</Typography>
                                    <Typography sx={{
                                        fontWeight: 200, fontSize: { xs: "0.58rem", sm: "0.65rem", md: "0.72rem" },
                                        color: alpha(colors.muted, 0.4), letterSpacing: "0.1em", textTransform: "uppercase",
                                        mt: 0.5,
                                    }}>{stat.label}</Typography>
                                </motion.div>
                                {i < arr.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 3.2 + i * 0.25 }}
                                    >
                                        <Typography sx={{
                                            color: alpha(colors.accent, 0.3), mx: { xs: 1.5, sm: 2, md: 2.5 },
                                            fontSize: { xs: "0.8rem", md: "1rem" }, fontWeight: 200,
                                        }}>&middot;</Typography>
                                    </motion.div>
                                )}
                            </Box>
                        ))}
                    </motion.div>
                </Box>
            );

            case 6: return (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: { xs: 1.5, md: 2 } }}>
                    {/* Line 1 — softer lead-in, slides down from above */}
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
                    >
                        <Typography sx={{
                            fontWeight: 200, letterSpacing: "0.04em", fontStyle: "italic",
                            fontSize: { xs: "1.1rem", sm: "1.4rem", md: "1.7rem" }, lineHeight: 1.3,
                            color: alpha(colors.muted, 0.6),
                        }}>So let us show you</Typography>
                    </motion.div>

                    {/* Line 2 — slides up, word-level colour */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.7 }}
                        style={{ position: "relative", display: "inline-block" }}
                    >
                        <Typography sx={{
                            fontWeight: 300, letterSpacing: "-0.01em", fontStyle: "italic",
                            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.4rem" }, lineHeight: 1.2,
                            color: colors.text,
                        }}>
                            <Typography component="span" sx={{ fontWeight: 300, fontStyle: "italic", fontSize: "inherit", color: alpha(colors.text, 0.35) }}>how</Typography>
                            {" "}<Typography component="span" sx={{ fontWeight: 300, fontStyle: "italic", fontSize: "inherit", color: colors.text }}>we&rsquo;d</Typography>
                            {" "}<Typography component="span" sx={{ fontWeight: 300, fontStyle: "italic", fontSize: "inherit", color: colors.accent }}>capture</Typography>
                            {" "}<Typography component="span" sx={{ fontWeight: 300, fontStyle: "italic", fontSize: "inherit", color: alpha(colors.text, 0.35) }}>it all.</Typography>
                        </Typography>
                    </motion.div>

                    {/* Camera icon — draws in after text */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 1.6 }}
                        style={{ marginTop: "16px" }}
                    >
                        <Box component="svg" viewBox="0 0 64 44" fill="none" sx={{
                            width: { xs: 48, sm: 56, md: 64 }, height: "auto",
                        }}>
                            {/* Camera body */}
                            <motion.rect
                                x="4" y="12" width="56" height="28" rx="4"
                                stroke={alpha(colors.accent, 0.35)}
                                strokeWidth="1.2"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.8 }}
                            />
                            {/* Viewfinder bump */}
                            <motion.path
                                d="M22 12 L26 4 L38 4 L42 12"
                                stroke={alpha(colors.accent, 0.35)}
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 2.2 }}
                            />
                            {/* Lens circle */}
                            <motion.circle
                                cx="32" cy="26" r="9"
                                stroke={alpha(colors.accent, 0.4)}
                                strokeWidth="1.2"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 2.5 }}
                            />
                            {/* Inner lens */}
                            <motion.circle
                                cx="32" cy="26" r="4"
                                stroke={alpha(colors.accent, 0.25)}
                                strokeWidth="0.8"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 2.9 }}
                            />
                            {/* Flash dot */}
                            <motion.circle
                                cx="50" cy="18" r="2"
                                fill={alpha(colors.accent, 0.3)}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 3.2 }}
                            />
                        </Box>
                    </motion.div>
                </Box>
            );

            case 7: return (
                <>
                    {/* Tagline above frame */}
                    <Typography sx={{
                        fontWeight: 200, letterSpacing: "0.08em", textTransform: "uppercase",
                        fontSize: { xs: "0.7rem", sm: "0.85rem", md: "0.95rem" },
                        color: alpha(colors.muted, 0.5), mb: 4,
                    }}>This Is{" "}
                        <Typography component="span" sx={{
                            fontWeight: 300, letterSpacing: "0.08em", textTransform: "uppercase",
                            fontSize: "inherit", color: alpha(colors.text, 0.85),
                        }}>Our Plan</Typography>
                        {" "}For Your Perfect Day</Typography>

                    {/* Framed couple name — matches Phase 3 frame */}
                    <Box sx={{ position: "relative", display: "inline-flex", justifyContent: "center" }}>
                        {/* Radial glow behind box */}
                        <Box sx={{
                            position: "absolute",
                            top: "50%", left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "140%", height: "200%",
                            background: `radial-gradient(ellipse at center, ${alpha(colors.accent, 0.08)} 0%, ${alpha(colors.accent, 0.03)} 40%, transparent 70%)`,
                            pointerEvents: "none",
                        }} />
                        {/* Decorative frame */}
                        <Box component="svg" viewBox="0 0 400 120" preserveAspectRatio="none" sx={{
                            position: "absolute", inset: 0, width: "100%", height: "100%",
                            overflow: "visible", pointerEvents: "none",
                        }}>
                            <motion.rect
                                x="8" y="8" width="384" height="104" rx="0" ry="0"
                                fill="none"
                                stroke={alpha(colors.accent, 0.18)}
                                strokeWidth="0.6"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                            />
                            {[
                                "M 2,20 L 2,2 L 20,2",
                                "M 380,2 L 398,2 L 398,20",
                                "M 398,100 L 398,118 L 380,118",
                                "M 20,118 L 2,118 L 2,100",
                            ].map((d, i) => (
                                <motion.path
                                    key={i} d={d} fill="none"
                                    stroke={alpha(colors.accent, 0.3)}
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.12 }}
                                />
                            ))}
                        </Box>

                        <Box sx={{ px: { xs: 3, sm: 5, md: 7 }, py: { xs: 2, sm: 3, md: 3.5 } }}>
                            <Typography variant="h1" sx={{
                                fontWeight: 200, letterSpacing: "-0.02em",
                                fontSize: { xs: "2rem", sm: "2.8rem", md: "3.6rem" }, lineHeight: 1.1,
                                ...textGradientSx,
                            }}>
                                {hasPartner
                                    ? `${honorific.left} & ${honorific.right} ${sharedLast}`
                                    : clientName}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Brand name — smaller, supporting role, with glow */}
                    {brandName && (
                        <Typography sx={{
                            fontWeight: 200, letterSpacing: "0.18em", textTransform: "uppercase",
                            fontSize: { xs: "0.8rem", sm: "1rem", md: "1.1rem" },
                            color: alpha(colors.muted, 0.45), mt: 4, mb: 2,
                        }}>by{" "}
                            <Typography component="span" sx={{
                                fontWeight: 300, letterSpacing: "0.18em", textTransform: "uppercase",
                                fontSize: "inherit", color: alpha(colors.text, 0.8),
                                textShadow: `0 0 24px ${alpha(colors.accent, 0.35)}, 0 0 48px ${alpha(colors.accent, 0.15)}`,
                            }}>{brandName}</Typography>
                        </Typography>
                    )}

                    {/* Presented on date */}
                    <Typography sx={{
                        fontWeight: 200, letterSpacing: "0.06em",
                        fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.95rem" },
                        color: alpha(colors.muted, 0.45),
                    }}>
                        Presented on {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </Typography>
                </>
            );

            default: return null;
        }
    };

    return (
        <Box
            ref={heroReveal.ref}
            sx={{
                position: "relative",
                height: "100dvh",
                mt: "-48px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                textAlign: "center", px: 3, overflow: "hidden",
            }}
        >
            <AnimatePresence mode="wait">
                {phase > 0 && (
                    <motion.div
                        key={phase}
                        variants={phase === 3 ? phase3ContainerVariants : phaseVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingBottom: "16vh",
                            pointerEvents: "none",
                            willChange: "opacity, transform, filter",
                        }}
                    >
                        {renderPhase()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Scroll hint ── */}
            <motion.div
                variants={scrollHintVariants}
                initial="hidden"
                animate={phase >= 5 ? "visible" : "hidden"}
                style={{
                    position: "absolute",
                    bottom: 40,
                }}
            >
                <Box sx={{
                    width: 20, height: 34, borderRadius: 10,
                    border: `1.5px solid ${alpha(colors.muted, 0.25)}`,
                    display: "flex", justifyContent: "center", pt: "6px",
                    animation: phase >= 5 ? `${scrollHintBob} 2.5s ease-in-out infinite` : "none",
                }}>
                    <Box sx={{
                        width: 3, height: 6, borderRadius: 2,
                        bgcolor: alpha(colors.muted, 0.35),
                    }} />
                </Box>
            </motion.div>
        </Box>
    );
}
