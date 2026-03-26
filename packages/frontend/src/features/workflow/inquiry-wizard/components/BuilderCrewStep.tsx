"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Person as PersonIcon, Videocam as VideocamIcon } from "@mui/icons-material";
import { C } from '../constants/wizard-config';
import { filmStagger } from '../constants/animations';

interface Props {
    opCount: number;
    camCount: number;
    maxVideographers: number;
    maxCamerasPerOp: number;
    handleChange: (key: string, value: unknown) => void;
}

export function BuilderCrewStep({ opCount, camCount, maxVideographers, maxCamerasPerOp, handleChange }: Props) {
    const maxCams = opCount * maxCamerasPerOp;
    const minCams = opCount;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0, alignItems: "center", py: 1 }}>
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
}
