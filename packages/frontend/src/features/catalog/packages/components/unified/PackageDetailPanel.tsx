"use client";

import React, { useState } from "react";
import {
    Box, Typography, TextField, Switch, Chip, Button, IconButton, Tooltip, Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PeopleIcon from "@mui/icons-material/People";
import VideocamIcon from "@mui/icons-material/Videocam";
import MicIcon from "@mui/icons-material/Mic";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PlaceIcon from "@mui/icons-material/Place";
import GroupsIcon from "@mui/icons-material/Groups";
import MovieIcon from "@mui/icons-material/Movie";
import BuildIcon from "@mui/icons-material/Build";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useRouter } from "next/navigation";
import { ServicePackage } from "../../types/service-package.types";
import { CATEGORY_COLORS, getCategoryEmoji } from "../listing/listing-helpers";
import { formatCurrency } from "@/shared/utils/formatUtils";
import { servicePackagesApi } from "../../api";

function getCategoryColor(cat: string | null): string {
    if (!cat) return "#64748b";
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
        if (cat.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return "#64748b";
}

interface PackageDetailPanelProps {
    pkg: ServicePackage | null;
    isSelected: boolean;
    onClose: () => void;
    currencyCode: string;
    onPackageUpdated?: () => void;
    onDelete?: () => void;
}

export function PackageDetailPanel({
    pkg,
    isSelected,
    onClose,
    currencyCode,
    onPackageUpdated,
    onDelete,
}: PackageDetailPanelProps) {
    const router = useRouter();
    const [editingName, setEditingName] = useState(false);
    const [editName, setEditName] = useState("");
    const [editingDesc, setEditingDesc] = useState(false);
    const [editDesc, setEditDesc] = useState("");

    if (!pkg) {
        return (
            <Box sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.06)",
                bgcolor: "rgba(255,255,255,0.01)",
                textAlign: "center",
                minHeight: 300,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}>
                <Typography sx={{ fontSize: "2rem", mb: 1.5 }}>📦</Typography>
                <Typography sx={{ fontWeight: 600, color: "#94a3b8", fontSize: "0.9rem", mb: 0.5 }}>
                    Hover over a package to preview
                </Typography>
                <Typography sx={{ color: "#475569", fontSize: "0.8rem" }}>
                    or click to pin details
                </Typography>
            </Box>
        );
    }

    const catColor = getCategoryColor(pkg.category);
    const catEmoji = getCategoryEmoji(pkg.category);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = pkg as any;
    const totalCost = pkg._totalCost ?? 0;
    const crewCost = pkg._totalCrewCost ?? 0;
    const equipCost = pkg._totalEquipmentCost ?? 0;
    const taxAmount = pkg._tax?.amount ?? 0;
    const taxRate = pkg._tax?.rate ?? 0;
    const subtotal = crewCost + equipCost;
    const contents = pkg.contents;

    // Use computed _equipmentCounts from backend (actual crew-slot equipment), fall back to template counts
    const eqCounts = data?._equipmentCounts || contents?.equipment_counts || {};
    const cameraCount: number = eqCounts.cameras ?? 0;
    const audioCount: number = eqCounts.audio ?? 0;

    // Crew & schedule
    const crewCount: number = typeof data?._crewCount === 'number' ? data._crewCount : 0;
    const counts = data?._count || {};
    const dayCount = typeof counts.package_event_days === 'number'
        ? counts.package_event_days
        : (contents?.day_coverage ? Object.keys(contents.day_coverage).length : 0);
    const locationCount: number = typeof counts.package_location_slots === 'number' ? counts.package_location_slots : 0;

    // Coverage hours — from computed pricing (crew slot hours), not contents JSON
    const crewHours: number = typeof data?._crewHours === 'number' ? data._crewHours : 0;
    const taskHours: number = typeof data?._taskHours === 'number' ? data._taskHours : 0;
    const taskCount: number = typeof data?._taskCount === 'number' ? data._taskCount : 0;
    const totalHours = crewHours;

    // Guest count
    const guestCount: number = typeof pkg.typical_guest_count === 'number' ? pkg.typical_guest_count : 0;

    // Deliverables from contents.items
    const items = contents?.items ?? [];
    const filmCount = items.filter(i => i.type === 'film').length;
    const serviceCount = items.filter(i => i.type === 'service').length;

    const handleSaveName = async () => {
        if (editName.trim() && editName.trim() !== pkg.name) {
            await servicePackagesApi.update(pkg.id, { name: editName.trim() });
            onPackageUpdated?.();
        }
        setEditingName(false);
    };

    const handleSaveDesc = async () => {
        const newDesc = editDesc.trim() || null;
        if (newDesc !== (pkg.description ?? null)) {
            await servicePackagesApi.update(pkg.id, { description: newDesc });
            onPackageUpdated?.();
        }
        setEditingDesc(false);
    };

    const handleToggleActive = async () => {
        await servicePackagesApi.update(pkg.id, { is_active: !pkg.is_active });
        onPackageUpdated?.();
    };

    return (
        <Box sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: alpha(catColor, 0.2),
            bgcolor: "rgba(16, 18, 22, 0.6)",
            overflow: "hidden",
        }}>
            {/* Top accent bar */}
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${catColor}, ${alpha(catColor, 0.4)})` }} />

            {/* Header */}
            <Box sx={{ px: 3, pt: 2.5, pb: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>{catEmoji}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {editingName ? (
                        <TextField
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                            autoFocus
                            fullWidth
                            size="small"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                        />
                    ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography sx={{ fontWeight: 700, color: "#f1f5f9", fontSize: "1.1rem" }} noWrap>
                                {pkg.name}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={() => { setEditName(pkg.name); setEditingName(true); }}
                                sx={{ opacity: 0.4, "&:hover": { opacity: 1 }, p: 0.25 }}
                            >
                                <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
                        {pkg.category && (
                            <Chip
                                label={pkg.category}
                                size="small"
                                sx={{
                                    height: 22, fontSize: "0.7rem", fontWeight: 600,
                                    bgcolor: alpha(catColor, 0.15), color: catColor,
                                }}
                            />
                        )}
                        <Chip
                            icon={pkg.is_active ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <CancelIcon sx={{ fontSize: 14 }} />}
                            label={pkg.is_active ? "Active" : "Inactive"}
                            size="small"
                            sx={{
                                height: 22, fontSize: "0.7rem", fontWeight: 600,
                                bgcolor: pkg.is_active ? alpha("#22c55e", 0.15) : alpha("#64748b", 0.15),
                                color: pkg.is_active ? "#22c55e" : "#64748b",
                                "& .MuiChip-icon": { color: "inherit" },
                            }}
                        />
                    </Box>
                </Box>
                {isSelected && (
                    <IconButton size="small" onClick={onClose} sx={{ color: "#64748b" }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                )}
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

            {/* Description */}
            <Box sx={{ px: 3, py: 2 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75 }}>
                    Description
                </Typography>
                {editingDesc ? (
                    <TextField
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        onBlur={handleSaveDesc}
                        autoFocus
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                    />
                ) : (
                    <Typography
                        onClick={() => { setEditDesc(pkg.description ?? ""); setEditingDesc(true); }}
                        sx={{
                            fontSize: "0.85rem", color: pkg.description ? "#94a3b8" : "#475569",
                            cursor: "pointer", lineHeight: 1.6,
                            fontStyle: pkg.description ? "normal" : "italic",
                            "&:hover": { color: "#cbd5e1" },
                        }}
                    >
                        {pkg.description || "Click to add a description…"}
                    </Typography>
                )}
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

            {/* Assets + Schedule — side by side */}
            <Box sx={{ px: 3, py: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                {/* Assets column */}
                <Box>
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                        Assets
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                        <StatItem icon={<VideocamIcon sx={{ fontSize: 16, color: "#10b981" }} />} label="Cameras" value={`${cameraCount}`} />
                        <StatItem icon={<MicIcon sx={{ fontSize: 16, color: "#a855f7" }} />} label="Mics" value={`${audioCount}`} />
                        <StatItem icon={<PeopleIcon sx={{ fontSize: 16, color: "#EC4899" }} />} label="Crew" value={taskHours > 0 ? `${crewCount} (${taskHours}h)` : `${crewCount}`} />
                    </Box>
                </Box>

                {/* Schedule column */}
                <Box>
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                        Schedule
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                        <StatItem icon={<CalendarMonthIcon sx={{ fontSize: 16, color: "#648CFF" }} />} label="Days" value={`${dayCount}`} />
                        <StatItem icon={<PlaceIcon sx={{ fontSize: 16, color: "#f59e0b" }} />} label="Locations" value={`${locationCount}`} />
                        {guestCount > 0 ? (
                            <StatItem icon={<GroupsIcon sx={{ fontSize: 16, color: "#22d3ee" }} />} label="Guests" value={`${guestCount}`} />
                        ) : (
                            <Box />
                        )}
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

            {/* Films */}
            {(pkg.package_films?.length ?? 0) > 0 && (
                <>
                    <Box sx={{ px: 3, py: 2 }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                            Films ({pkg.package_films!.length})
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {pkg.package_films!.map((pf) => {
                                const film = pf.film;
                                const typeLabel = film.film_type === "MONTAGE" ? "Montage"
                                    : film.film_type === "FEATURE" ? "Feature"
                                    : film.film_type === "ACTIVITY" ? "Activity"
                                    : "Raw";
                                const typeColor = film.film_type === "MONTAGE" ? "#a855f7"
                                    : film.film_type === "FEATURE" ? "#f472b6"
                                    : film.film_type === "ACTIVITY" ? "#0ea5e9"
                                    : "#64748b";
                                // Compute duration: prefer target range, fall back to summed scene durations
                                const sceneDurationSec = (film.scenes ?? []).reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
                                const durationStr = film.target_duration_min != null
                                    ? film.target_duration_min >= 60
                                        ? `${Math.round(film.target_duration_min / 60)}–${Math.round((film.target_duration_max ?? film.target_duration_min) / 60)} min`
                                        : `${film.target_duration_min}–${film.target_duration_max ?? film.target_duration_min}s`
                                    : sceneDurationSec > 0
                                        ? sceneDurationSec >= 60
                                            ? `${Math.round(sceneDurationSec / 60)} min`
                                            : `${sceneDurationSec}s`
                                        : null;
                                const sceneCount = film._count?.scenes ?? 0;
                                return (
                                    <Box
                                        key={pf.id}
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 0.5,
                                            p: 1.5,
                                            borderRadius: 2,
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            bgcolor: "rgba(255,255,255,0.02)",
                                            "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                                            minWidth: 140,
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <MovieIcon sx={{ fontSize: 16, color: typeColor }} />
                                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {film.name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 0.25 }}>
                                            <Chip label={typeLabel} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600, bgcolor: alpha(typeColor, 0.15), color: typeColor, "& .MuiChip-label": { px: 0.75 } }} />
                                            {durationStr && (
                                                <Typography sx={{ fontSize: "0.65rem", color: "#64748b" }}>
                                                    {durationStr}
                                                </Typography>
                                            )}
                                            {sceneCount > 0 && (
                                                <Typography sx={{ fontSize: "0.65rem", color: "#64748b" }}>
                                                    {sceneCount} scene{sceneCount !== 1 ? "s" : ""}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                    <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
                </>
            )}

            {/* Cost Breakdown */}
            <Box sx={{
                px: 3, py: 2,
                background: `linear-gradient(135deg, ${alpha(catColor, 0.06)}, transparent)`,
            }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                    Cost Breakdown
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <CostRow icon={<PeopleIcon sx={{ fontSize: 14, color: "#EC4899" }} />} label="Crew" value={formatCurrency(crewCost, currencyCode)} />
                    <CostRow icon={<BuildIcon sx={{ fontSize: 14, color: "#10b981" }} />} label="Equipment" value={formatCurrency(equipCost, currencyCode)} />
                    <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 0.5 }} />
                    <CostRow label="Subtotal" value={formatCurrency(subtotal, currencyCode)} bold />
                    {taxRate > 0 && (
                        <CostRow icon={<ReceiptIcon sx={{ fontSize: 14, color: "#64748b" }} />} label={`Tax (${(taxRate * 100).toFixed(0)}%)`} value={formatCurrency(taxAmount, currencyCode)} />
                    )}
                    <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 0.5 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9" }}>Total</Typography>
                        <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "#f1f5f9", fontFamily: "monospace" }}>
                            {totalCost > 0 ? formatCurrency(totalCost, currencyCode) : "—"}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

            {/* Active toggle + Actions */}
            <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Switch
                        checked={pkg.is_active}
                        onChange={handleToggleActive}
                        size="small"
                        sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": { color: "#22c55e" },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: alpha("#22c55e", 0.4) },
                        }}
                    />
                    <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        {pkg.is_active ? "Active" : "Inactive"}
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {onDelete && (
                        <Tooltip title="Delete package" arrow>
                            <IconButton
                                size="small"
                                onClick={onDelete}
                                sx={{
                                    color: "#64748b",
                                    "&:hover": { color: "#ef4444", bgcolor: alpha("#ef4444", 0.08) },
                                }}
                            >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Open full editor" arrow>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                            onClick={() => router.push(`/packages/${pkg.id}`)}
                            sx={{ borderRadius: 2, fontWeight: 600, fontSize: "0.75rem" }}
                        >
                            Edit Details
                        </Button>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Box sx={{
            display: "flex", alignItems: "center", gap: 1,
            p: 1.25, borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
        }}>
            {icon}
            <Box>
                <Typography sx={{ fontSize: "0.65rem", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: 600 }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );
}

function CostRow({ icon, label, value, bold }: { icon?: React.ReactNode; label: string; value: string; bold?: boolean }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {icon && icon}
                <Typography sx={{ fontSize: "0.8rem", color: bold ? "#cbd5e1" : "#94a3b8", fontWeight: bold ? 600 : 400 }}>
                    {label}
                </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.8rem", color: bold ? "#cbd5e1" : "#94a3b8", fontWeight: bold ? 600 : 500, fontFamily: "monospace" }}>
                {value}
            </Typography>
        </Box>
    );
}
