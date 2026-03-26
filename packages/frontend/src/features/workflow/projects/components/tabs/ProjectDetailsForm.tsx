import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Stack,
    Alert,
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Project } from '@/features/workflow/projects/types/project.types';
import { useProjects } from '../../hooks/useProjects';

const PROJECT_PHASES = ['overview', 'creative', 'preproduction', 'production', 'postproduction', 'delivery'];
const PHASE_LABELS: Record<string, string> = {
    overview: 'Project Overview',
    creative: 'Creative Development',
    preproduction: 'Pre Production',
    production: 'Production',
    postproduction: 'Post Production',
    delivery: 'Delivery',
};

const darkFieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(75, 85, 99, 0.6)' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7280' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9ca3af' },
    },
    '& .MuiInputLabel-root': { color: '#9ca3af', '&.Mui-focused': { color: '#d1d5db' } },
    '& .MuiInputBase-input': { color: '#f3f4f6' },
};

const darkSelectSx = {
    borderRadius: 2,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(75, 85, 99, 0.6)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7280' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9ca3af' },
    '& .MuiSelect-select': { color: '#f3f4f6' },
};

interface ProjectDetailsFormProps {
    project: Project;
    onRefresh: () => void;
}

export default function ProjectDetailsForm({ project, onRefresh }: ProjectDetailsFormProps) {
    const { updateProject } = useProjects();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Project>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartEdit = () => {
        setEditData({
            project_name: project.project_name,
            wedding_date: project.wedding_date,
            booking_date: project.booking_date,
            edit_start_date: project.edit_start_date,
            phase: project.phase,
        });
        setIsEditing(true);
        setError(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({});
        setError(null);
    };

    const handleSaveEdit = async () => {
        try {
            setLoading(true);
            setError(null);
            await updateProject(project.id, editData);
            setIsEditing(false);
            setEditData({});
            onRefresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update project');
        } finally {
            setLoading(false);
        }
    };

    const updateEditData = (field: keyof Project, value: string) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const toDateInput = (dateString?: string) =>
        dateString ? new Date(dateString).toISOString().split('T')[0] : '';

    return (
        <>
            {error && (
                <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    {error}
                </Alert>
            )}

            <Card sx={{
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                border: '1px solid rgba(52, 58, 68, 0.3)',
                background: 'rgba(16, 18, 22, 0.95)',
                backdropFilter: 'blur(10px)',
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AssignmentIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 28 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                Project Details
                            </Typography>
                        </Box>

                        {isEditing ? (
                            <Stack direction="row" spacing={1}>
                                <Button startIcon={<SaveIcon />} onClick={handleSaveEdit} disabled={loading}
                                    variant="contained" size="small"
                                    sx={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        '&:hover': { background: 'rgba(16, 185, 129, 0.3)' } }}>
                                    Save
                                </Button>
                                <Button startIcon={<CancelIcon />} onClick={handleCancelEdit} disabled={loading}
                                    variant="outlined" size="small"
                                    sx={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444',
                                        '&:hover': { background: 'rgba(239, 68, 68, 0.1)' } }}>
                                    Cancel
                                </Button>
                            </Stack>
                        ) : (
                            <IconButton onClick={handleStartEdit}
                                sx={{ color: '#9ca3af', '&:hover': { background: 'rgba(52, 58, 68, 0.4)', color: '#d1d5db' } }}>
                                <EditIcon />
                            </IconButton>
                        )}
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField label="Project Name"
                                value={isEditing ? editData.project_name || '' : project.project_name || 'Untitled Project'}
                                onChange={(e) => updateEditData('project_name', e.target.value)}
                                disabled={!isEditing} fullWidth sx={darkFieldSx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Wedding Date" type="date"
                                value={isEditing ? toDateInput(editData.wedding_date) : toDateInput(project.wedding_date)}
                                onChange={(e) => updateEditData('wedding_date', e.target.value)}
                                disabled={!isEditing} fullWidth InputLabelProps={{ shrink: true }}
                                sx={darkFieldSx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth disabled={!isEditing}>
                                <InputLabel sx={{ color: '#9ca3af', '&.Mui-focused': { color: '#d1d5db' } }}>
                                    Current Phase
                                </InputLabel>
                                <Select value={isEditing ? editData.phase || '' : project.phase || ''}
                                    onChange={(e) => updateEditData('phase', e.target.value)}
                                    label="Current Phase" sx={darkSelectSx}>
                                    {PROJECT_PHASES.map((phase) => (
                                        <MenuItem key={phase} value={phase}>
                                            {PHASE_LABELS[phase]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Booking Date" type="date"
                                value={isEditing ? toDateInput(editData.booking_date) : toDateInput(project.booking_date)}
                                onChange={(e) => updateEditData('booking_date', e.target.value)}
                                disabled={!isEditing} fullWidth InputLabelProps={{ shrink: true }}
                                sx={darkFieldSx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Edit Start Date" type="date"
                                value={isEditing ? toDateInput(editData.edit_start_date) : toDateInput(project.edit_start_date)}
                                onChange={(e) => updateEditData('edit_start_date', e.target.value)}
                                disabled={!isEditing} fullWidth InputLabelProps={{ shrink: true }}
                                sx={darkFieldSx} />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </>
    );
}
