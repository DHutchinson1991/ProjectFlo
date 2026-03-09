'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Stack,
    Grid,
    Snackbar,
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';
import { inquiriesService, api } from '@/lib/api';

// Extracted _detail barrel — types, constants, helpers, components
import {
    // helpers
    getConversionScore,
    getDaysInPipeline,
    calculateWorkflowProgress,
    // constants
    WORKFLOW_PHASES,
    // components
    WorkflowCard,
    CommandCenterHeader,
    PhaseOverview,
    EstimatesCard,
    ProposalsCard,
    QuotesCard,
    ContractsCard,
    CallsCard,
    ConsultationCard,
    ClientApprovalCard,
    ActivityLogCard,
    NeedsAssessmentDialog,
} from './_detail';

// Existing per-inquiry sub-components (unchanged)
import EventDetailsCard from './components/EventDetailsCard';
import PackageScopeCard from './components/PackageScopeCard';
import SalesBudgetCard from './components/SalesBudgetCard';
import LeadInfoCard from './components/LeadInfoCard';


/* ================================================================== */
/*  InquiryDetailPage — slim orchestrator                             */
/* ================================================================== */
export default function InquiryDetailPage() {
    const params = useParams();
    const inquiryId = parseInt(params.id as string);

    /* ---- core state ---- */
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [needsAssessmentSubmission, setNeedsAssessmentSubmission] =
        useState<NeedsAssessmentSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });
    const [naDialogOpen, setNaDialogOpen] = useState(false);

    /* ---- data loading ---- */
    useEffect(() => {
        loadInquiry();
    }, [inquiryId]);

    const loadInquiry = async () => {
        try {
            setLoading(true);
            const data = await inquiriesService.getById(inquiryId);
            setInquiry(data);

            try {
                const submissions = await api.needsAssessmentSubmissions.getByInquiryId(inquiryId);
                setNeedsAssessmentSubmission(submissions[0] || null);
            } catch {
                setNeedsAssessmentSubmission(null);
            }
        } catch (err) {
            console.error('Error loading inquiry:', err);
            setError('Failed to load inquiry details');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        await loadInquiry();
        setSnackbar({ open: true, message: 'Data refreshed successfully', severity: 'success' });
    };

    /* ---- loading / error guards ---- */
    if (loading) {
        return (
            <Box sx={{ width: '100%', px: 3, py: 4 }}>
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" gap={2}>
                    <Box sx={{ position: 'relative' }}>
                        <CircularProgress size={48} thickness={3} sx={{ color: '#3b82f6' }} />
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Assignment sx={{ fontSize: 20, color: '#3b82f640' }} />
                        </Box>
                    </Box>
                    <Typography sx={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Loading inquiry...</Typography>
                </Box>
            </Box>
        );
    }

    if (error) return <Box sx={{ width: '100%', px: 3, py: 4 }}><Alert severity="error">{error}</Alert></Box>;
    if (!inquiry) return <Box sx={{ width: '100%', px: 3, py: 4 }}><Alert severity="warning">Inquiry not found</Alert></Box>;

    /* ---- computed values ---- */
    const workflowProgress = calculateWorkflowProgress(inquiry);
    const completedCount = Math.floor((workflowProgress / 100) * WORKFLOW_PHASES.length);
    const activeIndex = Math.min(completedCount, WORKFLOW_PHASES.length - 1);
    const currentPhase = WORKFLOW_PHASES[activeIndex].id;
    const currentPhaseData = WORKFLOW_PHASES[activeIndex];
    const IconComponent = currentPhaseData?.icon || Assignment;

    const conversionData = getConversionScore(inquiry);
    const daysInPipeline = getDaysInPipeline(inquiry);
    const dealValue = (() => {
        const primaryEst = inquiry.estimates?.find(e => e.is_primary) ?? inquiry.estimates?.[0];
        return primaryEst ? Number(primaryEst.total_amount || 0) : 0;
    })();

    /* ---- helpers for phase lookup ---- */
    const phaseColor = (id: string) => WORKFLOW_PHASES.find((p) => p.id === id)?.color;

    /* ---- render ---- */
    return (
        <Box sx={{ minHeight: '100vh', p: 3 }}>
            {/* --- COMMAND CENTER HEADER --- */}
            <CommandCenterHeader
                inquiry={inquiry}
                needsAssessmentSubmission={needsAssessmentSubmission}
                conversionData={conversionData}
                daysInPipeline={daysInPipeline}
                dealValue={dealValue}
                onRefresh={handleRefresh}
                onOpenAssessment={() => setNaDialogOpen(true)}
                onSnackbar={(msg) => setSnackbar({ open: true, message: msg, severity: 'success' })}
            />

            {/* --- PHASE OVERVIEW --- */}
            <PhaseOverview
                currentPhase={currentPhase}
                currentPhaseData={currentPhaseData}
                activeIndex={activeIndex}
                inquiryId={inquiry.id}
                IconComponent={IconComponent}
            />

            {/* --- MAIN THREE-COLUMN WORKSPACE --- */}
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
                {/* LEFT COLUMN */}
                <Grid item xs={12} md={5}>
                    <Stack spacing={3}>
                        <div id="needs-assessment-section">
                            <EventDetailsCard
                                inquiry={inquiry}
                                onRefresh={handleRefresh}
                                isActive={currentPhase === 'needs-assessment'}
                                activeColor={phaseColor('needs-assessment')}
                                submission={needsAssessmentSubmission}
                                WorkflowCard={WorkflowCard}
                            />
                        </div>

                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <PackageScopeCard
                                    inquiry={inquiry}
                                    onRefresh={handleRefresh}
                                    isActive={currentPhase === 'needs-assessment'}
                                    activeColor={phaseColor('needs-assessment')}
                                    submission={needsAssessmentSubmission}
                                    WorkflowCard={WorkflowCard}
                                />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <SalesBudgetCard
                                    inquiry={inquiry}
                                    onRefresh={handleRefresh}
                                    isActive={currentPhase === 'needs-assessment'}
                                    activeColor={phaseColor('needs-assessment')}
                                    submission={needsAssessmentSubmission}
                                    WorkflowCard={WorkflowCard}
                                />
                            </Box>
                        </Box>

                        <LeadInfoCard inquiry={inquiry} submission={needsAssessmentSubmission} WorkflowCard={WorkflowCard} />

                        <div id="estimates-section">
                            <EstimatesCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'estimates'} activeColor={phaseColor('estimates')} />
                        </div>
                    </Stack>
                </Grid>

                {/* MIDDLE COLUMN */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        <div id="calls-section">
                            <CallsCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'calls'} activeColor={phaseColor('calls')} submission={needsAssessmentSubmission} />
                        </div>
                        <div id="proposals-section">
                            <ProposalsCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'proposals'} activeColor={phaseColor('proposals')} />
                        </div>
                        <div id="consultation-section">
                            <ConsultationCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'consultation'} activeColor={phaseColor('consultation')} submission={needsAssessmentSubmission} />
                        </div>
                        <div id="quotes-section">
                            <QuotesCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'quotes'} activeColor={phaseColor('quotes')} />
                        </div>
                    </Stack>
                </Grid>

                {/* RIGHT COLUMN */}
                <Grid item xs={12} md={3}>
                    <Stack spacing={3}>
                        <div id="contracts-section">
                            <ContractsCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'contracts'} activeColor={phaseColor('contracts')} />
                        </div>
                        <div id="approval-section">
                            <ClientApprovalCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'approval'} activeColor={phaseColor('approval')} />
                        </div>
                        <div id="activity-section">
                            <ActivityLogCard inquiry={inquiry} onRefresh={handleRefresh} />
                        </div>
                    </Stack>
                </Grid>
            </Grid>

            {/* --- NEEDS ASSESSMENT DIALOG --- */}
            <NeedsAssessmentDialog
                open={naDialogOpen}
                onClose={() => setNaDialogOpen(false)}
                submission={needsAssessmentSubmission}
                inquiryId={inquiryId}
            />

            {/* --- SNACKBAR --- */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                message={snackbar.message}
            />
        </Box>
    );
}
