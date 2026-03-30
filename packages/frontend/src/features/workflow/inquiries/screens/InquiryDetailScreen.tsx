'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useBrand } from '@/features/platform/brand';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Stack,
    Grid,
    Snackbar,
    Tabs,
    Tab,
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { Inquiry, InquiryTask, NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { taskLibraryApi } from '@/features/catalog/task-library';
import { inquiryWizardSubmissionsApi } from '@/features/workflow/inquiry-wizard';
import { calendarApi, type BackendUserAccount } from '@/features/workflow/calendar/api';
import { computeTaxBreakdown } from '@/shared/utils/pricing';

import {
    getConversionScore,
    getDaysInPipeline,
    getActivePhaseFromTasks,
    buildPipelineTasks,
    buildPipelineTasksFromInquiry,
    WORKFLOW_PHASES,
} from '../lib';
import type { PipelineTask } from '../lib';

import {
    WorkflowCard,
    CommandCenterHeader,
    PhaseOverview,
    EstimatesCard,
    PaymentTermsCard,
    ProposalsCard,
    QuotesCard,
    ContractsCard,
    CallsCard,
    ProposalReviewCard,
    ClientApprovalCard,
    DiscoveryQuestionnaireCard,
    QualifyCard,
    EventDetailsCard,
    AvailabilityCard,
    PackageScopeCard,
    NeedsAssessmentDialog,
    InquirySchedulePreview,
} from '../components';


/* ================================================================== */
/*  InquiryDetailScreen — slim orchestrator                           */
/* ================================================================== */
export default function InquiryDetailScreen() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const inquiryId = parseInt(params.id as string);
    const { currentBrand } = useBrand();

    /* ---- core state ---- */
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [needsAssessmentSubmission, setNeedsAssessmentSubmission] =
        useState<NeedsAssessmentSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [activeTab, setActiveTab] = useState<'overview' | 'package-details'>('overview');

    const [pipelineTasks, setPipelineTasks] = useState<PipelineTask[]>([]);
    const [inquiryTasksData, setInquiryTasksData] = useState<InquiryTask[]>([]);
    const [hasRealTasks, setHasRealTasks] = useState(false);
    const [crew, setCrew] = useState<BackendUserAccount[]>([]);;
    const [needsAssessmentDialogOpen, setNeedsAssessmentDialogOpen] = useState(false);

    /* ---- data loading ---- */
    useEffect(() => {
        loadInquiry();
    }, [inquiryId]);

    useEffect(() => {
        if (currentBrand?.id) {
            loadPipelineTasks();
            loadCrew();
        }
    }, [inquiryId, currentBrand?.id]);

    useEffect(() => {
        setNeedsAssessmentDialogOpen(searchParams.get('open') === 'needs-assessment');
    }, [searchParams]);

    const loadInquiry = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const data = await inquiriesApi.getById(inquiryId);
            setInquiry(data);

            try {
                const submissions = await inquiryWizardSubmissionsApi.getByInquiryId(inquiryId);
                setNeedsAssessmentSubmission(submissions[0] || null);
            } catch {
                setNeedsAssessmentSubmission(null);
            }
        } catch (err) {
            console.error('Error loading inquiry:', err);
            setError('Failed to load inquiry details');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const loadCrew = async () => {
        try {
            const data = await calendarApi.getUserAccounts();
            setCrew(data);
        } catch (err) {
            console.error('Error loading user accounts:', err);
        }
    };

    const loadPipelineTasks = async () => {
        // Try loading existing real tasks
        try {
            const inquiryTasks: InquiryTask[] = await inquiriesApi.inquiryTasks.getAll(inquiryId);
            if (inquiryTasks.length > 0) {
                setInquiryTasksData(inquiryTasks);
                setPipelineTasks(buildPipelineTasksFromInquiry(inquiryTasks));
                setHasRealTasks(true);
                return;
            }
        } catch (err) {
            console.error('Error loading inquiry tasks:', err);
        }

        // No tasks loaded — try auto-generating from task library
        try {
            const generated: InquiryTask[] = await inquiriesApi.inquiryTasks.generate(inquiryId);
            if (generated.length > 0) {
                setInquiryTasksData(generated);
                setPipelineTasks(buildPipelineTasksFromInquiry(generated));
                setHasRealTasks(true);
                return;
            }
        } catch (err) {
            console.error('Error generating inquiry tasks:', err);
        }

        // Fallback: show read-only task library templates
        try {
            const grouped = await taskLibraryApi.getGroupedByPhase();
            const inquiryPhaseTasks = grouped['Inquiry'] ?? [];
            const bookingPhaseTasks = grouped['Booking'] ?? [];
            setInquiryTasksData([]);
            setPipelineTasks(buildPipelineTasks([...inquiryPhaseTasks, ...bookingPhaseTasks]));
        } catch (err) {
            console.error('Error loading fallback pipeline tasks:', err);
            setInquiryTasksData([]);
            setPipelineTasks([]);
        }

        setHasRealTasks(false);
    };

    const handleRefresh = async () => {
        await Promise.all([loadInquiry(false), loadPipelineTasks()]);
    };

    const handleCloseNeedsAssessmentDialog = () => {
        setNeedsAssessmentDialogOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('open');
        const query = params.toString();
        router.replace(query ? `/inquiries/${inquiryId}?${query}` : `/inquiries/${inquiryId}`);
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
    const currentPhase = getActivePhaseFromTasks(pipelineTasks, inquiry);

    const conversionData = getConversionScore(inquiry);
    const daysInPipeline = getDaysInPipeline(inquiry);
    const primaryEst = inquiry.estimates?.find(e => e.is_primary) ?? inquiry.estimates?.[0];
    const dealValue = primaryEst ? computeTaxBreakdown(Number(primaryEst.total_amount ?? 0), Number(currentBrand?.default_tax_rate ?? 0)).total : 0;

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
                onSnackbar={(msg) => setSnackbar({ open: true, message: msg, severity: 'success' })}
            />

            {/* --- PHASE OVERVIEW --- */}
            <PhaseOverview
                inquiry={inquiry}
                pipelineTasks={pipelineTasks}
                hasRealTasks={hasRealTasks}
            />

            {/* --- TABS & CONTENT --- */}
            <Box sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#64748b',
                            minHeight: 44,
                            '&.Mui-selected': {
                                color: '#3b82f6',
                            },
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            backgroundColor: '#3b82f6',
                        },
                    }}
                >
                    <Tab label="Overview" value="overview" />
                    {inquiry.selected_package_id && <Tab label="Package Details" value="package-details" />}
                </Tabs>
            </Box>

            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'overview' && (
                <Grid container spacing={3}>
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

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                                    gap: 2,
                                    alignItems: 'start',
                                }}
                            >
                                <div id="availability-section">
                                    <AvailabilityCard
                                        inquiry={inquiry}
                                        inquiryTasks={inquiryTasksData}
                                        isActive={currentPhase === 'needs-assessment'}
                                        activeColor={phaseColor('needs-assessment')}
                                        onTasksChanged={() => { loadPipelineTasks(); }}
                                        WorkflowCard={WorkflowCard}
                                    />
                                </div>

                                <Stack spacing={2}>
                                    <PackageScopeCard
                                        inquiry={inquiry}
                                        onRefresh={handleRefresh}
                                        isActive={currentPhase === 'needs-assessment'}
                                        activeColor={phaseColor('needs-assessment')}
                                        submission={needsAssessmentSubmission}
                                        WorkflowCard={WorkflowCard}
                                        onPackageDetailsClick={() => setActiveTab('package-details')}
                                    />

                                    <div id="payment-terms-section">
                                        <PaymentTermsCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'estimates'} activeColor={phaseColor('estimates')} />
                                    </div>
                                </Stack>
                            </Box>

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
                            <QualifyCard
                                inquiry={inquiry}
                                inquiryTasks={inquiryTasksData}
                                submission={needsAssessmentSubmission}
                                onRefresh={handleRefresh}
                            />
                            <div id="discovery-questionnaire-section">
                                <DiscoveryQuestionnaireCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'calls'} activeColor="#3b82f6" />
                            </div>
                            <div id="proposals-section">
                                <ProposalsCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'proposals'} activeColor={phaseColor('proposals')} />
                            </div>
                            <div id="proposal-review-section">
                                <ProposalReviewCard inquiry={inquiry} onRefresh={handleRefresh} isActive={currentPhase === 'proposal-review'} activeColor={phaseColor('proposal-review')} submission={needsAssessmentSubmission} />
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

                        </Stack>
                    </Grid>
                </Grid>
            )}

            {/* --- PACKAGE DETAILS TAB --- */}
            {activeTab === 'package-details' && inquiry.selected_package_id && (
                <Box sx={{ mb: 3 }}>
                    <InquirySchedulePreview inquiryId={inquiry.id} sourcePackageId={inquiry.selected_package_id} />
                </Box>
            )}

            <NeedsAssessmentDialog
                open={needsAssessmentDialogOpen}
                onClose={handleCloseNeedsAssessmentDialog}
                submission={needsAssessmentSubmission}
                inquiryId={inquiry.id}
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
