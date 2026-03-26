"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    ArrowForward as ArrowForwardIcon,
    MovieFilter as MovieFilterIcon,
    Tune as TuneIcon,
} from "@mui/icons-material";
import WelcomeSocialProof from "./WelcomeSocialProof";
import { C } from '../constants/wizard-config';
import { subtleFloat, fadeIn, fadeInUp } from '../constants/animations';
import { NACtx } from '../types';

const glowPulse = keyframes`
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 0.8; }
`;

export default function WelcomeScreen({ ctx }: { ctx: NACtx }) {
    const { currentBrand, brandName, brandInitial, welcomeSettings } = ctx;

    const socialProofCount = welcomeSettings?.social_proof_count || 0;
    const socialProofText = welcomeSettings?.social_proof_text || "happy customers";
    const socialLinks = (welcomeSettings?.social_links || []).filter(l => l.platform && l.url);
    const testimonials = (welcomeSettings?.testimonials || []).filter(t => t.name && t.text);

    return (
        <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: "100vh", textAlign: "center",
            px: { xs: 3, md: 6 }, py: { xs: 3, md: 4 },
            position: "relative",
        }}>

            {/* Decorative glow behind brand */}
            <Box sx={{
                position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
                width: 320, height: 320, borderRadius: "50%",
                background: `radial-gradient(circle, ${alpha(C.accent, 0.08)} 0%, transparent 70%)`,
                animation: `${glowPulse} 6s ease-in-out infinite`,
                pointerEvents: "none",
            }} />

            {/* Brand logo / initial */}
            <Box sx={{ animation: `${fadeIn} 0.6s ease-out`, position: "relative", mb: 3 }}>
                {currentBrand?.logo_url ? (
                    <Box component="img" src={currentBrand.logo_url} alt={brandName}
                        sx={{
                            height: 56, width: "auto", objectFit: "contain",
                            animation: `${subtleFloat} 6s ease-in-out infinite`,
                        }} />
                ) : brandInitial ? (
                    <Box sx={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        animation: `${subtleFloat} 6s ease-in-out infinite`,
                        position: "relative",
                        "&::before": {
                            content: '""', position: "absolute", inset: -6,
                            borderRadius: "50%", border: `1px solid ${alpha(C.accent, 0.12)}`,
                        },
                        "&::after": {
                            content: '""', position: "absolute", inset: -14,
                            borderRadius: "50%", border: `1px solid ${alpha(C.accent, 0.05)}`,
                        },
                    }}>
                        <Typography sx={{ color: "#fff", fontWeight: 300, fontSize: "1.8rem" }}>{brandInitial}</Typography>
                    </Box>
                ) : null}
            </Box>

            {/* Headline */}
            <Box sx={{
                animation: `${fadeInUp} 0.7s ease-out 0.1s both`,
                maxWidth: 680, mx: "auto", mb: 2,
            }}>
                <Typography sx={{
                    fontSize: { xs: "2.2rem", sm: "2.8rem", md: "3.4rem" }, fontWeight: 200,
                    letterSpacing: "-0.04em", lineHeight: 1.1,
                    background: `linear-gradient(135deg, ${C.text} 0%, ${alpha(C.text, 0.55)} 60%, ${C.text} 100%)`,
                    backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    Your film starts here
                </Typography>
            </Box>

            {/* Subtitle */}
            <Typography sx={{
                color: alpha(C.muted, 0.75), fontSize: { xs: "1rem", md: "1.15rem" },
                lineHeight: 1.7, maxWidth: 480, mx: "auto",
                animation: `${fadeInUp} 0.7s ease-out 0.2s both`,
                mb: 3.5,
            }}>
                Tell us about your day and get an instant estimate — choose a package or build something completely custom.
            </Typography>

            {/* Two-path CTA */}
            <Box sx={{
                display: "flex", gap: { xs: 2, md: 2.5 },
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center", justifyContent: "center",
                animation: `${fadeInUp} 0.7s ease-out 0.35s both`,
                mb: 2,
            }}>
                {/* Primary CTA */}
                <Button
                    onClick={() => { ctx.singleSelect("_dummy", ""); ctx.goTo("event_type"); }}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: "1rem !important" }} />}
                    sx={{
                        px: { xs: 4, md: 5 }, py: 1.75, borderRadius: "16px",
                        fontSize: { xs: "0.95rem", md: "1.05rem" },
                        textTransform: "none", fontWeight: 600,
                        background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`,
                        color: "#fff", boxShadow: `0 4px 28px ${alpha(C.accent, 0.35)}`,
                        minWidth: { xs: 260, sm: "auto" },
                        "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: `0 8px 36px ${alpha(C.accent, 0.5)}`,
                        },
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}>
                    Get Your Estimate
                </Button>
            </Box>

            {/* Supporting line */}
            <Typography sx={{
                color: alpha(C.muted, 0.45), fontSize: "0.78rem",
                animation: `${fadeInUp} 0.7s ease-out 0.45s both`,
                mb: 3,
            }}>
                Takes about 2 minutes — no commitment required
            </Typography>

            {/* Value props row */}
            <Box sx={{
                display: "flex", gap: { xs: 3, md: 5 }, flexWrap: "wrap",
                justifyContent: "center",
                animation: `${fadeInUp} 0.7s ease-out 0.55s both`,
                mb: 2.5,
            }}>
                {[
                    { icon: <MovieFilterIcon sx={{ fontSize: "1.05rem" }} />, text: "Pick a package or build your own" },
                    { icon: <TuneIcon sx={{ fontSize: "1.05rem" }} />, text: "Instant personalised pricing" },
                ].map((item, i) => (
                    <Box key={i} sx={{
                        display: "flex", alignItems: "center", gap: 1,
                    }}>
                        <Box sx={{ color: alpha(C.accent, 0.7), display: "flex" }}>{item.icon}</Box>
                        <Typography sx={{ color: alpha(C.muted, 0.7), fontSize: "0.82rem", fontWeight: 500 }}>
                            {item.text}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <WelcomeSocialProof
                socialProofCount={socialProofCount}
                socialProofText={socialProofText}
                socialLinks={socialLinks}
                testimonials={testimonials}
            />
        </Box>
    );
}
