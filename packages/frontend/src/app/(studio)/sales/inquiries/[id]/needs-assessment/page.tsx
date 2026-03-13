"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Alert,
    Button,
    Grid,
    Chip,
    Stack,
    Divider,
    Paper,
    Container,
    IconButton
} from "@mui/material";
import { 
    Event, 
    Person, 
    Videocam, 
    Notes, 
    AccessTime, 
    CheckCircle,
    ArrowBack
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { NeedsAssessmentSubmission } from "@/lib/types";

export default function NeedsAssessmentReviewPage() {
    const params = useParams();
    const inquiryId = Number(params.id);
    const [submission, setSubmission] = useState<NeedsAssessmentSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSubmission = async () => {
            try {
                setLoading(true);
                const submissions = await api.needsAssessmentSubmissions.getByInquiryId(inquiryId);
                setSubmission(submissions[0] || null);
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
            </Grid>
        </Container>
    );
}
