"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, Chip, CircularProgress, Button, Tabs, Tab, Collapse } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    ArrowBack as ArrowBackIcon,
    Warning as WarningIcon,
    Print as PrintIcon,
    AccountBalance as BankIcon,
    Payment as PaymentIcon,
    ContentCopy as CopyIcon,
} from "@mui/icons-material";

import { clientPortalApi } from "@/features/workflow/client-portal/api";
import { fadeInUp } from "@/features/workflow/proposals/utils/portal/animations";
import { getPortalDashboardColors } from "@/features/workflow/proposals/utils/portal/themes";
import { formatDate, formatCurrency } from "@/features/workflow/proposals/utils/portal/formatting";
import { DEFAULT_CURRENCY } from "@projectflo/shared";

import { AcceptedPaymentMethods } from "@/features/finance/stripe/components/AcceptedPaymentMethods";

import type { InvoiceData, PaymentsData, BrandData, PaymentMethodData } from "../components/payments-portal/payments-helpers";
import { getStatusColor, getUrgencyLabel } from "../components/payments-portal/payments-helpers";
import { AllPaidCelebration } from "../components/payments-portal/PaymentsEmptyStates";
import { PaymentsInvoiceCard } from "../components/payments-portal/PaymentsInvoiceCard";
import { AddNoteSection } from "../components/payments-portal/AddNoteSection";
import { QuoteSummaryCard } from "../components/payments-portal/QuoteSummaryCard";

/* ================================================================== */
/* Main Component                                                      */
/* ================================================================== */

export function PaymentsPortalScreen({ token }: { token: string }) {
    const colors = getPortalDashboardColors();

    const [data, setData] = useState<PaymentsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedPayId, setExpandedPayId] = useState<number | null>(null);

    const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "true";
    const paymentStatus = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("payment") : null;
    const [showPaymentBanner, setShowPaymentBanner] = useState(!!paymentStatus);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await clientPortalApi.getPaymentsData(token, isPreview);
            setData(result as unknown as PaymentsData);
        } catch {
            setError("Could not load payment information.");
        } finally {
            setLoading(false);
        }
    }, [token, isPreview]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, fetchData]);

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={32} sx={{ color: colors.accent }} />
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ color: colors.muted, fontSize: "1rem" }}>{error || "Something went wrong."}</Typography>
            </Box>
        );
    }

    const brand = data.brand;
    const paymentMethods = data.payment_methods ?? [];
    // In preview mode, treat Draft invoices as "Sent" so the studio user
    // sees exactly what the customer will see once invoices are finalized.
    const invoices = isPreview
        ? data.invoices.map(inv => inv.status === "Draft" ? { ...inv, status: "Sent" as const } : inv)
        : data.invoices;
    const currency = brand?.currency || DEFAULT_CURRENCY;

    const totalAmount = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid ?? 0), 0);
    const progressPct = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const allPaid = invoices.length > 0 && invoices.every(i => i.status === "Paid");

    const sortedInvoices = [...invoices].sort((a, b) =>
        (a.milestone?.order_index ?? 999) - (b.milestone?.order_index ?? 999));

    const handlePayNow = (inv: InvoiceData) => {
        setExpandedPayId(prev => prev === inv.id ? null : inv.id);
    };

    const brandName = brand?.display_name || brand?.name || "your vendor";

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: colors.bg, color: colors.text }}>
            {isPreview && <PreviewBanner />}
            {showPaymentBanner && paymentStatus === "success" && (
                <PaymentSuccessBanner onClose={() => setShowPaymentBanner(false)} />
            )}
            {showPaymentBanner && paymentStatus === "cancelled" && (
                <PaymentCancelledBanner onClose={() => setShowPaymentBanner(false)} />
            )}

            <Box sx={{ px: { xs: 2.5, md: 4 }, pt: { xs: 3, md: 4 }, pb: 3, maxWidth: 900, mx: "auto" }}>
                <BackToPortalButton token={token} colors={colors} />
                <PageHeader brand={brand} contact={data.contact} eventDate={data.event_date} colors={colors} />

                {allPaid && <AllPaidCelebration colors={colors} brandName={brandName} />}

                {data.quote && (
                    <QuoteSummaryCard quote={data.quote} currency={currency} colors={colors} />
                )}

                <PaymentSchedule
                    sortedInvoices={sortedInvoices} totalAmount={totalAmount}
                    progressPct={progressPct}
                    scheduleName={data.quote?.schedule_name ?? null}
                    expandedPayId={expandedPayId} brand={brand}
                    paymentMethods={paymentMethods}
                    portalToken={token}
                    currency={currency} colors={colors}
                    onPayNow={handlePayNow} onSelectTab={setActiveTab}
                />

                <TabbedInvoiceDetail
                    sortedInvoices={sortedInvoices} activeTab={activeTab}
                    setActiveTab={setActiveTab} currency={currency}
                    colors={colors} onPayNow={handlePayNow}
                />

                <PaymentTermsSection invoices={sortedInvoices} colors={colors} />
                {paymentMethods.length === 0 && <BankDetailsSection brand={brand} colors={colors} />}
                <AddNoteSection token={token} colors={colors} />
                <Footer brand={brand} colors={colors} />
            </Box>
        </Box>
    );
}

