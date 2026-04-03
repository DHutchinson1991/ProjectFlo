"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    TextField,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Chip,
    Stack,
    Collapse,
} from "@mui/material";
import { alpha, keyframes, styled } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    Celebration as CelebrationIcon,
    Gavel as ContractIcon,
    Payments as PaymentsIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon,
    HourglassEmpty,
    Visibility,
} from "@mui/icons-material";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";
import { useSigningContract, useSubmitSignature } from "@/features/finance/contracts/hooks";
import { clientPortalApi } from "@/features/workflow/client-portal/api";

/* ── Animations ────────────────────────────────────────────── */

const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
`;

const confettiPop = keyframes`
    0%   { opacity: 0; transform: scale(0) rotate(-15deg); }
    60%  { opacity: 1; transform: scale(1.15) rotate(5deg); }
    100% { opacity: 1; transform: scale(1) rotate(0); }
`;

// shimmer keyframes reserved for future use

/* ── Styled Step Connector ─────────────────────────────────── */

const GlowConnector = styled(StepConnector)<{ accent: string }>(({ accent }) => ({
    "& .MuiStepConnector-line": {
        borderColor: alpha(accent, 0.2),
        borderTopWidth: 2,
    },
    "&.Mui-active .MuiStepConnector-line": {
        borderColor: accent,
    },
    "&.Mui-completed .MuiStepConnector-line": {
        borderColor: accent,
    },
}));

/* ── Types ─────────────────────────────────────────────────── */

export type AcceptanceStep = "congrats" | "contract" | "payments" | "complete";

interface ContractSectionData {
    title: string;
    contract_status: string;
    signing_token: string | null;
    signed_date: string | null;
    sent_at: string | null;
    signers: Array<{ id: number; name: string; role: string; status: string; signed_at: string | null }>;
}

export interface AcceptanceWizardProps {
    colors: PortalThemeColors;
    clientName: string;
    brandName: string;
    brandLogoUrl?: string | null;
    contractData: ContractSectionData | null;
    portalToken: string;
    onComplete: () => void;
    /** Called after acceptance to refresh portal data and pick up the newly sent contract */
    onRefresh: () => Promise<void>;
}

const STEPS: { key: AcceptanceStep; label: string; icon: React.ReactNode }[] = [
    { key: "congrats", label: "Congratulations", icon: <CelebrationIcon /> },
    { key: "contract", label: "Review & Sign", icon: <ContractIcon /> },
    { key: "payments", label: "Payment", icon: <PaymentsIcon /> },
];

/* ================================================================== */
/* AcceptanceWizard                                                     */
/* ================================================================== */

export default function AcceptanceWizard({
    colors,
    clientName,
    brandName,
    brandLogoUrl,
    contractData,
    portalToken,
    onComplete,
    onRefresh,
}: AcceptanceWizardProps) {
    const [currentStep, setCurrentStep] = useState<AcceptanceStep>("congrats");
    const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

    const goNext = useCallback(() => {
        const idx = STEPS.findIndex((s) => s.key === currentStep);
        if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
        else onComplete();
    }, [currentStep, onComplete]);

    const goBack = useCallback(() => {
        const idx = STEPS.findIndex((s) => s.key === currentStep);
        if (idx > 0) setCurrentStep(STEPS[idx - 1].key);
    }, [currentStep]);

    return (
        <Box sx={{
            maxWidth: 780,
            mx: "auto",
            px: { xs: 2.5, md: 4 },
            py: { xs: 3, md: 5 },
            animation: `${fadeInUp} 0.6s ease both`,
        }}>
            {/* Stepper */}
            <Stepper
                activeStep={stepIndex}
                alternativeLabel
                connector={<GlowConnector accent={colors.accent} />}
                sx={{ mb: { xs: 4, md: 5 } }}
            >
                {STEPS.map((step, i) => (
                    <Step key={step.key} completed={i < stepIndex}>
                        <StepLabel
                            StepIconComponent={() => (
                                <Box sx={{
                                    width: 40, height: 40, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    bgcolor: i <= stepIndex
                                        ? alpha(colors.accent, 0.15)
                                        : alpha(colors.muted, 0.08),
                                    border: `2px solid ${i <= stepIndex ? colors.accent : alpha(colors.muted, 0.2)}`,
                                    color: i <= stepIndex ? colors.accent : colors.muted,
                                    transition: "all 0.3s ease",
                                    "& svg": { fontSize: 20 },
                                }}>
                                    {i < stepIndex ? <CheckCircleIcon sx={{ color: colors.accent }} /> : step.icon}
                                </Box>
                            )}
                        >
                            <Typography sx={{
                                color: i <= stepIndex ? colors.text : colors.muted,
                                fontSize: "0.78rem",
                                fontWeight: i === stepIndex ? 700 : 500,
                                letterSpacing: "0.02em",
                            }}>
                                {step.label}
                            </Typography>
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Step Content */}
            {currentStep === "congrats" && (
                <CongratsStep
                    colors={colors}
                    clientName={clientName}
                    brandName={brandName}
                    brandLogoUrl={brandLogoUrl}
                    onContinue={goNext}
                />
            )}

            {currentStep === "contract" && (
                <ContractStep
                    colors={colors}
                    contractData={contractData}
                    brandName={brandName}
                    onContinue={goNext}
                    onBack={goBack}
                    onRefresh={onRefresh}
                />
            )}

            {currentStep === "payments" && (
                <PaymentsStep
                    colors={colors}
                    portalToken={portalToken}
                    onComplete={onComplete}
                    onBack={goBack}
                />
            )}
        </Box>
    );
}

/* ── Step 1: Congrats ────────────────────────────────────── */

function CongratsStep({
    colors,
    clientName,
    brandName,
    brandLogoUrl,
    onContinue,
}: {
    colors: PortalThemeColors;
    clientName: string;
    brandName: string;
    brandLogoUrl?: string | null;
    onContinue: () => void;
}) {
    return (
        <Box sx={{ textAlign: "center", animation: `${scaleIn} 0.5s cubic-bezier(0.16,1,0.3,1) both` }}>
            {/* Hero Icon */}
            <Box sx={{
                width: 96, height: 96, borderRadius: "50%", mx: "auto", mb: 3,
                background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: `${confettiPop} 0.6s cubic-bezier(0.16,1,0.3,1) both 0.2s`,
                boxShadow: `0 12px 48px ${alpha(colors.gradient1, 0.35)}`,
            }}>
                <CelebrationIcon sx={{ fontSize: 48, color: "#fff" }} />
            </Box>

            <Typography sx={{
                fontSize: { xs: "1.6rem", md: "2rem" },
                fontWeight: 800,
                color: colors.text,
                mb: 1,
                letterSpacing: "-0.02em",
            }}>
                Congratulations, {clientName}!
            </Typography>

            <Typography sx={{
                fontSize: { xs: "1rem", md: "1.1rem" },
                color: colors.muted,
                mb: 1,
                lineHeight: 1.6,
                maxWidth: 480,
                mx: "auto",
            }}>
                You&apos;ve accepted the proposal from{" "}
                <span style={{ color: colors.text, fontWeight: 600 }}>{brandName}</span>.
                We&apos;re thrilled to be working together!
            </Typography>

            {/* Brand logo if available */}
            {brandLogoUrl && (
                <Box
                    component="img"
                    src={brandLogoUrl}
                    alt={brandName}
                    sx={{
                        height: 36, width: "auto", objectFit: "contain",
                        mx: "auto", mt: 2, mb: 1, opacity: 0.7,
                    }}
                />
            )}

            <Typography sx={{
                fontSize: "0.88rem",
                color: alpha(colors.muted, 0.7),
                mt: 3,
                mb: 4,
                maxWidth: 440,
                mx: "auto",
                lineHeight: 1.7,
            }}>
                Just a couple more quick steps to finalise everything &mdash;
                we&apos;ll walk you through reviewing and signing your contract,
                then set up your payment schedule.
            </Typography>

            <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={onContinue}
                sx={{
                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                    color: "#fff",
                    px: 5, py: 1.75,
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: `0 8px 32px ${alpha(colors.gradient1, 0.3)}`,
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    "&:hover": {
                        boxShadow: `0 12px 48px ${alpha(colors.gradient1, 0.45)}`,
                        transform: "translateY(-2px)",
                    },
                }}
            >
                Continue to Contract
            </Button>
        </Box>
    );
}

/* ── Step 2: Contract Review & Signing ───────────────────── */

function ContractStep({
    colors,
    contractData,
    brandName,
    onContinue,
    onBack,
    onRefresh,
}: {
    colors: PortalThemeColors;
    contractData: ContractSectionData | null;
    brandName?: string;
    onContinue: () => void;
    onBack: () => void;
    onRefresh: () => Promise<void>;
}) {
    const signingToken = contractData?.signing_token ?? null;
    const contractSigned = contractData?.contract_status === "Signed";

    // Load the full contract via signing API
    const { data: signingData, isPending: loadingContract } = useSigningContract(signingToken);
    const submitSignature = useSubmitSignature(signingToken);

    const [signatureText, setSignatureText] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [signed, setSigned] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const isSigned = signed || contractSigned || signingData?.signer?.status === "signed";

    // After signing, refresh portal data so the overall state updates
    useEffect(() => {
        if (signed) {
            onRefresh();
        }
    }, [signed, onRefresh]);

    const handleSign = async () => {
        if (!signatureText.trim() || !agreed) return;
        setSubmitError("");
        try {
            await submitSignature.mutateAsync(signatureText.trim());
            setSigned(true);
        } catch {
            setSubmitError("Failed to submit signature. Please try again.");
        }
    };

    return (
        <Box sx={{ animation: `${fadeInUp} 0.4s ease both` }}>
            {/* Signed success state */}
            {isSigned && (
                <Box sx={{ textAlign: "center", py: 3, animation: `${scaleIn} 0.5s ease both` }}>
                    <CheckCircleIcon sx={{ fontSize: 64, color: "#22c55e", mb: 2 }} />
                    <Typography sx={{
                        fontSize: { xs: "1.4rem", md: "1.7rem" },
                        fontWeight: 800, color: colors.text, mb: 1,
                    }}>
                        Contract Signed!
                    </Typography>
                    <Typography sx={{
                        color: colors.muted, fontSize: "0.95rem",
                        mb: 4, maxWidth: 420, mx: "auto", lineHeight: 1.6,
                    }}>
                        Your signature has been recorded. Let&apos;s set up your payment schedule next.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        onClick={onContinue}
                        sx={{
                            background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                            color: "#fff", px: 5, py: 1.5, borderRadius: 3,
                            textTransform: "none", fontWeight: 700,
                            boxShadow: `0 8px 32px ${alpha(colors.gradient1, 0.3)}`,
                            "&:hover": { transform: "translateY(-2px)" },
                        }}
                    >
                        Continue to Payments
                    </Button>
                </Box>
            )}

            {/* No contract ready yet */}
            {!isSigned && !signingToken && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <ContractIcon sx={{ fontSize: 48, color: alpha(colors.muted, 0.4), mb: 2 }} />
                    <Typography sx={{ color: colors.text, fontWeight: 700, fontSize: "1.2rem", mb: 1 }}>
                        Your Contract is Being Prepared
                    </Typography>
                    <Typography sx={{
                        color: colors.muted, fontSize: "0.88rem",
                        maxWidth: 420, mx: "auto", lineHeight: 1.6, mb: 3,
                    }}>
                        {brandName ? `${brandName} is` : "We're"} preparing your contract now.
                        It will appear here shortly — you can wait or come back later.
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={onBack}
                            sx={{
                                color: colors.muted, borderColor: alpha(colors.muted, 0.25),
                                textTransform: "none", borderRadius: 2,
                                "&:hover": { borderColor: colors.muted },
                            }}
                        >
                            Back
                        </Button>
                        <Button
                            variant="outlined"
                            endIcon={<ArrowForwardIcon />}
                            onClick={onContinue}
                            sx={{
                                color: colors.accent, borderColor: alpha(colors.accent, 0.3),
                                textTransform: "none", borderRadius: 2,
                                "&:hover": { borderColor: colors.accent },
                            }}
                        >
                            Skip for Now
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Contract loading */}
            {!isSigned && signingToken && loadingContract && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress sx={{ color: colors.accent }} />
                </Box>
            )}

            {/* Contract signing form */}
            {!isSigned && signingToken && signingData && !loadingContract && (
                <Box>
                    {/* Header */}
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                        <ContractIcon sx={{ fontSize: 36, color: "#6366f1", mb: 1 }} />
                        <Typography sx={{
                            fontSize: { xs: "1.3rem", md: "1.5rem" },
                            fontWeight: 800, color: colors.text, mb: 0.5,
                        }}>
                            {signingData.contract.title}
                        </Typography>
                        <Typography sx={{ color: colors.muted, fontSize: "0.88rem" }}>
                            Please review the contract below and sign at the bottom.
                        </Typography>
                    </Box>

                    {/* Signer status */}
                    {signingData.signers.length > 1 && (
                        <Box sx={{
                            mb: 3, p: 2,
                            bgcolor: alpha(colors.card, 0.5),
                            borderRadius: 2.5,
                            border: `1px solid ${alpha(colors.border, 0.3)}`,
                        }}>
                            <Typography sx={{
                                color: colors.muted, fontSize: "0.72rem", fontWeight: 600,
                                mb: 1, textTransform: "uppercase", letterSpacing: "0.05em",
                            }}>
                                All Signers
                            </Typography>
                            <Stack spacing={0.5}>
                                {signingData.signers.map((s, i) => (
                                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {s.status === "signed" ? (
                                            <CheckCircleIcon sx={{ fontSize: 16, color: "#22c55e" }} />
                                        ) : s.status === "viewed" ? (
                                            <Visibility sx={{ fontSize: 16, color: "#3b82f6" }} />
                                        ) : (
                                            <HourglassEmpty sx={{ fontSize: 16, color: alpha(colors.muted, 0.5) }} />
                                        )}
                                        <Typography sx={{ color: colors.text, fontSize: "0.82rem" }}>
                                            {s.name}{" "}
                                            <span style={{ color: alpha(colors.muted, 0.7) }}>({s.role})</span>
                                        </Typography>
                                        <Chip
                                            label={s.status}
                                            size="small"
                                            sx={{
                                                height: 18, fontSize: "0.62rem", fontWeight: 600, ml: "auto",
                                                bgcolor: s.status === "signed"
                                                    ? alpha("#22c55e", 0.12)
                                                    : s.status === "viewed"
                                                        ? alpha("#3b82f6", 0.12)
                                                        : alpha(colors.muted, 0.1),
                                                color: s.status === "signed"
                                                    ? "#22c55e"
                                                    : s.status === "viewed"
                                                        ? "#3b82f6"
                                                        : colors.muted,
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Contract body */}
                    <Box sx={{
                        bgcolor: "#fff", borderRadius: 3, p: { xs: 3, md: 5 }, mb: 3,
                        color: "#1e293b", lineHeight: 1.7, fontSize: "0.92rem",
                        boxShadow: `0 4px 24px ${alpha("#000", 0.15)}`,
                        maxHeight: 500, overflowY: "auto",
                        "& .contract-section": { mb: 3 },
                        "& .contract-section h3": {
                            fontSize: "1rem", fontWeight: 700, color: "#1e293b",
                            mb: 1, borderBottom: "1px solid #e2e8f0", pb: 0.5,
                        },
                        "& .contract-section p": {
                            fontSize: "0.88rem", lineHeight: 1.7, color: "#334155",
                        },
                    }}>
                        {signingData.contract.rendered_html ? (
                            <div dangerouslySetInnerHTML={{ __html: signingData.contract.rendered_html }} />
                        ) : (
                            <Typography sx={{ color: "#64748b", fontStyle: "italic" }}>
                                No contract content available.
                            </Typography>
                        )}
                    </Box>

                    {/* Signing section */}
                    <Box sx={{
                        p: { xs: 3, md: 4 },
                        bgcolor: alpha(colors.card, 0.7),
                        borderRadius: 3,
                        border: `1px solid ${alpha("#6366f1", 0.2)}`,
                    }}>
                        <Typography sx={{
                            color: colors.text, fontWeight: 700,
                            fontSize: "1.05rem", mb: 0.5,
                        }}>
                            Sign this Contract
                        </Typography>
                        <Typography sx={{
                            color: colors.muted, fontSize: "0.85rem", mb: 3,
                        }}>
                            By typing your full legal name below, you are agreeing to
                            all terms in this contract.
                        </Typography>

                        <TextField
                            fullWidth
                            label="Type your full legal name"
                            value={signatureText}
                            onChange={(e) => setSignatureText(e.target.value)}
                            placeholder={signingData.signer.name}
                            sx={{
                                mb: 2,
                                "& .MuiInputBase-input": {
                                    fontFamily: '"Dancing Script", "Brush Script MT", cursive',
                                    fontSize: "1.5rem",
                                    color: colors.text,
                                    py: 1.5,
                                },
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: alpha("#6366f1", 0.3) },
                                    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                                },
                            }}
                            InputLabelProps={{ sx: { color: colors.muted } }}
                        />

                        {/* Signature preview */}
                        <Collapse in={!!signatureText}>
                            <Box sx={{
                                mb: 2, p: 2, textAlign: "center",
                                borderBottom: "2px solid #6366f1",
                                bgcolor: alpha("#fff", 0.03),
                                borderRadius: "4px 4px 0 0",
                            }}>
                                <Typography sx={{
                                    fontFamily: '"Dancing Script", "Brush Script MT", cursive',
                                    fontSize: "1.8rem", color: colors.text, fontWeight: 700,
                                }}>
                                    {signatureText}
                                </Typography>
                                <Typography sx={{ color: alpha(colors.muted, 0.5), fontSize: "0.72rem", mt: 0.5 }}>
                                    {new Date().toLocaleDateString("en-GB", {
                                        day: "numeric", month: "long", year: "numeric",
                                    })}
                                </Typography>
                            </Box>
                        </Collapse>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    sx={{ color: alpha(colors.muted, 0.5), "&.Mui-checked": { color: "#6366f1" } }}
                                />
                            }
                            label={
                                <Typography sx={{ color: colors.text, fontSize: "0.82rem" }}>
                                    I have read and agree to all terms and conditions in this contract.
                                </Typography>
                            }
                            sx={{ mb: 2 }}
                        />

                        {submitError && (
                            <Typography sx={{ color: "#ef4444", fontSize: "0.82rem", mb: 2 }}>
                                {submitError}
                            </Typography>
                        )}

                        <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackIcon />}
                                onClick={onBack}
                                sx={{
                                    color: colors.muted,
                                    borderColor: alpha(colors.muted, 0.25),
                                    textTransform: "none", borderRadius: 2,
                                    "&:hover": { borderColor: colors.muted },
                                }}
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                disabled={!signatureText.trim() || !agreed || submitSignature.isPending}
                                onClick={handleSign}
                                startIcon={submitSignature.isPending
                                    ? <CircularProgress size={18} color="inherit" />
                                    : <ContractIcon />
                                }
                                sx={{
                                    bgcolor: "#6366f1",
                                    color: "#fff",
                                    px: 4, py: 1.25, borderRadius: 2.5,
                                    textTransform: "none", fontWeight: 700,
                                    "&:hover": { bgcolor: "#4f46e5" },
                                    "&:disabled": { bgcolor: alpha("#6366f1", 0.3), color: alpha("#fff", 0.5) },
                                }}
                            >
                                {submitSignature.isPending ? "Signing..." : "Sign Contract"}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

/* ── Step 3: Payments Overview ───────────────────────────── */

function PaymentsStep({
    colors,
    portalToken,
    onComplete,
    onBack,
}: {
    colors: PortalThemeColors;
    portalToken: string;
    onComplete: () => void;
    onBack: () => void;
}) {
    const [paymentsData, setPaymentsData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        clientPortalApi.getPaymentsData(portalToken)
            .then((data) => { if (mounted) setPaymentsData(data); })
            .catch(() => { /* payments not ready yet */ })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [portalToken]);

    const invoices = (paymentsData?.invoices ?? []) as Array<{
        id: number;
        invoice_number: string;
        title: string;
        status: string;
        total_amount: string | number;
        amount_paid: string | number;
        due_date: string | null;
        currency: string;
        milestone?: { label: string } | null;
    }>;

    const hasInvoices = invoices.length > 0;

    return (
        <Box sx={{ animation: `${fadeInUp} 0.4s ease both` }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <PaymentsIcon sx={{ fontSize: 40, color: colors.accent, mb: 1.5 }} />
                <Typography sx={{
                    fontSize: { xs: "1.3rem", md: "1.6rem" },
                    fontWeight: 800, color: colors.text, mb: 1,
                }}>
                    Payment Overview
                </Typography>
                <Typography sx={{
                    color: colors.muted, fontSize: "0.88rem",
                    maxWidth: 440, mx: "auto", lineHeight: 1.6,
                }}>
                    {hasInvoices
                        ? "Here's your payment schedule. Your first payment secures your booking."
                        : "Your payment schedule will be set up shortly. You can come back to the portal to view and pay your invoices."}
                </Typography>
            </Box>

            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress sx={{ color: colors.accent }} />
                </Box>
            )}

            {!loading && hasInvoices && (
                <Stack spacing={2} sx={{ mb: 4 }}>
                    {invoices.map((inv) => {
                        const total = parseFloat(String(inv.total_amount));

                        const isPaid = inv.status === "Paid";
                        const isOverdue = inv.status === "Overdue";
                        const dueDate = inv.due_date
                            ? new Date(inv.due_date).toLocaleDateString("en-GB", {
                                day: "numeric", month: "short", year: "numeric",
                            })
                            : null;

                        return (
                            <Box
                                key={inv.id}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2.5,
                                    bgcolor: alpha(colors.card, 0.6),
                                    border: `1px solid ${alpha(
                                        isPaid ? "#22c55e" : isOverdue ? "#ef4444" : colors.border,
                                        isPaid ? 0.3 : isOverdue ? 0.3 : 0.4,
                                    )}`,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                                    <Box>
                                        <Typography sx={{ color: colors.text, fontWeight: 600, fontSize: "0.92rem" }}>
                                            {inv.milestone?.label ?? inv.title ?? inv.invoice_number}
                                        </Typography>
                                        <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: "0.75rem" }}>
                                            {inv.invoice_number}
                                            {dueDate && ` · Due ${dueDate}`}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "right" }}>
                                        <Typography sx={{
                                            color: isPaid ? "#22c55e" : colors.text,
                                            fontWeight: 700, fontSize: "1rem",
                                        }}>
                                            {inv.currency === "USD" ? "$" : inv.currency === "EUR" ? "€" : "£"}
                                            {total.toLocaleString("en", { minimumFractionDigits: 2 })}
                                        </Typography>
                                        <Chip
                                            label={inv.status}
                                            size="small"
                                            sx={{
                                                height: 20, fontSize: "0.65rem", fontWeight: 600,
                                                bgcolor: alpha(
                                                    isPaid ? "#22c55e" : isOverdue ? "#ef4444" : "#f59e0b",
                                                    0.12,
                                                ),
                                                color: isPaid ? "#22c55e" : isOverdue ? "#ef4444" : "#f59e0b",
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            )}

            {!loading && !hasInvoices && (
                <Box sx={{
                    py: 4, textAlign: "center",
                    bgcolor: alpha(colors.card, 0.35),
                    border: `1px dashed ${alpha(colors.border, 0.4)}`,
                    borderRadius: 3, mb: 4,
                }}>
                    <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: "0.85rem" }}>
                        Your invoices will appear here once generated. Check back in the portal soon!
                    </Typography>
                </Box>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                    sx={{
                        color: colors.muted,
                        borderColor: alpha(colors.muted, 0.25),
                        textTransform: "none", borderRadius: 2,
                        "&:hover": { borderColor: colors.muted },
                    }}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    endIcon={<CheckCircleIcon />}
                    onClick={onComplete}
                    sx={{
                        background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                        color: "#fff", px: 5, py: 1.5, borderRadius: 3,
                        textTransform: "none", fontWeight: 700,
                        boxShadow: `0 8px 32px ${alpha(colors.gradient1, 0.3)}`,
                        "&:hover": { transform: "translateY(-2px)" },
                    }}
                >
                    Done
                </Button>
            </Box>
        </Box>
    );
}
