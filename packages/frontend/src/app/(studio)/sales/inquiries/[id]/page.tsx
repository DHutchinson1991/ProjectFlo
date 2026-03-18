'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useBrand } from '@/app/providers/BrandProvider';
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
import { Inquiry, InquiryTask, NeedsAssessmentSubmission, Contributor } from '@/lib/types';
import { inquiriesService, api } from '@/lib/api';
import { computeTaxBreakdown } from '@/lib/utils/pricing';

// Extracted _detail barrel — types, constants, helpers, components
import {
    // helpers
    getConversionScore,
    getDaysInPipeline,
    getActivePhaseFromTasks,
    // components
    WorkflowCard,
    CommandCenterHeader,
    PhaseOverview,
    EstimatesCard,
    ProposalsCard,
    QuotesCard,
    ContractsCard,
    CallsCard,
    ProposalReviewCard,
    ClientApprovalCard,
    ActivityLogCard,
    ClientUpdatesCard,
    DiscoveryQuestionnaireCard,
    ReviewNotesCard,
    buildPipelineTasks,
    buildPipelineTasksFromInquiry,
    type PipelineTask,
    // constants
    WORKFLOW_PHASES,
} from './_detail';

// Existing per-inquiry sub-components (unchanged)
import EventDetailsCard from './components/EventDetailsCard';
import PackageScopeCard from './components/PackageScopeCard';
import ClientInfoCard from './_detail/_components/ClientInfoCard';
import InquirySchedulePreview from './components/InquirySchedulePreview';


/* ================================================================== */
/*  InquiryDetailPage — slim orchestrator                             */
/* ================================================================== */
export default function InquiryDetailPage() {
    const params = useParams();
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
    const [hasRealTasks, setHasRealTasks] = useState(false);
    const [contributors, setContributors] = useState<Contributor[]>([]);

    /* ---- data loading ---- */
    useEffect(() => {
        loadInquiry();
    }, [inquiryId]);

    useEffect(() => {
        if (currentBrand?.id) {
            loadPipelineTasks();
            loadContributors();
        }
    }, [inquiryId, currentBrand?.id]);

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

    const loadContributors = async () => {
        try {
            const data = await api.contributors.getAll();
            setContributors(data);
        } catch (err) {
            console.error('Error loading contributors:', err);
        }
    };

    const loadPipelineTasks = async () => {
        // Try loading existing real tasks
        try {
            const inquiryTasks: InquiryTask[] = await api.inquiryTasks.getAll(inquiryId);
            if (inquiryTasks.length > 0) {
                setPipelineTasks(buildPipelineTasksFromInquiry(inquiryTasks));
                setHasRealTasks(true);
                return;
            }
        } catch (err) {
            console.error('Error loading inquiry tasks:', err);
        }

        // No tasks loaded — try auto-generating from task library
        try {
            const generated: InquiryTask[] = await api.inquiryTasks.generate(inquiryId);
            if (generated.length > 0) {
                setPipelineTasks(buildPipelineTasksFromInquiry(generated));
                setHasRealTasks(true);
                return;
            }
        } catch (err) {
            console.error('Error generating inquiry tasks:', err);
        }

        // Fallback: show read-only task library templates
        try {
            const grouped = await api.taskLibrary.getGroupedByPhase();
            const inquiryPhaseTasks = grouped['Inquiry'] ?? [];
            const bookingPhaseTasks = grouped['Booking'] ?? [];
            setPipelineTasks(buildPipelineTasks([...inquiryPhaseTasks, ...bookingPhaseTasks]));
        } catch (err) {
            console.error('Error loading fallback pipeline tasks:', err);
            setPipelineTasks([]);
        }

        setHasRealTasks(false);
    };

    const handleRefresh = async () => {
        await Promise.all([loadInquiry(), loadPipelineTasks()]);
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
    const currentPhase = getActivePhaseFromTasks(pipelineTasks, inquiry as Inquiry & { activity_logs?: unknown[] });

    const conversionData = getConversionScore(inquiry);
    const daysInPipeline = getDaysInPipeline(inquiry);
    const taxRate = Number(currentBrand?.default_tax_rate ?? 0);
    const dealValue = (() => {
        // 1. Primary estimate total (pre-tax, from estimate line items)
        const primaryEst = inquiry.estimates?.find(e => e.is_primary) ?? inquiry.estimates?.[0];
        if (primaryEst && Number(primaryEst.total_amount || 0) > 0) {
            return computeTaxBreakdown(Number(primaryEst.total_amount), taxRate).total;
        }
        // 2. Package base price from snapshot (taken when package was selected)
        const snapshot = inquiry.package_contents_snapshot as { base_price?: number } | null;
        if (snapshot?.base_price && snapshot.base_price > 0) {
            return computeTaxBreakdown(snapshot.base_price, taxRate).total;
        }
        return 0;
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
                taxRate={taxRate}
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
                                <ClientInfoCard
                                    inquiry={inquiry}
                                    onRefresh={handleRefresh}
                                    isActive={currentPhase === 'needs-assessment'}
                                    activeColor={phaseColor('needs-assessment')}
                                    submission={needsAssessmentSubmission}
                                />

                                <PackageScopeCard
                                    inquiry={inquiry}
                                    onRefresh={handleRefresh}
                                    isActive={currentPhase === 'needs-assessment'}
                                    activeColor={phaseColor('needs-assessment')}
                                    submission={needsAssessmentSubmission}
                                    WorkflowCard={WorkflowCard}
                                    onPackageDetailsClick={() => setActiveTab('package-details')}
                                />
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
                            <ReviewNotesCard
                                inquiry={inquiry}
                                onRefresh={handleRefresh}
                                submission={needsAssessmentSubmission}
                            />
                            <div id="activity-section">
                                <ActivityLogCard inquiry={inquiry} onRefresh={handleRefresh} />
                            </div>
                            <div id="client-updates-section">
                                <ClientUpdatesCard inquiry={inquiry} onRefresh={handleRefresh} />
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
