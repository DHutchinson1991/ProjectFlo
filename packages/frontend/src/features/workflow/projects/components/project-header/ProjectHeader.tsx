'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Button,
} from '@mui/material';
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    ContentCopy as CopyIcon,
    Undo as UndoIcon,
} from '@mui/icons-material';
import type { Project } from '../../types/project.types';
import { ProjectStatus } from '../../types/project.types';
import { PROJECT_PHASE_TABS, PHASE_CONFIG_MAP } from '../../constants/project-phases';
import { projectsApi } from '../../api';

interface ProjectHeaderProps {
    project: Project;
    onRefresh: () => Promise<void>;
    onSnackbar: (msg: string, severity?: 'success' | 'error') => void;
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
    [ProjectStatus.ACTIVE]: '#10b981',
    [ProjectStatus.ON_HOLD]: '#f59e0b',
    [ProjectStatus.COMPLETED]: '#3b82f6',
    [ProjectStatus.CANCELLED]: '#ef4444',
};

export function ProjectHeader({ project, onSnackbar }: ProjectHeaderProps) {
    const router = useRouter();
    const [reverting, setReverting] = useState(false);
    const contact = project.contact ?? project.client?.contact;
    const firstName = contact?.first_name ?? '';
    const lastName = contact?.last_name ?? '';
    const email = contact?.email ?? '';
    const phone = contact?.phone_number;
    const projectTitle = project.project_name ?? `${firstName} & ${lastName}'s Wedding`;
    const phaseConfig = PHASE_CONFIG_MAP.get(project.phase);

    const weddingDate = project.wedding_date
        ? new Date(project.wedding_date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : null;

    const daysToEvent = project.wedding_date
        ? Math.ceil((new Date(project.wedding_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    const handleCopyPortalLink = () => {
        if (project.portal_token) {
            const portalUrl = `${window.location.origin}/portal/${project.portal_token}`;
            navigator.clipboard.writeText(portalUrl);
            onSnackbar('Portal link copied');
        }
    };

    const handleRevert = async () => {
        if (reverting || !project.inquiry_id) return;
        setReverting(true);
        try {
            const { inquiryId } = await projectsApi.revertToInquiry(project.id);
            onSnackbar('Reverted to inquiry');
            router.push(`/inquiries/${inquiryId}`);
        } catch {
            onSnackbar('Failed to revert', 'error');
            setReverting(false);
        }
    };

    return (
        <Box
            sx={{
                mb: 3,
                p: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.08)',
            }}
        >
            {/* Top row: contact + actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>
                        {projectTitle}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                            {firstName} {lastName}
                        </Typography>
                        {email && (
                            <Tooltip title={email}>
                                <IconButton size="small" sx={{ color: '#64748b' }} href={`mailto:${email}`}>
                                    <EmailIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {phone && (
                            <Tooltip title={phone}>
                                <IconButton size="small" sx={{ color: '#64748b' }} href={`tel:${phone}`}>
                                    <PhoneIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {process.env.NODE_ENV === 'development' && project.inquiry_id && (
                        <Tooltip title="DEV: Revert to inquiry">
                            <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                startIcon={<UndoIcon sx={{ fontSize: 14 }} />}
                                onClick={handleRevert}
                                disabled={reverting}
                                sx={{ fontSize: '0.7rem', textTransform: 'none', borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b' }}
                            >
                                {reverting ? 'Reverting…' : 'Revert to Inquiry'}
                            </Button>
                        </Tooltip>
                    )}
                    {project.portal_token && (
                        <Tooltip title="Copy client portal link">
                            <IconButton size="small" onClick={handleCopyPortalLink} sx={{ color: '#64748b' }}>
                                <CopyIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Chip
                        label={project.status.replace('_', ' ')}
                        size="small"
                        sx={{
                            backgroundColor: STATUS_COLORS[project.status] + '20',
                            color: STATUS_COLORS[project.status],
                            fontWeight: 600,
                            fontSize: '0.75rem',
                        }}
                    />
                </Box>
            </Box>

            {/* Metrics row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {weddingDate && (
                    <MetricPill label="Event Date" value={weddingDate} />
                )}
                {daysToEvent !== null && (
                    <MetricPill
                        label="Days to Event"
                        value={daysToEvent > 0 ? `${daysToEvent}d` : daysToEvent === 0 ? 'Today' : 'Past'}
                        color={daysToEvent <= 7 ? '#ef4444' : daysToEvent <= 30 ? '#f59e0b' : '#10b981'}
                    />
                )}
                {phaseConfig && (
                    <MetricPill label="Phase" value={phaseConfig.name} color={phaseConfig.color} />
                )}
                {project.event_type && (
                    <MetricPill label="Event Type" value={project.event_type.name} />
                )}
                {project.source_package && (
                    <MetricPill label="Package" value={project.source_package.name} />
                )}
            </Box>

            {/* Phase progress bar */}
            <Box sx={{ mt: 2, display: 'flex', gap: 0.5 }}>
                {PROJECT_PHASE_TABS.map((phase) => {
                    const phaseIdx = PROJECT_PHASE_TABS.findIndex((p) => p.id === project.phase);
                    const currentIdx = PROJECT_PHASE_TABS.findIndex((p) => p.id === phase.id);
                    const isCompleted = currentIdx < phaseIdx;
                    const isCurrent = phase.id === project.phase;

                    return (
                        <Box
                            key={phase.tabId}
                            sx={{
                                flex: 1,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: isCompleted
                                    ? phase.color
                                    : isCurrent
                                        ? phase.color + '80'
                                        : 'rgba(148, 163, 184, 0.15)',
                                transition: 'background-color 0.3s',
                            }}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}

function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </Typography>
            <Typography sx={{ color: color ?? '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
                {value}
            </Typography>
        </Box>
    );
}
