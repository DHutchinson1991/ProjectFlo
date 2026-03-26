"use client";

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { ContributorOption } from '@/features/workflow/calendar/hooks/use-contributors';
import { useEventForm, EventFormData } from '../../hooks/use-event-form';
import EventFormFields from './EventFormFields';

export type { EventFormData };

interface EventModalProps {
    open: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    event?: CalendarEvent | null;
    initialData?: { start: Date; end: Date; title: string };
    contributors: ContributorOption[];
    currentUserContributor: ContributorOption | null;
    contributorsLoading: boolean;
    contributorsError: string | null;
    onSave: (eventData: EventFormData) => void;
    onDelete?: (eventId: string) => void;
    isSaving?: boolean;
}

export const EventModal: React.FC<EventModalProps> = ({
    open, onClose, mode, event, initialData,
    contributors, currentUserContributor, contributorsLoading, contributorsError,
    onSave, onDelete, isSaving = false,
}) => {
    const { formData, setFormData, handleSave, handleDelete, handleClose } = useEventForm({
        open, mode, event, initialData, currentUserContributor, onSave, onDelete, onClose,
    });

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(30,30,35,0.98) 0%, rgba(25,25,30,0.98) 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                    overflow: 'hidden', color: 'white', maxHeight: '85vh',
                    display: 'flex', flexDirection: 'column',
                },
            }}
            BackdropProps={{ sx: { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' } }}
        >
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, rgba(74,144,226,0.15) 0%, rgba(74,144,226,0.08) 100%)',
                borderBottom: '1px solid rgba(74,144,226,0.2)', pb: 2, color: 'white', flexShrink: 0,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: 2,
                            background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', boxShadow: '0 4px 12px rgba(74,144,226,0.4)',
                        }}>
                            <EventIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={600} color="white">
                                {mode === 'create' ? 'Create New Event' : 'Edit Event'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                                {mode === 'create' ? 'Add a new event to your calendar' : 'Modify event details'}
                            </Typography>
                        </Box>
                    </Box>
                    {mode === 'edit' && onDelete && (
                        <Button onClick={handleDelete} color="error" variant="outlined" size="small" disabled={isSaving}
                            sx={{
                                borderRadius: 2, px: 2, borderColor: 'rgba(211,47,47,0.7)', color: '#ff6b6b',
                                '&:hover': { backgroundColor: 'rgba(211,47,47,0.1)', borderColor: '#ff6b6b', transform: 'translateY(-1px)' },
                            }}>
                            Delete Event
                        </Button>
                    )}
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2, flex: 1, overflow: 'auto' }}>
                <EventFormFields
                    formData={formData} setFormData={setFormData}
                    mode={mode} event={event}
                    contributors={contributors} currentUserContributor={currentUserContributor}
                    contributorsLoading={contributorsLoading} contributorsError={contributorsError}
                />
            </DialogContent>

            <DialogActions sx={{
                px: 3, py: 2,
                background: 'linear-gradient(135deg, rgba(20,20,25,0.9) 0%, rgba(15,15,20,0.9) 100%)',
                borderTop: '1px solid rgba(74,144,226,0.2)', gap: 1, flexShrink: 0,
            }}>
                <Button onClick={handleClose} disabled={isSaving} sx={{
                    borderRadius: 2, px: 3, color: 'rgba(255,255,255,0.7)', textTransform: 'none', fontWeight: 500,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', color: 'white' },
                }}>
                    Cancel
                </Button>
                <Button onClick={handleSave} variant="contained" disabled={isSaving || !formData.title} sx={{
                    borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600,
                    background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                    boxShadow: '0 4px 12px rgba(74,144,226,0.4)',
                    '&:hover': { background: 'linear-gradient(135deg, #357ABD 0%, #2E6BA0 100%)', boxShadow: '0 6px 16px rgba(74,144,226,0.5)', transform: 'translateY(-1px)' },
                    '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', boxShadow: 'none', transform: 'none' },
                }}>
                    {isSaving ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventModal;
