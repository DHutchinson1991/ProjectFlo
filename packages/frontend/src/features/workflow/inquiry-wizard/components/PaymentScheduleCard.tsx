"use client";
import React from "react";
import { Box, Typography, Chip, Tooltip, Collapse, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CheckCircle as CheckCircleIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import type { PaymentScheduleTemplate } from "@/features/finance/payment-schedules/types";
import { C, glassSx } from '../constants/wizard-config';
import { chipBounce, selectPulse } from '../constants/animations';
import { MILESTONE_COLORS, timingLabel, rulePercent } from '../mappers/payment-terms';
import { formatCurrency } from '@projectflo/shared';
import { roundMoney } from '@/shared/utils/pricing';

interface Props {
    template: PaymentScheduleTemplate;
    selected: number | null;
    totalPrice: number | null;
    currency: string;
    onSelect: (id: number) => void;
}

export function PaymentScheduleCard({ template, selected, totalPrice, currency, onSelect }: Props) {
    const isSel = selected === template.id;
    const sorted = template.rules.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const barTotal = sorted.reduce((s, r) => s + (rulePercent(r) || 1), 0) || 1;

    const rows = sorted.map((rule, i) => {
        const pct = rulePercent(rule);
        return {
            rule, pct,
            amount: totalPrice && pct > 0 ? roundMoney((pct / 100) * totalPrice) : null,
            color: MILESTONE_COLORS[i % MILESTONE_COLORS.length],
            timing: timingLabel(rule),
        };
    });

    const summaryText = rows.map((r) => r.amount !== null ? formatCurrency(r.amount, currency, 0) : `${r.pct}%`).join("  +  ");

    return (
        <Box
            onClick={() => onSelect(template.id)}
            sx={{
                ...glassSx, p: 0, cursor: "pointer", userSelect: "none", overflow: "hidden",
                border: `1.5px solid ${isSel ? C.accent : C.border}`,
                bgcolor: isSel ? alpha(C.accent, 0.08) : alpha(C.card, 0.4),
                borderRadius: "16px", transition: "all 0.25s ease",
                animation: isSel ? `${chipBounce} 0.25s ease-out, ${selectPulse} 0.6s ease-out` : "none",
                "&:hover": { borderColor: alpha(C.accent, 0.5), bgcolor: alpha(C.accent, 0.06) },
            }}
        >
            <Box sx={{ px: 2.5, pt: 2, pb: isSel ? 0 : 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontWeight: isSel ? 700 : 500, fontSize: "0.95rem", color: isSel ? C.text : alpha(C.text, 0.85) }}>
                            {template.name}
                        </Typography>
                        {template.is_default && (
                            <Chip label="Recommended" size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", bgcolor: alpha(C.accent, 0.18), color: C.accent, border: "none" }} />
                        )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {isSel && <CheckCircleIcon sx={{ color: C.accent, fontSize: 18 }} />}
                        <ExpandMoreIcon sx={{ color: C.muted, fontSize: 18, transition: "transform 0.25s ease", transform: isSel ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: "3px", height: 5, borderRadius: 3, overflow: "hidden", bgcolor: alpha(C.border, 0.3), mb: 1 }}>
                    {rows.map((r, i) => (
                        <Tooltip key={i} title={`${r.rule.label}: ${r.amount !== null ? formatCurrency(r.amount, currency, 0) : `${r.pct || Math.round(100 / rows.length)}%`}`} arrow placement="top">
                            <Box sx={{ flex: (r.pct || 1) / barTotal, bgcolor: isSel ? r.color : alpha(r.color, 0.35), borderRadius: 1, minWidth: 4, transition: "flex 0.3s, background-color 0.3s" }} />
                        </Tooltip>
                    ))}
                </Box>
                {!isSel && <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontFamily: "monospace", fontWeight: 500, letterSpacing: "0.02em" }}>{summaryText}</Typography>}
            </Box>
            <Collapse in={isSel} timeout={250}>
                <Box sx={{ px: 2.5, pb: 2, pt: 0.5 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                        {rows.map((r, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: r.color, flexShrink: 0 }} />
                                <Typography sx={{ fontSize: "0.62rem", color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{r.rule.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <Stack spacing={0.75}>
                        {rows.map((r, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.2, py: 0.6, px: 1, borderRadius: "10px", bgcolor: alpha(r.color, 0.08), borderLeft: `3px solid ${r.color}` }}>
                                <Box sx={{ width: 32, flexShrink: 0 }}>
                                    <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(r.color, 0.2), overflow: "hidden" }}>
                                        <Box sx={{ width: `${r.pct || Math.round(100 / rows.length)}%`, height: "100%", bgcolor: r.color, borderRadius: 2 }} />
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: alpha(C.text, 0.95), lineHeight: 1.25 }}>{r.rule.label}</Typography>
                                    {r.timing && <Typography sx={{ fontSize: "0.62rem", color: alpha(C.muted, 0.8), lineHeight: 1.25, mt: 0.1 }}>{r.timing}</Typography>}
                                </Box>
                                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                    {r.amount !== null ? (
                                        <>
                                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "monospace", color: r.color, lineHeight: 1.2 }}>{formatCurrency(r.amount, currency, 0)}</Typography>
                                            <Typography sx={{ fontSize: "0.58rem", color: alpha(C.muted, 0.7), lineHeight: 1.2 }}>({r.pct}%)</Typography>
                                        </>
                                    ) : (
                                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "monospace", color: r.color, lineHeight: 1.2 }}>
                                            {r.pct > 0 ? `${r.pct}%` : formatCurrency(Number(r.rule.amount_value), currency, 0)}
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
}
