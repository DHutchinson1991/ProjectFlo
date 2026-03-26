// Re-export shim — canonical FormsSettings has moved to @/features/platform/settings
export { FormsSettings } from "@/features/platform/settings/components";
export { FormsSettings as default } from "@/features/platform/settings/components";

import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Tooltip,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { api } from "@/lib/api";
import {
    NeedsAssessmentTemplate,
    NeedsAssessmentSubmission,
} from "@/lib/types";
import { useBrand } from "@/app/providers/BrandProvider";

// ── Dark design tokens ──────────────────────────────────────────────────────
const border0 = "rgba(255,255,255,0.07)";
const border1 = "rgba(255,255,255,0.12)";
const accent = "#3b82f6";
const accentLight = "rgba(59,130,246,0.1)";
const accentBorder = "rgba(59,130,246,0.35)";
const muted = "#64748b";
const body = "#cbd5e1";
const heading = "#f1f5f9";
const bg1 = "rgba(255,255,255,0.025)";
const successGreen = "#22c55e";
const successBg = "rgba(34,197,94,0.08)";

const cardSx = {
    bgcolor: bg1,
    border: `1px solid ${border0}`,
    borderRadius: "14px",
    backdropFilter: "blur(8px)",
};

export function FormsSettings() {
    const { currentBrand } = useBrand();
    const [template, setTemplate] = useState<NeedsAssessmentTemplate | null>(null);
    const [submissions, setSubmissions] = useState<NeedsAssessmentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);



    // ── Load ────────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!currentBrand?.id) return;
        try {
            setLoading(true);
            const [activeTemplate, submissionData] = await Promise.all([
                api.needsAssessmentTemplates.getActive(),
                api.needsAssessmentSubmissions.getAll(),
            ]);
            setTemplate(activeTemplate);
            setSubmissions(submissionData || []);
        } catch {
            setError("Failed to load inquiry wizard data.");
        } finally {
            setLoading(false);
        }
    }, [currentBrand?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleConvertSubmission = async (submissionId: number) => {
        try {
            await api.needsAssessmentSubmissions.convert(submissionId);
            await loadData();
        } catch { setError("Failed to convert submission."); }
    };

    // ── Loading ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={36} sx={{ color: accent }} />
                    <Typography sx={{ color: muted, fontSize: "0.8rem" }}>Loading…</Typography>
                </Stack>
            </Box>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    return (
        <Box sx={{ pb: 4 }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <Box sx={{ pt: 3, pb: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography sx={{ color: heading, fontWeight: 700, fontSize: "1.25rem" }}>Inquiry Wizard</Typography>
                    <Box component="div" sx={{ color: muted, fontSize: "0.8rem", mt: 0.25, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <span>{template?.name || "No template loaded"}</span>
                        <Chip label={template?.status || "draft"} size="small" sx={{
                            height: 18, fontSize: "0.62rem", ml: 0.5,
                            bgcolor: template?.status === "live" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                            color: template?.status === "live" ? "#4ade80" : muted, border: "none",
                        }} />
                    </Box>
                </Box>
                <Button size="small" startIcon={<OpenInNew sx={{ fontSize: "0.85rem !important" }} />}
                    onClick={() => window.open("/needs-assessment/preview", "_blank")}
                    sx={{ color: body, fontSize: "0.75rem", textTransform: "none", border: `1px solid ${border1}`, borderRadius: "8px", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", borderColor: accentBorder } }}>
                    Live Form
                </Button>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, bgcolor: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", "& .MuiAlert-icon": { color: "#ef4444" } }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, bgcolor: successBg, color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", "& .MuiAlert-icon": { color: successGreen } }}>
                    {success}
                </Alert>
            )}

            {/* ── Submissions ────────────────────────────────────────────── */}
            <Box sx={{ maxWidth: 900 }}>
                <Typography sx={{ color: heading, fontWeight: 600, mb: 2 }}>Recent Submissions</Typography>
                {submissions.length === 0 ? (
                    <Box sx={{ ...cardSx, p: 4, textAlign: "center" }}>
                        <Typography sx={{ color: muted, fontSize: "0.8rem" }}>No submissions yet</Typography>
                    </Box>
                ) : (
                    <Stack spacing={1}>
                        {submissions.map((s) => (
                            <Box key={s.id} sx={{ ...cardSx, p: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ color: heading, fontSize: "0.82rem", fontWeight: 600 }}>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {[((s.responses as any)?.contact_first_name || ""), ((s.responses as any)?.contact_last_name || "")].filter(Boolean).join(" ") || `Submission #${s.id}`}
                                    </Typography>
                                    <Typography sx={{ color: muted, fontSize: "0.72rem", mt: 0.25 }}>
                                        {new Date(s.submitted_at).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Chip label={s.status} size="small" sx={{ height: 20, fontSize: "0.62rem", bgcolor: s.status === "converted" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)", color: s.status === "converted" ? "#4ade80" : muted, border: "none" }} />
                                {s.inquiry_id ? (
                                    <Tooltip title="View inquiry">
                                        <IconButton size="small" onClick={() => window.open(`/sales/inquiries/${s.inquiry_id}`, "_blank")}
                                            sx={{ color: muted, "&:hover": { color: body } }}>
                                            <OpenInNew sx={{ fontSize: "0.85rem" }} />
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Button size="small" onClick={() => handleConvertSubmission(s.id)}
                                        sx={{ color: accent, fontSize: "0.7rem", textTransform: "none", border: `1px solid ${accentBorder}`, borderRadius: "7px", "&:hover": { bgcolor: accentLight } }}>
                                        Create Inquiry
                                    </Button>
                                )}
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

export default FormsSettings;
