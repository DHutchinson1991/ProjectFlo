"use client";

import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import { C, glassSx } from '../../constants/wizard-config';
import { NACtx, ScreenId } from '../../types';
import { Q } from '../QuestionWrapper';
import type { ServicePackage, ServicePackageItem } from '@/features/catalog/packages/types/service-package.types';
import { formatCurrency } from '@projectflo/shared';

// Backend may inject pricing fields at runtime
type EnrichedPackage = ServicePackage & {
    _tax?: { rate: number; amount: number; totalWithTax: number } | null;
    _totalCost?: number;
};

function StatChip({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Box sx={{
            display: "inline-flex", alignItems: "center", gap: 0.6,
            px: 1.1, py: 0.45, borderRadius: 1.5,
            bgcolor: active ? alpha(C.accent, 0.13) : alpha(C.border, 0.22),
            border: `1px solid ${active ? alpha(C.accent, 0.28) : alpha(C.border, 0.45)}`,
        }}>
            <Box sx={{ color: active ? C.accent : alpha(C.text, 0.45), display: "flex", alignItems: "center" }}>{icon}</Box>
            <Typography sx={{ color: active ? alpha(C.text, 0.88) : alpha(C.text, 0.52), fontSize: "0.68rem", fontWeight: 600 }}>{label}</Typography>
        </Box>
    );
}

