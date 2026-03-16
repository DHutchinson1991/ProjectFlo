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
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { Inquiry, InquiryTask, NeedsAssessmentSubmission } from '@/lib/types';
import { inquiriesService, api } from '@/lib/api';

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
    NeedsAssessmentDialog,
    DiscoveryQuestionnaireCard,
    buildPipelineTasks,
    buildPipelineTasksFromInquiry,
    type PipelineTask,
    // constants
    WORKFLOW_PHASES,
} from './_detail';

// Existing per-inquiry sub-components (unchanged)
import EventDetailsCard from './components/EventDetailsCard';
import PackageScopeCard from './components/PackageScopeCard';
import LeadInfoCard from './components/LeadInfoCard';



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
    const [naDialogOpen, setNaDialogOpen] = useState(false);
    const [pipelineTasks, setPipelineTasks] = useState<PipelineTask[]>([]);
    const [hasRealTasks, setHasRealTasks] = useState(false);
    const [taskActionPending, setTaskActionPending] = useState(false);

    /* ---- data loading ---- */
    useEffect(() => {
        loadInquiry();
    }, [inquiryId]);

    useEffect(() => {
        if (currentBrand?.id) {
            loadPipelineTasks();
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

    const handleToggleTask = async (task: PipelineTask) => {
        if (!hasRealTasks || !task.inquiry_task_id || taskActionPending) return;

        try {
            setTaskActionPending(true);
            await api.inquiryTasks.toggle(inquiryId, task.inquiry_task_id);
            await loadPipelineTasks();
            setSnackbar({
                open: true,
                message: task.status === 'Completed' ? 'Task reopened' : 'Task completed',
                severity: 'success',
            });
        } catch (err) {
            console.error('Error toggling inquiry task:', err);
            setSnackbar({ open: true, message: 'Failed to update task', severity: 'error' });
        } finally {
            setTaskActionPending(false);
        }
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
                inquiry={inquiry}
                pipelineTasks={pipelineTasks}
                hasRealTasks={hasRealTasks}
                onToggleTask={handleToggleTask}
                taskActionPending={taskActionPending}
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

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <PackageScopeCard
                                    inquiry={inquiry}
                                    onRefresh={handleRefresh}
                                    isActive={currentPhase === 'needs-assessment'}
                                    activeColor={phaseColor('needs-assessment')}
                                    submission={needsAssessmentSubmission}
                                    WorkflowCard={WorkflowCard}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{
                                    border: '1px dashed rgba(255,255,255,0.08)',
                                    borderRadius: 2,
                                    height: '100%',
                                    minHeight: 200,
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                }} />
                            </Grid>
                        </Grid>

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