/* ── Sub-sections (keep main screen thin) ─────────────────────────── */

function PreviewBanner() {
    return (
        <Box sx={{
            bgcolor: alpha("#f59e0b", 0.1),
            borderBottom: `1px solid ${alpha("#f59e0b", 0.2)}`,
            py: 1, px: 3,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
        }}>
            <WarningIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
            <Typography sx={{ color: "#f59e0b", fontSize: "0.78rem", fontWeight: 600 }}>
                Preview Mode — This is how your client will see this page. Draft invoices are shown as sent.
            </Typography>
        </Box>
    );
}

function PaymentSuccessBanner({ onClose }: { onClose: () => void }) {
    return (
        <Box sx={{
            bgcolor: alpha("#10b981", 0.08),
            borderBottom: `1px solid ${alpha("#10b981", 0.2)}`,
            py: 1.5, px: 3,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5,
        }}>
            <CheckCircleIcon sx={{ fontSize: 20, color: "#10b981" }} />
            <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography sx={{ color: "#10b981", fontSize: "0.85rem", fontWeight: 700 }}>
                    Payment received — thank you!
                </Typography>
                <Typography sx={{ color: alpha("#10b981", 0.7), fontSize: "0.72rem" }}>
                    A receipt has been sent to your email. Your invoice will update shortly.
                </Typography>
            </Box>
            <Typography onClick={onClose}
                sx={{ color: alpha("#10b981", 0.5), fontSize: "0.72rem", cursor: "pointer", "&:hover": { color: "#10b981" } }}>
                ✕
            </Typography>
        </Box>
    );
}

function PaymentCancelledBanner({ onClose }: { onClose: () => void }) {
    return (
        <Box sx={{
            bgcolor: alpha("#f59e0b", 0.08),
            borderBottom: `1px solid ${alpha("#f59e0b", 0.2)}`,
            py: 1.5, px: 3,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5,
        }}>
            <WarningIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
            <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography sx={{ color: "#f59e0b", fontSize: "0.85rem", fontWeight: 700 }}>
                    Payment cancelled
                </Typography>
                <Typography sx={{ color: alpha("#f59e0b", 0.7), fontSize: "0.72rem" }}>
                    No charge was made. You can try again whenever you&apos;re ready.
                </Typography>
            </Box>
            <Typography onClick={onClose}
                sx={{ color: alpha("#f59e0b", 0.5), fontSize: "0.72rem", cursor: "pointer", "&:hover": { color: "#f59e0b" } }}>
                ✕
            </Typography>
        </Box>
    );
}

