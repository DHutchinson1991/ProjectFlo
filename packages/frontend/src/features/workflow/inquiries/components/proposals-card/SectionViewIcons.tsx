'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { TextFields, EventNote, AttachMoney, MovieFilter, Schedule, People, Handshake, Gavel } from '@mui/icons-material';
import { colors } from '@/shared/theme/tokens';
import { formatSectionDuration, getDurationVisual } from '@/shared/utils/dateTime';
import type { SectionViewIconsProps } from './types';

const TRACKED_SECTIONS: { type: string; label: string; icon: React.ElementType }[] = [
    { type: 'text', label: 'Message', icon: TextFields },
    { type: 'event-details', label: 'Event', icon: EventNote },
    { type: 'pricing', label: 'Pricing', icon: AttachMoney },
    { type: 'films', label: 'Films', icon: MovieFilter },
    { type: 'schedule', label: 'Schedule', icon: Schedule },
    { type: 'team', label: 'Team', icon: People },
    { type: 'quote', label: 'Quote', icon: AttachMoney },
    { type: 'payment-terms', label: 'Payment', icon: Handshake },
    { type: 'contract', label: 'Contract', icon: Gavel },
];

const SectionViewIcons: React.FC<SectionViewIconsProps> = ({ sectionViews, sectionNotes }) => {
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const viewedTypes = new Set(sectionViews.map((sv) => sv.section_type));
    const durationByType = new Map(sectionViews.map((sv) => [sv.section_type, sv.duration_seconds ?? 0]));
    const noteByType = new Map(sectionNotes.map((sn) => [sn.section_type, sn.note]));
    const viewedCount = TRACKED_SECTIONS.filter((s) => viewedTypes.has(s.type)).length;

    const activeNote = selectedSection ? noteByType.get(selectedSection) ?? null : null;
    const activeSection = selectedSection ? TRACKED_SECTIONS.find((s) => s.type === selectedSection) : null;

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
                    Client Engagement
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: viewedCount > 0 ? colors.accent : '#475569' }}>
                    {viewedCount}/{TRACKED_SECTIONS.length} viewed
                </Typography>
            </Box>
            {/* Progress bar */}
            <Box sx={{ height: 2, borderRadius: 1, bgcolor: 'rgba(100, 116, 139, 0.1)', mb: 1.5, overflow: 'hidden' }}>
                <Box sx={{
                    height: '100%', borderRadius: 1,
                    width: `${(viewedCount / TRACKED_SECTIONS.length) * 100}%`,
                    bgcolor: colors.accent,
                    transition: 'width 0.4s ease',
                }} />
            </Box>
            {/* Full-width icon row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {TRACKED_SECTIONS.map(({ type, label, icon: Icon }) => {
                    const viewed = viewedTypes.has(type);
                    const totalSeconds = durationByType.get(type) ?? 0;
                    const durationLabel = formatSectionDuration(totalSeconds);
                    const durationVisual = getDurationVisual(totalSeconds);
                    const hasNote = noteByType.has(type);
                    const isSelected = selectedSection === type;
                    return (
                            <Box
                                key={type}
                                onClick={() => setSelectedSection((prev) => (prev === type ? null : type))}
                                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3, flex: 1, cursor: 'pointer' }}
                            >
                                <Box sx={{
                                    width: 30, height: 30, borderRadius: 1.5,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: isSelected
                                        ? 'rgba(139, 92, 246, 0.22)'
                                        : viewed ? 'rgba(139, 92, 246, 0.12)' : 'rgba(100, 116, 139, 0.05)',
                                    border: `1px solid ${isSelected ? colors.accent : viewed ? 'rgba(139, 92, 246, 0.3)' : 'rgba(100, 116, 139, 0.08)'}`,
                                    transition: 'all 0.2s ease',
                                    '&:hover': { bgcolor: viewed ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.1)' },
                                    ...(hasNote && { boxShadow: '0 0 0 1.5px rgba(139,92,246,0.35)' }),
                                }}>
                                    <Icon sx={{ fontSize: 15, color: isSelected ? colors.accent : viewed ? colors.accent : '#334155', transition: 'color 0.2s ease' }} />
                                </Box>
                                <Typography sx={{ fontSize: '0.55rem', color: viewed ? '#94a3b8' : '#334155', fontWeight: viewed ? 600 : 400, transition: 'all 0.25s ease' }}>
                                    {label}
                                </Typography>
                                <Typography sx={{
                                    fontSize: '0.55rem',
                                    color: viewed ? durationVisual.text : 'rgba(100,116,139,0.45)',
                                    fontWeight: viewed ? 700 : 500,
                                    letterSpacing: '0.02em',
                                    px: 0.45,
                                    py: 0.1,
                                    borderRadius: 1,
                                    bgcolor: viewed ? durationVisual.bg : 'transparent',
                                    border: viewed ? `1px solid ${durationVisual.border}` : '1px solid transparent',
                                }}>
                                    {durationLabel}
                                </Typography>
                            </Box>
                    );
                })}
            </Box>
            {/* Inline note panel */}
            {selectedSection && (
                <Box sx={{
                    mt: 1.5, p: 1.5, borderRadius: 2,
                    bgcolor: activeNote ? 'rgba(139, 92, 246, 0.06)' : 'rgba(100, 116, 139, 0.04)',
                    border: `1px solid ${activeNote ? 'rgba(139, 92, 246, 0.18)' : 'rgba(100, 116, 139, 0.1)'}`,
                    transition: 'all 0.2s ease',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: activeNote ? 0.75 : 0 }}>
                        {activeSection && <activeSection.icon sx={{ fontSize: 13, color: activeNote ? colors.accent : '#64748b' }} />}
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: activeNote ? '#94a3b8' : '#64748b' }}>
                            {activeSection?.label ?? selectedSection}
                        </Typography>
                    </Box>
                    {activeNote ? (
                        <Typography sx={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                            &ldquo;{activeNote}&rdquo;
                        </Typography>
                    ) : (
                        <Typography sx={{ fontSize: '0.7rem', color: '#475569', fontStyle: 'italic' }}>
                            No note for this section
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default SectionViewIcons;
