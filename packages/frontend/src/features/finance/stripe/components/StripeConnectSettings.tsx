"use client";

import React from "react";
import {
    Box,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckIcon,
    OpenInNew as OpenInNewIcon,
    Link as LinkIcon,
} from "@mui/icons-material";
import {
    useStripeConnectStatus,
    useCreateStripeAccount,
    useStripeOnboardingLink,
    useStripeDashboardLink,
} from "@/features/finance/stripe/hooks";

export function StripeConnectSettings() {
    const { data: status, isLoading } = useStripeConnectStatus();
    const createAccount = useCreateStripeAccount();
    const getOnboardingLink = useStripeOnboardingLink();
    const getDashboardLink = useStripeDashboardLink();

    const handleConnect = async () => {
        try {
            const result = await createAccount.mutateAsync();
            window.open(result.url, "_blank");
        } catch {
            // error handled by mutation
        }
    };

    const handleResumeOnboarding = async () => {
        try {
            const result = await getOnboardingLink.mutateAsync();
            window.open(result.url, "_blank");
        } catch {
            // error handled by mutation
        }
    };

    const handleOpenDashboard = async () => {
        try {
            const result = await getDashboardLink.mutateAsync();
            window.open(result.url, "_blank");
        } catch {
            // error handled by mutation
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    const isConnected = status?.onboarding_complete;
    const hasAccount = status?.has_account;

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <LinkIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="subtitle2" fontWeight={700}>
                    Stripe Connect
                </Typography>
                {isConnected && (
                    <Chip
                        icon={<CheckIcon sx={{ fontSize: 14 }} />}
                        label="Connected"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                    />
                )}
            </Box>

            <Box
                sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: isConnected
                        ? (theme) => alpha(theme.palette.success.main, 0.3)
                        : "divider",
                    bgcolor: (theme) =>
                        isConnected
                            ? alpha(theme.palette.success.main, 0.03)
                            : alpha(theme.palette.background.paper, 0.6),
                }}
            >
                {/* ── Not connected ── */}
                {!hasAccount && (
                    <>
                        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                            Connect a Stripe account to accept card payments directly from your
                            client payment portal. Funds go straight to your Stripe account.
                        </Typography>
                        <Button
                            variant="contained"
                            disableElevation
                            onClick={handleConnect}
                            disabled={createAccount.isPending}
                            startIcon={
                                createAccount.isPending ? (
                                    <CircularProgress size={16} />
                                ) : undefined
                            }
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                                bgcolor: "#635bff",
                                "&:hover": { bgcolor: "#4f46e5" },
                            }}
                        >
                            {createAccount.isPending
                                ? "Setting up…"
                                : "Connect with Stripe"}
                        </Button>
                        {createAccount.isError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Failed to create Stripe account. Check your STRIPE_SECRET_KEY.
                            </Alert>
                        )}
                    </>
                )}

                {/* ── Account exists but onboarding incomplete ── */}
                {hasAccount && !isConnected && (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Your Stripe account setup is incomplete. Please finish onboarding
                            to start accepting payments.
                        </Alert>
                        <Button
                            variant="contained"
                            disableElevation
                            onClick={handleResumeOnboarding}
                            disabled={getOnboardingLink.isPending}
                            startIcon={
                                getOnboardingLink.isPending ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                                )
                            }
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                                bgcolor: "#635bff",
                                "&:hover": { bgcolor: "#4f46e5" },
                            }}
                        >
                            {getOnboardingLink.isPending
                                ? "Loading…"
                                : "Resume Stripe Setup"}
                        </Button>
                    </>
                )}

                {/* ── Fully connected ── */}
                {isConnected && (
                    <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                            <Box>
                                <Typography variant="body2" fontWeight={600}>
                                    Stripe account active
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Clients can pay invoices via Stripe Checkout.{" "}
                                    {status?.account_id && (
                                        <Typography component="span" variant="caption" sx={{ fontFamily: "monospace", opacity: 0.7 }}>
                                            {status.account_id}
                                        </Typography>
                                    )}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Chip
                                label={status?.charges_enabled ? "Charges enabled" : "Charges disabled"}
                                size="small"
                                color={status?.charges_enabled ? "success" : "default"}
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                            />
                            <Chip
                                label={status?.payouts_enabled ? "Payouts enabled" : "Payouts disabled"}
                                size="small"
                                color={status?.payouts_enabled ? "success" : "default"}
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                            />
                        </Box>
                        <Button
                            size="small"
                            onClick={handleOpenDashboard}
                            disabled={getDashboardLink.isPending}
                            startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                            sx={{
                                mt: 2,
                                textTransform: "none",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                            }}
                        >
                            {getDashboardLink.isPending ? "Loading…" : "Open Stripe Dashboard"}
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
}
