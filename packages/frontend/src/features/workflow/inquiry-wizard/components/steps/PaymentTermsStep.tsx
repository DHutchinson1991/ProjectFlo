"use client";

import React from "react";
import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import { C } from '../../constants/wizard-config';
import { fadeInUp } from '../../constants/animations';
import { NACtx } from '../../types';
import { Q } from "../QuestionWrapper";
import { useWizardPaymentSchedules } from "../../hooks/useWizardPaymentSchedules";
import { resolveTotal } from '../../mappers/payment-terms';
import { formatCurrency, DEFAULT_CURRENCY } from '@projectflo/shared';
import { PaymentScheduleCard } from "../PaymentScheduleCard";

export default function PaymentTermsScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, currentBrand } = ctx;
    const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;
    const { data: templates = [], isLoading: loading } = useWizardPaymentSchedules();

    const selected: number | null = responses.payment_schedule_template_id ?? null;
    const totalPrice = resolveTotal(ctx);

    // Auto-select default template once loaded
    React.useEffect(() => {
        if (!loading && templates.length > 0 && !responses.payment_schedule_template_id) {
            const def = templates.find((t) => t.is_default);
            if (def) handleChange("payment_schedule_template_id", def.id);
        }
    }, [loading, templates.length]);

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
                        {formatCurrency(totalPrice, currency, 0)}
                    </Typography>
                </Box>
            )}

            <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
                {templates.map((template) => (
                    <PaymentScheduleCard
                        key={template.id}
                        template={template}
                        selected={selected}
                        totalPrice={totalPrice}
                        currency={currency}
                        onSelect={(id) => handleChange("payment_schedule_template_id", id)}
                    />
                ))}
            </Stack>
        </Q>
    );
}
