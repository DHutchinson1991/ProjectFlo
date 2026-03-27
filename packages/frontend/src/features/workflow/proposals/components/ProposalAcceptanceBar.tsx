"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    Button,
    Alert,
    TextField,
    CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import { fadeInUp, pulseGlow, revealSx, useReveal } from "@/features/workflow/proposals/utils/portal/animations";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface ProposalAcceptanceBarProps {
    colors: PortalThemeColors;
    isDark: boolean;
    alreadyResponded: boolean;
    clientResponse?: string | null;
    clientResponseMessage?: string | null;
    responding: boolean;
    responseSuccess: boolean;
    /** Called when customer clicks "Accept Proposal" */
    onAccept: () => void;
    /** Called when customer submits a change request */
    onRequestChanges: (message: string) => void;
}

/* ================================================================== */
/* ProposalAcceptanceBar                                               */
/* ================================================================== */

export default function ProposalAcceptanceBar({
    colors,
    isDark,
    alreadyResponded,
    clientResponse,
    clientResponseMessage,
    responding,
    responseSuccess,
    onAccept,
    onRequestChanges,
}: ProposalAcceptanceBarProps) {
    const ctaReveal = useReveal();
    const [showChangesForm, setShowChangesForm] = useState(false);
    const [changesMessage, setChangesMessage] = useState("");

    const handleSubmitChanges = () => {
        if (changesMessage.trim()) {
            onRequestChanges(changesMessage.trim());
        }
    };

    return (
        <>
            {/* ── Already-Responded Banner ──────────────────── */}
            {alreadyResponded && (
                <Alert
                    severity={clientResponse === "accepted" ? "success" : "info"}
                    sx={{
                        bgcolor: alpha(
                            clientResponse === "accepted" ? "#4caf50" : colors.accent,
                            isDark ? 0.1 : 0.06,
                        ),
                        color: colors.text,
                        border: `1px solid ${alpha(
                            clientResponse === "accepted" ? "#4caf50" : colors.accent,
                            0.2,
                        )}`,
                        borderRadius: 3,
                        "& .MuiAlert-icon": {
                            color: clientResponse === "accepted" ? "#4caf50" : colors.accent,
                        },
                    }}
                >
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", mb: 0.5 }}>
                        {clientResponse === "accepted"
                            ? "You've accepted this proposal!"
                            : "You've requested changes to this proposal."}
                    </Typography>
                    <Typography sx={{ color: colors.muted, fontSize: "0.82rem" }}>
                        {clientResponse === "accepted"
                            ? "We'll be in touch with next steps soon."
                            : "We've received your feedback and will follow up shortly."}
                    </Typography>
                    {clientResponseMessage && (
                        <Typography
                            sx={{
                                color: colors.muted,
                                fontSize: "0.8rem",
                                mt: 1,
                                fontStyle: "italic",
                                pl: 1,
                                borderLeft: `2px solid ${alpha(colors.accent, 0.3)}`,
                            }}
                        >
                            &quot;{clientResponseMessage}&quot;
                        </Typography>
                    )}
                </Alert>
            )}

            {/* ── CTA Section ──────────────────────────────────── */}
            {!alreadyResponded && !responseSuccess && (
                <Box
                    ref={ctaReveal.ref}
                    sx={{
                        textAlign: "center",
                        py: { xs: 2, md: 3 },
                        ...revealSx(ctaReveal.visible, 0),
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 600,
                            color: colors.text,
                            fontSize: { xs: "1.3rem", md: "1.5rem" },
                            mb: 1,
                        }}
                    >
                        Ready to move forward?
                    </Typography>
                    <Typography
                        sx={{
                            color: colors.muted,
                            fontSize: "0.88rem",
                            mb: 4,
                            maxWidth: 420,
                            mx: "auto",
                            lineHeight: 1.6,
                        }}
                    >
                        Accept this proposal to lock in your date and pricing, or
                        request any changes you&apos;d like.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        disabled={responding}
                        onClick={onAccept}
                        startIcon={
                            responding ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : (
                                <CheckCircleIcon />
                            )
                        }
                        sx={{
                            background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                            color: "#fff",
                            px: 5,
                            py: 1.75,
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "1rem",
                            letterSpacing: 0.5,
                            boxShadow: `0 8px 32px ${alpha(colors.gradient1, 0.3)}`,
                            animation: !responding
                                ? `${pulseGlow} 4s ease-in-out infinite`
                                : "none",
                            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                            "&:hover": {
                                boxShadow: `0 12px 48px ${alpha(colors.gradient1, 0.45)}`,
                                transform: "translateY(-2px) scale(1.02)",
                            },
                            "&:active": {
                                transform: "translateY(0) scale(0.98)",
                            },
                        }}
                    >
                        {responding ? "Processing..." : "Accept Proposal"}
                    </Button>

                    <Box sx={{ mt: 3 }}>
                        {!showChangesForm ? (
                            <Button
                                variant="text"
                                size="small"
                                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                                onClick={() => setShowChangesForm(true)}
                                sx={{
                                    color: colors.muted,
                                    textTransform: "none",
                                    fontWeight: 500,
                                    fontSize: "0.85rem",
                                    transition:
                                        "color 0.2s ease, background-color 0.2s ease",
                                    "&:hover": {
                                        color: colors.accent,
                                        bgcolor: alpha(colors.accent, 0.06),
                                    },
                                }}
                            >
                                Request Changes
                            </Button>
                        ) : (
                            <Box
                                sx={{
                                    mt: 2,
                                    animation: `${fadeInUp} 0.3s ease`,
                                    maxWidth: 480,
                                    mx: "auto",
                                    textAlign: "left",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 1,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            color: colors.text,
                                            fontWeight: 600,
                                            fontSize: "0.88rem",
                                        }}
                                    >
                                        What changes would you like?
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setShowChangesForm(false);
                                            setChangesMessage("");
                                        }}
                                        startIcon={
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        }
                                        sx={{
                                            color: colors.muted,
                                            minWidth: "auto",
                                            textTransform: "none",
                                            fontSize: "0.75rem",
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                                <TextField
                                    multiline
                                    minRows={3}
                                    fullWidth
                                    value={changesMessage}
                                    onChange={(e) => setChangesMessage(e.target.value)}
                                    placeholder="Tell us what you'd like to adjust..."
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2.5,
                                            bgcolor: alpha(
                                                colors.card,
                                                isDark ? 0.5 : 1,
                                            ),
                                            color: colors.text,
                                            fontSize: "0.88rem",
                                            "& fieldset": {
                                                borderColor: alpha(
                                                    colors.border,
                                                    0.6,
                                                ),
                                            },
                                            "&:hover fieldset": {
                                                borderColor: alpha(
                                                    colors.accent,
                                                    0.3,
                                                ),
                                            },
                                            "&.Mui-focused fieldset": {
                                                borderColor: colors.accent,
                                            },
                                        },
                                        "& .MuiInputBase-input::placeholder":
                                            {
                                                color: alpha(
                                                    colors.muted,
                                                    0.5,
                                                ),
                                            },
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={
                                        !changesMessage.trim() || responding
                                    }
                                    onClick={handleSubmitChanges}
                                    startIcon={
                                        responding ? (
                                            <CircularProgress
                                                size={14}
                                                color="inherit"
                                            />
                                        ) : (
                                            <EditIcon
                                                sx={{ fontSize: 14 }}
                                            />
                                        )
                                    }
                                    sx={{
                                        mt: 1.5,
                                        borderColor: alpha(
                                            colors.accent,
                                            0.3,
                                        ),
                                        color: colors.accent,
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        "&:hover": {
                                            borderColor: colors.accent,
                                            bgcolor: alpha(
                                                colors.accent,
                                                0.06,
                                            ),
                                        },
                                        "&.Mui-disabled": {
                                            borderColor: alpha(
                                                colors.border,
                                                0.3,
                                            ),
                                            color: alpha(
                                                colors.muted,
                                                0.4,
                                            ),
                                        },
                                    }}
                                >
                                    {responding
                                        ? "Sending..."
                                        : "Send Request"}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            {/* ── Success Response ────────────────────────────── */}
            {responseSuccess && (
                <Alert
                    severity="success"
                    sx={{
                        bgcolor: alpha("#4caf50", isDark ? 0.12 : 0.08),
                        color: colors.text,
                        border: `1px solid ${alpha("#4caf50", 0.25)}`,
                        borderRadius: 3,
                        animation: `${fadeInUp} 0.4s ease`,
                        "& .MuiAlert-icon": { color: "#4caf50" },
                    }}
                >
                    <Typography
                        sx={{ fontWeight: 600, fontSize: "0.92rem" }}
                    >
                        Thank you for your response!
                    </Typography>
                    <Typography
                        sx={{
                            color: colors.muted,
                            fontSize: "0.82rem",
                            mt: 0.5,
                        }}
                    >
                        We&apos;ll be in touch shortly with next steps.
                    </Typography>
                </Alert>
            )}
        </>
    );
}