function BackToPortalButton({ token, colors }: { token: string; colors: ReturnType<typeof getPortalDashboardColors> }) {
    return (
        <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => window.location.href = `/portal/${token}`}
            sx={{ color: colors.muted, fontSize: "0.78rem", fontWeight: 600, textTransform: "none", mb: 3, px: 0,
                "&:hover": { color: colors.text, bgcolor: "transparent" } }}
        >
            Back to Portal
        </Button>
    );
}

function PageHeader({ brand, contact, eventDate, colors }: {
    brand: PaymentsData["brand"]; contact: PaymentsData["contact"]; eventDate: string | null;
    colors: ReturnType<typeof getPortalDashboardColors>;
}) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
            <Box>
                {brand?.logo_url && (
                    <Box component="img" src={brand.logo_url} alt={brand.display_name || brand.name}
                        sx={{ height: 40, mb: 1.5, objectFit: "contain" }} />
                )}
                <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: colors.text,
                    letterSpacing: "-0.02em", animation: `${fadeInUp} 0.6s ease forwards` }}>
                    Payments
                </Typography>
                <Typography sx={{ color: colors.muted, fontSize: "0.85rem", mt: 0.5 }}>
                    {contact.first_name} {contact.last_name}{eventDate && ` · ${formatDate(eventDate)}`}
                </Typography>
            </Box>
            <Button startIcon={<PrintIcon sx={{ fontSize: 16 }} />} onClick={() => window.print()}
                sx={{ color: colors.muted, fontSize: "0.72rem", fontWeight: 600, textTransform: "none",
                    borderRadius: "10px", border: `1px solid ${alpha(colors.border, 0.2)}`, px: 2, py: 0.75,
                    "&:hover": { color: colors.text, borderColor: alpha(colors.border, 0.4) } }}>
                Print All
            </Button>
        </Box>
    );
}

/* ── Payment Schedule (timeline with inline Pay Now + expandable instructions) ── */

