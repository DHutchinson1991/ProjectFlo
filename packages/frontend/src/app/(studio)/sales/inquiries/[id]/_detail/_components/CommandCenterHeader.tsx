'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Button,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    CheckCircle,
    EmailOutlined,
    Phone,
    AccessTime,
    Assignment,
    TrendingUp,
    LocalFireDepartment,
} from '@mui/icons-material';
import { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';
import { inquiriesService } from '@/lib/api';
import { getDisplayEmail } from '../_lib';
import type { ConversionData } from '../_lib';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
export interface CommandCenterHeaderProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    needsAssessmentSubmission: NeedsAssessmentSubmission | null;
    conversionData: ConversionData;
    daysInPipeline: number;
    dealValue: number;
    onRefresh: () => Promise<void>;
    onOpenAssessment: () => void;
    onSnackbar: (msg: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CommandCenterHeader({
    inquiry,
    needsAssessmentSubmission,
    conversionData,
    daysInPipeline,
    dealValue,
    onRefresh,
    onOpenAssessment,
    onSnackbar,
}: CommandCenterHeaderProps) {
    /* ---- inline-editing state ---- */
    const [editingField, setEditingField] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
    });

    useEffect(() => {
        if (inquiry) {
            setContactForm({
                first_name: inquiry.contact?.first_name || '',
                last_name: inquiry.contact?.last_name || '',
                email: getDisplayEmail(inquiry.contact?.email) || '',
                phone_number: inquiry.contact?.phone_number || '',
            });
        }
    }, [inquiry]);

    const handleContactFieldSave = async (field: string) => {
        try {
            const payload: Record<string, string> = {
                [field]: (contactForm as Record<string, string>)[field],
            };
            if (field === 'email' && !payload.email) delete payload.email;
            await inquiriesService.update(inquiry.id, payload);
            setEditingField(null);
            await onRefresh();
        } catch {
            onSnackbar('Failed to update contact');
        }
    };

    const handleContactKeyDown = (e: React.KeyboardEvent, field: string) => {
        if (e.key === 'Enter') handleContactFieldSave(field);
        if (e.key === 'Escape') setEditingField(null);
    };

    /* ---- derived display values ---- */
    const displayEmail = getDisplayEmail(inquiry.contact?.email);
    const phone = inquiry.contact?.phone_number;
    const fullName =
        inquiry.contact?.first_name || inquiry.contact?.last_name
            ? `${inquiry.contact?.first_name || ''} ${inquiry.contact?.last_name || ''}`.trim()
            : null;
    const initials = fullName
        ? fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '?';


    /* ---- render ---- */
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                mb: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(16, 18, 24, 0.92), rgba(20, 22, 30, 0.85))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(52, 58, 68, 0.25)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(52, 58, 68, 0.08)',
                overflow: 'hidden',
            }}
        >
            {/* ===== TOP ROW: Identity + Contact ===== */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 2.5,
                    py: 2,
                }}
            >
                {/* Avatar with status indicator */}
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${conversionData.color}, ${conversionData.color}99)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            color: '#fff',
                            boxShadow: `0 4px 16px ${conversionData.color}30`,
                            border: `2px solid ${conversionData.color}30`,
                        }}
                    >
                        {initials}
                    </Box>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 1,
                            right: 1,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: conversionData.color,
                            border: '2px solid rgba(16, 18, 24, 0.9)',
                            boxShadow: `0 0 8px ${conversionData.color}50`,
                        }}
                    />
                </Box>

                {/* Name + inline edit */}
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {editingField === 'name' ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                variant="standard"
                                placeholder="First"
                                value={contactForm.first_name}
                                onChange={(e) => setContactForm((p) => ({ ...p, first_name: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleContactFieldSave('first_name').then(() => handleContactFieldSave('last_name'));
                                    }
                                    if (e.key === 'Escape') setEditingField(null);
                                }}
                                autoFocus
                                sx={{ '& input': { color: '#f1f5f9', fontSize: '1rem', fontWeight: 700 } }}
                            />
                            <TextField
                                size="small"
                                variant="standard"
                                placeholder="Last"
                                value={contactForm.last_name}
                                onChange={(e) => setContactForm((p) => ({ ...p, last_name: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleContactFieldSave('first_name').then(() => handleContactFieldSave('last_name'));
                                    }
                                    if (e.key === 'Escape') setEditingField(null);
                                }}
                                sx={{ '& input': { color: '#f1f5f9', fontSize: '1rem', fontWeight: 700 } }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => handleContactFieldSave('first_name').then(() => handleContactFieldSave('last_name'))}
                                sx={{ color: '#22c55e' }}
                            >
                                <CheckCircle sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Box>
                    ) : (
                        <Box onClick={() => setEditingField('name')} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                            <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.05rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                                {fullName || 'Add name'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.58rem', color: '#64748b', letterSpacing: '0.04em', fontWeight: 600 }}>INQUIRY</Typography>
                        </Box>
                    )}
                </Box>

                {/* Divider */}
                <Box sx={{ width: '1px', height: 32, bgcolor: 'rgba(52, 58, 68, 0.35)', flexShrink: 0 }} />

                {/* Email + Phone side by side */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0, flex: 1 }}>
                    {/* Email */}
                    {editingField === 'email' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                            <EmailOutlined sx={{ fontSize: 14, color: '#818cf8' }} />
                            <TextField
                                size="small"
                                variant="standard"
                                placeholder="Email"
                                fullWidth
                                value={contactForm.email}
                                onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                                onKeyDown={(e) => handleContactKeyDown(e, 'email')}
                                autoFocus
                                sx={{ '& input': { color: '#cbd5e1', fontSize: '0.8rem' } }}
                            />
                            <IconButton size="small" onClick={() => handleContactFieldSave('email')} sx={{ color: '#22c55e' }}>
                                <CheckCircle sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    ) : (
                        <Box
                            onClick={() => setEditingField('email')}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', '&:hover': { opacity: 0.8 }, minWidth: 0 }}
                        >
                            <EmailOutlined sx={{ fontSize: 14, color: '#818cf8', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.8rem', color: displayEmail ? '#cbd5e1' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {displayEmail || 'Add email'}
                            </Typography>
                        </Box>
                    )}

                    {/* Subtle separator */}
                    <Box sx={{ width: '1px', height: 18, bgcolor: 'rgba(52, 58, 68, 0.25)', flexShrink: 0 }} />

                    {/* Phone */}
                    {editingField === 'phone_number' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                            <Phone sx={{ fontSize: 14, color: '#34d399' }} />
                            <TextField
                                size="small"
                                variant="standard"
                                placeholder="Phone"
                                value={contactForm.phone_number}
                                onChange={(e) => setContactForm((p) => ({ ...p, phone_number: e.target.value }))}
                                onKeyDown={(e) => handleContactKeyDown(e, 'phone_number')}
                                autoFocus
                                sx={{ '& input': { color: '#cbd5e1', fontSize: '0.8rem' } }}
                            />
                            <IconButton size="small" onClick={() => handleContactFieldSave('phone_number')} sx={{ color: '#22c55e' }}>
                                <CheckCircle sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    ) : (
                        <Box
                            onClick={() => setEditingField('phone_number')}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                        >
                            <Phone sx={{ fontSize: 14, color: '#34d399', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.8rem', color: phone ? '#cbd5e1' : '#475569', whiteSpace: 'nowrap' }}>
                                {phone || 'Add phone'}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Right side: metrics pills + assessment button */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, ml: 'auto' }}>
                    {/* Deal Value pill */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.75, borderRadius: 2,
                        bgcolor: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.12)',
                    }}>
                        <TrendingUp sx={{ fontSize: 14, color: '#10b981' }} />
                        <Box>
                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Value</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                {dealValue > 0 ? `£${dealValue.toLocaleString()}` : '\u2014'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Pipeline Age pill */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.75, borderRadius: 2,
                        bgcolor: daysInPipeline > 14 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(59, 130, 246, 0.06)',
                        border: `1px solid ${daysInPipeline > 14 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)'}`,
                    }}>
                        <AccessTime sx={{ fontSize: 14, color: daysInPipeline > 14 ? '#ef4444' : '#3b82f6' }} />
                        <Box>
                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Age</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: daysInPipeline > 14 ? '#ef4444' : '#3b82f6', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                {daysInPipeline === 0 ? 'Today' : `${daysInPipeline}d`}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Deal Health pill */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.75, borderRadius: 2,
                        bgcolor: `${conversionData.color}0A`,
                        border: `1px solid ${conversionData.color}1A`,
                    }}>
                        <LocalFireDepartment sx={{ fontSize: 14, color: conversionData.color }} />
                        <Box>
                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Health</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: conversionData.color, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                    {conversionData.score}%
                                </Typography>
                                <Chip
                                    label={conversionData.label}
                                    size="small"
                                    sx={{
                                        height: 16, fontSize: '0.5rem', fontWeight: 800,
                                        bgcolor: `${conversionData.color}15`, color: conversionData.color,
                                        border: `1px solid ${conversionData.color}20`,
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={conversionData.score}
                                sx={{
                                    mt: 0.25, height: 2.5, borderRadius: 2, width: 60, bgcolor: 'rgba(52, 58, 68, 0.15)',
                                    '& .MuiLinearProgress-bar': { borderRadius: 2, background: `linear-gradient(90deg, ${conversionData.color}80, ${conversionData.color})` },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Assessment button */}
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Assignment sx={{ fontSize: 15 }} />}
                        onClick={onOpenAssessment}
                        sx={{
                            borderColor: needsAssessmentSubmission ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                            color: needsAssessmentSubmission ? '#22c55e' : '#f59e0b',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.5,
                            '&:hover': {
                                bgcolor: needsAssessmentSubmission ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                borderColor: needsAssessmentSubmission ? 'rgba(34, 197, 94, 0.5)' : 'rgba(245, 158, 11, 0.5)',
                            },
                        }}
                    >
                        {needsAssessmentSubmission ? 'View Assessment' : 'Assessment'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
