"use client";

import React from "react";
import { Box } from "@mui/material";
import { getCategoryIcon, getCategoryColor } from "../constants/categoryConfig";

interface EquipmentCategoryIconProps {
    category: string;
    expanded: boolean;
}

export function EquipmentCategoryIcon({ category, expanded }: EquipmentCategoryIconProps) {
    const IconComponent = getCategoryIcon(category);
    const categoryColor = getCategoryColor(category);

    return (
        <Box
            sx={{
                position: "relative",
                mr: 2,
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": { transform: "scale(1.1) rotate(5deg)" },
            }}
        >
            {/* Outer glow */}
            <Box
                sx={{
                    position: "absolute",
                    inset: "-4px",
                    borderRadius: "16px",
                    background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}80)`,
                    opacity: 0.4,
                    filter: "blur(8px)",
                    transition: "all 0.5s ease",
                    animation: expanded ? "pulse 2s infinite" : "none",
                    "@keyframes pulse": {
                        "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
                        "50%": { opacity: 0.6, transform: "scale(1.05)" },
                    },
                }}
            />

            {/* Main icon container */}
            <Box
                sx={{
                    position: "relative",
                    width: 48,
                    height: 48,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}CC)`,
                    boxShadow: `0 8px 32px ${categoryColor}40, 0 4px 16px ${categoryColor}30, inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                        boxShadow: `0 12px 40px ${categoryColor}50, 0 6px 20px ${categoryColor}40, inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -1px 3px rgba(0,0,0,0.3)`,
                    },
                }}
            >
                {/* Inner highlight */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: "2px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, rgba(255,255,255,0.4), transparent 60%)",
                        opacity: 0.3,
                    }}
                />

                <IconComponent
                    sx={{
                        position: "relative",
                        fontSize: 24,
                        color: "#ffffff",
                        filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.4)) drop-shadow(0 0 8px ${categoryColor}80)`,
                        transition: "all 0.3s ease",
                    }}
                />

                {/* Inner glow when expanded */}
                {expanded && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: "1px",
                            borderRadius: "13px",
                            background: `radial-gradient(circle at center, ${categoryColor}20, transparent 70%)`,
                            animation: "innerGlow 4s ease-in-out infinite alternate",
                            "@keyframes innerGlow": {
                                "0%": { opacity: 0.3 },
                                "100%": { opacity: 0.6 },
                            },
                        }}
                    />
                )}
            </Box>

            {/* Floating orbs when expanded */}
            {expanded && (
                <>
                    {[...Array(3)].map((_, i) => (
                        <Box
                            key={i}
                            sx={{
                                position: "absolute",
                                width: i === 1 ? "2px" : "1.5px",
                                height: i === 1 ? "2px" : "1.5px",
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${categoryColor}, ${categoryColor}80)`,
                                left: `${25 + i * 20}%`,
                                top: `${20 + i * 15}%`,
                                boxShadow: `0 0 6px ${categoryColor}60`,
                                animation: `elegantFloat ${2 + i * 0.5}s ease-in-out infinite`,
                                animationDelay: `${i * 0.4}s`,
                                "@keyframes elegantFloat": {
                                    "0%, 100%": { transform: "translateY(0px) translateX(0px)", opacity: 0.4 },
                                    "25%": { transform: "translateY(-6px) translateX(2px)", opacity: 0.8 },
                                    "50%": { transform: "translateY(-4px) translateX(-2px)", opacity: 1 },
                                    "75%": { transform: "translateY(-8px) translateX(1px)", opacity: 0.6 },
                                },
                            }}
                        />
                    ))}

                    {/* Energy ring */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "60px",
                            height: "60px",
                            border: `1px solid ${categoryColor}30`,
                            borderRadius: "50%",
                            animation: "energyRing 3s ease-in-out infinite",
                            "@keyframes energyRing": {
                                "0%": { opacity: 0, transform: "translate(-50%, -50%) scale(0.8)" },
                                "50%": { opacity: 0.3, transform: "translate(-50%, -50%) scale(1)" },
                                "100%": { opacity: 0, transform: "translate(-50%, -50%) scale(1.2)" },
                            },
                        }}
                    />
                </>
            )}
        </Box>
    );
}
