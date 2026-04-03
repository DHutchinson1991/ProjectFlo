'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, IconButton, Button } from '@mui/material';
import { CheckCircle, EmailOutlined, Phone, OpenInNew } from '@mui/icons-material';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { inquiryWizardSubmissionsApi } from '@/features/workflow/inquiry-wizard';
import { getDisplayEmail } from '../../lib';
import type { ContactInfoProps } from './types';

export default function ContactInfo({ inquiry, conversionData, onRefresh, onSnackbar }: ContactInfoProps) {
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
            await inquiriesApi.update(inquiry.id, payload);
            setEditingField(null);
            await onRefresh();
        } catch (err: unknown) {
            let msg = 'Failed to update contact';
            if (err instanceof Error) {
                try { const body = JSON.parse(err.message); if (body?.message) msg = body.message; } catch { /* use default */ }
            }
            onSnackbar(msg);
        }
    };

    const handleContactKeyDown = (e: React.KeyboardEvent, field: string) => {
        if (e.key === 'Enter') handleContactFieldSave(field);
        if (e.key === 'Escape') setEditingField(null);
    };

    const displayEmail = getDisplayEmail(inquiry.contact?.email);
    const phone = inquiry.contact?.phone_number;
    const fullName =
        inquiry.contact?.first_name || inquiry.contact?.last_name
            ? `${inquiry.contact?.first_name || ''} ${inquiry.contact?.last_name || ''}`.trim()
            : null;
    const initials = fullName
        ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <Box
            id="contact-info-section"
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 2,
                px: 1,
                py: 0.5,
                mx: -1,
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, minWidth: 0 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                        onClick={async () => {
                            try {
                                const res = await inquiryWizardSubmissionsApi.generatePortalToken(inquiry.id);
                                window.open(`${window.location.origin}/portal/${res.portal_token}`, '_blank');
                            } catch {
                                onSnackbar('Failed to open Client Portal');
                            }
                        }}
                        sx={{
                            borderColor: 'rgba(96, 165, 250, 0.3)',
                            color: '#93bbfc',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            borderRadius: 1.75,
                            textTransform: 'none',
                            px: 1.1,
                            py: 0.25,
                            minWidth: 'auto',
                            flexShrink: 0,
                            '&:hover': {
                                bgcolor: 'rgba(96, 165, 250, 0.1)',
                                borderColor: 'rgba(96, 165, 250, 0.45)',
                            },
                        }}
                    >
                        Portal
                    </Button>

                    {editingField === 'name' ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 0 }}>
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
                        <Box onClick={() => setEditingField('name')} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 }, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.05rem', lineHeight: 1.2, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                                {fullName || 'Add name'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.58rem', color: '#64748b', letterSpacing: '0.04em', fontWeight: 600 }}>INQUIRY</Typography>
                        </Box>
                    )}
                </Box>
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
        </Box>
    );
}
