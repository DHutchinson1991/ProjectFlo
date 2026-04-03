"use client";

import { Box, Typography, Tooltip, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AccountBalanceWallet as WalletIcon } from "@mui/icons-material";
import { formatCurrency } from "@/features/workflow/proposals/utils/portal/formatting";
import type { SectionBaseProps, PublicProposalQuotePaymentMilestone } from "@/features/workflow/proposals/types";
import RevealBox from "./RevealBox";

interface PaymentTermsSectionProps extends SectionBaseProps {
    milestones: PublicProposalQuotePaymentMilestone[];
    totalAmount: number;
    currency: string;
}

const MILESTONE_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#f59e0b", "#f87171", "#818cf8", "#2dd4bf"];

export default function PaymentTermsSection({ milestones, totalAmount, currency, colors, cardSx }: PaymentTermsSectionProps) {
    if (milestones.length === 0) return null;

    const barTotal = totalAmount || milestones.reduce((s, m) => s + parseFloat(String(m.amount)), 0) || 1;

    const rows = milestones.map((m, i) => {
        const amount = parseFloat(String(m.amount));
        const pct = barTotal > 0 ? Math.round((amount / barTotal) * 100) : 0;
        const color = MILESTONE_COLORS[i % MILESTONE_COLORS.length];
        const isPaid = m.status === "PAID";
        const dueDate = new Date(m.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        return { ...m, amount, pct, color, isPaid, dueDate };
    });

    return (
        <RevealBox>
            <Box sx={{ ...cardSx, p: 0, overflow: "hidden" }}>
                {/* ── Header ── */}
                <Box sx={{ px: { xs: 2.5, md: 3 }, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <Box sx={{
                            width: 34, height: 34, borderRadius: "50%",
                            bgcolor: alpha(colors.accent, 0.12),
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <WalletIcon sx={{ fontSize: 17, color: colors.accent }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
                                Payment Plan
                            </Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: colors.muted }}>
                                {rows.length} {rows.length === 1 ? "payment" : "payments"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* ── Stacked bar ── */}
                    <Box sx={{ display: "flex", gap: "3px", height: 6, borderRadius: 3, overflow: "hidden", bgcolor: alpha(colors.muted, 0.08), mb: 1.5 }}>
                        {rows.map((r, i) => (
                            <Tooltip key={i} title={`${r.label}: ${formatCurrency(r.amount, currency)} (${r.pct}%)`} arrow placement="top">
                                <Box sx={{
                                    flex: r.amount / barTotal,
                                    bgcolor: r.isPaid ? "#22c55e" : r.color,
                                    borderRadius: 1, minWidth: 4,
                                    transition: "flex 0.3s",
                                    opacity: r.isPaid ? 0.9 : 1,
                                }} />
                            </Tooltip>
                        ))}
                    </Box>

                    {/* ── Legend dots ── */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, rowGap: 0.5, mb: 2 }}>
                        {rows.map((r, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: r.isPaid ? "#22c55e" : r.color, flexShrink: 0 }} />
                                <Typography sx={{ fontSize: "0.62rem", color: colors.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{r.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* ── Milestone cards ── */}
                <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 2.5 }}>
                    <Stack spacing={0.75}>
                        {rows.map((r, i) => (
                            <Box key={i} sx={{
                                display: "flex", alignItems: "center", gap: 1.2,
                                py: 0.75, px: 1.25,
                                borderRadius: "10px",
                                bgcolor: alpha(r.isPaid ? "#22c55e" : r.color, 0.06),
                                borderLeft: `3px solid ${r.isPaid ? "#22c55e" : r.color}`,
                            }}>
                                {/* Mini progress bar */}
                                <Box sx={{ width: 32, flexShrink: 0 }}>
                                    <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(r.color, 0.15), overflow: "hidden" }}>
                                        <Box sx={{ width: `${r.pct}%`, height: "100%", bgcolor: r.isPaid ? "#22c55e" : r.color, borderRadius: 2 }} />
                                    </Box>
                                </Box>
                                {/* Label & date */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: colors.text, lineHeight: 1.25 }}>
                                        {r.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.64rem", color: alpha(colors.muted, 0.8), lineHeight: 1.25, mt: 0.15 }}>
                                        {r.isPaid ? "Paid" : `Due ${r.dueDate}`}
                                    </Typography>
                                </Box>
                                {/* Amount */}
                                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                    <Typography sx={{
                                        fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace", lineHeight: 1.2,
                                        color: r.isPaid ? "#22c55e" : r.color,
                                    }}>
                                        {formatCurrency(r.amount, currency)}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.58rem", color: alpha(colors.muted, 0.65), lineHeight: 1.2 }}>
                                        ({r.pct}%)
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Box>
        </RevealBox>
    );
}
