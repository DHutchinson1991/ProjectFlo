import React from "react";
import {
    Box, Typography, Divider, Chip, Button,
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    Payment as PaymentIcon,
    FileDownload as DownloadIcon,
    OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import type { PortalDashboardColors } from "@/features/workflow/proposals/utils/portal/themes";
import { formatDate, formatCurrency } from "@/features/workflow/proposals/utils/portal/formatting";
import type { InvoiceData } from "./payments-helpers";
import { getStatusColor, getStatusIcon, getPaymentMethodIcon, getUrgencyLabel } from "./payments-helpers";

const CATEGORY_COLORS: Record<string, string> = {
    Coverage: "#648CFF",
    Planning: "#a855f7",
    "Post-Production": "#f97316",
    Travel: "#06b6d4",
    Equipment: "#10b981",
    Discount: "#ef4444",
    Services: "#94a3b8",
    Other: "#94a3b8",
};
function getCatColor(raw: string): string {
    const key = raw.startsWith("Post-Production") ? "Post-Production" : raw;
    return CATEGORY_COLORS[key] ?? "#94a3b8";
}

const pulseRing = keyframes`
    0%   { transform: scale(0.9); opacity: 0.6; }
    50%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.6; }
`;

export function PaymentsInvoiceCard({
    inv, currency, colors, onPayNow,
}: {
    inv: InvoiceData; currency: string;
    colors: PortalDashboardColors; onPayNow: (inv: InvoiceData) => void;
}) {
    const isPaid = inv.status === "Paid";
    const isDraft = inv.status === "Draft";
    const isOverdue = inv.status === "Overdue";
    const invSubtotal = Number(inv.subtotal ?? inv.total_amount);
    const invTaxRate = Number(inv.tax_rate ?? 0);
    const invTax = invSubtotal * (invTaxRate / 100);
    const invTotal = Number(inv.total_amount);
    const invPaid = Number(inv.amount_paid ?? 0);
    const invBalance = invTotal - invPaid;
    const statusColor = getStatusColor(inv.status, colors);
    const urgency = getUrgencyLabel(inv.due_date);

    return (
        <Box sx={{
            borderRadius: "16px", overflow: "hidden",
            bgcolor: alpha(colors.card, 0.7), backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(colors.border, isDraft ? 0.4 : 0.3)}`,
            ...(isDraft && { borderStyle: "dashed" }),
            transition: "all 0.3s ease",
            "&:hover": { borderColor: alpha(statusColor, 0.3), boxShadow: `0 8px 32px ${alpha(statusColor, 0.06)}` },
        }}>
            {/* Urgency banner */}
            {(isOverdue || (urgency?.urgent && !isPaid && !isDraft)) && (
                <Box sx={{
                    px: 3, py: 0.75,
                    bgcolor: alpha(isOverdue ? "#ef4444" : "#f59e0b", 0.08),
                    borderBottom: `1px solid ${alpha(isOverdue ? "#ef4444" : "#f59e0b", 0.15)}`,
                    display: "flex", alignItems: "center", gap: 1,
                }}>
                    <Box sx={{
                        width: 6, height: 6, borderRadius: "50%",
                        bgcolor: isOverdue ? "#ef4444" : "#f59e0b",
                        animation: `${pulseRing} 1.5s ease-in-out infinite`,
                    }} />
                    <Typography sx={{ color: isOverdue ? "#ef4444" : "#f59e0b", fontSize: "0.7rem", fontWeight: 700 }}>
                        {urgency?.text || "Overdue"}
                    </Typography>
                </Box>
            )}

            {/* Header */}
            <InvoiceCardHeader inv={inv} colors={colors} statusColor={statusColor} />

            {/* Line Items */}
            {inv.items.length > 0 && <InvoiceLineItems items={inv.items} taxRate={invTaxRate} taxAmount={invTax} currency={currency} colors={colors} />}

            {/* Totals */}
            <InvoiceTotals
                invSubtotal={invSubtotal} invTaxRate={invTaxRate} invTax={invTax}
                invTotal={invTotal} invPaid={invPaid} invBalance={invBalance}
                isPaid={isPaid} currency={currency} dueDate={inv.due_date} colors={colors}
            />

            {/* Payment History */}
            {inv.payments.length > 0 && <PaymentHistory payments={inv.payments} currency={currency} colors={colors} />}

            {/* Notes */}
            {inv.notes && (
                <Box sx={{ px: 3, pb: 2 }}>
                    <Typography sx={{ color: colors.muted, fontSize: "0.78rem", fontStyle: "italic", lineHeight: 1.6 }}>{inv.notes}</Typography>
                </Box>
            )}

            {/* Actions */}
            <Box sx={{
                px: 3, py: 1.5, display: "flex", justifyContent: "flex-end", gap: 1,
                borderTop: `1px solid ${alpha(colors.border, 0.06)}`,
            }}>
                <Button size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={() => window.print()}
                    sx={{ color: colors.muted, fontSize: "0.7rem", fontWeight: 600, textTransform: "none", borderRadius: "8px",
                        "&:hover": { color: colors.text, bgcolor: alpha(colors.border, 0.06) } }}>
                    Print
                </Button>
                {!isPaid && !isDraft && (
                    <Button size="small" variant="contained" startIcon={<PaymentIcon sx={{ fontSize: 14 }} />}
                        onClick={() => onPayNow(inv)}
                        sx={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "none", borderRadius: "8px",
                            background: "linear-gradient(135deg, #ec4899, #8b5cf6)", px: 2,
                            "&:hover": { boxShadow: `0 3px 12px ${alpha("#ec4899", 0.3)}` } }}>
                        Pay Now
                    </Button>
                )}
            </Box>
        </Box>
    );
}

/* ── Sub-components ────────────────────────────────────────── */

function InvoiceCardHeader({ inv, colors, statusColor }: { inv: InvoiceData; colors: PortalDashboardColors; statusColor: string }) {
    const isPaid = inv.status === "Paid";
    const isDraft = inv.status === "Draft";
    return (
        <Box sx={{
            px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center",
            bgcolor: isPaid ? alpha(colors.green, 0.04) : isDraft ? alpha("#64748b", 0.04) : alpha(colors.border, 0.04),
            borderBottom: `1px solid ${alpha(colors.border, 0.1)}`,
        }}>
            <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ color: colors.text, fontSize: "1rem", fontWeight: 700 }}>
                        {inv.title || inv.milestone?.label || inv.invoice_number}
                    </Typography>
                    {isDraft && (
                        <Chip label="PREVIEW" size="small" sx={{
                            height: 20, fontSize: "0.55rem", fontWeight: 800,
                            bgcolor: alpha("#64748b", 0.15), color: "#94a3b8", letterSpacing: "0.05em",
                        }} />
                    )}
                </Box>
                <Typography sx={{ color: colors.muted, fontSize: "0.75rem", mt: 0.25 }}>
                    {inv.invoice_number} · {inv.issued_date ? `Issued ${formatDate(inv.issued_date)}` : "Not yet issued"}
                </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {getStatusIcon(inv.status)}
                <Chip label={isDraft ? "DRAFT" : isPaid ? "PAID" : inv.status.toUpperCase()} size="small"
                    sx={{ height: 24, fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.05em",
                        bgcolor: alpha(statusColor, 0.12), color: statusColor }} />
            </Box>
        </Box>
    );
}

function InvoiceLineItems({ items, taxRate, taxAmount, currency, colors }: { items: InvoiceData["items"]; taxRate: number; taxAmount: number; currency: string; colors: PortalDashboardColors }) {
    return (
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
            <Typography sx={{ color: colors.muted, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1.5 }}>
                Breakdown
            </Typography>
            {items.map((item, idx) => {
                const price = Number(item.unit_price);
                const catColor = getCatColor(item.category || item.description);
                return (
                    <Box key={idx} sx={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        py: 0.75, px: 1,
                        borderLeft: `3px solid ${alpha(catColor, 0.5)}`,
                        mb: 0.75,
                        borderRadius: "0 6px 6px 0",
                        bgcolor: alpha(catColor, 0.03),
                        transition: "background 0.2s",
                        "&:hover": { bgcolor: alpha(catColor, 0.06) },
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: catColor, flexShrink: 0 }} />
                            <Typography sx={{ color: colors.text, fontSize: "0.82rem", fontWeight: 600 }}>
                                {item.category || item.description}
                            </Typography>
                        </Box>
                        <Typography sx={{ color: colors.text, fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace" }}>
                            {formatCurrency(price, currency)}
                        </Typography>
                    </Box>
                );
            })}
            {taxRate > 0 && (
                <Box sx={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    py: 0.75, px: 1,
                    borderLeft: `3px solid ${alpha("#f59e0b", 0.5)}`,
                    borderRadius: "0 6px 6px 0",
                    bgcolor: alpha("#f59e0b", 0.03),
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#f59e0b", flexShrink: 0, opacity: 0.7 }} />
                        <Typography sx={{ color: colors.muted, fontSize: "0.82rem", fontWeight: 600 }}>
                            Tax ({taxRate}%)
                        </Typography>
                    </Box>
                    <Typography sx={{ color: colors.muted, fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace" }}>
                        {formatCurrency(taxAmount, currency)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

function InvoiceTotals({ invSubtotal, invTaxRate, invTax, invTotal, invPaid, invBalance, isPaid, currency, dueDate, colors }: {
    invSubtotal: number; invTaxRate: number; invTax: number; invTotal: number; invPaid: number; invBalance: number;
    isPaid: boolean; currency: string; dueDate: string | null; colors: PortalDashboardColors;
}) {
    return (
        <Box sx={{ px: 3, py: 2 }}>
            <Divider sx={{ borderColor: alpha(colors.border, 0.1), mb: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Box sx={{ width: 260 }}>
                    <TotalRow label="Subtotal" value={formatCurrency(invSubtotal, currency)} colors={colors} />
                    {invTaxRate > 0 && <TotalRow label={`Tax (${invTaxRate}%)`} value={formatCurrency(invTax, currency)} colors={colors} />}
                    {invPaid > 0 && !isPaid && <TotalRow label="Paid" value={`-${formatCurrency(invPaid, currency)}`} colors={colors} color={colors.green} />}
                    <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, mt: 0.5, borderTop: `2px solid ${alpha(colors.border, 0.15)}` }}>
                        <Typography sx={{ color: colors.text, fontSize: "0.95rem", fontWeight: 700 }}>
                            {isPaid ? "Total Paid" : "Balance Due"}
                        </Typography>
                        <Typography sx={{ color: isPaid ? colors.green : "#ec4899", fontSize: "1.1rem", fontWeight: 800 }}>
                            {formatCurrency(isPaid ? invTotal : invBalance, currency)}
                        </Typography>
                    </Box>
                    {!isPaid && dueDate && (
                        <Typography sx={{ color: colors.muted, fontSize: "0.68rem", textAlign: "right", mt: 0.5 }}>Due {formatDate(dueDate)}</Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

function TotalRow({ label, value, colors, color }: { label: string; value: string; colors: PortalDashboardColors; color?: string }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ color: color || colors.muted, fontSize: "0.78rem" }}>{label}</Typography>
            <Typography sx={{ color: color || colors.text, fontSize: "0.78rem", fontWeight: 600 }}>{value}</Typography>
        </Box>
    );
}

function PaymentHistory({ payments, currency, colors }: { payments: InvoiceData["payments"]; currency: string; colors: PortalDashboardColors }) {
    const getMethodLabel = (payment: InvoiceData["payments"][number]) => {
        if (!payment.payment_method) return null;
        if (payment.payment_method.toLowerCase() !== "stripe") return payment.payment_method;
        if (payment.card_brand && payment.card_last4) {
            const brand = payment.card_brand.charAt(0).toUpperCase() + payment.card_brand.slice(1);
            return `${brand} •••• ${payment.card_last4}`;
        }
        if (payment.card_brand) {
            return payment.card_brand.charAt(0).toUpperCase() + payment.card_brand.slice(1);
        }
        return "Stripe";
    };

    return (
        <Box sx={{ px: 3, pb: 2 }}>
            <Typography sx={{ color: colors.muted, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1 }}>
                Payment History
            </Typography>
            {payments.map((p) => (
                <Box key={p.id} sx={{
                    display: "flex", justifyContent: "space-between", px: 2, py: 1,
                    borderRadius: "10px", mb: 0.5,
                    bgcolor: alpha(colors.green, 0.04),
                    border: `1px solid ${alpha(colors.green, 0.08)}`,
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 14, color: colors.green }} />
                        <Typography sx={{ color: colors.muted, fontSize: "0.78rem" }}>{formatDate(p.payment_date)}</Typography>
                        {getMethodLabel(p) && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: colors.muted }}>
                                {getPaymentMethodIcon(p.payment_method)}
                                <Typography sx={{ fontSize: "0.72rem" }}>{getMethodLabel(p)}</Typography>
                            </Box>
                        )}
                        {p.payer_email && (
                            <Typography sx={{ color: alpha(colors.muted, 0.85), fontSize: "0.68rem" }}>
                                · {p.payer_email}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {p.receipt_url && (
                            <Button
                                component="a"
                                href={p.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                startIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                sx={{
                                    color: colors.muted,
                                    fontSize: "0.66rem",
                                    textTransform: "none",
                                    minWidth: 0,
                                    px: 0.8,
                                    "&:hover": { color: colors.text, bgcolor: alpha(colors.border, 0.08) },
                                }}
                            >
                                Receipt
                            </Button>
                        )}
                        <Typography sx={{ color: colors.green, fontSize: "0.78rem", fontWeight: 600 }}>{formatCurrency(p.amount, currency)}</Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}