function PaymentSchedule({ sortedInvoices, totalAmount, progressPct, scheduleName, expandedPayId, brand, paymentMethods, portalToken, currency, colors, onPayNow, onSelectTab }: {
    sortedInvoices: InvoiceData[]; totalAmount: number; progressPct: number;
    scheduleName: string | null;
    expandedPayId: number | null; brand: BrandData | null;
    paymentMethods: PaymentMethodData[];
    portalToken: string;
    currency: string; colors: ReturnType<typeof getPortalDashboardColors>;
    onPayNow: (inv: InvoiceData) => void; onSelectTab: (idx: number) => void;
}) {
    if (sortedInvoices.length === 0) return null;
    return (
        <Box sx={{ mb: 4, p: 3, borderRadius: "20px", bgcolor: alpha(colors.card, 0.7),
            backdropFilter: "blur(20px)", border: `1px solid ${alpha(colors.border, 0.3)}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ color: colors.muted, fontSize: "0.65rem", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Payment Schedule
                </Typography>
                {scheduleName && (
                    <Chip label={scheduleName} size="small" sx={{
                        height: 20, fontSize: "0.6rem", fontWeight: 600,
                        bgcolor: alpha(colors.accent, 0.1), color: colors.accent,
                        border: `1px solid ${alpha(colors.accent, 0.2)}`,
                    }} />
                )}
            </Box>
            {sortedInvoices.map((inv, idx) => {
                const isPaid = inv.status === "Paid";
                const isOverdue = inv.status === "Overdue";
                const isDraft = inv.status === "Draft";
                const isCurrent = !isPaid && !isDraft && idx === sortedInvoices.findIndex(i => i.status !== "Paid" && i.status !== "Draft");
                const dotColor = isPaid ? colors.green : isOverdue ? "#ef4444" : isCurrent ? "#ec4899" : isDraft ? "#64748b" : colors.muted;
                const isLast = idx === sortedInvoices.length - 1;
                const urgency = !isPaid && !isDraft ? getUrgencyLabel(inv.due_date) : null;
                const pct = totalAmount > 0 ? Math.round((Number(inv.total_amount) / totalAmount) * 100) : 0;
                const balance = Number(inv.total_amount) - Number(inv.amount_paid ?? 0);
                const canPay = !isPaid && !isDraft;
                const isExpanded = expandedPayId === inv.id;

                return (
                    <Box key={inv.id} sx={{ display: "flex", gap: 2, mb: isLast ? 0 : 0.5 }}>
                        {/* Dot + connector */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 0.5 }}>
                            <Box sx={{
                                width: isCurrent ? 16 : 12, height: isCurrent ? 16 : 12,
                                borderRadius: "50%", flexShrink: 0,
                                bgcolor: isPaid ? dotColor : "transparent",
                                border: `2px solid ${dotColor}`,
                                ...(isDraft && { borderStyle: "dashed" }),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                ...(isCurrent && { boxShadow: `0 0 12px ${alpha("#ec4899", 0.4)}` }),
                            }}>
                                {isPaid && <CheckCircleIcon sx={{ fontSize: 8, color: colors.card }} />}
                            </Box>
                            {!isLast && (
                                <Box sx={{
                                    width: 2, flexGrow: 1, minHeight: 36,
                                    bgcolor: isPaid ? alpha(colors.green, 0.3) : alpha(colors.border, 0.15),
                                    ...(isDraft && { borderLeft: `2px dashed ${alpha("#64748b", 0.3)}`, width: 0, bgcolor: "transparent" }),
                                }} />
                            )}
                        </Box>

                        {/* Row content */}
                        <Box sx={{ flex: 1, mb: isLast ? 0 : 0.5 }}>
                            <Box
                                onClick={() => onSelectTab(idx)}
                                sx={{
                                    px: 2.5, py: 1.5,
                                    borderRadius: isExpanded ? "12px 12px 0 0" : "12px", cursor: "pointer",
                                    bgcolor: isCurrent ? alpha("#ec4899", 0.06) : isDraft ? alpha("#64748b", 0.04) : alpha(colors.card, 0.4),
                                    border: `1px solid ${isCurrent ? alpha("#ec4899", 0.2) : isDraft ? alpha("#64748b", 0.15) : alpha(colors.border, 0.15)}`,
                                    ...(isDraft && { borderStyle: "dashed" }),
                                    ...(isExpanded && { borderBottom: "none" }),
                                    transition: "all 0.2s",
                                    "&:hover": { borderColor: alpha("#ec4899", 0.3), bgcolor: alpha("#ec4899", 0.04) },
                                }}
                            >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                            <Typography sx={{ color: isDraft ? colors.muted : colors.text, fontSize: "0.88rem", fontWeight: 600 }}>
                                                {inv.title || inv.milestone?.label || inv.invoice_number}
                                            </Typography>
                                            <Chip label={`${pct}%`} size="small" sx={{
                                                height: 18, fontSize: "0.55rem", fontWeight: 700,
                                                bgcolor: alpha(isDraft ? "#64748b" : "#ec4899", 0.1),
                                                color: isDraft ? "#94a3b8" : "#ec4899",
                                            }} />
                                            {isPaid && (
                                                <Chip label="Paid" size="small" icon={<CheckCircleIcon sx={{ fontSize: "12px !important" }} />}
                                                    sx={{ height: 18, fontSize: "0.55rem", fontWeight: 700,
                                                        bgcolor: alpha(colors.green, 0.12), color: colors.green,
                                                        "& .MuiChip-icon": { color: colors.green } }} />
                                            )}
                                            {isOverdue && (
                                                <Chip label="Overdue" size="small"
                                                    sx={{ height: 18, fontSize: "0.55rem", fontWeight: 700,
                                                        bgcolor: alpha("#ef4444", 0.12), color: "#ef4444" }} />
                                            )}
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Typography sx={{ color: colors.muted, fontSize: "0.72rem" }}>
                                                {isPaid ? `Paid ${formatDate(inv.paid_date)}` : inv.due_date ? `Due ${formatDate(inv.due_date)}` : "Date pending"}
                                            </Typography>
                                            {urgency?.urgent && (
                                                <Typography sx={{ color: urgency.color, fontSize: "0.65rem", fontWeight: 700 }}>· {urgency.text}</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 1.5, flexShrink: 0 }}>
                                        <Typography sx={{ color: isDraft ? colors.muted : colors.text, fontSize: "1rem", fontWeight: 700 }}>
                                            {formatCurrency(inv.total_amount, currency)}
                                        </Typography>
                                        {canPay && (
                                            <Button size="small" variant="contained"
                                                startIcon={<PaymentIcon sx={{ fontSize: 14 }} />}
                                                onClick={(e) => { e.stopPropagation(); onPayNow(inv); }}
                                                sx={{
                                                    fontSize: "0.7rem", fontWeight: 700, textTransform: "none",
                                                    borderRadius: "8px", px: 1.5, py: 0.5, minWidth: 0, whiteSpace: "nowrap",
                                                    background: isOverdue
                                                        ? "linear-gradient(135deg, #ef4444, #dc2626)"
                                                        : "linear-gradient(135deg, #ec4899, #8b5cf6)",
                                                    boxShadow: `0 2px 12px ${alpha(isOverdue ? "#ef4444" : "#ec4899", 0.3)}`,
                                                    "&:hover": { boxShadow: `0 4px 20px ${alpha(isOverdue ? "#ef4444" : "#ec4899", 0.45)}` },
                                                }}
                                            >
                                                Pay Now
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            {/* Inline payment instructions (expandable) */}
                            <Collapse in={isExpanded}>
                                <InlinePaymentInstructions
                                    invoice={inv} brand={brand} balance={balance}
                                    paymentMethods={paymentMethods}
                                    portalToken={portalToken}
                                    currency={currency} colors={colors}
                                />
                            </Collapse>
                        </Box>
                    </Box>
                );
            })}

            {/* Segmented progress bar */}
            <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${alpha(colors.border, 0.1)}` }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography sx={{ color: colors.muted, fontSize: "0.6rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {Math.round(progressPct)}% Paid
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: "3px", height: 8, borderRadius: 4, overflow: "hidden" }}>
                    {sortedInvoices.map((inv) => {
                        const isPaid = inv.status === "Paid";
                        const segPct = totalAmount > 0 ? (Number(inv.total_amount) / totalAmount) * 100 : 0;
                        return (
                            <Box key={inv.id} sx={{
                                width: `${segPct}%`, height: "100%",
                                borderRadius: 4,
                                bgcolor: isPaid
                                    ? colors.green
                                    : alpha(colors.border, 0.15),
                                transition: "background-color 0.6s ease",
                            }} />
                        );
                    })}
                </Box>
                <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                    {sortedInvoices.map((inv) => {
                        const isPaid = inv.status === "Paid";
                        return (
                            <Box key={inv.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Box sx={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    bgcolor: isPaid ? colors.green : alpha(colors.border, 0.3),
                                }} />
                                <Typography sx={{
                                    color: isPaid ? colors.text : alpha(colors.muted, 0.5),
                                    fontSize: "0.62rem", fontWeight: 600,
                                }}>
                                    {inv.title || inv.milestone?.label || inv.invoice_number}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}

/* ── Inline Payment Instructions (replaces PayNowDrawer) ── */

function InlinePaymentInstructions({ invoice, brand, balance, paymentMethods, portalToken, currency, colors }: {
    invoice: InvoiceData; brand: BrandData | null; balance: number;
    paymentMethods: PaymentMethodData[]; portalToken: string;
    currency: string; colors: ReturnType<typeof getPortalDashboardColors>;
}) {
    const hasPaymentMethods = paymentMethods.length > 0;
    // Legacy fallback
    const legacyMethod = invoice.payment_method || brand?.default_payment_method;

    return (
        <Box sx={{
            px: 2.5, py: 2, borderRadius: "0 0 12px 12px",
            bgcolor: alpha("#ec4899", 0.03),
            border: `1px solid ${alpha("#ec4899", 0.15)}`,
            borderTop: `1px dashed ${alpha("#ec4899", 0.15)}`,
        }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography sx={{ color: colors.text, fontSize: "0.82rem", fontWeight: 700 }}>
                    Payment Instructions
                </Typography>
                <Box sx={{
                    px: 1.5, py: 0.5, borderRadius: "8px",
                    bgcolor: alpha("#ec4899", 0.06), border: `1px solid ${alpha("#ec4899", 0.12)}`,
                }}>
                    <Typography sx={{ color: "#ec4899", fontSize: "0.88rem", fontWeight: 800 }}>
                        {formatCurrency(balance, currency)}
                    </Typography>
                </Box>
            </Box>

            {hasPaymentMethods ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {paymentMethods.map((pm) => (
                        <InlineMethodCard key={pm.id} method={pm} invoice={invoice} portalToken={portalToken} colors={colors} />
                    ))}
                </Box>
            ) : (
                <>
                    {legacyMethod && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
                            <BankIcon sx={{ fontSize: 16, color: colors.muted }} />
                            <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 600 }}>{legacyMethod}</Typography>
                        </Box>
                    )}
                    {brand?.bank_name && (
                        <Box sx={{
                            p: 2, borderRadius: "10px",
                            bgcolor: alpha(colors.border, 0.04),
                            border: `1px solid ${alpha(colors.border, 0.08)}`,
                        }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                                {brand.bank_name && <CopyableField label="Bank" value={brand.bank_name} colors={colors} />}
                                {brand.bank_account_name && <CopyableField label="Account Name" value={brand.bank_account_name} colors={colors} />}
                                {brand.bank_sort_code && <CopyableField label="Sort Code" value={brand.bank_sort_code} colors={colors} />}
                                {brand.bank_account_number && <CopyableField label="Account Number" value={brand.bank_account_number} colors={colors} />}
                            </Box>
                            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: "8px",
                                bgcolor: alpha("#f59e0b", 0.06), border: `1px solid ${alpha("#f59e0b", 0.12)}` }}>
                                <Typography sx={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 600 }}>
                                    Use &quot;{invoice.invoice_number}&quot; as the payment reference
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}

function InlineMethodCard({ method, invoice, portalToken, colors }: {
    method: PaymentMethodData; invoice: InvoiceData;
    portalToken: string;
    colors: ReturnType<typeof getPortalDashboardColors>;
}) {
    const cfg = (method.config || {}) as Record<string, string>;
    const [checkoutLoading, setCheckoutLoading] = React.useState(false);
    const iconMap: Record<string, React.ReactNode> = {
        BANK_TRANSFER: <BankIcon sx={{ fontSize: 16 }} />,
        CREDIT_CARD: <PaymentIcon sx={{ fontSize: 16 }} />,
        CASH: <PaymentIcon sx={{ fontSize: 16 }} />,
        STRIPE: <PaymentIcon sx={{ fontSize: 16 }} />,
    };

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
            p: 2, borderRadius: "10px",
            bgcolor: alpha(colors.border, 0.04),
            border: `1px solid ${alpha(colors.border, method.is_default ? 0.15 : 0.08)}`,
        }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: method.type === "BANK_TRANSFER" || method.type === "STRIPE" || method.instructions ? 1.5 : 0 }}>
                <Box sx={{ color: method.is_default ? "#ec4899" : colors.muted }}>{iconMap[method.type]}</Box>
                <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 600, flex: 1 }}>{method.label}</Typography>
                {method.is_default && (
                    <Box sx={{ px: 0.75, py: 0.15, borderRadius: "5px", bgcolor: alpha("#ec4899", 0.08) }}>
                        <Typography sx={{ color: "#ec4899", fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase" }}>
                            Recommended
                        </Typography>
                    </Box>
                )}
            </Box>

            {method.type === "BANK_TRANSFER" && cfg.bank_name && (
                <>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                        {cfg.bank_name && <CopyableField label="Bank" value={cfg.bank_name} colors={colors} />}
                        {cfg.account_name && <CopyableField label="Account Name" value={cfg.account_name} colors={colors} />}
                        {cfg.sort_code && <CopyableField label="Sort Code" value={cfg.sort_code} colors={colors} />}
                        {cfg.account_number && <CopyableField label="Account Number" value={cfg.account_number} colors={colors} />}
                    </Box>
                    <Box sx={{ mt: 1.5, p: 1.25, borderRadius: "8px",
                        bgcolor: alpha("#f59e0b", 0.06), border: `1px solid ${alpha("#f59e0b", 0.12)}` }}>
                        <Typography sx={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 600 }}>
                            Use &quot;{invoice.invoice_number}&quot; as the payment reference
                        </Typography>
                    </Box>
                </>
            )}

            {method.type === "STRIPE" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Button
                        variant="contained"
                        onClick={handleStripeCheckout}
                        disabled={checkoutLoading}
                        disableElevation
                        size="small"
                        sx={{
                            textTransform: "none", fontWeight: 700, borderRadius: "8px",
                            bgcolor: "#635bff", "&:hover": { bgcolor: "#4f46e5" },
                            fontSize: "0.78rem", px: 2.5, py: 0.75,
                        }}
                    >
                        {checkoutLoading ? (
                            <CircularProgress size={16} sx={{ color: "#fff", mr: 1 }} />
                        ) : null}
                        {checkoutLoading ? "Redirecting…" : "Pay with Stripe"}
                    </Button>
                    <AcceptedPaymentMethods labelColor={colors.muted} size={26} />
                </Box>
            )}

            {method.instructions && (
                <Typography sx={{ color: colors.muted, fontSize: "0.72rem", mt: 1, lineHeight: 1.5 }}>
                    {method.instructions}
                </Typography>
            )}
        </Box>
    );
}

