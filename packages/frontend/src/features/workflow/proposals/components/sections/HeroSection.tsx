"use client";

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    AccessTime as AccessTimeIcon,
    Print as PrintIcon,
} from "@mui/icons-material";
import {
    fadeIn, float, pulseGlow, gradientShift, subtleFloat,
    useReveal, revealSx,
} from "@/features/workflow/proposals/utils/portal/animations";
import { formatDateLong as formatDate, getDaysUntil } from "@/features/workflow/proposals/utils/portal/formatting";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";
import type { PublicProposalBrand, PublicProposalContent } from "@/features/workflow/proposals/types";

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
}

/* ------------------------------------------------------------------ */
/* Sub-pieces                                                          */
/* ------------------------------------------------------------------ */

function StickyHeader({ brand, colors, isDark }: { brand: PublicProposalBrand | null; colors: PortalThemeColors; isDark: boolean }) {
    const brandName = brand?.display_name || brand?.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();
    return (
        <Box
            sx={{
                position: "sticky", top: 0, zIndex: 50,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5,
                "@media print": { display: "none" },
                py: 1.5, px: 3,
                backdropFilter: "blur(16px) saturate(1.8)",
                bgcolor: alpha(colors.card, isDark ? 0.7 : 0.85),
                borderBottom: `1px solid ${alpha(colors.border, 0.6)}`,
                animation: `${fadeIn} 0.5s ease both`,
            }}
        >
            {brand?.logo_url ? (
                <Box component="img" src={brand.logo_url} alt={brandName} sx={{ height: 28, width: "auto", objectFit: "contain", transition: "transform 0.3s ease", "&:hover": { transform: "scale(1.05)" } }} />
            ) : brandInitial ? (
                <Box sx={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", lineHeight: 1 }}>{brandInitial}</Typography>
                </Box>
            ) : null}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.text, letterSpacing: 1, fontSize: "0.8rem", textTransform: "uppercase", flex: 1 }}>
                {brandName}
            </Typography>
            <IconButton size="small" onClick={() => window.print()} sx={{ color: colors.muted, transition: "color 0.2s", "&:hover": { color: colors.text }, "@media print": { display: "none" } }} aria-label="Save as PDF">
                <PrintIcon sx={{ fontSize: 18 }} />
            </IconButton>
        </Box>
    );
}

function FloatingOrbs({ colors, isDark }: { colors: PortalThemeColors; isDark: boolean }) {
    return (
        <>
            <Box sx={{ position: "absolute", top: "5%", right: "8%", width: { xs: 180, md: 320 }, height: { xs: 180, md: 320 }, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(colors.gradient1, isDark ? 0.15 : 0.08)} 0%, transparent 70%)`, filter: "blur(60px)", animation: `${float} 8s ease-in-out infinite`, pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", bottom: "0%", left: "5%", width: { xs: 140, md: 240 }, height: { xs: 140, md: 240 }, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(colors.gradient2, isDark ? 0.12 : 0.06)} 0%, transparent 70%)`, filter: "blur(50px)", animation: `${float} 10s ease-in-out 1s infinite`, pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)", width: { xs: 200, md: 400 }, height: { xs: 200, md: 400 }, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(colors.accent, isDark ? 0.06 : 0.03)} 0%, transparent 70%)`, filter: "blur(80px)", animation: `${subtleFloat} 12s ease-in-out 1s infinite`, pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${alpha(colors.gradient1, 0.04)}, transparent 40%, ${alpha(colors.gradient2, 0.04)})`, backgroundSize: "400% 400%", animation: `${gradientShift} 15s ease infinite`, pointerEvents: "none" }} />
        </>
    );
}

/* ------------------------------------------------------------------ */
/* HeroSection                                                         */
/* ------------------------------------------------------------------ */

