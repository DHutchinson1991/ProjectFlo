import React from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    AccountBalance as BankIcon,
    CreditCard as CardIcon,
    AttachMoney as CashIcon,
    Link as LinkIcon,
} from "@mui/icons-material";
import { clientPortalApi } from "@/features/workflow/client-portal/api";
import { AcceptedPaymentMethods } from "@/features/finance/stripe/components/AcceptedPaymentMethods";
import { fadeInUp } from "@/features/workflow/proposals/utils/portal/animations";
import { formatCurrency } from "@/features/workflow/proposals/utils/portal/formatting";
import type { PortalDashboardColors } from "@/features/workflow/proposals/utils/portal/themes";
import type { InvoiceData, BrandData, PaymentMethodData } from "./payments-helpers";
import { getPaymentMethodIcon } from "./payments-helpers";

function getMethodTypeIcon(type: PaymentMethodData["type"]) {
    switch (type) {
        case "BANK_TRANSFER": return <BankIcon sx={{ fontSize: 18 }} />;
        case "CREDIT_CARD": return <CardIcon sx={{ fontSize: 18 }} />;
        case "CASH": return <CashIcon sx={{ fontSize: 18 }} />;
        case "STRIPE": return <LinkIcon sx={{ fontSize: 18 }} />;
    }
}

