"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    Typography,
    Alert,
    Button,
    Grid,
    Chip,
    Divider,
    Paper,
    Container,
    IconButton,
    Checkbox,
    FormControlLabel,
    TextField,
} from "@mui/material";
import { CheckCircle, ArrowBack, RateReview } from "@mui/icons-material";
import type { InquiryWizardSubmission, IwDateConflictResult, IwCrewConflictResult } from "../types";
import { inquiryWizardSubmissionsApi } from "../api";
import ReviewDataSections from "../components/ReviewDataSections";
import ReviewConflictPanel from "../components/ReviewConflictPanel";

const MANUAL_CHECKLIST = [
    { key: "venue_feasibility", label: "Venue feasibility checked" },
    { key: "coverage_scope", label: "Coverage scope verified" },
    { key: "budget_alignment", label: "Budget alignment confirmed" },
];

export default function InquiryWizardReviewScreen() {
    const params = useParams();
    const inquiryId = Number(params.id);

    const [submission, setSubmission] = useState<InquiryWizardSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateConflicts, setDateConflicts] = useState<IwDateConflictResult | null>(null);
    const [crewConflicts, setCrewConflicts] = useState<IwCrewConflictResult | null>(null);
    const [loadingConflicts, setLoadingConflicts] = useState(false);
    const [reviewNotes, setReviewNotes] = useState("");
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewDone, setReviewDone] = useState(false);

    useEffect(() => {
        if (!inquiryId) return;
        const load = async () => {
            try {
                setLoading(true);
                const submissions = await inquiryWizardSubmissionsApi.getByInquiryId(inquiryId);
                const sub = submissions[0] || null;
                setSubmission(sub);
                if (sub) {
                    setReviewNotes(sub.review_notes ?? "");
                    setChecklistState((sub.review_checklist_state as Record<string, boolean>) ?? {});
                    setReviewDone(!!sub.reviewed_at);
                }
            } catch {
                setError("Failed to load inquiry wizard submission.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [inquiryId]);

    useEffect(() => {
        if (!submission) return;
        setLoadingConflicts(true);
        Promise.all([
            inquiryWizardSubmissionsApi.checkDateConflicts(submission.id),
            inquiryWizardSubmissionsApi.checkCrewConflicts(submission.id),
        ])
            .then(([dc, cc]) => { setDateConflicts(dc); setCrewConflicts(cc); })
            .catch(() => {
                setDateConflicts({ wedding_date: null, booked_conflicts: [], soft_conflicts: [] });
                setCrewConflicts({ conflicts: [] });
            })
            .finally(() => setLoadingConflicts(false));
    }, [submission?.id]);

    const handleToggleChecklist = (key: string) =>
        setChecklistState(prev => ({ ...prev, [key]: !prev[key] }));

    const handleCompleteReview = async () => {
        if (!submission) return;
        setSubmittingReview(true);
        try {
            await inquiryWizardSubmissionsApi.review(submission.id, {
                review_notes: reviewNotes || undefined,
                review_checklist_state: checklistState,
            });
            setReviewDone(true);
        } catch { /* user can retry */ } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
                <Typography variant="h6">Loading needs assessment...</Typography>
            </Box>
        );
    }
    if (error) {
        return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }
    if (!submission) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="warning">No needs assessment found for this inquiry.</Alert>
                <Button sx={{ mt: 2 }} variant="outlined" onClick={() => window.close()}>Close Window</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                        <IconButton onClick={() => window.close()} sx={{ border: 1, borderColor: "divider" }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h4" component="h1" fontWeight={700}>Needs Assessment Review</Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ ml: 7 }}>
                        Submitted on {new Date(submission.submitted_at).toLocaleDateString()} at{" "}
                        {new Date(submission.submitted_at).toLocaleTimeString()}
                    </Typography>
                </Box>
            </Box>

            <ReviewDataSections data={submission.responses as Record<string, unknown>} />

            <Grid container spacing={3} sx={{ mt: 0 }}>
                <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                        <Box sx={{ p: 2, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                            <RateReview color={reviewDone ? "success" : "secondary"} />
                            <Typography variant="subtitle1" fontWeight={600}>Review Checklist</Typography>
                            {reviewDone && (
                                <Chip
                                    icon={<CheckCircle sx={{ fontSize: "1rem !important" }} />}
                                    label="Reviewed" size="small" color="success" variant="outlined" sx={{ ml: 1 }}
                                />
                            )}
                        </Box>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <ReviewConflictPanel
                                        dateConflicts={dateConflicts}
                                        crewConflicts={crewConflicts}
                                        loadingConflicts={loadingConflicts}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                                        Manual Checklist
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        {MANUAL_CHECKLIST.map((item) => (
                                            <FormControlLabel
                                                key={item.key}
                                                control={<Checkbox size="small" checked={!!checklistState[item.key]} onChange={() => handleToggleChecklist(item.key)} />}
                                                label={<Typography variant="body2">{item.label}</Typography>}
                                            />
                                        ))}
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth multiline minRows={3}
                                        label="Review notes (optional)"
                                        placeholder="Add any notes about this assessment…"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        size="small" disabled={reviewDone}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        color={reviewDone ? "success" : "primary"}
                                        disabled={submittingReview || reviewDone}
                                        onClick={handleCompleteReview}
                                        startIcon={reviewDone ? <CheckCircle /> : <RateReview />}
                                    >
                                        {submittingReview ? "Saving…" : reviewDone ? "Review Complete" : "Complete Review"}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