export default function PackagesScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, filteredPackages, budgetMax, slotLabels, currency, maxCamerasPerOp } = ctx;
    const selectedPkg = responses.selected_package;

    return (
        <Q title="Here's what we'd recommend" subtitle="Based on your event and budget — pick the one that fits">
            {filteredPackages.length > 0 ? (
                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: filteredPackages.length === 1 ? "minmax(0,480px)" : "repeat(2, 1fr)",
                        md: filteredPackages.length >= 3 ? "repeat(3, 1fr)" : `repeat(${filteredPackages.length}, 1fr)`,
                    },
                    gap: 2.5, maxWidth: 1060, mx: "auto",
                    alignItems: "stretch",
                }}>
                    {filteredPackages.map((pkg) => {
                        const epkg = pkg as EnrichedPackage;
                        const isSel = selectedPkg === String(pkg.id);
                        const itemsTotal = (pkg.contents?.items ?? []).reduce((s: number, it: { price?: number }) => s + (it.price ?? 0), 0);
                        const backendTax = epkg._tax;
                        const totalCost = backendTax?.totalWithTax ?? Number(epkg._totalCost ?? 0);
                        const price = totalCost > 0 ? totalCost : (Number(pkg.base_price) || itemsTotal || 0);
                        const overBudget = budgetMax !== null && price > budgetMax;
                        const tier = slotLabels.get(pkg.id);
                        const items = pkg.contents?.items ?? [];
                        const hours = pkg.contents?.coverage_hours;
                        const cameras = pkg.contents?.equipment_counts?.cameras ?? 0;
                        const audio = pkg.contents?.equipment_counts?.audio ?? 0;
                        const operators = cameras > 0 ? Math.ceil(cameras / Math.max(1, maxCamerasPerOp || 1)) : 0;
                        const filmItems = items.filter((it: ServicePackageItem) => it.type === "film");
                        const serviceItems = items.filter((it: ServicePackageItem) => it.type === "service");
                        const hasTypedItems = filmItems.length > 0 || serviceItems.length > 0;

                        return (
                            <Box key={pkg.id} onClick={() => handleChange("selected_package", String(pkg.id))} sx={{
                                ...glassSx, p: 0, cursor: "pointer", overflow: "hidden", position: "relative",
                                display: "flex", flexDirection: "column",
                                opacity: overBudget ? 0.55 : 1,
                                borderColor: isSel ? alpha(C.accent, 0.5) : undefined,
                                bgcolor: isSel ? alpha(C.accent, 0.06) : undefined,
                                transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                                "&:hover": { borderColor: alpha(C.accent, 0.35), transform: "translateY(-4px)", opacity: 1, boxShadow: `0 8px 32px ${alpha(C.accent, 0.12)}` },
                            }}>
                                {/* Top accent bar */}
                                <Box sx={{ height: 3, background: isSel ? `linear-gradient(90deg, ${C.gradient1}, ${C.gradient2})` : alpha(C.border, 0.3) }} />

                                <Box sx={{ p: 3, display: "flex", flexDirection: "column", flex: 1 }}>
                                    {/* Tier badge + radio */}
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                                        {tier ? (
                                            <Box sx={{ px: 1.5, py: 0.4, borderRadius: 8, bgcolor: alpha(C.accent, 0.12), display: "inline-flex" }}>
                                                <Typography sx={{ color: C.accent, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{tier}</Typography>
                                            </Box>
                                        ) : <Box />}
                                        <Box sx={{
                                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                            border: `2px solid ${isSel ? C.accent : C.border}`,
                                            bgcolor: isSel ? C.accent : "transparent",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all 0.2s",
                                        }}>
                                            {isSel && <Box sx={{ width: 8, height: 8, bgcolor: "#fff", borderRadius: "50%" }} />}
                                        </Box>
                                    </Box>

                                    {/* Package name */}
                                    <Typography sx={{ color: C.text, fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.3, mb: 1.5 }}>{pkg.name}</Typography>

                                    {/* Stat chips: cameras · operators · audio · hours */}
                                    {(cameras > 0 || audio > 0 || hours) && (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.7, mb: 2 }}>
                                            {cameras > 0 && (
                                                <StatChip icon={<CameraAltOutlinedIcon sx={{ fontSize: "0.8rem" }} />} label={`${cameras} Camera${cameras !== 1 ? "s" : ""}`} active={isSel} />
                                            )}
                                            {operators > 0 && (
                                                <StatChip icon={<PersonOutlineOutlinedIcon sx={{ fontSize: "0.8rem" }} />} label={`${operators} Operator${operators !== 1 ? "s" : ""}`} active={isSel} />
                                            )}
                                            {audio > 0 && (
                                                <StatChip icon={<MicNoneOutlinedIcon sx={{ fontSize: "0.8rem" }} />} label={`${audio} Audio`} active={isSel} />
                                            )}
                                            {hours && (
                                                <StatChip icon={<AccessTimeOutlinedIcon sx={{ fontSize: "0.8rem" }} />} label={`${hours} hrs`} active={isSel} />
                                            )}
                                        </Box>
                                    )}

                                    <Box sx={{ borderTop: `1px solid ${alpha(C.border, 0.4)}`, mb: 2 }} />

                                    {/* WHAT WE FILM – service items */}
                                    {(hasTypedItems ? serviceItems.length > 0 : false) && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography sx={{ color: alpha(C.muted, 0.7), fontSize: "0.59rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1 }}>
                                                What we film
                                            </Typography>
                                            <Stack spacing={0.55}>
                                                {serviceItems.slice(0, 4).map((item: ServicePackageItem, i: number) => (
                                                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                                                        <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: isSel ? alpha(C.accent, 0.7) : alpha(C.text, 0.2), flexShrink: 0 }} />
                                                        <Typography sx={{ color: alpha(C.text, 0.62), fontSize: "0.73rem", lineHeight: 1.4 }}>{item.description}</Typography>
                                                    </Box>
                                                ))}
                                                {serviceItems.length > 4 && (
                                                    <Typography sx={{ color: alpha(C.muted, 0.55), fontSize: "0.66rem", pl: 1.5 }}>+{serviceItems.length - 4} more</Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* FILMS DELIVERED – film items */}
                                    {(hasTypedItems ? filmItems.length > 0 : false) && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography sx={{ color: alpha(C.muted, 0.7), fontSize: "0.59rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1 }}>
                                                Films delivered
                                            </Typography>
                                            <Stack spacing={0.55}>
                                                {filmItems.slice(0, 4).map((item: ServicePackageItem, i: number) => (
                                                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                                                        <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: isSel ? alpha(C.gradient2, 0.8) : alpha(C.text, 0.2), flexShrink: 0 }} />
                                                        <Typography sx={{ color: alpha(C.text, 0.62), fontSize: "0.73rem", lineHeight: 1.4 }}>{item.description}</Typography>
                                                    </Box>
                                                ))}
                                                {filmItems.length > 4 && (
                                                    <Typography sx={{ color: alpha(C.muted, 0.55), fontSize: "0.66rem", pl: 1.5 }}>+{filmItems.length - 4} more films</Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* Fallback: untypes items (no type field) */}
                                    {!hasTypedItems && items.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            <Stack spacing={0.55}>
                                                {items.slice(0, 6).map((item: ServicePackageItem, i: number) => (
                                                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                                                        <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: isSel ? C.accent : alpha(C.text, 0.2), flexShrink: 0 }} />
                                                        <Typography sx={{ color: alpha(C.text, 0.62), fontSize: "0.73rem", lineHeight: 1.4 }}>{item.description}</Typography>
                                                    </Box>
                                                ))}
                                                {items.length > 6 && (
                                                    <Typography sx={{ color: alpha(C.muted, 0.55), fontSize: "0.66rem", pl: 1.5 }}>+{items.length - 6} more included</Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* Spacer pushes price to bottom */}
                                    <Box sx={{ flex: 1, minHeight: 8 }} />

                                    {/* Price at bottom */}
                                    <Box sx={{ borderTop: `1px solid ${alpha(C.border, 0.4)}`, pt: 2 }}>
                                        {overBudget && (
                                            <Typography sx={{ color: "#fbbf24", fontSize: "0.67rem", fontWeight: 600, mb: 0.4 }}>Above your range</Typography>
                                        )}
                                        <Typography sx={{
                                            fontSize: "1.7rem", fontWeight: 700, lineHeight: 1,
                                            background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`,
                                            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                        }}>{formatCurrency(Number(price), currency, 0)}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            ) : (
                <Box sx={{ ...glassSx, p: 4, maxWidth: 400, mx: "auto", textAlign: "center" }}>
                    <Typography sx={{ color: C.muted, fontSize: "0.85rem" }}>No packages available for this event type yet.</Typography>
                </Box>
            )}

            {/* Decide later + Build your own */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, mt: 3 }}>
                <Box onClick={() => handleChange("selected_package", "none")} sx={{
                    display: "inline-flex", alignItems: "center", gap: 1, px: 3, py: 1.2, borderRadius: 12,
                    cursor: "pointer", border: `1px solid ${selectedPkg === "none" ? alpha(C.accent, 0.4) : alpha(C.border, 0.5)}`,
                    bgcolor: selectedPkg === "none" ? alpha(C.accent, 0.08) : "transparent",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: alpha(C.accent, 0.3), bgcolor: alpha(C.accent, 0.04) },
                }}>
                    <Typography sx={{ fontSize: "0.85rem" }}>{"🤔"}</Typography>
                    <Typography sx={{ color: selectedPkg === "none" ? C.text : C.muted, fontSize: "0.82rem", fontWeight: 500 }}>Decide later</Typography>
                </Box>
                <Typography onClick={() => {
                    handleChange("package_path", "build");
                    ctx.goTo("builder" as ScreenId);
                }} sx={{
                    color: C.muted, fontSize: "0.8rem", cursor: "pointer",
                    "&:hover": { color: C.accent }, transition: "color 0.2s",
                }}>
                    None of these quite right? <Box component="span" sx={{ color: C.accent, fontWeight: 600 }}>Build your own →</Box>
                </Typography>
            </Box>
        </Q>
    );
}
