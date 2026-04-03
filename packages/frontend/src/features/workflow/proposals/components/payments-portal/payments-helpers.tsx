import React from "react";
import {
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
    Payment as PaymentIcon,
    AccountBalance as BankIcon,
    CreditCard as CardIcon,
} from "@mui/icons-material";
import type { PortalDashboardColors } from "@/features/workflow/proposals/utils/portal/themes";
import { formatDate, getDaysUntil } from "@/features/workflow/proposals/utils/portal/formatting";

/* ── Shared types ───────────────────────────────────────────────── */

export interface InvoiceItemData { id: number; description: string; quantity: string | number; unit_price: string | number; category: string | null }
export interface InvoicePaymentData {
    id: number;
    amount: string | number;
    payment_date: string;
    payment_method: string | null;
    transaction_id?: string | null;
    receipt_url?: string | null;
    card_brand?: string | null;
    card_last4?: string | null;
    payer_email?: string | null;
    currency?: string | null;
}
export interface InvoiceMilestoneData { id: number; label: string; due_date: string; amount: string | number; order_index: number }

export interface InvoiceData {
    id: number; invoice_number: string; status: string;
    title: string | null; subtotal: string | number | null;
    total_amount: string | number; amount_paid: string | number | null;
    tax_rate: string | number | null; currency: string | null;
    due_date: string | null; paid_date: string | null; issued_date: string | null;
    notes: string | null; terms: string | null; payment_method: string | null;
    milestone: InvoiceMilestoneData | null;
    items: InvoiceItemData[]; payments: InvoicePaymentData[];
}

export interface BrandData {
    id: number; name: string; display_name: string | null;
    email: string | null; phone: string | null;
    address_line1: string | null; city: string | null;
    state: string | null; country: string | null;
    postal_code: string | null; logo_url: string | null;
    currency: string; tax_number: string | null;
    bank_name: string | null; bank_account_name: string | null;
    bank_sort_code: string | null; bank_account_number: string | null;
    default_payment_method: string | null;
}

export interface QuoteItemData { id: number; description: string; category: string | null; quantity: string | number; unit_price: string | number }

export interface QuoteData {
    id: number; quote_number: string; title: string | null;
    total_amount: string | number; tax_rate: string | number | null;
    currency: string | null; notes: string | null;
    schedule_name: string | null;
    items: QuoteItemData[];
}

export interface PaymentMethodData {
    id: number;
    type: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'STRIPE';
    label: string;
    is_default: boolean;
    instructions: string | null;
    config: Record<string, unknown> | null;
    order_index: number;
}

export interface PaymentsData {
    inquiry_id: number;
    event_date: string | null;
    contact: { first_name: string | null; last_name: string | null; email: string | null };
    brand: BrandData | null;
    payment_methods: PaymentMethodData[];
    quote: QuoteData | null;
    invoices: InvoiceData[];
}

/* ── Status helpers ─────────────────────────────────────────────── */

export function getStatusColor(status: string, colors: PortalDashboardColors) {
    switch (status) {
        case "Paid": return colors.green;
        case "Overdue": return "#ef4444";
        case "Sent": return "#3b82f6";
        case "Draft": return "#64748b";
        case "Partially Paid": return "#f59e0b";
        default: return colors.muted;
    }
}

export function getStatusIcon(status: string) {
    switch (status) {
        case "Paid": return <CheckCircleIcon sx={{ fontSize: 14 }} />;
        case "Overdue": return <WarningIcon sx={{ fontSize: 14 }} />;
        default: return <ScheduleIcon sx={{ fontSize: 14 }} />;
    }
}

export function getPaymentMethodIcon(method: string | null) {
    if (!method) return <PaymentIcon sx={{ fontSize: 16 }} />;
    const lower = method.toLowerCase();
    if (lower.includes("bank") || lower.includes("transfer") || lower.includes("bacs")) return <BankIcon sx={{ fontSize: 16 }} />;
    if (lower.includes("card") || lower.includes("stripe")) return <CardIcon sx={{ fontSize: 16 }} />;
    return <PaymentIcon sx={{ fontSize: 16 }} />;
}

export interface UrgencyLabel { text: string; color: string; urgent: boolean }

export function getUrgencyLabel(dueDate: string | null): UrgencyLabel | null {
    const days = getDaysUntil(dueDate);
    if (days === null) return null;
    if (days < 0) return { text: `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`, color: "#ef4444", urgent: true };
    if (days === 0) return { text: "Due today", color: "#f59e0b", urgent: true };
    if (days === 1) return { text: "Due tomorrow", color: "#f59e0b", urgent: true };
    if (days <= 7) return { text: `Due in ${days} days`, color: "#f59e0b", urgent: false };
    if (days <= 30) return { text: `Due in ${days} days`, color: "#94a3b8", urgent: false };
    return { text: `Due ${formatDate(dueDate)}`, color: "#94a3b8", urgent: false };
}
