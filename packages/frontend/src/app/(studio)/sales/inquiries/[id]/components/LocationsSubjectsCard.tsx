'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CardContent,
    TextField,
    IconButton,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { Inquiry } from '@/lib/types';
import { api } from '@/lib/api';

interface LocationsSubjectsCardProps {
    inquiry: Inquiry;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

interface LocationSlot {
    id: number;
    location_number: number;
    name: string | null;
    address: string | null;
    project_activity?: { name: string } | null;
}

interface EventDaySubject {
    id: number;
    name: string;
    real_name: string | null;
    category: string;
}

function InlineEditField({
    value,
    placeholder,
    onSave,
}: {
    value: string | null;
    placeholder: string;
    onSave: (v: string | null) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(draft.trim() || null);
            setEditing(false);
        } catch {
            // keep editing open on error
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setDraft(value ?? '');
        setEditing(false);
    };

    if (editing) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                <TextField
                    size="small"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={placeholder}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') handleCancel();
                    }}
                    sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.5 } }}
                    disabled={saving}
                />
                {saving ? (
                    <CircularProgress size={16} />
                ) : (
                    <>
                        <Tooltip title="Save">
                            <IconButton size="small" onClick={handleSave} sx={{ color: '#4ade80' }}>
                                <CheckIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                            <IconButton size="small" onClick={handleCancel}>
                                <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
            <Typography
                sx={{
                    fontSize: '0.82rem',
                    color: value ? 'text.primary' : 'text.disabled',
                    fontStyle: value ? 'normal' : 'italic',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {value || placeholder}
            </Typography>
            <Tooltip title="Edit">
                <IconButton size="small" onClick={() => setEditing(true)} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                    <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

const LocationsSubjectsCard: React.FC<LocationsSubjectsCardProps> = ({ inquiry, WorkflowCard }) => {
    const [locationSlots, setLocationSlots] = useState<LocationSlot[]>([]);
    const [subjects, setSubjects] = useState<EventDaySubject[]>([]);
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(() => {
        if (!inquiry.source_package_id) return;
        Promise.all([
            api.schedule.instanceLocationSlots.getForInquiry(inquiry.id),
            api.schedule.instanceSubjects.getForInquiry(inquiry.id),
        ])
            .then(([slots, subs]) => {
                setLocationSlots(slots ?? []);
                setSubjects(subs ?? []);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, [inquiry.id, inquiry.source_package_id]);

    useEffect(() => {
        load();
    }, [load]);

    // Only show if a package has been cloned to this inquiry
    if (!inquiry.source_package_id) return null;

    const handleSlotNameSave = async (slotId: number, name: string | null) => {
        const updated = await api.schedule.instanceLocationSlots.update(slotId, { name });
        setLocationSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, name: updated.name } : s)));
    };

    const handleSlotAddressSave = async (slotId: number, address: string | null) => {
        const updated = await api.schedule.instanceLocationSlots.update(slotId, { address });
        setLocationSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, address: updated.address } : s)));
    };

    const handleSubjectRealNameSave = async (subjectId: number, real_name: string | null) => {
        const updated = await api.schedule.instanceSubjects.update(subjectId, { real_name });
        setSubjects((prev) => prev.map((s) => (s.id === subjectId ? { ...s, real_name: updated.real_name } : s)));
    };

    const hasContent = locationSlots.length > 0 || subjects.length > 0;

    return (
        <WorkflowCard isActive={false} activeColor={undefined}>
            <CardContent sx={{ p: '0 !important' }}>
                {/* Header */}
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlaceIcon sx={{ fontSize: 18, color: '#a855f7' }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        Locations &amp; Subjects
                    </Typography>
                </Box>

                {!loaded && (
                    <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={14} />
                        <Typography variant="caption" color="text.secondary">Loading…</Typography>
                    </Box>
                )}

                {loaded && !hasContent && (
                    <Box sx={{ px: 2.5, pb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.82rem' }}>
                            No location slots or subjects found for this package.
                        </Typography>
                    </Box>
                )}

                {loaded && locationSlots.length > 0 && (
                    <Box sx={{ px: 2.5, pb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                            <PlaceIcon sx={{ fontSize: 14, color: '#a855f7' }} />
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Locations
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {locationSlots.map((slot) => (
                                <Box key={slot.id} sx={{ display: 'flex', gap: 1 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', minWidth: 20, textAlign: 'right', pt: 0.25 }}>
                                        L{slot.location_number}
                                    </Typography>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            {slot.project_activity?.name && (
                                                <Typography sx={{
                                                    fontSize: '0.72rem', color: 'text.secondary',
                                                    bgcolor: 'rgba(168,85,247,0.08)', px: 0.75, py: 0.25,
                                                    borderRadius: 0.5, whiteSpace: 'nowrap', flexShrink: 0,
                                                }}>
                                                    {slot.project_activity.name}
                                                </Typography>
                                            )}
                                            <InlineEditField
                                                value={slot.name}
                                                placeholder="Add location name…"
                                                onSave={(v) => handleSlotNameSave(slot.id, v)}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', ml: slot.project_activity?.name ? 0 : 0 }}>
                                            <InlineEditField
                                                value={slot.address}
                                                placeholder="Add address…"
                                                onSave={(v) => handleSlotAddressSave(slot.id, v)}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {loaded && subjects.length > 0 && (
                    <Box sx={{ px: 2.5, pb: 2, borderTop: locationSlots.length > 0 ? '1px solid rgba(52,58,68,0.3)' : 'none', pt: locationSlots.length > 0 ? 1.5 : 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                            <PeopleIcon sx={{ fontSize: 14, color: '#648CFF' }} />
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#648CFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Subjects
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            {subjects.map((subject) => (
                                <Box key={subject.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{
                                        fontSize: '0.72rem', color: 'text.secondary',
                                        bgcolor: 'rgba(100,140,255,0.08)', px: 0.75, py: 0.25,
                                        borderRadius: 0.5, whiteSpace: 'nowrap', flexShrink: 0, minWidth: 50, textAlign: 'center',
                                    }}>
                                        {subject.name}
                                    </Typography>
                                    <InlineEditField
                                        value={subject.real_name}
                                        placeholder="Add real name…"
                                        onSave={(v) => handleSubjectRealNameSave(subject.id, v)}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default LocationsSubjectsCard;