function CopyableField({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof getPortalDashboardColors> }) {
    const [copied, setCopied] = React.useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover .copy-icon": { opacity: 1 } }}
            onClick={handleCopy}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: colors.muted, fontSize: "0.62rem" }}>{label}</Typography>
                <Typography sx={{ color: colors.text, fontSize: "0.82rem", fontWeight: 600 }}>{value}</Typography>
            </Box>
            <CopyIcon className="copy-icon" sx={{
                fontSize: 13, color: copied ? colors.green : colors.muted,
                opacity: copied ? 1 : 0, transition: "all 0.2s",
            }} />
        </Box>
    );
}

function TabbedInvoiceDetail({ sortedInvoices, activeTab, setActiveTab, currency, colors, onPayNow }: {
    sortedInvoices: InvoiceData[]; activeTab: number; setActiveTab: (v: number) => void;
    currency: string;
    colors: ReturnType<typeof getPortalDashboardColors>; onPayNow: (inv: InvoiceData) => void;
}) {
    if (sortedInvoices.length === 0) return null;
    return (
        <Box sx={{ mb: 4, borderRadius: "20px", bgcolor: alpha(colors.card, 0.7),
            backdropFilter: "blur(20px)", border: `1px solid ${alpha(colors.border, 0.3)}`, overflow: "hidden" }}>
            {sortedInvoices.length > 1 && (
                <Box sx={{ borderBottom: `1px solid ${alpha(colors.border, 0.15)}`, px: 1 }}>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
                        sx={{ minHeight: 44,
                            "& .MuiTabs-indicator": { background: "linear-gradient(90deg, #ec4899, #8b5cf6)", height: 2, borderRadius: 1 },
                            "& .MuiTabs-scrollButtons": { color: colors.muted } }}>
                        {sortedInvoices.map((inv, idx) => {
                            const isDraft = inv.status === "Draft";
                            const sc = getStatusColor(inv.status, colors);
                            return (
                                <Tab key={inv.id} label={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: sc,
                                            ...(isDraft && { border: `1.5px dashed ${sc}`, bgcolor: "transparent" }) }} />
                                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "none",
                                            color: activeTab === idx ? colors.text : colors.muted }}>
                                            {inv.title || inv.milestone?.label || inv.invoice_number}
                                        </Typography>
                                    </Box>
                                } sx={{ minHeight: 44, textTransform: "none", px: 2, "&.Mui-selected": { color: colors.text } }} />
                            );
                        })}
                    </Tabs>
                </Box>
            )}
            <Box sx={{ p: { xs: 0, md: 1 } }}>
                {sortedInvoices[activeTab] && (
                    <PaymentsInvoiceCard inv={sortedInvoices[activeTab]} currency={currency} colors={colors} onPayNow={onPayNow} />
                )}
            </Box>
        </Box>
    );
}

