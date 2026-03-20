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
    Tooltip,
} from '@mui/material';
import {
    CheckCircle,
    EmailOutlined,
    Phone,
    TrendingUp,
    LocalFireDepartment,
    TravelExplore,
    OpenInNew,
    CardGiftcard,
    Schedule,
    CalendarToday,
} from '@mui/icons-material';
import { formatCurrency } from '@/lib/utils/formatUtils';
import { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';
import { inquiriesService, api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
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
    onSnackbar,
}: CommandCenterHeaderProps) {
    const { currentBrand } = useBrand();

    /* ---- currency ---- */
    const currencyCode = currentBrand?.currency || 'GBP';

    /* ---- inquiry period ---- */
    const validityDays = currentBrand?.inquiry_validity_days ?? 14;
    const createdDate = new Date(inquiry.created_at);
    const expiresDate = new Date(createdDate);
    expiresDate.setDate(expiresDate.getDate() + validityDays);
    const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / 86_400_000);
    const periodExpired = daysLeft < 0;
    const periodUrgent = daysLeft >= 0 && daysLeft <= 3;

    /* ---- inline-editing state ---- */
    const [editingField, setEditingField] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
    });
    const [sendingWelcomePack, setSendingWelcomePack] = useState(false);
    const [welcomePackSent, setWelcomePackSent] = useState(!!inquiry.welcome_sent_at);

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

    /* ---- derived lead source ---- */
    const naResponses = (needsAssessmentSubmission?.responses ?? {}) as Record<string, unknown>;
    const leadSource = inquiry.lead_source || naResponses.lead_source || null;

    /* ---- send welcome pack ---- */
    const handleSendWelcomePack = async () => {
        if (welcomePackSent || sendingWelcomePack) return;
        try {
            setSendingWelcomePack(true);
            await api.inquiries.sendWelcomePack(inquiry.id);
            setWelcomePackSent(true);
            onSnackbar('Welcome pack sent!');
            await onRefresh();
        } catch {
            onSnackbar('Failed to send welcome pack');
        } finally {
            setSendingWelcomePack(false);
        }
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
                    {/* ---- Metric pills (uniform style) ---- */}

                    {/* Lead Source pill — warm violet (discovery / origin) */}
                    {leadSource && (
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.5, py: 0.75, borderRadius: 2, minWidth: 0, height: 44,
                            bgcolor: 'rgba(167, 139, 250, 0.06)',
                            border: '1px solid rgba(167, 139, 250, 0.14)',
                        }}>
                            <TravelExplore sx={{ fontSize: 14, color: '#a78bfa', flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Source</Typography>
                                <Typography title={String(leadSource)} sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {String(leadSource)}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Deal Value pill — amber/gold (money / worth) */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.75, borderRadius: 2, height: 44,
                        bgcolor: 'rgba(245, 158, 11, 0.06)',
                        border: '1px solid rgba(245, 158, 11, 0.14)',
                    }}>
                        <TrendingUp sx={{ fontSize: 14, color: '#f59e0b' }} />
                        <Box>
                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Value</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                {dealValue > 0 ? formatCurrency(dealValue, currencyCode) : '\u2014'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Combined Submitted + Offer Period pill — cyan/teal (time / flow) */}
                    {(() => {
                        const tealBase = '#06b6d4';
                        const periodColor = periodExpired ? '#ef4444' : periodUrgent ? '#f59e0b' : tealBase;
                        const periodBg = periodExpired
                            ? 'rgba(239, 68, 68, 0.06)'
                            : periodUrgent ? 'rgba(245, 158, 11, 0.06)' : 'rgba(6, 182, 212, 0.04)';
                        const periodBorder = periodExpired
                            ? 'rgba(239, 68, 68, 0.12)'
                            : periodUrgent ? 'rgba(245, 158, 11, 0.12)' : 'rgba(6, 182, 212, 0.14)';
                        const periodLabel = periodExpired
                            ? 'Expired'
                            : daysLeft === 0 ? 'Today'
                            : `${daysLeft}d left`;
                        return (
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 0,
                                borderRadius: 2, height: 44, overflow: 'hidden',
                                border: `1px solid ${periodBorder}`,
                                position: 'relative',
                            }}>
                                {/* Submitted half */}
                                <Tooltip title={createdDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })} arrow placement="bottom">
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.75,
                                    px: 1.5, height: '100%',
                                    bgcolor: 'rgba(6, 182, 212, 0.06)',
                                    cursor: 'default',
                                }}>
                                    <CalendarToday sx={{ fontSize: 14, color: tealBase, opacity: 0.85 }} />
                                    <Box>
                                        <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Submitted</Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: tealBase, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                            {createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Typography>
                                    </Box>
                                </Box>
                                </Tooltip>
                                {/* Dot divider */}
                                <Box sx={{
                                    width: 4, height: 4, borderRadius: '50%',
                                    bgcolor: 'rgba(100, 116, 139, 0.35)',
                                    flexShrink: 0, mx: 0.25,
                                }} />
                                {/* Offer half */}
                                <Tooltip title={`Expires ${expiresDate.toLocaleDateString(undefined, { dateStyle: 'full' })}`} arrow placement="bottom">
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.75,
                                    px: 1.5, height: '100%',
                                    bgcolor: periodBg,
                                    cursor: 'default',
                                }}>
                                    <Schedule sx={{ fontSize: 14, color: periodColor, opacity: 0.85 }} />
                                    <Box>
                                        <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Offer</Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: periodColor, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                            {periodLabel}
                                        </Typography>
                                    </Box>
                                </Box>
                                </Tooltip>
                            </Box>
                        );
                    })()}

                    {/* Deal Health pill */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.75, borderRadius: 2, height: 44,
                        bgcolor: `${conversionData.color}0A`,
                        border: `1px solid ${conversionData.color}1A`,
                    }}>
                        <LocalFireDepartment sx={{ fontSize: 14, color: conversionData.color }} />
                        <Box>
                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Health</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: conversionData.color, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
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
                        </Box>
                    </Box>

                    {/* Send Welcome Pack button — shown only when inquiry is Booked */}
                    {inquiry.status === 'Booked' && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={
                                sendingWelcomePack
                                    ? <LinearProgress sx={{ width: 14 }} />
                                    : <CardGiftcard sx={{ fontSize: 14 }} />
                            }
                            disabled={welcomePackSent || sendingWelcomePack}
                            onClick={handleSendWelcomePack}
                            sx={{
                                borderColor: welcomePackSent ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)',
                                color: welcomePackSent ? '#10b981' : '#10b981',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 1.5,
                                py: 0.5,
                                '&:hover': {
                                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                                    borderColor: 'rgba(16, 185, 129, 0.5)',
                                },
                                '&.Mui-disabled': {
                                    borderColor: 'rgba(16, 185, 129, 0.25)',
                                    color: '#10b981',
                                    opacity: 0.6,
                                },
                            }}
                        >
                            {welcomePackSent ? 'Welcome Pack Sent' : 'Send Welcome Pack'}
                        </Button>
                    )}

                    {/* Client Portal button */}
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<OpenInNew sx={{ fontSize: 15 }} />}
                        onClick={async () => {
                            try {
                                const res = await api.clientPortal.generateToken(inquiry.id);
                                window.open(`${window.location.origin}/portal/${res.portal_token}`, '_blank');
                            } catch {
                                onSnackbar('Failed to open Client Portal');
                            }
                        }}
                        sx={{
                            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15))',
                            color: '#93bbfc',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 2,
                            py: 0.85,
                            border: '1px solid rgba(96, 165, 250, 0.25)',
                            boxShadow: '0 2px 8px rgba(96, 165, 250, 0.12)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.25), rgba(139, 92, 246, 0.25))',
                                borderColor: 'rgba(96, 165, 250, 0.45)',
                                boxShadow: '0 4px 16px rgba(96, 165, 250, 0.2)',
                            },
                        }}
                    >
                        Client Portal
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
