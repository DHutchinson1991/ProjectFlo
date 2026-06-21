'use client';

import React, { useMemo } from 'react';
import { Box, Button, Chip, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import LocalMoviesRoundedIcon from '@mui/icons-material/LocalMoviesRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import TheatersRoundedIcon from '@mui/icons-material/TheatersRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';

import { formatCurrency } from '@/shared/utils/formatUtils';
import { usePaymentScheduleTemplates } from '@/features/finance/payment-schedules';
import type { PaymentScheduleRule, PaymentScheduleTemplate } from '@/features/finance/payment-schedules/types';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { TaskAutoGenerationPreview } from '@/features/catalog/task-library/types';
import type { ServicePackage } from '../../../types/service-package.types';
import type {
    EquipmentRecord,
    FilmData,
    PackageActivityRecord,
    PackageCrewSlotRecord,
    PackageEventDaySubjectRecord,
    PackageLocationSlotRecord,
    UnmannedEquipmentRecord,
} from '../../../types';
import {
    buildPackageOverviewViewModel,
    resolvePackageDisplayPrice,
    type PackageOverviewActionTarget,
} from '../../../utils/package-overview-view-model';

interface PackageOverviewTabPanelProps {
    formData: Partial<ServicePackage>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<ServicePackage>>>;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    packageSubjects: PackageEventDaySubjectRecord[];
    packageLocationSlots: PackageLocationSlotRecord[];
    PackageCrewSlots: PackageCrewSlotRecord[];
    allEquipment: EquipmentRecord[];
    unmannedEquipment: UnmannedEquipmentRecord[];
    films: FilmData[];
    taskPreview: TaskAutoGenerationPreview | null;
    currency: string;
    taxRate?: number;
    onNavigate: (target: PackageOverviewActionTarget) => void;
}

const actionLabels: Record<PackageOverviewActionTarget, string> = {
    blueprint: 'Open Blueprint',
    people: 'Review People',
    locations: 'Check Locations',
    roles: 'Plan Roles',
    equipment: 'Check Equipment',
    tasks: 'Review Tasks',
    content: 'View Content',
    deliverables: 'Deliverables',
};

const ACCENTS = {
    narrative: '#a78bfa',
    content: '#ec4899',
    production: '#06b6d4',
    pricing: '#6366f1',
} as const;

const MILESTONE_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f59e0b', '#f87171', '#818cf8', '#2dd4bf'];

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        color: '#e2e8f0',
        borderRadius: 2,
        fontSize: '0.82rem',
        bgcolor: 'rgba(2,6,23,0.35)',
        alignItems: 'flex-start',
        '& fieldset': { borderColor: 'rgba(148,163,184,0.18)' },
        '&:hover fieldset': { borderColor: 'rgba(167,139,250,0.35)' },
        '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
    },
    '& .MuiInputLabel-root': { color: '#64748b', fontSize: '0.68rem', fontWeight: 700 },
    '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' },
};

