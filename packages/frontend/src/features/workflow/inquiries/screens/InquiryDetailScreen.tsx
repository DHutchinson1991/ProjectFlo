'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useBrand } from '@/features/platform/brand';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
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
    CommandCenterHeader,
} from '../components';
import {
    InquiryTab,
    DiscoveryTab,
    ProposalTab,
    ScheduleTab,
    navigateToSection,
} from '../components/tabs';
import type { InquiryTabId } from '../components/tabs';


/* ================================================================== */
/*  InquiryDetailScreen — slim orchestrator                           */
/* ================================================================== */
export default function InquiryDetailScreen() {
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
    const [activeTab, setActiveTab] = useState<InquiryTabId>('inquiry');

    const [pipelineTasks, setPipelineTasks] = useState<PipelineTask[]>([]);
    const [inquiryTasksData, setInquiryTasksData] = useState<InquiryTask[]>([]);
    const [hasRealTasks, setHasRealTasks] = useState(false);
    const [crew, setCrew] = useState<BackendUserAccount[]>([]);

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

    useEffect(() => {
        const handleHashNavigation = () => {
            const hash = window.location.hash?.replace(/^#/, '');
            if (!hash) return;
            navigateToSection(hash, setActiveTab);
        };

        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);
        return () => window.removeEventListener('hashchange', handleHashNavigation);
    }, []);

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
                inquiryTasks={inquiryTasksData}
                needsAssessmentSubmission={needsAssessmentSubmission}
                conversionData={conversionData}
                daysInPipeline={daysInPipeline}
                dealValue={dealValue}
                onRefresh={handleRefresh}
                onSnackbar={(msg) => setSnackbar({ open: true, message: msg, severity: 'success' })}
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
                    <Tab label="Inquiry" value="inquiry" />
                    <Tab label="Discovery" value="discovery" />
                    <Tab label="Proposal" value="proposal" />
                    {inquiry.selected_package_id && <Tab label="Schedule" value="schedule" />}
                </Tabs>
            </Box>

            {activeTab === 'inquiry' && (
                <InquiryTab
                    inquiry={inquiry}
                    inquiryId={inquiry.id}
                    onRefresh={handleRefresh}
                    inquiryTasks={inquiryTasksData}
                    submission={needsAssessmentSubmission}
                    currentPhase={currentPhase}
                    phaseColor={phaseColor}
                    onTasksChanged={loadPipelineTasks}
                    onScheduleClick={() => setActiveTab('schedule')}
                    packageId={inquiry.selected_package_id ?? null}
                />
            )}

            {activeTab === 'discovery' && (
                <DiscoveryTab
                    inquiry={inquiry}
                    onRefresh={handleRefresh}
                    currentPhase={currentPhase}
                />
            )}

            {activeTab === 'proposal' && (
                <ProposalTab
                    inquiry={inquiry}
                    onRefresh={handleRefresh}
                    currentPhase={currentPhase}
                    phaseColor={phaseColor}
                />
            )}

            {activeTab === 'schedule' && inquiry.selected_package_id && (
                <ScheduleTab inquiryId={inquiry.id} sourcePackageId={inquiry.selected_package_id} />
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
