"use client";

import React from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { C, STEP_AMBIENCE, DEFAULT_AMB } from '../constants/wizard-config';
import { fadeIn, shimmer, slideInRight, slideInLeft, glowPulse, drift1, drift2, drift3 } from '../constants/animations';
import type { ScreenId, Direction, AnyRecord } from '../types';
import type { Brand } from "@/lib/types";

interface WizardLayoutProps {
    currentScreenId: ScreenId;
    screenIdx: number;
    progress: number;
    direction: Direction;
    validationShake: boolean;
    error: string | null;
    onClearError: () => void;
    submitting: boolean;
    goBack: () => void;
    handleContinue: () => void;
    handleSubmit: () => void;
    goNext: () => void;
    responses: AnyRecord;
    handleChange: (key: string, value: unknown) => void;
    isOptional: boolean;
    currentBrand: Brand | null;
    brandName: string;
    brandInitial: string;
    renderScreen: () => React.ReactNode;
}

export default function WizardLayout({
    currentScreenId, screenIdx, progress, direction, validationShake, error, onClearError,
    submitting, goBack, handleContinue, handleSubmit, goNext, responses, handleChange,
    isOptional, currentBrand, brandName, brandInitial, renderScreen,
}: WizardLayoutProps) {
    const amb = STEP_AMBIENCE[currentScreenId] ?? DEFAULT_AMB;
    const P = [
        { s: 220, x: "8%",  y: "5%",  c: amb.c1, o: 0.04,  b: 110, d: 26, dl: 0,   k: drift1 },
        { s: 160, x: "72%", y: "10%", c: amb.c2, o: 0.03,  b: 90,  d: 34, dl: -10, k: drift2 },
        { s: 120, x: "38%", y: "55%", c: amb.c1, o: 0.035, b: 75,  d: 22, dl: -5,  k: drift3 },
        { s: 180, x: "82%", y: "50%", c: amb.c2, o: 0.025, b: 100, d: 30, dl: -14, k: drift1 },
        { s: 90,  x: "18%", y: "78%", c: amb.c2, o: 0.03,  b: 55,  d: 38, dl: -20, k: drift2 },
        { s: 130, x: "55%", y: "28%", c: amb.c1, o: 0.025, b: 80,  d: 20, dl: -3,  k: drift3 },
        { s: 70,  x: "92%", y: "32%", c: amb.c1, o: 0.02,  b: 48,  d: 32, dl: -8,  k: drift2 },
        { s: 100, x: "3%",  y: "42%", c: amb.c2, o: 0.025, b: 62,  d: 28, dl: -18, k: drift1 },
    ];

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: C.bg, color: C.text, overflowX: "hidden", WebkitFontSmoothing: "antialiased", position: "relative", display: "flex", flexDirection: "column" }}>
            {/* Animated bokeh background */}
            <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                <Box sx={{ position: "absolute", inset: 0, background: [
                    `radial-gradient(ellipse 80% 50% at 50% 0%, ${alpha(amb.c1, 0.05)} 0%, transparent 70%)`,
                    `radial-gradient(ellipse 50% 70% at 85% 100%, ${alpha(amb.c2, 0.03)} 0%, transparent 60%)`,
                    `radial-gradient(ellipse 40% 40% at 10% 55%, ${alpha(amb.c1, 0.02)} 0%, transparent 50%)`,
                ].join(", "), transition: "background 2.5s ease" }} />
                {P.map((p, i) => (
                    <Box key={i} sx={{ position: "absolute", left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: "50%",
                        background: `radial-gradient(circle, ${alpha(p.c, p.o)} 0%, transparent 70%)`,
                        filter: `blur(${p.b}px)`,
                        animation: `${p.k} ${p.d}s ease-in-out ${p.dl}s infinite, ${glowPulse} ${p.d + 8}s ease-in-out ${p.dl}s infinite`,
                        transition: "background 2.5s ease" }} />
                ))}
                <Box sx={{ position: "absolute", inset: 0, opacity: 0.02, mixBlendMode: "overlay",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: "128px 128px" }} />
                <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: `linear-gradient(to top, ${alpha(C.bg, 0.7)}, transparent)` }} />
            </Box>

            {/* Progress bar */}
            <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, bgcolor: alpha(C.border, 0.3), zIndex: 100 }}>
                <Box sx={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${C.gradient1}, ${C.gradient2})`, borderRadius: "0 2px 2px 0", transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }} />
            </Box>

            {/* Brand header */}
            {currentScreenId !== "welcome" && (
                <Box sx={{ position: "sticky", top: 3, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, py: 1.25, px: 3, backdropFilter: "blur(16px) saturate(1.8)", bgcolor: alpha(C.card, 0.5), borderBottom: `1px solid ${alpha(C.border, 0.5)}`, animation: `${fadeIn} 0.3s ease both` }}>
                    {currentBrand?.logo_url ? (
                        <Box component="img" src={currentBrand.logo_url} alt={brandName} sx={{ height: 24, width: "auto", objectFit: "contain" }} />
                    ) : brandInitial ? (
                        <Box sx={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{brandInitial}</Typography>
                        </Box>
                    ) : null}
                    <Typography sx={{ fontWeight: 600, color: C.text, letterSpacing: 1, fontSize: "0.75rem", textTransform: "uppercase" }}>{brandName}</Typography>
                </Box>
            )}

            {/* Screen content */}
            <Box sx={{ position: "relative", zIndex: 1, maxWidth: 680, mx: "auto", px: { xs: 2.5, md: 0 }, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", mt: { xs: -4, md: -8 } }}>
                {error && <Alert severity="error" onClose={onClearError} sx={{ mb: 2, bgcolor: alpha("#ef4444", 0.08), color: "#fca5a5", border: `1px solid ${alpha("#ef4444", 0.2)}`, borderRadius: 3, "& .MuiAlert-icon": { color: "#ef4444" } }}>{error}</Alert>}
                <Box key={currentScreenId} sx={validationShake ? { "@keyframes shake": { "0%, 100%": { transform: "translateX(0)" }, "20%, 60%": { transform: "translateX(-8px)" }, "40%, 80%": { transform: "translateX(8px)" } }, animation: "shake 0.4s ease-in-out" } : { animation: `${direction === "forward" ? slideInRight : slideInLeft} 0.4s cubic-bezier(0.16, 1, 0.3, 1) both` }}>
                    {renderScreen()}
                </Box>
            </Box>

            {/* Navigation */}
            {currentScreenId !== "welcome" && (
                <Box sx={{ position: "sticky", bottom: 0, zIndex: 50, backdropFilter: "blur(16px) saturate(1.8)", bgcolor: alpha(C.card, 0.8), borderTop: `1px solid ${alpha(C.border, 0.4)}`, px: 3, py: 2 }}>
                    <Box sx={{ maxWidth: 680, mx: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Button onClick={() => { if (currentScreenId === "builder" && (responses.builder_step || 1) > 1) { handleChange("builder_step", (responses.builder_step || 1) - 1); } else { goBack(); } }}
                            disabled={screenIdx <= 1 && !(currentScreenId === "builder" && (responses.builder_step || 1) > 1)}
                            startIcon={<ArrowBackIcon sx={{ fontSize: "0.85rem !important" }} />}
                            sx={{ color: C.muted, fontSize: "0.82rem", textTransform: "none", borderRadius: "12px", "&:hover": { bgcolor: alpha(C.text, 0.04), color: C.text }, "&:disabled": { color: alpha(C.muted, 0.25) } }}>Back</Button>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {isOptional && <Typography onClick={goNext} sx={{ color: C.muted, fontSize: "0.78rem", cursor: "pointer", "&:hover": { color: C.text }, transition: "color 0.2s" }}>Skip &rarr;</Typography>}
                            {currentScreenId === "summary" ? (
                                <Button onClick={handleSubmit} disabled={submitting}
                                    endIcon={!submitting && <CheckCircleIcon sx={{ fontSize: "0.9rem !important" }} />}
                                    sx={{ background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`, color: "#fff", fontWeight: 600, fontSize: "0.88rem", px: 4, py: 1.25, borderRadius: "14px", textTransform: "none", boxShadow: `0 4px 20px ${alpha(C.accent, 0.3)}`, "&:hover": { transform: "translateY(-1px)", boxShadow: `0 8px 28px ${alpha(C.accent, 0.4)}` }, "&:disabled": { bgcolor: alpha(C.text, 0.06), color: alpha(C.text, 0.2), boxShadow: "none" }, transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                                    {submitting && <CircularProgress size={16} sx={{ color: "inherit", mr: 1 }} />}
                                    {submitting ? "Submitting\u2026" : "Submit"}
                                </Button>
                            ) : (
                                <Button onClick={handleContinue} endIcon={<ArrowForwardIcon sx={{ fontSize: "0.85rem !important" }} />}
                                    sx={{ background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`, color: "#fff", fontWeight: 600, fontSize: "0.88rem", px: 3.5, py: 1.25, borderRadius: "14px", textTransform: "none", boxShadow: `0 4px 20px ${alpha(C.accent, 0.3)}`, "&:hover": { transform: "translateY(-1px)", boxShadow: `0 8px 28px ${alpha(C.accent, 0.4)}` }, transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>Continue</Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Footer */}
            {currentScreenId === "summary" && (
                <Box sx={{ textAlign: "center", py: 3, position: "relative", zIndex: 1 }}>
                    <Typography sx={{ color: alpha(C.muted, 0.35), fontSize: "0.65rem", letterSpacing: 0.5 }}>
                        &copy; {new Date().getFullYear()} {brandName} &middot; Powered by ProjectFlo
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
