'use client';

import React from 'react';
import { Grid, Stack, Typography, Box, Chip } from '@mui/material';
import type { Project } from '../../types/project.types';
import { PHASE_CONFIG_MAP } from '../../constants/project-phases';

interface ProjectTabProps {
    project: Project;
    onRefresh: () => Promise<void>;
}

export function ProjectTab({ project }: ProjectTabProps) {
    const contact = project.contact ?? project.client?.contact;
    const tasks = project.inquiry_tasks ?? [];
    const completedTasks = tasks.filter((t) => t.status === 'Completed');
    const totalTasks = tasks.length;
    const phaseConfig = PHASE_CONFIG_MAP.get(project.phase);

    return (
        <Grid container spacing={3} columns={12}>
            {/* Col 1 — Project Info */}
            <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                    <InfoCard title="Project Details">
                        <InfoRow label="Project Name" value={project.project_name ?? '—'} />
                        <InfoRow label="Event Type" value={project.event_type?.name ?? '—'} />
                        <InfoRow
                            label="Wedding Date"
                            value={
                                project.wedding_date
                                    ? new Date(project.wedding_date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })
                                    : '—'
                            }
                        />
                        <InfoRow label="Guest Count" value={project.guest_count ?? '—'} />
                        <InfoRow label="Package" value={project.source_package?.name ?? '—'} />
                        {project.booking_date && (
                            <InfoRow
                                label="Booking Date"
                                value={new Date(project.booking_date).toLocaleDateString()}
                            />
                        )}
                    </InfoCard>

                    <InfoCard title="Contact">
                        <InfoRow label="Name" value={`${contact?.first_name ?? ''} ${contact?.last_name ?? ''}`.trim() || '—'} />
                        <InfoRow label="Email" value={contact?.email ?? '—'} />
                        {contact?.phone_number && <InfoRow label="Phone" value={contact.phone_number} />}
                    </InfoCard>
                </Stack>
            </Grid>

            {/* Col 2 — Phase & Status */}
            <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                    <InfoCard title="Status">
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Chip
                                label={project.status.replace('_', ' ')}
                                size="small"
                                sx={{ fontWeight: 600 }}
                            />
                            {phaseConfig && (
                                <Chip
                                    label={phaseConfig.name}
                                    size="small"
                                    sx={{
                                        backgroundColor: phaseConfig.color + '20',
                                        color: phaseConfig.color,
                                        fontWeight: 600,
                                    }}
                                />
                            )}
                        </Box>
                        <InfoRow
                            label="Tasks Progress"
                            value={`${completedTasks.length} / ${totalTasks} completed`}
                        />
                    </InfoCard>

                    {project.notes && (
                        <InfoCard title="Notes">
                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                {project.notes}
                            </Typography>
                        </InfoCard>
                    )}
                </Stack>
            </Grid>

            {/* Col 3 — Key Dates & Finance Summary */}
            <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                    <InfoCard title="Key Dates">
                        {project.edit_start_date && (
                            <InfoRow label="Edit Start" value={new Date(project.edit_start_date).toLocaleDateString()} />
                        )}
                        {project.delivery_date && (
                            <InfoRow label="Delivery" value={new Date(project.delivery_date).toLocaleDateString()} />
                        )}
                        <InfoRow label="Created" value={new Date(project.created_at).toLocaleDateString()} />
                    </InfoCard>

                    <InfoCard title="Finance Summary">
                        <InfoRow label="Estimates" value={`${project.estimates?.length ?? 0}`} />
                        <InfoRow label="Quotes" value={`${project.quotes?.length ?? 0}`} />
                        <InfoRow label="Invoices" value={`${project.invoices?.length ?? 0}`} />
                        <InfoRow label="Contracts" value={`${project.contracts?.length ?? 0}`} />
                    </InfoCard>
                </Stack>
            </Grid>
        </Grid>
    );
}

/* ---- Shared sub-components ---- */

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Box
            sx={{
                p: 2.5,
                borderRadius: 2,
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.08)',
            }}
        >
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                {title}
            </Typography>
            {children}
        </Box>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</Typography>
            <Typography sx={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>{value}</Typography>
        </Box>
    );
}
