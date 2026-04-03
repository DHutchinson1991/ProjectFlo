"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    Close as CloseIcon,
    ChatBubbleOutline as ChatBubbleIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { fadeInUp, pulseGlow, revealSx, useReveal } from "@/features/workflow/proposals/utils/portal/animations";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";
import type { ProposalSectionNote } from "@/features/workflow/proposals/types";

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
    /** True when the acceptance wizard is actively shown (hides CTA) */
    showingAcceptanceWizard?: boolean;
    /** Called when customer clicks "Accept Proposal" */
    onAccept: () => void;
    /** Called when customer submits a change request */
    onRequestChanges: (message: string) => void;
    /** Called when customer submits for reconsideration — a softer review request */
    onRequestReconsideration?: (message: string) => void;
    /** Called when returning user clicks "Continue Setup" after already accepting */
    onContinueSetup?: () => void;
    /** Section notes left by client during proposal review */
    sectionNotes?: ProposalSectionNote[];
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
    showingAcceptanceWizard,
    onAccept,
    onRequestChanges,
    onRequestReconsideration,
    onContinueSetup,
    sectionNotes = [],
}: ProposalAcceptanceBarProps) {
    const ctaReveal = useReveal();
    const [showChangesForm, setShowChangesForm] = useState(false);
    const [showReconsiderationForm, setShowReconsiderationForm] = useState(false);
    const [changesMessage, setChangesMessage] = useState("");
    const [reconsiderationMessage, setReconsiderationMessage] = useState("");
    const [notesExpanded, setNotesExpanded] = useState(false);

    const handleSubmitChanges = () => {
        if (changesMessage.trim()) {
            onRequestChanges(changesMessage.trim());
        }
    };

    const handleSubmitReconsideration = () => {
        if (reconsiderationMessage.trim() && onRequestReconsideration) {
            onRequestReconsideration(reconsiderationMessage.trim());
        }
    };

    const noteCount = sectionNotes.length;
    const hasSignificantNotes = noteCount >= 3;

    const SECTION_LABELS: Record<string, string> = {
        text: "Message", pricing: "Pricing", films: "Films", schedule: "Schedule",
        team: "Team", locations: "Locations", quote: "Quote", "payment-terms": "Payment Terms",
        contract: "Contract", "event-details": "Event Details",
    };

    /** Build a summary message from section notes for reconsideration */
    const buildNotesSummary = () =>
        sectionNotes.map(n =>
            `${SECTION_LABELS[n.section_type] ?? n.section_type}: ${n.note}`
        ).join("\n");

    const handleReviewWithNotes = () => {
        if (onRequestReconsideration) {
            onRequestReconsideration(
                `Client submitted for review with ${noteCount} section note${noteCount === 1 ? "" : "s"}:\n\n${buildNotesSummary()}`
            );
        }
    };

    // If the acceptance wizard is showing, don't render anything here
    if (showingAcceptanceWizard) return null;

    return (
        <>
            {/* ── Already-Responded Banner ──────────────────── */}
            {alreadyResponded && (
                <Box sx={{ textAlign: "center", py: { xs: 1, md: 2 } }}>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: "50%", mx: "auto", mb: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: alpha(
                            clientResponse === "accepted" ? "#4caf50" : colors.accent,
                            isDark ? 0.12 : 0.08,
                        ),
                        border: `1px solid ${alpha(
                            clientResponse === "accepted" ? "#4caf50" : colors.accent,
                            0.25,
                        )}`,
                    }}>
                        {clientResponse === "accepted"
                            ? <CheckCircleIcon sx={{ fontSize: 24, color: "#4caf50" }} />
                            : <EditIcon sx={{ fontSize: 20, color: colors.accent }} />}
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "1.05rem", color: colors.text, mb: 0.5 }}>
                        {clientResponse === "accepted"
                            ? "You\u2019re all set!"
                            : clientResponse === "reconsideration"
                                ? "Submitted for review"
                                : "Changes requested"}
                    </Typography>
                    <Typography sx={{ color: colors.muted, fontSize: "0.84rem", lineHeight: 1.6, maxWidth: 360, mx: "auto" }}>
                        {clientResponse === "accepted"
                            ? onContinueSetup
                                ? "Just a couple more steps to finalise everything."
                                : "We\u2019ll be in touch with next steps soon."
                            : clientResponse === "reconsideration"
                                ? "We\u2019ll review your feedback and get back to you shortly."
                                : "We\u2019ve received your feedback and will follow up shortly."}
                    </Typography>
                    {clientResponse === "accepted" && onContinueSetup && (
                        <Button
                            variant="contained"
                            size="medium"
                            onClick={onContinueSetup}
                            sx={{
                                mt: 2.5,
                                background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                color: "#fff",
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                borderRadius: 3,
                                px: 4, py: 1.25,
                                boxShadow: `0 6px 24px ${alpha(colors.gradient1, 0.3)}`,
                                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                "&:hover": {
                                    boxShadow: `0 10px 40px ${alpha(colors.gradient1, 0.4)}`,
                                    transform: "translateY(-2px) scale(1.02)",
                                },
                            }}
                        >
                            Continue Setup &rarr;
                        </Button>
                    )}
                    {clientResponseMessage && (
                        <Typography
                            sx={{
                                color: alpha(colors.muted, 0.7),
                                fontSize: "0.78rem",
                                mt: 2,
                                fontStyle: "italic",
                                lineHeight: 1.6,
                                maxWidth: 320,
                                mx: "auto",
                            }}
                        >
                            &ldquo;{clientResponseMessage}&rdquo;
                        </Typography>
                    )}
                </Box>
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
                        {hasSignificantNotes
                            ? "You've left some detailed feedback across the proposal."
                            : "Accept this proposal to lock in your date and pricing, or request any changes you\u2019d like."}
                    </Typography>

                    {/* ── Feedback Summary (when notes exist) ──── */}
                    {noteCount > 0 && (
                        <Box sx={{
                            mb: 4, maxWidth: 480, mx: "auto", textAlign: "left",
                            animation: `${fadeInUp} 0.3s ease`,
                        }}>
                            <Box
                                onClick={() => setNotesExpanded(p => !p)}
                                sx={{
                                    display: "flex", alignItems: "center", gap: 1,
                                    cursor: "pointer", userSelect: "none",
                                    py: 1.5, px: 2, borderRadius: 2.5,
                                    bgcolor: alpha(colors.accent, isDark ? 0.08 : 0.05),
                                    border: `1px solid ${alpha(colors.accent, 0.15)}`,
                                    transition: "all 0.2s ease",
                                    "&:hover": { bgcolor: alpha(colors.accent, isDark ? 0.12 : 0.08) },
                                }}
                            >
                                <ChatBubbleIcon sx={{ fontSize: 16, color: colors.accent }} />
                                <Typography sx={{
                                    flex: 1, fontSize: "0.82rem", fontWeight: 600,
                                    color: colors.text,
                                }}>
                                    You left feedback on {noteCount} section{noteCount === 1 ? "" : "s"}
                                </Typography>
                                {notesExpanded
                                    ? <ExpandLessIcon sx={{ fontSize: 18, color: colors.muted }} />
                                    : <ExpandMoreIcon sx={{ fontSize: 18, color: colors.muted }} />}
                            </Box>

                            {notesExpanded && (
                                <Box sx={{
                                    mt: 1, px: 2, py: 1.5, borderRadius: 2,
                                    bgcolor: alpha(colors.card, isDark ? 0.4 : 0.8),
                                    border: `1px solid ${alpha(colors.border, 0.3)}`,
                                    animation: `${fadeInUp} 0.2s ease`,
                                }}>
                                    {sectionNotes.map((n, i) => (
                                        <Box key={n.section_type} sx={{
                                            py: 1,
                                            borderTop: i > 0 ? `1px solid ${alpha(colors.border, 0.15)}` : "none",
                                        }}>
                                            <Typography sx={{
                                                fontSize: "0.7rem", fontWeight: 600,
                                                color: colors.accent, textTransform: "uppercase",
                                                letterSpacing: "0.06em", mb: 0.3,
                                            }}>
                                                {SECTION_LABELS[n.section_type] ?? n.section_type}
                                            </Typography>
                                            <Typography sx={{
                                                fontSize: "0.8rem", color: colors.text,
                                                lineHeight: 1.5,
                                            }}>
                                                &ldquo;{n.note}&rdquo;
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {!hasSignificantNotes && (
                                <Typography sx={{
                                    fontSize: "0.75rem", color: alpha(colors.muted, 0.7),
                                    mt: 1, px: 0.5, lineHeight: 1.5,
                                }}>
                                    Your notes will be shared with the studio when you confirm.
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* ── Self-triage (3+ notes) ──────────────── */}
                    {hasSignificantNotes && onRequestReconsideration ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
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
                                    px: 4, py: 1.5,
                                    borderRadius: 3,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    letterSpacing: 0.5,
                                    boxShadow: `0 6px 24px ${alpha(colors.gradient1, 0.25)}`,
                                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                    "&:hover": {
                                        boxShadow: `0 10px 40px ${alpha(colors.gradient1, 0.4)}`,
                                        transform: "translateY(-2px) scale(1.02)",
                                    },
                                    "&:active": { transform: "translateY(0) scale(0.98)" },
                                }}
                            >
                                {responding ? "Processing..." : "These are minor \u2014 Accept & Share Notes"}
                            </Button>

                            <Typography sx={{ fontSize: "0.72rem", color: alpha(colors.muted, 0.5) }}>or</Typography>

                            <Button
                                variant="outlined"
                                size="large"
                                disabled={responding}
                                onClick={handleReviewWithNotes}
                                startIcon={
                                    responding ? (
                                        <CircularProgress size={18} color="inherit" />
                                    ) : (
                                        <ChatBubbleIcon />
                                    )
                                }
                                sx={{
                                    borderColor: alpha(colors.accent, 0.35),
                                    color: colors.accent,
                                    px: 4, py: 1.5,
                                    borderRadius: 3,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "0.92rem",
                                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                    "&:hover": {
                                        borderColor: colors.accent,
                                        bgcolor: alpha(colors.accent, 0.06),
                                        transform: "translateY(-1px)",
                                    },
                                    "&:active": { transform: "translateY(0)" },
                                }}
                            >
                                {responding ? "Sending..." : "I\u2019d like the studio to review these first"}
                            </Button>
                        </Box>
                    ) : (
                    /* ── Standard CTA (0-2 notes or no reconsideration handler) ── */
                    <>
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
                        ) : !showReconsiderationForm ? (
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

                                {/* Reconsideration link at bottom of changes form */}
                                {onRequestReconsideration && (
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={() => {
                                            setShowChangesForm(false);
                                            setShowReconsiderationForm(true);
                                            setChangesMessage("");
                                        }}
                                        sx={{
                                            mt: 1,
                                            color: alpha(colors.muted, 0.6),
                                            textTransform: "none",
                                            fontWeight: 500,
                                            fontSize: "0.78rem",
                                            "&:hover": {
                                                color: colors.accent,
                                                bgcolor: alpha(colors.accent, 0.04),
                                            },
                                        }}
                                    >
                                        Or submit for reconsideration instead
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            /* ── Reconsideration Form ──────────────── */
                            <Box
                                sx={{
                                    mt: 2,
                                    animation: `${fadeInUp} 0.3s ease`,
                                    maxWidth: 480,
                                    mx: "auto",
                                    textAlign: "left",
                                }}
                            >
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                    <Typography sx={{ color: colors.text, fontWeight: 600, fontSize: "0.88rem" }}>
                                        Submit for Reconsideration
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setShowReconsiderationForm(false);
                                            setReconsiderationMessage("");
                                        }}
                                        startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                                        sx={{ color: colors.muted, minWidth: "auto", textTransform: "none", fontSize: "0.75rem" }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                                <Typography sx={{
                                    color: alpha(colors.muted, 0.8),
                                    fontSize: "0.82rem", mb: 1.5, lineHeight: 1.6,
                                }}>
                                    Let us know what you&apos;d like reconsidered.
                                    We&apos;ll review your feedback and come back with an updated proposal.
                                </Typography>
                                <TextField
                                    multiline
                                    minRows={3}
                                    fullWidth
                                    value={reconsiderationMessage}
                                    onChange={(e) => setReconsiderationMessage(e.target.value)}
                                    placeholder="What would you like us to reconsider? (pricing, coverage, scheduling...)"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2.5,
                                            bgcolor: alpha(colors.card, isDark ? 0.5 : 1),
                                            color: colors.text,
                                            fontSize: "0.88rem",
                                            "& fieldset": { borderColor: alpha(colors.border, 0.6) },
                                            "&:hover fieldset": { borderColor: alpha(colors.accent, 0.3) },
                                            "&.Mui-focused fieldset": { borderColor: colors.accent },
                                        },
                                        "& .MuiInputBase-input::placeholder": { color: alpha(colors.muted, 0.5) },
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={!reconsiderationMessage.trim() || responding}
                                    onClick={handleSubmitReconsideration}
                                    startIcon={responding ? <CircularProgress size={14} color="inherit" /> : <EditIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                        mt: 1.5,
                                        borderColor: alpha(colors.accent, 0.3),
                                        color: colors.accent,
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        "&:hover": { borderColor: colors.accent, bgcolor: alpha(colors.accent, 0.06) },
                                        "&.Mui-disabled": { borderColor: alpha(colors.border, 0.3), color: alpha(colors.muted, 0.4) },
                                    }}
                                >
                                    {responding ? "Sending..." : "Submit for Review"}
                                </Button>
                            </Box>
                        )}
                    </Box>
                    </>
                    )}
                </Box>
            )}

            {/* ── Success Response ────────────────────────────── */}
            {responseSuccess && (
                <Box sx={{
                    textAlign: "center", py: { xs: 1, md: 2 },
                    animation: `${fadeInUp} 0.4s ease`,
                }}>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: "50%", mx: "auto", mb: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: alpha("#4caf50", isDark ? 0.12 : 0.08),
                        border: `1px solid ${alpha("#4caf50", 0.25)}`,
                    }}>
                        <CheckCircleIcon sx={{ fontSize: 24, color: "#4caf50" }} />
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "1.05rem", color: colors.text }}>
                        Thank you!
                    </Typography>
                    <Typography sx={{ color: colors.muted, fontSize: "0.84rem", mt: 0.5, lineHeight: 1.6 }}>
                        We&apos;ll be in touch shortly with next steps.
                    </Typography>
                </Box>
            )}
        </>
    );
}
