import React, { useState } from "react";
import { Box, Typography, Tooltip, Collapse, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Receipt as ReceiptIcon,
    ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import type { PortalDashboardColors } from "@/features/workflow/proposals/utils/portal/themes";
import { formatCurrency } from "@/features/workflow/proposals/utils/portal/formatting";
import { computeLineTotal, computeTaxBreakdown } from "@/shared/utils/pricing";
import type { QuoteData } from "./payments-helpers";

const CATEGORY_COLORS: Record<string, string> = {
    Coverage: "#648CFF",
    Planning: "#a855f7",
    "Post-Production": "#f97316",
    Travel: "#06b6d4",
    Equipment: "#10b981",
    Discount: "#ef4444",
    Other: "#94a3b8",
};
function getCatColor(raw: string): string {
    const key = raw.startsWith("Post-Production") ? "Post-Production" : raw;
    return CATEGORY_COLORS[key] ?? "#94a3b8";
}

interface QuoteSummaryCardProps {
    quote: QuoteData;
    currency: string;
    colors: PortalDashboardColors;
}

export function QuoteSummaryCard({ quote, currency, colors }: QuoteSummaryCardProps) {
    const [expanded, setExpanded] = useState(false);

    const grouped: Record<string, typeof quote.items> = {};
    for (const item of quote.items) {
        const cat = item.category ?? "Services";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    }

    const subtotal = quote.items.reduce(
        (s, i) => s + computeLineTotal(i.quantity, i.unit_price), 0,
    );
    const taxRate = quote.tax_rate ? parseFloat(String(quote.tax_rate)) : 0;
    const { taxAmount, total: grandTotal } = computeTaxBreakdown(subtotal, taxRate);

    const catTotals: Record<string, number> = {};
    for (const [cat, items] of Object.entries(grouped)) {
        const key = cat.startsWith("Post-Production") ? "Post-Production" : cat;
        catTotals[key] = (catTotals[key] ?? 0) + items.reduce(
            (s, i) => s + computeLineTotal(i.quantity, i.unit_price), 0,
        );
    }
    const barTotal = (subtotal + taxAmount) || 1;

    return (
        <Box sx={{
            mb: 4, borderRadius: "20px", overflow: "hidden",
            bgcolor: alpha(colors.card, 0.7), backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(colors.border, 0.3)}`,
        }}>
            {/* Header */}
            <Box
                onClick={() => setExpanded(prev => !prev)}
                sx={{
                    px: 3, py: 2, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    "&:hover": { bgcolor: alpha(colors.border, 0.04) },
                    transition: "background 0.2s",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{
                        width: 34, height: 34, borderRadius: "50%",
                        bgcolor: alpha(colors.accent, 0.12),
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <ReceiptIcon sx={{ fontSize: 17, color: colors.accent }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: colors.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            What You&#39;re Paying For
                        </Typography>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: colors.text, mt: 0.25 }}>
                            {quote.title ?? quote.quote_number}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: colors.accent, fontFamily: "monospace" }}>
                        {formatCurrency(grandTotal, currency)}
                    </Typography>
                    <IconButton size="small" sx={{ color: colors.muted }}>
                        <ExpandMoreIcon sx={{
                            fontSize: 20, transition: "transform 0.3s",
                            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                        }} />
                    </IconButton>
                </Box>
            </Box>

            {/* Category breakdown bar — always visible */}
            <Box sx={{ px: 3, pb: 2 }}>
                <Box sx={{
                    display: "flex", gap: "3px", mb: 1, height: 5,
                    borderRadius: 2, overflow: "hidden",
                    bgcolor: alpha(colors.muted, 0.08),
                }}>
                    {Object.entries(catTotals).map(([cat, total]) => (
                        <Tooltip key={cat} title={`${cat}: ${formatCurrency(total, currency)}`} arrow placement="top">
                            <Box sx={{
                                flex: total / barTotal, bgcolor: getCatColor(cat),
                                borderRadius: 1, minWidth: 4, transition: "flex 0.3s",
                            }} />
                        </Tooltip>
                    ))}
                    {taxAmount > 0 && (
                        <Tooltip title={`Tax (${taxRate}%): ${formatCurrency(taxAmount, currency)}`} arrow placement="top">
                            <Box sx={{
                                flex: taxAmount / barTotal, bgcolor: "#f59e0b",
                                borderRadius: 1, minWidth: 4, transition: "flex 0.3s", opacity: 0.7,
                            }} />
                        </Tooltip>
                    )}
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, rowGap: 0.5 }}>
                    {Object.entries(catTotals).map(([cat, total]) => (
                        <Box key={cat} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: getCatColor(cat), flexShrink: 0 }} />
                            <Typography sx={{ fontSize: "0.64rem", fontWeight: 600, color: colors.muted, whiteSpace: "nowrap" }}>{cat}</Typography>
                            <Typography sx={{ fontSize: "0.64rem", fontWeight: 700, color: alpha(colors.text, 0.65), fontFamily: "monospace" }}>
                                {formatCurrency(total, currency)}
                            </Typography>
                        </Box>
                    ))}
                    {taxAmount > 0 && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#f59e0b", flexShrink: 0, opacity: 0.7 }} />
                            <Typography sx={{ fontSize: "0.64rem", fontWeight: 600, color: colors.muted }}>Tax ({taxRate}%)</Typography>
                            <Typography sx={{ fontSize: "0.64rem", fontWeight: 700, color: alpha(colors.text, 0.65), fontFamily: "monospace" }}>
                                {formatCurrency(taxAmount, currency)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Expandable line items */}
            <Collapse in={expanded}>
                <Box sx={{ borderTop: `1px solid ${alpha(colors.border, 0.1)}`, px: 3, py: 2 }}>
                    {Object.keys(grouped).map((cat, ci, arr) => {
                        const catColor = getCatColor(cat);
                        const catTotal = grouped[cat].reduce(
                            (s, i) => s + computeLineTotal(i.quantity, i.unit_price), 0,
                        );
                        return (
                            <Box key={cat} sx={{ mb: ci < arr.length - 1 ? 2 : 0 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75, pl: 0.5 }}>
                                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: catColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        {cat}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: catColor, fontFamily: "monospace" }}>
                                        {formatCurrency(catTotal, currency)}
                                    </Typography>
                                </Box>
                                {grouped[cat].map((item, i) => {
                                    const lineTotal = computeLineTotal(item.quantity, item.unit_price);
                                    return (
                                        <Box key={item.id ?? i} sx={{
                                            display: "flex", alignItems: "center", gap: 2,
                                            py: 0.6, px: 0.5,
                                            borderLeft: `2px solid ${alpha(catColor, 0.2)}`,
                                        }}>
                                            <Typography sx={{ flex: 1, fontSize: "0.8rem", color: colors.text, minWidth: 0 }}>
                                                {item.description}
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.72rem", color: colors.muted, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                                                {formatCurrency(parseFloat(String(item.unit_price)), currency)} × {parseFloat(String(item.quantity))}
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, fontFamily: "monospace", color: colors.text, minWidth: 70, textAlign: "right" }}>
                                                {formatCurrency(lineTotal, currency)}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}

                    {/* Footer totals */}
                    <Box sx={{
                        mt: 2, pt: 1.5,
                        borderTop: `1px solid ${alpha(colors.border, 0.1)}`,
                        display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5,
                    }}>
                        {taxRate > 0 && (
                            <Typography sx={{ fontSize: "0.7rem", color: colors.muted, fontFamily: "monospace" }}>
                                {formatCurrency(subtotal, currency)} + {taxRate}% tax
                            </Typography>
                        )}
                        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", fontFamily: "monospace", color: colors.accent }}>
                            {formatCurrency(grandTotal, currency)}
                        </Typography>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
