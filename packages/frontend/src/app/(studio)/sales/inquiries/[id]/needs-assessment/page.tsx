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
    Stack,
    Divider,
    Paper,
    Container,
    IconButton,
    Checkbox,
    FormControlLabel,
    TextField,
    CircularProgress,
} from "@mui/material";
import { 
    Event, 
    Person, 
    Videocam, 
    Notes, 
    CheckCircle,
    ArrowBack,
    RateReview,
    ErrorOutline,
    InfoOutlined,
    Warning,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { NeedsAssessmentSubmission, NaDateConflictResult, NaCrewConflictResult } from "@/lib/types";

const MANUAL_CHECKLIST = [
    { key: 'venue_feasibility', label: 'Venue feasibility checked' },
    { key: 'coverage_scope', label: 'Coverage scope verified' },
    { key: 'budget_alignment', label: 'Budget alignment confirmed' },
];

export default function NeedsAssessmentReviewPage() {
    const params = useParams();
    const inquiryId = Number(params.id);
    const [submission, setSubmission] = useState<NeedsAssessmentSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Review state
    const [dateConflicts, setDateConflicts] = useState<NaDateConflictResult | null>(null);
    const [crewConflicts, setCrewConflicts] = useState<NaCrewConflictResult | null>(null);
    const [loadingConflicts, setLoadingConflicts] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewDone, setReviewDone] = useState(false);

    useEffect(() => {
        const loadSubmission = async () => {
            try {
                setLoading(true);
                const submissions = await api.needsAssessmentSubmissions.getByInquiryId(inquiryId);
                const sub = submissions[0] || null;
                setSubmission(sub);
                if (sub) {
                    setReviewNotes(sub.review_notes ?? '');
                    setChecklistState((sub.review_checklist_state as Record<string, boolean>) ?? {});
                    setReviewDone(!!sub.reviewed_at);
                }
            } catch (err) {
                setError("Failed to load needs assessment submission.");
            } finally {
                setLoading(false);
            }
        };

        if (inquiryId) {
            loadSubmission();
        }
    }, [inquiryId]);

    useEffect(() => {
        if (!submission) return;
        setLoadingConflicts(true);
        Promise.all([
            api.needsAssessmentSubmissions.checkDateConflicts(submission.id),
            api.needsAssessmentSubmissions.checkCrewConflicts(submission.id),
        ])
            .then(([dc, cc]) => {
                setDateConflicts(dc);
                setCrewConflicts(cc);
            })
            .catch(() => {
                setDateConflicts({ wedding_date: null, booked_conflicts: [], soft_conflicts: [] });
                setCrewConflicts({ conflicts: [] });
            })
            .finally(() => setLoadingConflicts(false));
    }, [submission?.id]);

    const handleToggleChecklist = (key: string) => {
        setChecklistState(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCompleteReview = async () => {
        if (!submission) return;
        setSubmittingReview(true);
        try {
            await api.needsAssessmentSubmissions.review(submission.id, {
                review_notes: reviewNotes || undefined,
                review_checklist_state: checklistState,
            });
            setReviewDone(true);
        } catch {
            // silently ignore — user can retry
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <Typography variant="h6">Loading needs assessment...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!submission) {
        return (
             <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="warning">No needs assessment found for this inquiry.</Alert>
                <Button sx={{ mt: 2 }} variant="outlined" onClick={() => window.close()}>
                    Close Window
                </Button>
            </Container>
        );
    }

    const data = submission.responses as Record<string, any>;

    // Helper to render sections
    const renderSection = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
        <Paper variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon}
                <Typography variant="subtitle1" fontWeight={600}>
                    {title}
                </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
                {content}
            </Box>
        </Paper>
    );

    // Helper for field display
    const Field = ({ label, value, isChip = false, fullWidth = false }: { label: string, value: any, isChip?: boolean, fullWidth?: boolean }) => {
        if (!value && value !== 0) return null;
        return (
            <Box sx={{ mb: 2, width: fullWidth ? '100%' : 'auto' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                </Typography>
                {isChip && Array.isArray(value) ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {value.map((v: string, i: number) => (
                            <Chip key={i} label={v} size="small" />
                        ))}
                    </Box>
                ) : (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {String(value)}
                    </Typography>
                )}
            </Box>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                         <IconButton onClick={() => window.close()} sx={{ border: 1, borderColor: 'divider' }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h4" component="h1" fontWeight={700}>
                            Needs Assessment Review
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ ml: 7 }}>
                        Submitted on {new Date(submission.submitted_at).toLocaleDateString()} at {new Date(submission.submitted_at).toLocaleTimeString()}
                    </Typography>
                </Box>

            </Box>

            <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid item xs={12} md={4}>
                    {renderSection("Contact Information", <Person color="primary" />, (
                        <Stack spacing={0}>
                             <Field 
                                label="Name" 
                                value={`${data.contact_first_name || ''} ${data.contact_last_name || ''}`.trim() || '-'} 
                            />
                            <Field label="Email" value={data.contact_email} />
                            <Field label="Phone" value={data.contact_phone} />
                            <Field label="Preferred Method" value={data.preferred_contact_method} />
                        </Stack>
                    ))}
                    

                </Grid>

                {/* Event & Scope */}
                <Grid item xs={12} md={8}>
                     <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                             {renderSection("Event Details", <Event color="primary" />, (
                                <Stack spacing={0}>
                                    {/* Handle both wedding_date and event_date keys if they exist */}
                                    <Field label="Event Date" value={data.wedding_date || data.event_date} />
                                    <Field label="Venue" value={data.venue_details} />
                                    <Field label="Stakeholders" value={data.stakeholders} />
                                </Stack>
                            ))}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {renderSection("Project Scope", <Videocam color="primary" />, (
                                <Stack spacing={0}>
                                    <Field label="Coverage Hours" value={data.coverage_hours} />
                                    <Field label="Deliverables" value={data.deliverables} isChip />
                                    <Box sx={{ mt: 2 }}>
                                         <Field label="Add-ons" value={data.add_ons} isChip />
                                    </Box>
                                </Stack>
                            ))}
                        </Grid>
                        
                        <Grid item xs={12}>
                             {renderSection("Notes & Additional Details", <Notes color="primary" />, (
                                <Box>
                                    <Field label="Additional Notes" value={data.notes} fullWidth />
                                    {/* Render any other fields that we didn't explicitly catch */}
                                    <Box sx={{ mt: 2 }}>
                                        {Object.entries(data)
                                            .filter(([key]) => ![
                                                'contact_first_name', 'contact_last_name', 'contact_email', 'contact_phone', 'preferred_contact_method',
                                                'budget_range', 'budget_flexible', 'decision_timeline', 'priority_level',
                                                'wedding_date', 'event_date', 'venue_details', 'stakeholders',
                                                'coverage_hours', 'deliverables', 'add_ons', 'notes'
                                            ].includes(key))
                                            .map(([key, value]) => (
                                                <Field key={key} label={key.replace(/_/g, ' ')} value={value} isChip={Array.isArray(value)} />
                                            ))}
                                    </Box>
                                </Box>
                            ))}
                        </Grid>
                     </Grid>
                </Grid>

                {/* Review Panel */}
                <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RateReview color={reviewDone ? 'success' : 'secondary'} />
                            <Typography variant="subtitle1" fontWeight={600}>
                                Review Checklist
                            </Typography>
                            {reviewDone && (
                                <Chip
                                    icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />}
                                    label="Reviewed"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                />
                            )}
                        </Box>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                {/* Conflict checks */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                        Date Conflicts
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        {loadingConflicts ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={14} />
                                                <Typography variant="body2" color="text.secondary">Checking…</Typography>
                                            </Box>
                                        ) : dateConflicts ? (
                                            <Stack spacing={0.5}>
                                                {dateConflicts.booked_conflicts.length === 0 && dateConflicts.soft_conflicts.length === 0 ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                                        <Typography variant="body2" color="success.main">No date conflicts found</Typography>
                                                    </Box>
                                                ) : (
                                                    <>
                                                        {dateConflicts.booked_conflicts.map((c) => (
                                                            <Box key={`${c.type}-${c.id}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <ErrorOutline sx={{ fontSize: 16, color: 'error.main' }} />
                                                                <Typography variant="body2" color="error.main">
                                                                    <strong>BOOKED:</strong> {c.name} ({c.status})
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                        {dateConflicts.soft_conflicts.map((c) => (
                                                            <Box key={`${c.type}-${c.id}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <InfoOutlined sx={{ fontSize: 16, color: 'warning.main' }} />
                                                                <Typography variant="body2" color="warning.main">
                                                                    <strong>UNBOOKED:</strong> {c.name} ({c.status})
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </>
                                                )}
                                            </Stack>
                                        ) : null}
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                        Crew Availability
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        {loadingConflicts ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={14} />
                                                <Typography variant="body2" color="text.secondary">Checking…</Typography>
                                            </Box>
                                        ) : crewConflicts ? (
                                            crewConflicts.conflicts.length === 0 ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                                    <Typography variant="body2" color="success.main">No crew conflicts found</Typography>
                                                </Box>
                                            ) : (
                                                <Stack spacing={0.5}>
                                                    {crewConflicts.conflicts.map((c) => (
                                                        <Box key={c.contributor_id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Warning sx={{ fontSize: 16, color: 'error.main' }} />
                                                            <Typography variant="body2" color="error.main">
                                                                <strong>{c.name}</strong> ({c.role}) — {c.event_title}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            )
                                        ) : null}
                                    </Box>
                                </Grid>

                                {/* Manual checklist */}
                                <Grid item xs={12}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                        Manual Checklist
                                    </Typography>
                                    <Stack spacing={0} sx={{ mt: 1 }}>
                                        {MANUAL_CHECKLIST.map((item) => (
                                            <FormControlLabel
                                                key={item.key}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={!!checklistState[item.key]}
                                                        onChange={() => handleToggleChecklist(item.key)}
                                                    />
                                                }
                                                label={<Typography variant="body2">{item.label}</Typography>}
                                            />
                                        ))}
                                    </Stack>
                                </Grid>

                                {/* Review notes */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        label="Review notes (optional)"
                                        placeholder="Add any notes about this assessment…"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        size="small"
                                        disabled={reviewDone}
                                    />
                                </Grid>

                                {/* Complete button */}
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        color={reviewDone ? 'success' : 'primary'}
                                        disabled={submittingReview || reviewDone}
                                        onClick={handleCompleteReview}
                                        startIcon={reviewDone ? <CheckCircle /> : <RateReview />}
                                    >
                                        {submittingReview ? 'Saving…' : reviewDone ? 'Review Complete' : 'Complete Review'}
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

