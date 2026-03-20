"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Stack, Chip, Tooltip, Collapse } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import type { PaymentScheduleTemplate } from "@/lib/types";
import { C, glassSx } from "../../constants";
import { chipBounce, selectPulse, fadeInUp } from "../../animations";
import { NACtx } from "../../types";
import { Q } from "../Shared";

/* ── Milestone colour palette (matching inquiry detail card) ── */
const MILESTONE_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#f59e0b", "#f87171", "#818cf8", "#2dd4bf"];

/** Human-readable timing suffix for a rule */
function timingLabel(rule: PaymentScheduleTemplate["rules"][number]): string {
    switch (rule.trigger_type) {
        case "AFTER_BOOKING":
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days after booking`
                : "on booking";
        case "BEFORE_EVENT":
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days before the event`
                : "on the event date";
        case "AFTER_EVENT":
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days after the event`
                : "after the event";
        default:
            return "";
    }
}

function rulePercent(rule: PaymentScheduleTemplate["rules"][number]): number {
    return rule.amount_type === "PERCENT" ? Number(rule.amount_value) : 0;
}

function fmtCurrency(sym: string, value: number): string {
    return `${sym}${Math.round(value).toLocaleString()}`;
}

/** Resolve the best available total price from builder estimate OR selected pre-built package */
function resolveTotal(ctx: NACtx): number | null {
    // 1. Builder estimate (custom package)
    const builderTotal = ctx.priceEstimate?.summary?.subtotal;
    if (builderTotal && builderTotal > 0) return builderTotal;

    // 2. Pre-built package selection
    const selectedPkgId = ctx.responses.selected_package;
    if (selectedPkgId) {
        const pkg = ctx.filteredPackages.find((p) => String(p.id) === String(selectedPkgId));
        if (pkg) {
            const backendTax = (pkg as unknown as Record<string, unknown>)._tax as { totalWithTax: number } | null | undefined;
            const totalCost = backendTax?.totalWithTax ?? Number((pkg as unknown as Record<string, unknown>)._totalCost ?? 0);
            const itemsTotal = (pkg.contents?.items ?? []).reduce(
                (s: number, it: { price?: number }) => s + (it.price ?? 0), 0,
            );
            const price = totalCost > 0 ? totalCost : (Number(pkg.base_price) || itemsTotal || 0);
            if (price > 0) return price;
        }
    }

    return null;
}

export default function PaymentTermsScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, currentBrand, currSym } = ctx;
    const [templates, setTemplates] = useState<PaymentScheduleTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const selected: number | null = responses.payment_schedule_template_id ?? null;
    const totalPrice = resolveTotal(ctx);

    useEffect(() => {
        if (!currentBrand?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await api.paymentSchedules.getAll(currentBrand.id);
                if (!cancelled) {
                    setTemplates(data);
                    if (!responses.payment_schedule_template_id) {
                        const def = data.find((t) => t.is_default);
                        if (def) handleChange("payment_schedule_template_id", def.id);
                    }
                }
            } catch {
                // non-fatal
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [currentBrand?.id]);

    if (loading) {
        return (
            <Q title="Payment plan">
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} sx={{ color: C.accent }} />
                </Box>
            </Q>
        );
    }

    if (templates.length === 0) {
        return (
            <Q title="Payment plan" subtitle="No payment plans have been set up yet — we'll sort this out with you directly.">
                <Box />
            </Q>
        );
    }

    return (
        <Q
            title="Flexible payment options"
            subtitle="Choose the structure that suits your budget — we'll confirm every detail with you personally before payments begin."
        >
            {/* ── Package total callout ──────────────────────── */}
            {totalPrice !== null && totalPrice > 0 && (
                <Box
                    sx={{
                        textAlign: "center",
                        mb: 3,
                        animation: `${fadeInUp} 0.35s ease-out`,
                    }}
                >
                    <Typography sx={{ color: C.muted, fontSize: "0.78rem", mb: 0.5, letterSpacing: "0.04em" }}>
                        Your package estimate
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: C.text,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.1,
                        }}
                    >
                        {fmtCurrency(currSym, totalPrice)}
                    </Typography>
                </Box>
            )}

            <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
                {templates.map((template) => {
                    const isSel = selected === template.id;
                    const sorted = template.rules.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
                    const barTotal = sorted.reduce((s, r) => s + (rulePercent(r) || 1), 0) || 1;

                    const rows = sorted.map((rule, i) => {
                        const pct = rulePercent(rule);
                        const amount = totalPrice && pct > 0 ? (pct / 100) * totalPrice : null;
                        return {
                            rule,
                            pct,
                            amount,
                            color: MILESTONE_COLORS[i % MILESTONE_COLORS.length],
                            timing: timingLabel(rule),
                        };
                    });

                    // Compact summary text: "50% + 50%" or "£441 + £441"
                    const summaryParts = rows.map((r) =>
                        r.amount !== null ? fmtCurrency(currSym, r.amount) : `${r.pct}%`,
                    );
                    const summaryText = summaryParts.join("  +  ");

                    return (
                        <Box
                            key={template.id}
                            onClick={() => handleChange("payment_schedule_template_id", template.id)}
                            sx={{
                                ...glassSx,
                                p: 0,
                                cursor: "pointer",
                                userSelect: "none",
                                overflow: "hidden",
                                border: `1.5px solid ${isSel ? C.accent : C.border}`,
                                bgcolor: isSel ? alpha(C.accent, 0.08) : alpha(C.card, 0.4),
                                borderRadius: "16px",
                                transition: "all 0.25s ease",
                                animation: isSel
                                    ? `${chipBounce} 0.25s ease-out, ${selectPulse} 0.6s ease-out`
                                    : "none",
                                "&:hover": {
                                    borderColor: alpha(C.accent, 0.5),
                                    bgcolor: alpha(C.accent, 0.06),
                                },
                            }}
                        >
                            <Box sx={{ px: 2.5, pt: 2, pb: isSel ? 0 : 2 }}>
                                {/* Header row */}
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography
                                            sx={{
                                                fontWeight: isSel ? 700 : 500,
                                                fontSize: "0.95rem",
                                                color: isSel ? C.text : alpha(C.text, 0.85),
                                            }}
                                        >
                                            {template.name}
                                        </Typography>
                                        {template.is_default && (
                                            <Chip
                                                label="Recommended"
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.6rem",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.06em",
                                                    bgcolor: alpha(C.accent, 0.18),
                                                    color: C.accent,
                                                    border: "none",
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        {isSel && <CheckCircleIcon sx={{ color: C.accent, fontSize: 18 }} />}
                                        <ExpandMoreIcon
                                            sx={{
                                                color: C.muted,
                                                fontSize: 18,
                                                transition: "transform 0.25s ease",
                                                transform: isSel ? "rotate(180deg)" : "rotate(0deg)",
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Segmented split bar — always visible */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: "3px",
                                        height: 5,
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        bgcolor: alpha(C.border, 0.3),
                                        mb: 1,
                                    }}
                                >
                                    {rows.map((r, i) => (
                                        <Tooltip
                                            key={i}
                                            title={`${r.rule.label}: ${r.amount !== null ? fmtCurrency(currSym, r.amount) : `${r.pct || Math.round(100 / rows.length)}%`}`}
                                            arrow
                                            placement="top"
                                        >
                                            <Box
                                                sx={{
                                                    flex: (r.pct || 1) / barTotal,
                                                    bgcolor: isSel ? r.color : alpha(r.color, 0.35),
                                                    borderRadius: 1,
                                                    minWidth: 4,
                                                    transition: "flex 0.3s, background-color 0.3s",
                                                }}
                                            />
                                        </Tooltip>
                                    ))}
                                </Box>

                                {/* Compact summary — visible when collapsed */}
                                {!isSel && (
                                    <Typography
                                        sx={{
                                            fontSize: "0.72rem",
                                            color: C.muted,
                                            fontFamily: "monospace",
                                            fontWeight: 500,
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        {summaryText}
                                    </Typography>
                                )}
                            </Box>

                            {/* ── Expanded detail (only when selected) ── */}
                            <Collapse in={isSel} timeout={250}>
                                <Box sx={{ px: 2.5, pb: 2, pt: 0.5 }}>
                                    {/* Legend chips */}
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                                        {rows.map((r, i) => (
                                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: r.color, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: "0.62rem", color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>
                                                    {r.rule.label}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    {/* Detail rows */}
                                    <Stack spacing={0.75}>
                                        {rows.map((r, i) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.2,
                                                    py: 0.6,
                                                    px: 1,
                                                    borderRadius: "10px",
                                                    bgcolor: alpha(r.color, 0.08),
                                                    borderLeft: `3px solid ${r.color}`,
                                                }}
                                            >
                                                {/* Mini fill bar */}
                                                <Box sx={{ width: 32, flexShrink: 0 }}>
                                                    <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(r.color, 0.2), overflow: "hidden" }}>
                                                        <Box sx={{ width: `${r.pct || Math.round(100 / rows.length)}%`, height: "100%", bgcolor: r.color, borderRadius: 2 }} />
                                                    </Box>
                                                </Box>

                                                {/* Label + timing */}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: alpha(C.text, 0.95), lineHeight: 1.25 }}>
                                                        {r.rule.label}
                                                    </Typography>
                                                    {r.timing && (
                                                        <Typography sx={{ fontSize: "0.62rem", color: alpha(C.muted, 0.8), lineHeight: 1.25, mt: 0.1 }}>
                                                            {r.timing}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                {/* Amount */}
                                                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                                    {r.amount !== null ? (
                                                        <>
                                                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "monospace", color: r.color, lineHeight: 1.2 }}>
                                                                {fmtCurrency(currSym, r.amount)}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: "0.58rem", color: alpha(C.muted, 0.7), lineHeight: 1.2 }}>
                                                                ({r.pct}%)
                                                            </Typography>
                                                        </>
                                                    ) : (
                                                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "monospace", color: r.color, lineHeight: 1.2 }}>
                                                            {r.pct > 0 ? `${r.pct}%` : `${currSym}${Number(r.rule.amount_value).toLocaleString()}`}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
            </Stack>
        </Q>
    );
}