function timingLabel(rule: PaymentScheduleRule): string {
    switch (rule.trigger_type) {
        case 'AFTER_BOOKING':
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days after booking`
                : 'on booking';
        case 'BEFORE_EVENT':
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days before the event`
                : 'on the event date';
        case 'AFTER_EVENT':
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days after the event`
                : 'after the event';
        default:
            return '';
    }
}

function rulePercent(rule: PaymentScheduleRule): number {
    return rule.amount_type === 'PERCENT' ? Number(rule.amount_value) : 0;
}

export function PackageOverviewTabPanel({
    formData,
    setFormData,
    packageEventDays,
    packageActivities,
    packageSubjects,
    packageLocationSlots,
    PackageCrewSlots,
    allEquipment,
    unmannedEquipment,
    films,
    taskPreview,
    currency,
    taxRate = 0,
    onNavigate,
}: PackageOverviewTabPanelProps) {
    const overview = useMemo(
        () => buildPackageOverviewViewModel({
            formData,
            packageEventDays,
            packageActivities,
            packageSubjects,
            packageLocationSlots,
            packageCrewSlots: PackageCrewSlots,
            allEquipment,
            unmannedEquipment,
            films,
            taskPreview,
        }),
        [
            PackageCrewSlots,
            allEquipment,
            films,
            formData,
            packageActivities,
            packageEventDays,
            packageLocationSlots,
            packageSubjects,
            taskPreview,
            unmannedEquipment,
        ],
    );

    const { data: paymentTemplates = [] } = usePaymentScheduleTemplates();

    const totalCost = overview.totals.crewCost + overview.totals.equipmentCost;
    const packagePrice = overview.totals.packagePrice;
    const displayPrice = resolvePackageDisplayPrice(
        packagePrice,
        overview.totals.crewCost,
        overview.totals.equipmentCost,
        taxRate,
        formData._totalCost,
        formData._tax?.totalWithTax,
    );
    const profit = packagePrice - totalCost;
    const marginPct = packagePrice > 0 ? Math.round((profit / packagePrice) * 100) : null;

    const description = formData.description ?? '';
    const narrativeDetail = formData.contents?.narrative_detail ?? '';
    const descriptionPlaceholder = overview.narrative.suggestedSummary;
    const selectedPaymentTemplateId = formData.contents?.default_payment_schedule_template_id ?? null;
    const selectedPaymentTemplate = paymentTemplates.find(
        (template: PaymentScheduleTemplate) => template.id === selectedPaymentTemplateId,
    ) ?? null;

    const updateDescription = (value: string) => {
        setFormData((prev) => ({ ...prev, description: value || null }));
    };

    const updateNarrativeDetail = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            contents: {
                ...prev.contents,
                items: prev.contents?.items ?? [],
                narrative_detail: value || null,
            },
        }));
    };

    const updatePaymentTemplate = (templateId: number | null) => {
        setFormData((prev) => ({
            ...prev,
            contents: {
                ...prev.contents,
                items: prev.contents?.items ?? [],
                default_payment_schedule_template_id: templateId,
            },
        }));
    };

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: [
                    'radial-gradient(circle at 8% 0%, rgba(251,191,36,0.08), transparent 28%)',
                    'radial-gradient(circle at 92% 12%, rgba(168,85,247,0.10), transparent 32%)',
                    'linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0))',
                ].join(', '),
            }}
        >
            {/* ── Hero ─────────────────────────────────────────────── */}
            <Box
                sx={{
                    flexShrink: 0,
                    mx: { xs: 2, xl: 3 },
                    mt: 2,
                    mb: 2,
                    px: { xs: 2, lg: 2.5 },
                    py: { xs: 1.75, lg: 2 },
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: [
                        'radial-gradient(circle at 0% 0%, rgba(167,139,250,0.14), transparent 42%)',
                        'radial-gradient(circle at 100% 100%, rgba(236,72,153,0.10), transparent 45%)',
                        'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,27,75,0.60))',
                    ].join(', '),
                    boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1.25fr) minmax(0, 1fr)' },
                        gap: { xs: 2.5, lg: 3 },
                        alignItems: 'start',
                    }}
                >
                    {/* Col 1 — identity (~50%) */}
                    <Box sx={{ minWidth: 0, display: 'flex', gap: 1.75 }}>
                        <Box
                            sx={{
                                width: 4,
                                flexShrink: 0,
                                borderRadius: 999,
                                background: 'linear-gradient(180deg, #fbbf24, rgba(167,139,250,0.85))',
                                alignSelf: 'stretch',
                                minHeight: 48,
                            }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={overview.categoryLabel}
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(251,191,36,0.13)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
                                />
                                {overview.blueprintUpdateAvailable ? (
                                    <Chip
                                        label="Blueprint update"
                                        size="small"
                                        sx={{ height: 22, fontSize: '0.65rem', bgcolor: 'rgba(251,113,133,0.12)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.28)' }}
                                    />
                                ) : null}
                            </Box>

                            <Typography
                                sx={{
                                    color: '#f1f5f9',
                                    fontWeight: 900,
                                    fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                                    lineHeight: 1.08,
                                    letterSpacing: '-0.02em',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #fbbf24 55%, #c4b5fd 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    mb: 1.25,
                                }}
                            >
                                {formData.name?.trim() || 'Untitled package'}
                            </Typography>

                            <Box
                                sx={{
                                    display: 'inline-block',
                                    mb: 1.5,
                                    px: 1.75,
                                    py: 1.15,
                                    borderRadius: 2.5,
                                    bgcolor: 'rgba(99,102,241,0.12)',
                                    border: '1px solid rgba(99,102,241,0.28)',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                                }}
                            >
                                <Typography sx={{ color: '#818cf8', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {displayPrice.label}
                                </Typography>
                                <Typography sx={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 850, fontFamily: 'monospace', lineHeight: 1.2 }}>
                                    {displayPrice.amount > 0 ? formatCurrency(displayPrice.amount, currency) : '—'}
                                </Typography>
                                <Typography sx={{ color: '#64748b', fontSize: '0.64rem', mt: 0.25 }}>
                                    {displayPrice.caption}
                                </Typography>
                            </Box>

                            <WorkloadStat
                                taskCount={overview.contentBridge.generatedTaskCount}
                                taskHours={overview.contentBridge.estimatedTaskHours}
                            />
                        </Box>
                    </Box>

                    {/* Col 2 — what the client gets */}
                    <Box
                        sx={{
                            minWidth: 0,
                            pl: { lg: 2.5 },
                            borderLeft: { lg: '1px solid rgba(255,255,255,0.07)' },
                        }}
                    >
                        <Typography sx={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                            What the client gets
                        </Typography>
                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.65, mb: 1.5 }}>
                            {overview.clientSummary.headline}
                        </Typography>

                        {overview.clientSummary.whatWeFilm.length > 0 ? (
                            <ClientSummaryList title="What we film" accent={ACCENTS.content} items={overview.clientSummary.whatWeFilm} />
                        ) : null}

                        {overview.clientSummary.filmsDelivered.length > 0 ? (
                            <Box sx={{ mt: overview.clientSummary.whatWeFilm.length > 0 ? 1.25 : 0 }}>
                                <ClientSummaryList title="Films delivered" accent="#818cf8" items={overview.clientSummary.filmsDelivered} />
                            </Box>
                        ) : null}

                        {overview.clientSummary.highlights.length > 0 ? (
                            <Stack spacing={0.75} sx={{ mt: 1.5, pt: 1.25, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                {overview.clientSummary.highlights.map((point) => (
                                    <Box key={point} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                        <Box sx={{ mt: '7px', width: 5, height: 5, borderRadius: '50%', bgcolor: '#fbbf24', flexShrink: 0 }} />
                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.55 }}>
                                            {point}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        ) : null}
                    </Box>

                    {/* Col 3 — assets & kit */}
                    <Box
                        sx={{
                            minWidth: 0,
                            pl: { lg: 2.5 },
                            borderLeft: { lg: '1px solid rgba(255,255,255,0.07)' },
                        }}
                    >
                        <Typography sx={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                            Assets & kit
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mb: 1.25 }}>
                            {overview.assetOverview.cameras > 0 ? (
                                <HeroStat icon={<CameraAltRoundedIcon />} value={String(overview.assetOverview.cameras)} label="Cameras" accent="#06b6d4" large />
                            ) : null}
                            {overview.assetOverview.audio > 0 ? (
                                <HeroStat icon={<MicRoundedIcon />} value={String(overview.assetOverview.audio)} label="Audio" accent="#ec4899" large />
                            ) : null}
                            {overview.assetOverview.lights > 0 ? (
                                <HeroStat icon={<LightModeRoundedIcon />} value={String(overview.assetOverview.lights)} label="Lights" accent="#fbbf24" large />
                            ) : null}
                            {overview.assetOverview.coverageHours ? (
                                <HeroStat icon={<ScheduleRoundedIcon />} value={`${overview.assetOverview.coverageHours}h`} label="On-site" accent="#34d399" large />
                            ) : null}
                            <HeroStat icon={<VideocamRoundedIcon />} value={String(overview.assetOverview.crewSlots)} label="Crew slots" accent="#60a5fa" large />
                            <HeroStat icon={<Inventory2RoundedIcon />} value={String(overview.assetOverview.equipmentItems)} label="Kit items" accent="#a78bfa" large />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mb: 1.5 }}>
                            <HeroStat icon={<CalendarMonthRoundedIcon />} value={String(overview.assetOverview.days)} label="Days" accent="#fbbf24" large />
                            <HeroStat icon={<TheatersRoundedIcon />} value={String(overview.assetOverview.activities)} label="Activities" accent="#a78bfa" large />
                        </Box>

                        {overview.assetOverview.equipmentCategories.length > 0 ? (
                            <Stack spacing={0.5} sx={{ mb: 1.25 }}>
                                {overview.assetOverview.equipmentCategories.slice(0, 4).map((entry) => (
                                    <Box key={entry.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }} noWrap>{entry.label}</Typography>
                                        <Typography sx={{ color: '#e2e8f0', fontSize: '0.72rem', fontWeight: 750 }}>×{entry.count}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        ) : null}

                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: overview.assetOverview.locationNames.length > 0 ? 1 : 0 }}>
                            <OverviewActionButton target="equipment" onNavigate={onNavigate} compact />
                            <OverviewActionButton target="roles" onNavigate={onNavigate} compact />
                            <OverviewActionButton target="locations" onNavigate={onNavigate} compact />
                        </Stack>

                        {overview.assetOverview.locationNames.length > 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <PlaceRoundedIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                {overview.assetOverview.locationNames.map((name, index) => (
                                    <React.Fragment key={name}>
                                        {index > 0 ? (
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(148,163,184,0.35)' }} />
                                        ) : null}
                                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.74rem', fontWeight: 650 }}>
                                            {name}
                                        </Typography>
                                    </React.Fragment>
                                ))}
                            </Box>
                        ) : null}
                    </Box>
                </Box>
            </Box>

            {/* ── Columns ─────────────────────────────────────────── */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                    gap: 2,
                    px: { xs: 2, xl: 3 },
                    pb: 2,
                }}
            >
                {/* ── Narrative ── */}
                <OverviewColumn
                    eyebrow="Story"
                    title="Narrative"
                    icon={<MenuBookRoundedIcon />}
                    accent={ACCENTS.narrative}
                    action={<OverviewActionButton target="blueprint" onNavigate={onNavigate} compact />}
                >
                    <Stack spacing={2}>
                        <TextField
                            label="Short description"
                            placeholder={descriptionPlaceholder}
                            value={description}
                            onChange={(event) => updateDescription(event.target.value)}
                            multiline
                            minRows={3}
                            maxRows={6}
                            fullWidth
                            sx={fieldSx}
                        />

                        <TextField
                            label="Narrative detail"
                            placeholder="Expand the story — tone, pacing, what matters most on the day, and how the edit should feel."
                            value={narrativeDetail}
                            onChange={(event) => updateNarrativeDetail(event.target.value)}
                            multiline
                            minRows={5}
                            fullWidth
                            sx={fieldSx}
                        />

                        {!description.trim() ? (
                            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}>
                                <Typography sx={{ color: '#a78bfa', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                                    Suggested from schedule
                                </Typography>
                                <Typography sx={{ color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.6 }}>
                                    {descriptionPlaceholder}
                                </Typography>
                            </Box>
                        ) : null}

                        <NarrativeSection title="Selling points">
                            {overview.narrative.sellingPoints.length === 0 ? (
                                <EmptyText>Selling angles will appear here as the schedule, crew, and content take shape.</EmptyText>
                            ) : (
                                <Stack spacing={1}>
                                    {overview.narrative.sellingPoints.map((point) => (
                                        <Box key={point} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                            <Box sx={{ mt: '7px', width: 5, height: 5, borderRadius: '50%', bgcolor: ACCENTS.narrative, flexShrink: 0 }} />
                                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.6 }}>
                                                {point}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </NarrativeSection>

                        <NarrativeSection title="Activity flow">
                            {overview.narrative.activities.length === 0 ? (
                                <EmptyText>Add activities in Edit to shape the narrative flow.</EmptyText>
                            ) : (
                                <Stack spacing={1}>
                                    {overview.narrative.activities.map((activity) => (
                                        <Box key={activity.name} sx={{ p: 1.15, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.84rem', fontWeight: 800 }}>
                                                    {activity.name}
                                                </Typography>
                                                {activity.moments.length > 0 ? (
                                                    <Typography sx={{ color: '#64748b', fontSize: '0.66rem', fontWeight: 700, flexShrink: 0 }}>
                                                        {activity.moments.length} moments
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                            {activity.description ? (
                                                <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.55, mt: 0.35 }}>
                                                    {activity.description}
                                                </Typography>
                                            ) : null}
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </NarrativeSection>
                    </Stack>
                </OverviewColumn>

                {/* ── Content ── */}
                <OverviewColumn
                    eyebrow="Outputs"
                    title="Content"
                    icon={<LocalMoviesRoundedIcon />}
                    accent={ACCENTS.content}
                    action={<OverviewActionButton target="content" onNavigate={onNavigate} compact />}
                >
                    <Stack spacing={1.5} sx={{ height: '100%' }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                            <SmallStat icon={<LocalMoviesRoundedIcon />} label="Films" value={String(overview.contentBridge.filmCount)} />
                            <SmallStat icon={<AutoAwesomeRoundedIcon />} label="Services" value={String(overview.contentBridge.serviceCount)} />
                        </Box>

                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <Typography sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                                Included in this package
                            </Typography>
                            {overview.contentBridge.items.length > 0 ? (
                                <Stack spacing={0.65}>
                                    {overview.contentBridge.items.map((item, index) => (
                                        <Box
                                            key={`${item.name}-${index}`}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: 1.15,
                                                py: 0.9,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(255,255,255,0.035)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderLeft: `3px solid ${item.type === 'film' ? ACCENTS.content : '#818cf8'}`,
                                            }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 750 }} noWrap>
                                                    {item.name}
                                                </Typography>
                                                <Typography sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                    {item.type}
                                                </Typography>
                                            </Box>
                                            {item.price > 0 ? (
                                                <Typography sx={{ color: '#cbd5e1', fontSize: '0.76rem', fontWeight: 750, fontFamily: 'monospace', flexShrink: 0 }}>
                                                    {formatCurrency(item.price, currency)}
                                                </Typography>
                                            ) : null}
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <EmptyText>No content yet. Open Content to add films and services.</EmptyText>
                            )}
                        </Box>

                        {packagePrice > 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Content total
                                </Typography>
                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.92rem', fontWeight: 850, fontFamily: 'monospace' }}>
                                    {formatCurrency(packagePrice, currency)}
                                </Typography>
                            </Box>
                        ) : null}
                    </Stack>
                </OverviewColumn>

                {/* ── Production ── */}
                <OverviewColumn
                    eyebrow="Delivery"
                    title="Production"
                    icon={<GroupsRoundedIcon />}
                    accent={ACCENTS.production}
                >
                    <Stack spacing={2} sx={{ height: '100%' }}>
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Crew
                                </Typography>
                                <OverviewActionButton target="roles" onNavigate={onNavigate} compact />
                            </Box>
                            {overview.productionFootprint.crewList.length > 0 ? (
                                <Stack spacing={0.65}>
                                    {overview.productionFootprint.crewList.map((entry) => (
                                        <Box
                                            key={entry.role}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: 1.15,
                                                py: 0.85,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(255,255,255,0.035)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderLeft: `3px solid ${ACCENTS.production}`,
                                            }}
                                        >
                                            <Typography sx={{ flex: 1, minWidth: 0, color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 750 }} noWrap>
                                                {entry.role}
                                            </Typography>
                                            <Typography sx={{ color: '#67e8f9', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
                                                ×{entry.count}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <EmptyText>No crew roles yet — open Roles to build the team.</EmptyText>
                            )}
                        </Box>

                        <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Tasks
                                </Typography>
                                <OverviewActionButton target="tasks" onNavigate={onNavigate} compact />
                            </Box>
                        </Box>
                    </Stack>
                </OverviewColumn>

                {/* ── Pricing ── */}
                <OverviewColumn
                    eyebrow="Commercial"
                    title="Pricing"
                    icon={<AttachMoneyRoundedIcon />}
                    accent={ACCENTS.pricing}
                >
                    <Stack spacing={1.5} sx={{ height: '100%' }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)' }}>
                            <Typography sx={{ color: '#818cf8', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {displayPrice.label}
                            </Typography>
                            <Typography sx={{ color: '#f1f5f9', fontSize: '1.35rem', fontWeight: 850, fontFamily: 'monospace', lineHeight: 1.25 }}>
                                {displayPrice.amount > 0 ? formatCurrency(displayPrice.amount, currency) : '—'}
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.64rem' }}>
                                {displayPrice.caption}
                            </Typography>
                        </Box>

                        <Stack spacing={0.5}>
                            <PriceRow label="Crew cost" value={formatCurrency(overview.totals.crewCost, currency)} />
                            <PriceRow label="Equipment cost" value={formatCurrency(overview.totals.equipmentCost, currency)} />
                            <PriceRow label="Cost base" value={formatCurrency(totalCost, currency)} strong />
                            {packagePrice > 0 ? (
                                <PriceRow
                                    label={`Projected profit${marginPct !== null ? ` (${marginPct}% margin)` : ''}`}
                                    value={formatCurrency(profit, currency)}
                                    strong
                                    valueColor={profit >= 0 ? '#34d399' : '#f87171'}
                                />
                            ) : null}
                        </Stack>

                        <CostSplitBar crewCost={overview.totals.crewCost} equipmentCost={overview.totals.equipmentCost} />

                        <Box sx={{ pt: 1.25, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                                Default payment plan
                            </Typography>
                            <Select
                                size="small"
                                fullWidth
                                displayEmpty
                                value={selectedPaymentTemplateId ?? ''}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    updatePaymentTemplate(next === '' ? null : Number(next));
                                }}
                                sx={{
                                    color: '#e2e8f0',
                                    fontSize: '0.8rem',
                                    borderRadius: 2,
                                    bgcolor: 'rgba(2,6,23,0.35)',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.18)' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(129,140,248,0.4)' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#818cf8' },
                                    '& .MuiSvgIcon-root': { color: '#64748b' },
                                }}
                            >
                                <MenuItem value="">
                                    <em>No default plan</em>
                                </MenuItem>
                                {paymentTemplates.map((template: PaymentScheduleTemplate) => (
                                    <MenuItem key={template.id} value={template.id}>
                                        {template.name}{template.is_default ? ' (brand default)' : ''}
                                    </MenuItem>
                                ))}
                            </Select>

                            {selectedPaymentTemplate ? (
                                <PaymentPlanBreakdown
                                    template={selectedPaymentTemplate}
                                    totalPrice={packagePrice > 0 ? packagePrice : null}
                                    currency={currency}
                                />
                            ) : null}

                            <Typography sx={{ color: '#64748b', fontSize: '0.66rem', lineHeight: 1.55, mt: 1 }}>
                                This plan becomes the default for inquiries built from this package — clients can still pick a different option during booking.
                            </Typography>
                        </Box>
                    </Stack>
                </OverviewColumn>
            </Box>
        </Box>
    );
}

function PaymentPlanBreakdown({
    template,
    totalPrice,
    currency,
}: {
    template: PaymentScheduleTemplate;
    totalPrice: number | null;
    currency: string;
}) {
    const sorted = [...template.rules].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const barTotal = sorted.reduce((sum, rule) => sum + (rulePercent(rule) || 1), 0) || 1;

    return (
        <Box sx={{ mt: 1.25 }}>
            <Box sx={{ display: 'flex', gap: '3px', height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(148,163,184,0.12)', mb: 1 }}>
                {sorted.map((rule, index) => {
                    const pct = rulePercent(rule);
                    return (
                        <Tooltip
                            key={rule.id ?? index}
                            title={`${rule.label}: ${pct > 0 ? `${pct}%` : formatCurrency(Number(rule.amount_value), currency)}`}
                            arrow
                            placement="top"
                        >
                            <Box sx={{ flex: (pct || 1) / barTotal, bgcolor: MILESTONE_COLORS[index % MILESTONE_COLORS.length], borderRadius: 1, minWidth: 4 }} />
                        </Tooltip>
                    );
                })}
            </Box>
            <Stack spacing={0.6}>
                {sorted.map((rule, index) => {
                    const pct = rulePercent(rule);
                    const amount = totalPrice && pct > 0 ? (pct / 100) * totalPrice : null;
                    const color = MILESTONE_COLORS[index % MILESTONE_COLORS.length];
                    const timing = timingLabel(rule);
                    return (
                        <Box
                            key={rule.id ?? index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1,
                                py: 0.6,
                                borderRadius: 1.5,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                borderLeft: `3px solid ${color}`,
                            }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ color: '#e2e8f0', fontSize: '0.74rem', fontWeight: 700 }} noWrap>
                                    {rule.label}
                                </Typography>
                                {timing ? (
                                    <Typography sx={{ color: '#64748b', fontSize: '0.6rem' }} noWrap>
                                        {timing}
                                    </Typography>
                                ) : null}
                            </Box>
                            <Typography sx={{ color, fontSize: '0.74rem', fontWeight: 800, fontFamily: 'monospace', flexShrink: 0 }}>
                                {amount !== null
                                    ? formatCurrency(amount, currency)
                                    : pct > 0
                                        ? `${pct}%`
                                        : formatCurrency(Number(rule.amount_value), currency)}
                            </Typography>
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
}

function HeroStat({
    icon,
    value,
    label,
    accent,
    large = false,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
    accent: string;
    large?: boolean;
}) {
    const iconSize = large ? 48 : 16;
    const boxSize = large ? 54 : 30;
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: large ? 1.25 : 1,
                px: large ? 1.25 : 1.15,
                py: large ? 1.1 : 0.9,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.06)',
                minWidth: 0,
            }}
        >
            <Box
                sx={{
                    width: boxSize,
                    height: boxSize,
                    borderRadius: large ? 2 : '50%',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    color: accent,
                    bgcolor: `${accent}1F`,
                    border: `1px solid ${accent}40`,
                    '& svg': { fontSize: iconSize },
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: '#f1f5f9', fontSize: large ? '1.05rem' : '0.98rem', fontWeight: 850, lineHeight: 1.15 }} noWrap>
                    {value}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }} noWrap>
                    {label}
                </Typography>
            </Box>
        </Box>
    );
}

function WorkloadStat({ taskCount, taskHours }: { taskCount: number; taskHours: number }) {
    const hoursLabel = `${(Math.round(taskHours * 10) / 10).toFixed(1)}h`;
    const value = taskCount > 0
        ? `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} · ${hoursLabel}`
        : hoursLabel !== '0.0h'
            ? `0 tasks · ${hoursLabel}`
            : 'Not planned yet';

    return (
        <Box
            sx={{
                p: 1.35,
                borderRadius: 2.5,
                bgcolor: 'rgba(167,139,250,0.08)',
                border: '1px solid rgba(167,139,250,0.20)',
                maxWidth: 360,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                <Box
                    sx={{
                        width: 54,
                        height: 54,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        color: '#a78bfa',
                        bgcolor: 'rgba(167,139,250,0.15)',
                        border: '1px solid rgba(167,139,250,0.35)',
                    }}
                >
                    <TaskAltRoundedIcon sx={{ fontSize: 48 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: '#a78bfa', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Post-production workload
                    </Typography>
                    <Typography sx={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 850, lineHeight: 1.25, mt: 0.35 }}>
                        {value}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.68rem', lineHeight: 1.45, mt: 0.4 }}>
                        Auto-planned editing & delivery tasks from your films and schedule
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

function ClientSummaryList({ title, accent, items }: { title: string; accent: string; items: string[] }) {
    return (
        <Box>
            <Typography sx={{ color: '#64748b', fontSize: '0.59rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.75 }}>
                {title}
            </Typography>
            <Stack spacing={0.55}>
                {items.map((item) => (
                    <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.9 }}>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: accent, flexShrink: 0, mt: '7px' }} />
                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.73rem', lineHeight: 1.45 }}>
                            {item}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}

function PriceRow({ label, value, strong = false, valueColor }: { label: string; value: string; strong?: boolean; valueColor?: string }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{ color: strong ? '#cbd5e1' : '#94a3b8', fontSize: '0.72rem', fontWeight: strong ? 800 : 650 }}>
                {label}
            </Typography>
            <Typography sx={{ color: valueColor ?? (strong ? '#f1f5f9' : '#cbd5e1'), fontSize: strong ? '0.82rem' : '0.76rem', fontWeight: strong ? 850 : 700, fontFamily: 'monospace' }}>
                {value}
            </Typography>
        </Box>
    );
}

function OverviewColumn({
    eyebrow,
    title,
    icon,
    accent,
    action,
    children,
}: {
    eyebrow: string;
    title: string;
    icon: React.ReactNode;
    accent: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                height: '100%',
                p: 1.5,
                borderRadius: 3,
                bgcolor: 'rgba(15,23,42,0.62)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 10px 34px rgba(0,0,0,0.22)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, flexShrink: 0 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: 1.5, display: 'grid', placeItems: 'center', color: accent, bgcolor: `${accent}1A`, border: `1px solid ${accent}40`, '& svg': { fontSize: 17 } }}>
                    {icon}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {eyebrow}
                    </Typography>
                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 850 }}>
                        {title}
                    </Typography>
                </Box>
                {action}
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.25 }}>
                {children}
            </Box>
        </Box>
    );
}

function NarrativeSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Box sx={{ pt: 1.25, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.85 }}>
                {title}
            </Typography>
            {children}
        </Box>
    );
}

function OverviewActionButton({
    target,
    onNavigate,
    compact = false,
}: {
    target: PackageOverviewActionTarget;
    onNavigate: (target: PackageOverviewActionTarget) => void;
    compact?: boolean;
}) {
    return (
        <Button
            size="small"
            onClick={() => onNavigate(target)}
            sx={{
                minHeight: compact ? 24 : 30,
                px: compact ? 1 : 1.35,
                py: compact ? 0.1 : 0.35,
                color: compact ? '#94a3b8' : '#f8fafc',
                bgcolor: compact ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.10)',
                fontSize: compact ? '0.62rem' : '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                '&:hover': { bgcolor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.35)', color: '#fbbf24' },
            }}
        >
            {actionLabels[target]}
        </Button>
    );
}

function SmallStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Box sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5, '& svg': { fontSize: 14 } }}>
                {icon}
                <Typography sx={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {label}
                </Typography>
            </Box>
            <Typography sx={{ color: '#f1f5f9', fontSize: '0.92rem', fontWeight: 850, mt: 0.45 }} noWrap>
                {value}
            </Typography>
        </Box>
    );
}

function EmptyText({ children }: { children: React.ReactNode }) {
    return (
        <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontStyle: 'italic', lineHeight: 1.5 }}>
            {children}
        </Typography>
    );
}

function CostSplitBar({ crewCost, equipmentCost }: { crewCost: number; equipmentCost: number }) {
    const total = crewCost + equipmentCost;
    if (total <= 0) {
        return <EmptyText>No cost base yet — add crew and equipment to shape pricing.</EmptyText>;
    }
    const crewPct = Math.round((crewCost / total) * 100);
    return (
        <Box>
            <Box sx={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', bgcolor: 'rgba(148,163,184,0.12)' }}>
                <Box sx={{ width: `${crewPct}%`, bgcolor: ACCENTS.production }} />
                <Box sx={{ width: `${100 - crewPct}%`, bgcolor: '#f97316' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
                <Typography sx={{ color: ACCENTS.production, fontSize: '0.64rem', fontWeight: 700 }}>
                    Crew {crewPct}%
                </Typography>
                <Typography sx={{ color: '#f97316', fontSize: '0.64rem', fontWeight: 700 }}>
                    Equipment {100 - crewPct}%
                </Typography>
            </Box>
        </Box>
    );
}