function PaymentTermsSection({ invoices, colors }: { invoices: InvoiceData[]; colors: ReturnType<typeof getPortalDashboardColors> }) {
    const terms = invoices.find(i => i.terms)?.terms;
    if (!terms) return null;
    return (
        <Box sx={{ mb: 4, p: 3, borderRadius: "16px", bgcolor: alpha(colors.card, 0.5),
            border: `1px solid ${alpha(colors.border, 0.15)}` }}>
            <Typography sx={{ color: colors.muted, fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", mb: 1 }}>
                Payment Terms
            </Typography>
            <Typography sx={{ color: colors.muted, fontSize: "0.82rem", lineHeight: 1.8 }}>{terms}</Typography>
        </Box>
    );
}

function BankDetailsSection({ brand, colors }: { brand: PaymentsData["brand"]; colors: ReturnType<typeof getPortalDashboardColors> }) {
    if (!brand?.bank_name) return null;
    return (
        <Box sx={{ mb: 4, p: 3, borderRadius: "16px", bgcolor: alpha(colors.card, 0.5),
            border: `1px solid ${alpha(colors.border, 0.15)}` }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <BankIcon sx={{ fontSize: 18, color: colors.muted }} />
                <Typography sx={{ color: colors.muted, fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Bank Details
                </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                {brand.bank_name && <BankField label="Bank" value={brand.bank_name} colors={colors} />}
                {brand.bank_account_name && <BankField label="Account Name" value={brand.bank_account_name} colors={colors} />}
                {brand.bank_sort_code && <BankField label="Sort Code" value={brand.bank_sort_code} colors={colors} />}
                {brand.bank_account_number && <BankField label="Account Number" value={brand.bank_account_number} colors={colors} />}
            </Box>
        </Box>
    );
}

function BankField({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof getPortalDashboardColors> }) {
    return (
        <Box>
            <Typography sx={{ color: colors.muted, fontSize: "0.68rem" }}>{label}</Typography>
            <Typography sx={{ color: colors.text, fontSize: "0.85rem", fontWeight: 600 }}>{value}</Typography>
        </Box>
    );
}

function Footer({ brand, colors }: { brand: PaymentsData["brand"]; colors: ReturnType<typeof getPortalDashboardColors> }) {
    return (
        <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography sx={{ color: alpha(colors.muted, 0.5), fontSize: "0.72rem" }}>
                {brand?.display_name || brand?.name || ""}{brand?.email && ` · ${brand.email}`}
            </Typography>
        </Box>
    );
}
