'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    Typography,
} from '@mui/material';
import { Female, GroupsOutlined, Male, PersonOutline } from '@mui/icons-material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import { scheduleApi } from '@/features/workflow/scheduling/api';
import type { PackageEventDaySubjectRecord } from '@/features/catalog/packages/types';

interface InquirySubjectsCardProps {
    inquiryId: number;
    guestCount?: string | number | null;
}

/* ── Inline-edit helpers ──────────────────────────────────────────── */

const inputBaseSx = {
    border: 'none',
    outline: 'none',
    bgcolor: 'transparent',
    fontFamily: 'inherit',
    color: '#f8fafc',
    '&::placeholder': { color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' },
} as const;

export default function InquirySubjectsCard({ inquiryId, guestCount }: InquirySubjectsCardProps) {
    const [subjects, setSubjects] = useState<PackageEventDaySubjectRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Inline-edit state
    const [editingNameId, setEditingNameId] = useState<number | null>(null);
    const [editingNameValue, setEditingNameValue] = useState('');
    const [editingCountId, setEditingCountId] = useState<number | null>(null);
    const [editingCountValue, setEditingCountValue] = useState('');

    useEffect(() => {
        setLoading(true);
        scheduleApi.instanceSubjects
            .getForInquiry(inquiryId)
            .then((data) => {
                const records = data as PackageEventDaySubjectRecord[];
                const deduped = new Map<string, PackageEventDaySubjectRecord>();
                for (const subject of records) {
                    const key = subject.name.trim().toLowerCase();
                    const current = deduped.get(key);
                    if (!current) {
                        deduped.set(key, subject);
                        continue;
                    }
                    const currentHasName = Boolean(current.real_name?.trim() || current.member_names?.[0]?.trim());
                    const nextHasName = Boolean(subject.real_name?.trim() || subject.member_names?.[0]?.trim());
                    if (!currentHasName && nextHasName) {
                        deduped.set(key, subject);
                    }
                }
                setSubjects(Array.from(deduped.values()));
            })
            .catch(() => setSubjects([]))
            .finally(() => setLoading(false));
    }, [inquiryId]);

    const people = subjects.filter(
        (s) => !s.category || s.category === 'PEOPLE',
    );

    const normalizeRole = (value?: string | null) =>
        (value ?? '').toLowerCase().replace(/[^a-z]/g, '');

    const isExactRole = (subject: PackageEventDaySubjectRecord, role: 'bride' | 'groom') => {
        const byName = normalizeRole(subject.name) === role;
        const byTemplate = normalizeRole(subject.role_template?.role_name) === role;
        return byName || byTemplate;
    };

    const brideSubject = people.find((subject) => isExactRole(subject, 'bride'));
    const groomSubject = people.find((subject) => isExactRole(subject, 'groom'));

    const otherSubjects = people.filter((subject) => {
        if (brideSubject && subject.id === brideSubject.id) return false;
        if (groomSubject && subject.id === groomSubject.id) return false;
        return true;
    });

    const guestCountDisplay = (() => {
        if (typeof guestCount === 'string') {
            const trimmed = guestCount.trim();
            return trimmed.length > 0 ? trimmed : null;
        }
        if (typeof guestCount === 'number' && Number.isFinite(guestCount) && guestCount > 0) {
            return String(guestCount);
        }
        return null;
    })();

    const displayPrimaryName = (
        subject: PackageEventDaySubjectRecord | undefined,
    ) => {
        if (!subject) return '';
        if (subject.real_name?.trim()) return subject.real_name.trim();
        const firstMember = subject.member_names?.find((name) => name?.trim());
        if (firstMember) return firstMember.trim();
        const normalized = normalizeRole(subject.name);
        if (normalized === 'bride' || normalized === 'groom') return '';
        return subject.name;
    };

    /* ── Save helpers ─────────────────────────────────────────────── */

    const saveRealName = async (subject: PackageEventDaySubjectRecord, value: string) => {
        const trimmed = value.trim() || null;
        if (trimmed === (subject.real_name ?? null)) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated: any = await scheduleApi.instanceSubjects.update(subject.id, { real_name: trimmed });
            setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, real_name: updated?.real_name ?? trimmed } : s));
        } catch (err) { console.warn('Failed to save name:', err); }
    };

    const saveCount = async (subject: PackageEventDaySubjectRecord, rawVal: string) => {
        const n = parseInt(rawVal, 10);
        const currentCount = subject.count ?? 1;
        const next = isNaN(n) ? currentCount : Math.max(1, n);
        if (next === currentCount) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated: any = await scheduleApi.instanceSubjects.update(subject.id, { count: next });
            setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, count: updated?.count ?? next } : s));
        } catch (err) { console.warn('Failed to save count:', err); }
    };

    const adjustCount = async (subject: PackageEventDaySubjectRecord, delta: number) => {
        const currentCount = subject.count ?? 1;
        const next = Math.max(1, currentCount + delta);
        if (next === currentCount) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated: any = await scheduleApi.instanceSubjects.update(subject.id, { count: next });
            setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, count: updated?.count ?? next } : s));
        } catch (err) { console.warn('Failed to adjust count:', err); }
    };

    if (!loading && people.length === 0) return null;

    /* ── Couple tile renderer ─────────────────────────────────────── */

    const renderCoupleTile = (
        subject: PackageEventDaySubjectRecord | undefined,
        role: 'Bride' | 'Groom',
        Icon: typeof Female,
    ) => {
        const name = displayPrimaryName(subject);
        const isEditingName = subject && editingNameId === subject.id;

        return (
            <Box
                sx={{
                    px: 2,
                    py: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(100,116,139,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    minHeight: 140,
                    transition: 'border-color 0.2s',
                    '&:hover': { borderColor: 'rgba(139,92,246,0.35)' },
                }}
            >
                {/* Avatar */}
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: 'rgba(148,163,184,0.14)',
                        border: '2px solid rgba(148,163,184,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon sx={{ color: '#e2e8f0', fontSize: 30 }} />
                </Box>

                {/* Role label */}
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {role}
                </Typography>

                {/* Editable name */}
                {subject ? (
                    isEditingName ? (
                        <Box
                            component="input"
                            type="text"
                            autoFocus
                            value={editingNameValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingNameValue(e.target.value)}
                            onBlur={() => {
                                setEditingNameId(null);
                                saveRealName(subject, editingNameValue);
                            }}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                if (e.key === 'Escape') setEditingNameId(null);
                            }}
                            placeholder="Enter name…"
                            sx={{
                                ...inputBaseSx,
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                textAlign: 'center',
                                width: '100%',
                                py: '2px',
                                borderBottom: '1px solid rgba(139,92,246,0.4)',
                            }}
                        />
                    ) : (
                        <Typography
                            onClick={() => {
                                setEditingNameId(subject.id);
                                setEditingNameValue(name);
                            }}
                            sx={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: name ? '#f8fafc' : 'rgba(255,255,255,0.25)',
                                cursor: 'text',
                                textAlign: 'center',
                                width: '100%',
                                py: '2px',
                                borderBottom: '1px solid transparent',
                                borderRadius: '2px',
                                transition: 'all 0.15s',
                                '&:hover': {
                                    borderBottomColor: 'rgba(139,92,246,0.3)',
                                    color: name ? '#f8fafc' : 'rgba(255,255,255,0.4)',
                                },
                            }}
                        >
                            {name || 'Enter name…'}
                        </Typography>
                    )
                ) : (
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                        Not assigned
                    </Typography>
                )}
            </Box>
        );
    };

    /* ── Other subject row renderer ────────────────────────────────── */

    const renderOtherSubject = (subject: PackageEventDaySubjectRecord) => {
        const isGroup = (subject.count ?? 0) > 1;
        const currentCount = subject.count ?? 1;
        const SubjectIcon = isGroup ? GroupsOutlined : PersonOutline;
        const roleName = subject.role_template?.role_name ?? null;
        const isEditingThisCount = editingCountId === subject.id;
        const isEditingThisName = editingNameId === subject.id;

        return (
            <Box
                key={subject.id}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(52, 58, 68, 0.25)',
                    transition: 'border-color 0.15s',
                    '&:hover': { borderColor: 'rgba(139,92,246,0.25)' },
                }}
            >
                {/* Avatar */}
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'rgba(148,163,184,0.12)',
                        border: '1px solid rgba(148,163,184,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <SubjectIcon sx={{ color: '#cbd5e1', fontSize: 16 }} />
                </Box>

                {/* Name + real name (editable) */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem', lineHeight: 1.3 }}
                    >
                        {subject.name}
                    </Typography>
                    {isEditingThisName ? (
                        <Box
                            component="input"
                            type="text"
                            autoFocus
                            value={editingNameValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingNameValue(e.target.value)}
                            onBlur={() => {
                                setEditingNameId(null);
                                saveRealName(subject, editingNameValue);
                            }}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                if (e.key === 'Escape') setEditingNameId(null);
                            }}
                            placeholder="Add name…"
                            sx={{
                                ...inputBaseSx,
                                fontSize: '0.72rem',
                                color: '#94a3b8',
                                mt: 0.15,
                                py: '1px',
                                px: '2px',
                                width: '100%',
                                borderBottom: '1px solid rgba(139,92,246,0.4)',
                            }}
                        />
                    ) : (
                        <Typography
                            onClick={() => {
                                setEditingNameId(subject.id);
                                setEditingNameValue(subject.real_name?.trim() ?? '');
                            }}
                            sx={{
                                fontSize: '0.72rem',
                                color: subject.real_name?.trim() ? '#64748b' : 'rgba(255,255,255,0.2)',
                                mt: 0.15,
                                lineHeight: 1.2,
                                cursor: 'text',
                                borderBottom: '1px solid transparent',
                                transition: 'all 0.15s',
                                '&:hover': { borderBottomColor: 'rgba(139,92,246,0.3)', color: subject.real_name?.trim() ? '#64748b' : 'rgba(255,255,255,0.35)' },
                            }}
                        >
                            {subject.real_name?.trim() || '— Add name…'}
                        </Typography>
                    )}
                </Box>

                {/* Role chip */}
                {roleName && (
                    <Chip
                        size="small"
                        label={roleName}
                        sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(148,163,184,0.1)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(148,163,184,0.2)',
                            flexShrink: 0,
                        }}
                    />
                )}

                {/* Editable count stepper */}
                {isGroup && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.15, flexShrink: 0 }}>
                        <IconButton
                            size="small"
                            onClick={() => adjustCount(subject, -1)}
                            sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}
                        >
                            <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>−</Box>
                        </IconButton>
                        {isEditingThisCount ? (
                            <Box
                                component="input"
                                type="number"
                                autoFocus
                                value={editingCountValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCountValue(e.target.value)}
                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                    setEditingCountId(null);
                                    saveCount(subject, e.target.value);
                                }}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                    if (e.key === 'Escape') setEditingCountId(null);
                                }}
                                sx={{
                                    width: 36, textAlign: 'center',
                                    border: '1px solid rgba(167,139,250,0.5)',
                                    borderRadius: '4px', bgcolor: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                                    fontSize: '0.65rem', fontWeight: 700, py: '1px', px: '2px',
                                    outline: 'none',
                                    '&::-webkit-inner-spin-button': { display: 'none' },
                                }}
                            />
                        ) : (
                            <Typography
                                onClick={() => { setEditingCountId(subject.id); setEditingCountValue(String(currentCount)); }}
                                sx={{
                                    fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa',
                                    minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                                    cursor: 'text', px: 0.25, borderRadius: '4px',
                                    '&:hover': { bgcolor: 'rgba(167,139,250,0.1)' },
                                }}
                            >
                                {currentCount}
                            </Typography>
                        )}
                        <IconButton
                            size="small"
                            onClick={() => adjustCount(subject, +1)}
                            sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}
                        >
                            <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>+</Box>
                        </IconButton>
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <WorkflowCard>
            <CardContent sx={{ p: '0 !important' }}>
                {/* Header */}
                <Box
                    sx={{
                        px: 2.5,
                        pt: 2,
                        pb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        borderBottom: '1px solid rgba(52, 58, 68, 0.3)',
                        background:
                            'linear-gradient(135deg, rgba(236, 72, 153, 0.06), transparent)',
                    }}
                >
                    <PeopleAltIcon sx={{ color: '#ec4899', fontSize: 20 }} />
                    <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}
                    >
                        The Couple
                    </Typography>
                    {!loading && (
                        <Chip
                            size="small"
                            label={people.length}
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(236,72,153,0.12)',
                                color: '#ec4899',
                                border: '1px solid rgba(236,72,153,0.2)',
                            }}
                        />
                    )}
                </Box>

                {/* Body */}
                <Box sx={{ p: 2.5 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={20} sx={{ color: '#8b5cf6' }} />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Bride & Groom tiles */}
                            <Grid container spacing={1.5}>
                                <Grid item xs={12} sm={5}>
                                    {renderCoupleTile(brideSubject, 'Bride', Female)}
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    {renderCoupleTile(groomSubject, 'Groom', Male)}
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <Box
                                        sx={{
                                            px: 1.2,
                                            py: 2.5,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(100,116,139,0.25)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1,
                                            minHeight: 140,
                                            transition: 'border-color 0.2s',
                                            '&:hover': { borderColor: 'rgba(139,92,246,0.35)' },
                                        }}
                                    >
                                        <GroupsOutlined sx={{ color: '#22d3ee', fontSize: 22 }} />
                                        <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
                                            Guests
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.86rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1.1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            {guestCountDisplay ?? '—'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Other subjects */}
                            {otherSubjects.length > 0 && (
                                <>
                                    <Divider sx={{ borderColor: 'rgba(52, 58, 68, 0.28)' }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {otherSubjects.map(renderOtherSubject)}
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </WorkflowCard>
    );
}