export default function HeroSection({ content, brand, clientName, weddingDate, colors, isDark }: HeroSectionProps) {
    const heroReveal = useReveal();
    const daysUntil = getDaysUntil(weddingDate);
    const brandName = brand?.display_name || brand?.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();

    const heroSection = content?.sections?.find((s) => s.type === "hero" && s.isVisible);
    const heroTitle = (heroSection?.data?.title || `${clientName}'s Wedding`) as string;
    const heroSubtitle = (heroSection?.data?.subtitle || heroSection?.data?.date || formatDate(weddingDate)) as string;

    return (
        <>
            <StickyHeader brand={brand} colors={colors} isDark={isDark} />

            <Box
                ref={heroReveal.ref}
                sx={{
                    position: "relative", py: { xs: 14, md: 22 }, px: 3, textAlign: "center",
                    background: `
                        radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha(colors.gradient1, isDark ? 0.2 : 0.1)} 0%, transparent 50%),
                        radial-gradient(ellipse 80% 50% at 80% 20%, ${alpha(colors.gradient2, isDark ? 0.12 : 0.06)} 0%, transparent 50%),
                        radial-gradient(ellipse 80% 50% at 20% 80%, ${alpha(colors.gradient1, isDark ? 0.08 : 0.04)} 0%, transparent 50%),
                        ${colors.bg}
                    `,
                    overflow: "hidden",
                }}
            >
                <FloatingOrbs colors={colors} isDark={isDark} />

                {/* Ornamental line */}
                <Box sx={{ width: 64, height: 2, background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.5)}, transparent)`, borderRadius: 1, mx: "auto", mb: 5, position: "relative", zIndex: 1, ...revealSx(heroReveal.visible, 0) }} />

                {/* Monogram circle */}
                {brandInitial && (
                    <Box
                        sx={{
                            width: { xs: 72, md: 88 }, height: { xs: 72, md: 88 }, borderRadius: "50%", border: `2px solid ${alpha(colors.accent, 0.2)}`,
                            display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 5, position: "relative", zIndex: 1,
                            animation: `${subtleFloat} 6s ease-in-out infinite`,
                            opacity: heroReveal.visible ? 1 : 0, transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s",
                            "&::before": { content: '""', position: "absolute", inset: -6, borderRadius: "50%", border: `1px solid ${alpha(colors.accent, 0.08)}` },
                        }}
                    >
                        {brand?.logo_url ? (
                            <Box component="img" src={brand.logo_url} alt={brandName} sx={{ width: "55%", height: "55%", objectFit: "contain" }} />
                        ) : (
                            <Typography sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: 300, background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                {brandInitial}
                            </Typography>
                        )}
                    </Box>
                )}

                <Typography
                    variant="h1"
                    sx={{
                        fontWeight: 200, letterSpacing: "-0.03em", position: "relative", zIndex: 1, fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4rem" }, lineHeight: 1.08,
                        ...(isDark ? { background: `linear-gradient(135deg, ${colors.text} 0%, ${alpha(colors.text, 0.6)} 50%, ${colors.text} 100%)`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: colors.text }),
                        ...revealSx(heroReveal.visible, 0.1),
                    }}
                >
                    {heroTitle}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 3, mb: 4, position: "relative", zIndex: 1, ...revealSx(heroReveal.visible, 0.2) }}>
                    <Box sx={{ width: 32, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(colors.muted, 0.3)})` }} />
                    <Typography sx={{ color: colors.muted, fontWeight: 400, fontSize: { xs: "0.95rem", md: "1.15rem" }, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {heroSubtitle}
                    </Typography>
                    <Box sx={{ width: 32, height: 1, background: `linear-gradient(90deg, ${alpha(colors.muted, 0.3)}, transparent)` }} />
                </Box>

                {daysUntil !== null && daysUntil > 0 && (
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2.5, py: 0.75, borderRadius: 10, bgcolor: alpha(colors.accent, isDark ? 0.1 : 0.06), border: `1px solid ${alpha(colors.accent, 0.15)}`, position: "relative", zIndex: 1, animation: `${pulseGlow} 4s ease-in-out infinite`, opacity: heroReveal.visible ? 1 : 0, transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s" }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: colors.accent }} />
                        <Typography sx={{ color: colors.accent, fontWeight: 600, fontSize: "0.85rem", letterSpacing: 0.5 }}>
                            {daysUntil} days to go
                        </Typography>
                    </Box>
                )}

                <Box sx={{ width: 48, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.25)}, transparent)`, borderRadius: 1, mx: "auto", mt: 6, position: "relative", zIndex: 1, ...revealSx(heroReveal.visible, 0.35) }} />
            </Box>
        </>
    );
}