export function PayNowDrawer({
    invoice, brand, paymentMethods, portalToken, currency, colors, onClose,
}: {
    invoice: InvoiceData; brand: BrandData | null;
    paymentMethods: PaymentMethodData[];
    portalToken: string;
    currency: string; colors: PortalDashboardColors; onClose: () => void;
}) {
    const balance = Number(invoice.total_amount) - Number(invoice.amount_paid ?? 0);
    const hasPaymentMethods = paymentMethods.length > 0;

    // Fallback to legacy brand-level fields when no payment methods are configured
    const legacyMethod = invoice.payment_method || brand?.default_payment_method;

    return (
        <Box sx={{
            mb: 3, p: 3, borderRadius: "16px",
            bgcolor: alpha(colors.card, 0.8), backdropFilter: "blur(20px)",
            border: `1px solid ${alpha("#ec4899", 0.25)}`,
            animation: `${fadeInUp} 0.3s ease forwards`,
        }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ color: colors.text, fontSize: "1rem", fontWeight: 700 }}>
                    Payment Instructions
                </Typography>
                <Button size="small" onClick={onClose}
                    sx={{ color: colors.muted, fontSize: "0.72rem", textTransform: "none", minWidth: 0 }}>
                    Close
                </Button>
            </Box>

            <Box sx={{
                p: 2, mb: 2, borderRadius: "12px",
                bgcolor: alpha("#ec4899", 0.04),
                border: `1px solid ${alpha("#ec4899", 0.12)}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <Box>
                    <Typography sx={{ color: colors.muted, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Amount Due
                    </Typography>
                    <Typography sx={{ color: "#ec4899", fontSize: "1.25rem", fontWeight: 800 }}>
                        {formatCurrency(balance, currency)}
                    </Typography>
                </Box>
                <Typography sx={{ color: colors.muted, fontSize: "0.75rem" }}>Ref: {invoice.invoice_number}</Typography>
            </Box>

            {/* ── Dynamic payment methods ── */}
            {hasPaymentMethods ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {paymentMethods.map((pm) => (
                        <PaymentMethodCard key={pm.id} method={pm} invoice={invoice} portalToken={portalToken} currency={currency} colors={colors} />
                    ))}
                </Box>
            ) : (
                /* ── Legacy fallback: brand-level bank details ── */
                <>
                    {legacyMethod && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            {getPaymentMethodIcon(legacyMethod)}
                            <Typography sx={{ color: colors.text, fontSize: "0.85rem", fontWeight: 600 }}>{legacyMethod}</Typography>
                        </Box>
                    )}

                    {brand?.bank_name && (
                        <Box sx={{
                            p: 2, borderRadius: "12px",
                            bgcolor: alpha(colors.border, 0.04),
                            border: `1px solid ${alpha(colors.border, 0.08)}`,
                        }}>
                            <Typography sx={{ color: colors.muted, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 1 }}>
                                Bank Transfer Details
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                                {brand.bank_name && <DetailField label="Bank" value={brand.bank_name} colors={colors} />}
                                {brand.bank_account_name && <DetailField label="Account Name" value={brand.bank_account_name} colors={colors} />}
                                {brand.bank_sort_code && <DetailField label="Sort Code" value={brand.bank_sort_code} colors={colors} />}
                                {brand.bank_account_number && <DetailField label="Account Number" value={brand.bank_account_number} colors={colors} />}
                            </Box>
                            <ReferenceHint invoiceNumber={invoice.invoice_number} colors={colors} />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}

// ── Per-method card renderer ──

function PaymentMethodCard({
    method, invoice, portalToken, currency, colors,
}: {
    method: PaymentMethodData; invoice: InvoiceData;
    portalToken: string;
    currency: string; colors: PortalDashboardColors;
}) {
    const cfg = (method.config || {}) as Record<string, string>;
    const [checkoutLoading, setCheckoutLoading] = React.useState(false);

    const handleStripeCheckout = async () => {
        setCheckoutLoading(true);
        try {
            const { checkout_url } = await clientPortalApi.createCheckoutSession(invoice.id, portalToken);
            window.location.href = checkout_url;
        } catch {
            setCheckoutLoading(false);
        }
    };

    return (
        <Box sx={{
            p: 2, borderRadius: "12px",
            bgcolor: alpha(colors.border, 0.04),
            border: `1px solid ${alpha(colors.border, method.is_default ? 0.2 : 0.08)}`,
        }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ color: method.is_default ? "#ec4899" : colors.muted }}>
                    {getMethodTypeIcon(method.type)}
                </Box>
                <Typography sx={{ color: colors.text, fontSize: "0.85rem", fontWeight: 600 }}>
                    {method.label}
                </Typography>
                {method.is_default && (
                    <Box sx={{
                        px: 1, py: 0.2, borderRadius: "6px",
                        bgcolor: alpha("#ec4899", 0.1),
                        border: `1px solid ${alpha("#ec4899", 0.2)}`,
                    }}>
                        <Typography sx={{ color: "#ec4899", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Recommended
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Type-specific details */}
            {method.type === "BANK_TRANSFER" && cfg.bank_name && (
                <>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 1.5 }}>
                        {cfg.bank_name && <DetailField label="Bank" value={cfg.bank_name} colors={colors} />}
                        {cfg.account_name && <DetailField label="Account Name" value={cfg.account_name} colors={colors} />}
                        {cfg.sort_code && <DetailField label="Sort Code" value={cfg.sort_code} colors={colors} />}
                        {cfg.account_number && <DetailField label="Account Number" value={cfg.account_number} colors={colors} />}
                        {cfg.iban && <DetailField label="IBAN" value={cfg.iban} colors={colors} />}
                        {cfg.swift && <DetailField label="SWIFT/BIC" value={cfg.swift} colors={colors} />}
                    </Box>
                    <ReferenceHint invoiceNumber={invoice.invoice_number} colors={colors} />
                </>
            )}

            {method.type === "STRIPE" && (
                <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Button
                        variant="contained"
                        onClick={handleStripeCheckout}
                        disabled={checkoutLoading}
                        disableElevation
                        sx={{
                            textTransform: "none", fontWeight: 700, borderRadius: "10px",
                            bgcolor: "#635bff", "&:hover": { bgcolor: "#4f46e5" },
                            fontSize: "0.85rem", px: 3, py: 1,
                        }}
                    >
                        {checkoutLoading ? (
                            <CircularProgress size={18} sx={{ color: "#fff", mr: 1 }} />
                        ) : null}
                        {checkoutLoading ? "Redirecting…" : "Pay with Stripe"}
                    </Button>
                    <AcceptedPaymentMethods labelColor={colors.muted} size={26} />
                </Box>
            )}

            {/* Instructions (all types) */}
            {method.instructions && (
                <Typography sx={{ color: colors.muted, fontSize: "0.78rem", mt: 1, lineHeight: 1.5 }}>
                    {method.instructions}
                </Typography>
            )}
        </Box>
    );
}

function DetailField({ label, value, colors }: { label: string; value: string; colors: PortalDashboardColors }) {
    return (
        <Box>
            <Typography sx={{ color: colors.muted, fontSize: "0.65rem" }}>{label}</Typography>
            <Typography sx={{ color: colors.text, fontSize: "0.82rem", fontWeight: 600 }}>{value}</Typography>
        </Box>
    );
}

function ReferenceHint({ invoiceNumber, colors }: { invoiceNumber: string; colors: PortalDashboardColors }) {
    return (
        <Box sx={{
            mt: 1.5, p: 1.5, borderRadius: "8px",
            bgcolor: alpha("#f59e0b", 0.06),
            border: `1px solid ${alpha("#f59e0b", 0.12)}`,
        }}>
            <Typography sx={{ color: "#f59e0b", fontSize: "0.72rem", fontWeight: 600 }}>
                Please use &quot;{invoiceNumber}&quot; as the payment reference
            </Typography>
        </Box>
    );
}
