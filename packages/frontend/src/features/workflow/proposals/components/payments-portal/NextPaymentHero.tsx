import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { Payment as PaymentIcon } from "@mui/icons-material";
import type { PortalDashboardColors } from "@/features/workflow/proposals/utils/portal/themes";
import { useReveal, revealSx } from "@/features/workflow/proposals/utils/portal/animations";
import { formatDate, formatCurrency, getDaysUntil } from "@/features/workflow/proposals/utils/portal/formatting";
import type { InvoiceData, BrandData } from "./payments-helpers";
import { getUrgencyLabel } from "./payments-helpers";

const pulseRing = keyframes`
    0%   { transform: scale(0.9); opacity: 0.6; }
    50%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.6; }
`;

export function NextPaymentHero({
    invoice, currency, colors, onPayNow,
}: {
    invoice: InvoiceData; currency: string;
    colors: PortalDashboardColors; onPayNow: (inv: InvoiceData) => void;
}) {
    const r = useReveal();
    const balance = Number(invoice.total_amount) - Number(invoice.amount_paid ?? 0);
    const urgency = getUrgencyLabel(invoice.due_date);
    const isOverdue = invoice.status === "Overdue";

    return (
        <Box ref={r.ref} sx={{ ...revealSx(r.visible, 0.05), mb: 4 }}>
            <Box sx={{
                p: 3, borderRadius: "20px",
                position: "relative", overflow: "hidden",
                background: isOverdue
                    ? `linear-gradient(135deg, ${alpha("#ef4444", 0.08)}, ${alpha("#f59e0b", 0.04)})`
                    : `linear-gradient(135deg, ${alpha("#ec4899", 0.06)}, ${alpha("#8b5cf6", 0.04)})`,
                border: `1px solid ${alpha(isOverdue ? "#ef4444" : "#ec4899", 0.2)}`,
            }}>
                <Box sx={{
                    position: "absolute", right: -20, top: -20,
                    width: 120, height: 120, borderRadius: "50%",
                    border: `2px solid ${alpha(isOverdue ? "#ef4444" : "#ec4899", 0.1)}`,
                    animation: `${pulseRing} 3s ease-in-out infinite`,
                }} />

                <Typography sx={{
                    color: colors.muted, fontSize: "0.62rem", fontWeight: 700,
                    letterSpacing: "0.14em", textTransform: "uppercase", mb: 1,
                }}>
                    {isOverdue ? "Action Required" : "Next Payment"}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
                    <Box>
                        <Typography sx={{ color: colors.text, fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.2 }}>
                            {formatCurrency(balance, currency)}
                        </Typography>
                        <Typography sx={{ color: colors.muted, fontSize: "0.82rem", mt: 0.5 }}>
                            {invoice.title || invoice.milestone?.label || invoice.invoice_number}
                        </Typography>
                        {urgency && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75 }}>
                                {urgency.urgent && <Box sx={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    bgcolor: urgency.color,
                                    animation: `${pulseRing} 1.5s ease-in-out infinite`,
                                }} />}
                                <Typography sx={{ color: urgency.color, fontSize: "0.75rem", fontWeight: 600 }}>
                                    {urgency.text}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
                        onClick={() => onPayNow(invoice)}
                        sx={{
                            textTransform: "none", fontWeight: 700,
                            fontSize: "0.88rem", px: 3, py: 1.25,
                            borderRadius: "12px",
                            background: isOverdue
                                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                                : "linear-gradient(135deg, #ec4899, #8b5cf6)",
                            boxShadow: `0 4px 20px ${alpha(isOverdue ? "#ef4444" : "#ec4899", 0.3)}`,
                            "&:hover": { boxShadow: `0 6px 28px ${alpha(isOverdue ? "#ef4444" : "#ec4899", 0.45)}` },
                        }}
                    >
                        Pay Now
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
