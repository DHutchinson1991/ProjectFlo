"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Autocomplete,
    Grid,
    Typography,
    Box
} from '@mui/material';
import {
    Event as EventIcon
} from '@mui/icons-material';

import { CalendarEvent, EventType, Priority, Project, User } from '../types';
import { ContributorSelector } from './ContributorSelector';
import { ContributorOption } from '../hooks/useContributors';
import { eventTypeConfig, priorityConfig, mockProjects } from '../config';

interface EventFormData {
    title: string;
    description: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: EventType;
    priority: Priority;
    assignee?: User;
    project?: Project;
    location: string;
    id?: string; // For edit mode
}

export type { EventFormData };

interface EventModalProps {
    open: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    event?: CalendarEvent | null;
    initialData?: {
        start: Date;
        end: Date;
        title: string;
    };
    contributors: ContributorOption[];
    currentUserContributor: ContributorOption | null;
    contributorsLoading: boolean;
    contributorsError: string | null;
    onSave: (eventData: EventFormData) => void;
    onDelete?: (eventId: string) => void;
    isSaving?: boolean;
}

export const EventModal: React.FC<EventModalProps> = ({
    open,
    onClose,
    mode,
    event,
    initialData,
    contributors,
    currentUserContributor,
    contributorsLoading,
    contributorsError,
    onSave,
    onDelete,
    isSaving = false
}) => {
    // Format date for datetime-local input
    const formatDateTimeLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
        type: 'meeting' as EventType,
        priority: 'medium' as Priority,
        assignee: null as ContributorOption | null,
        project: null as Project | null,
        location: ''
    });

    // Track if we've initialized the form data to prevent unwanted resets
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    // Initialize form data when modal opens
    useEffect(() => {
        if (open && !isFormInitialized) {
            setIsFormInitialized(true);

            if (mode === 'edit' && event) {
                // Edit mode - populate with event data
                setFormData({
                    title: event.title,
                    description: event.description || '',
                    start: new Date(event.start),
                    end: new Date(event.end),
                    allDay: event.allDay || false,
                    type: event.type,
                    priority: event.priority,
                    assignee: event.assignee ? {
                        id: event.assignee.id,
                        name: event.assignee.name,
                        email: event.assignee.email,
                        initials: event.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase(),
                        isCurrentUser: event.assignee.id === currentUserContributor?.id
                    } : null,
                    project: event.project || null,
                    location: event.location || ''
                });
            } else if (mode === 'create' && initialData) {
                // Create mode - populate with initial data
                setFormData({
                    title: initialData.title,
                    description: '',
                    start: initialData.start,
                    end: initialData.end,
                    allDay: false,
                    type: 'meeting' as EventType,
                    priority: 'medium' as Priority,
                    assignee: currentUserContributor,
                    project: null,
                    location: ''
                });
            }
        }
    }, [open, mode, event, initialData, currentUserContributor, isFormInitialized]);

    // Reset form initialized flag when modal closes
    useEffect(() => {
        if (!open) {
            setIsFormInitialized(false);
        }
    }, [open]);

    const handleSave = () => {
        const eventData: EventFormData = {
            title: formData.title,
            description: formData.description,
            start: formData.start,
            end: formData.end,
            allDay: formData.allDay,
            type: formData.type,
            priority: formData.priority,
            assignee: formData.assignee ? {
                id: formData.assignee.id,
                name: formData.assignee.name,
                email: formData.assignee.email,
                role: 'contributor' // Default role
            } : undefined,
            project: formData.project || undefined,
            location: formData.location
        };

        if (mode === 'edit' && event) {
            // Include the event ID for updates
            eventData.id = event.id;
        }

        onSave(eventData);
        // Auto-close modal after save
        handleClose();
    };

    const handleDelete = () => {
        if (mode === 'edit' && event && onDelete) {
            onDelete(event.id);
            // Auto-close modal after delete
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            description: '',
            start: new Date(),
            end: new Date(),
            allDay: false,
            type: 'meeting' as EventType,
            priority: 'medium' as Priority,
            assignee: null,
            project: null,
            location: ''
        });
        setIsFormInitialized(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(30,30,35,0.98) 0%, rgba(25,25,30,0.98) 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    color: 'white',
                    maxHeight: '85vh', // Limit height to 85% of viewport
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
            BackdropProps={{
                sx: {
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)'
                }
            }}
        >
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, rgba(74,144,226,0.15) 0%, rgba(74,144,226,0.08) 100%)',
                    borderBottom: '1px solid rgba(74,144,226,0.2)',
                    pb: 2,
                    color: 'white',
                    flexShrink: 0 // Prevent title from shrinking
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(74,144,226,0.4)'
                            }}
                        >
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
                        <Button
                            onClick={handleDelete}
                            color="error"
                            variant="outlined"
                            size="small"
                            disabled={isSaving}
                            sx={{
                                borderRadius: 2,
                                px: 2,
                                borderColor: 'rgba(211,47,47,0.7)',
                                color: '#ff6b6b',
                                '&:hover': {
                                    backgroundColor: 'rgba(211,47,47,0.1)',
                                    borderColor: '#ff6b6b',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Delete Event
                        </Button>
                    )}
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2, flex: 1, overflow: 'auto' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            label="Event Title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            fullWidth
                            required
                            variant="outlined"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: 'rgba(255,255,255,0.7)',
                                    '&.Mui-focused': {
                                        color: '#4A90E2'
                                    }
                                },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    '& fieldset': {
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#4A90E2',
                                        boxShadow: '0 0 0 3px rgba(74,144,226,0.1)'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            multiline
                            rows={2}
                            fullWidth
                            variant="outlined"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: 'rgba(255,255,255,0.7)',
                                    '&.Mui-focused': {
                                        color: '#4A90E2'
                                    }
                                },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    '& fieldset': {
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#4A90E2',
                                        boxShadow: '0 0 0 3px rgba(74,144,226,0.1)'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Start Date & Time"
                            type="datetime-local"
                            value={formatDateTimeLocal(formData.start)}
                            onChange={(e) => setFormData(prev => ({ ...prev, start: new Date(e.target.value) }))}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: 'rgba(255,255,255,0.7)',
                                    '&.Mui-focused': {
                                        color: '#4A90E2'
                                    }
                                },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    '& fieldset': {
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#4A90E2',
                                        boxShadow: '0 0 0 3px rgba(74,144,226,0.1)'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="End Date & Time"
                            type="datetime-local"
                            value={formatDateTimeLocal(formData.end)}
                            onChange={(e) => setFormData(prev => ({ ...prev, end: new Date(e.target.value) }))}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: 'rgba(255,255,255,0.7)',
                                    '&.Mui-focused': {
                                        color: '#4A90E2'
                                    }
                                },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    '& fieldset': {
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#4A90E2',
                                        boxShadow: '0 0 0 3px rgba(74,144,226,0.1)'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-focused': { color: '#4A90E2' } }}>
                                Event Type
                            </InputLabel>
                            <Select
                                value={formData.type}
                                label="Event Type"
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as EventType }))}
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#4A90E2'
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: 'rgba(255,255,255,0.7)'
                                    }
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: 'rgba(30,30,35,0.95)',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            '& .MuiMenuItem-root': {
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(74,144,226,0.1)'
                                                },
                                                '&.Mui-selected': {
                                                    backgroundColor: 'rgba(74,144,226,0.2)'
                                                }
                                            }
                                        }
                                    }
                                }}
                            >
                                {Object.entries(eventTypeConfig).map(([key, config]) => (
                                    <MenuItem key={key} value={key}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    backgroundColor: config.color
                                                }}
                                            />
                                            {config.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-focused': { color: '#4A90E2' } }}>
                                Priority
                            </InputLabel>
                            <Select
                                value={formData.priority}
                                label="Priority"
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#4A90E2'
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: 'rgba(255,255,255,0.7)'
                                    }
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: 'rgba(30,30,35,0.95)',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            '& .MuiMenuItem-root': {
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(74,144,226,0.1)'
                                                },
                                                '&.Mui-selected': {
                                                    backgroundColor: 'rgba(74,144,226,0.2)'
                                                }
                                            }
                                        }
                                    }
                                }}
                            >
                                {Object.entries(priorityConfig).map(([key, config]) => (
                                    <MenuItem key={key} value={key}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: config.color
                                                }}
                                            />
                                            {config.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Location"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <ContributorSelector
                            selectedContributor={formData.assignee}
                            onContributorChange={(contributor) => setFormData(prev => ({ ...prev, assignee: contributor }))}
                            contributors={contributors}
                            currentUserContributor={currentUserContributor}
                            loading={contributorsLoading}
                            error={contributorsError}
                            label="Assignee"
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            value={formData.project}
                            onChange={(_, newValue) => setFormData(prev => ({ ...prev, project: newValue }))}
                            options={mockProjects}
                            getOptionLabel={(option) => option.name}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Project"
                                />
                            )}
                            renderOption={(props, option) => (
                                <Box component="li" {...props}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: option.color,
                                            mr: 1
                                        }}
                                    />
                                    {option.name}
                                </Box>
                            )}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.allDay}
                                    onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: '#4A90E2'
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#4A90E2'
                                        }
                                    }}
                                />
                            }
                            label={<Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>All Day Event</Typography>}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Location"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            fullWidth
                            variant="outlined"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: 'rgba(255,255,255,0.7)',
                                    '&.Mui-focused': {
                                        color: '#4A90E2'
                                    }
                                },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    '& fieldset': {
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#4A90E2',
                                        boxShadow: '0 0 0 3px rgba(74,144,226,0.1)'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    {/* Event Metadata (only show in edit mode) */}
                    {mode === 'edit' && event && (
                        <Grid item xs={12}>
                            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>Event Information</Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Status: <strong>{event.status}</strong>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Created: <strong>{new Date(event.created_at).toLocaleDateString()}</strong>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Updated: <strong>{new Date(event.updated_at).toLocaleDateString()}</strong>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Event ID: <strong>{event.id}</strong>
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    background: 'linear-gradient(135deg, rgba(20,20,25,0.9) 0%, rgba(15,15,20,0.9) 100%)',
                    borderTop: '1px solid rgba(74,144,226,0.2)',
                    gap: 1,
                    flexShrink: 0
                }}
            >
                <Button
                    onClick={handleClose}
                    disabled={isSaving}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        color: 'rgba(255,255,255,0.7)',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            color: 'white'
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={isSaving || !formData.title}
                    sx={{
                        borderRadius: 2,
                        px: 4,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                        boxShadow: '0 4px 12px rgba(74,144,226,0.4)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #357ABD 0%, #2E6BA0 100%)',
                            boxShadow: '0 6px 16px rgba(74,144,226,0.5)',
                            transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                            background: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.3)',
                            boxShadow: 'none',
                            transform: 'none'
                        }
                    }}
                >
                    {isSaving ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventModal;
