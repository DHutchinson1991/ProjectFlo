"use client";

import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CircleIcon from "@mui/icons-material/Circle";
import VideocamIcon from "@mui/icons-material/Videocam";
import MicIcon from "@mui/icons-material/Mic";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import { ServicePackage } from "../../types/service-package.types";
import { CATEGORY_COLORS, getCategoryEmoji } from "../listing/listing-helpers";
import { formatCurrency } from "@/shared/utils/formatUtils";
import { EmptyState } from "@/shared/ui";

function getCategoryColor(cat: string | null): string {
    if (!cat) return "#64748b";
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
        if (cat.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return "#64748b";
}

interface PackageListPanelProps {
    packages: ServicePackage[];
    selectedPackageId: number | null;
    hoveredPackageId: number | null;
    onRowClick: (pkg: ServicePackage) => void;
    onRowHover: (pkg: ServicePackage | null) => void;
    onToggleActive?: (pkg: ServicePackage) => void;
    currencyCode: string;
    isLoading: boolean;
}

export function PackageListPanel({
    packages,
    selectedPackageId,
    hoveredPackageId,
    onRowClick,
    onRowHover,
    onToggleActive,
    currencyCode,
    isLoading,
}: PackageListPanelProps) {
    if (packages.length === 0 && !isLoading) {
        return (
            <Box sx={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                overflow: "hidden",
                bgcolor: "rgba(255,255,255,0.01)",
                p: 4,
            }}>
                <EmptyState
                    icon={InventoryIcon}
                    message="No packages yet"
                    description="Create your first package for this service to get started."
                />
            </Box>
        );
    }

    return (
        <Box sx={{
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            overflow: "hidden",
            bgcolor: "rgba(255,255,255,0.01)",
        }}>
            {/* Header row */}
            <Box sx={{
                display: "grid",
                gridTemplateColumns: "4px 28px 1fr 60px 60px 60px 100px 100px",
                gap: 1,
                px: 2,
                py: 1.5,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                bgcolor: "rgba(255,255,255,0.02)",
                alignItems: "center",
            }}>
                <Box /> {/* color bar spacer */}
                <Box /> {/* active dot spacer */}
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Package
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>
                    📷
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>
                    🎤
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>
                    👥
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Price
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Created
                </Typography>
            </Box>

            {/* Package rows */}
            {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                const isHovered = hoveredPackageId === pkg.id;
                const catColor = getCategoryColor(pkg.category);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const pkgData = pkg as any;
                const eqCounts = pkgData?._equipmentCounts || pkg.contents?.equipment_counts || {};
                const cameraCount: number = eqCounts.cameras ?? 0;
                const audioCount: number = eqCounts.audio ?? 0;
                const crewCount: number = typeof pkgData?._crewCount === 'number' ? pkgData._crewCount : 0;
                const totalCost = pkg._totalCost ?? 0;
                const created = new Date(pkg.created_at);
                const dateStr = created.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

                return (
                    <Box
                        key={pkg.id}
                        onClick={() => onRowClick(pkg)}
                        onMouseEnter={() => onRowHover(pkg)}
                        onMouseLeave={() => onRowHover(null)}
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "4px 28px 1fr 60px 60px 60px 100px 100px",
                            gap: 1,
                            px: 2,
                            py: 1.25,
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            transition: "all 0.12s ease",
                            bgcolor: isSelected
                                ? alpha(catColor, 0.08)
                                : isHovered
                                    ? "rgba(255,255,255,0.03)"
                                    : "transparent",
                            borderLeft: isSelected ? `2px solid ${catColor}` : "2px solid transparent",
                            "&:hover": {
                                bgcolor: alpha(catColor, 0.05),
                            },
                            "&:last-child": { borderBottom: "none" },
                        }}
                    >
                        {/* Category color bar */}
                        <Box sx={{
                            width: 4,
                            borderRadius: 1,
                            bgcolor: catColor,
                            alignSelf: "stretch",
                            my: 0.25,
                        }} />

                        {/* Active toggle dot */}
                        <Tooltip title={pkg.is_active ? "Active — click to deactivate" : "Inactive — click to activate"} arrow>
                            <Box
                                onClick={(e) => { e.stopPropagation(); onToggleActive?.(pkg); }}
                                sx={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer",
                                    "&:hover .dot": { transform: "scale(1.3)" },
                                }}
                            >
                                <CircleIcon
                                    className="dot"
                                    sx={{
                                        fontSize: 10,
                                        color: pkg.is_active ? "#22c55e" : "#475569",
                                        transition: "all 0.15s ease",
                                    }}
                                />
                            </Box>
                        </Tooltip>

                        {/* Name */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                            <Typography sx={{
                                fontSize: "0.85rem",
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? "#f1f5f9" : "#cbd5e1",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                                {pkg.name}
                            </Typography>
                        </Box>

                        {/* Cameras */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <VideocamIcon sx={{ fontSize: 13, color: "#10b981", opacity: cameraCount > 0 ? 1 : 0.25 }} />
                            <Typography sx={{ fontSize: "0.8rem", color: cameraCount > 0 ? "#94a3b8" : "#334155", fontWeight: 500 }}>
                                {cameraCount}
                            </Typography>
                        </Box>

                        {/* Mics */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <MicIcon sx={{ fontSize: 13, color: "#a855f7", opacity: audioCount > 0 ? 1 : 0.25 }} />
                            <Typography sx={{ fontSize: "0.8rem", color: audioCount > 0 ? "#94a3b8" : "#334155", fontWeight: 500 }}>
                                {audioCount}
                            </Typography>
                        </Box>

                        {/* Crew */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <PeopleIcon sx={{ fontSize: 13, color: "#EC4899", opacity: crewCount > 0 ? 1 : 0.25 }} />
                            <Typography sx={{ fontSize: "0.8rem", color: crewCount > 0 ? "#94a3b8" : "#334155", fontWeight: 500 }}>
                                {crewCount}
                            </Typography>
                        </Box>

                        {/* Price */}
                        <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>
                            {totalCost > 0 ? formatCurrency(totalCost, currencyCode) : "—"}
                        </Typography>

                        {/* Created date */}
                        <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {dateStr}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}
