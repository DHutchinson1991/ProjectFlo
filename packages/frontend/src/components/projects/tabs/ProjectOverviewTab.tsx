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
    Chip,
    IconButton,
    Stack,
    Alert,
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    AssignmentTurnedIn as WorkflowIcon,
    TrendingUp as ProgressIcon,
} from '@mui/icons-material';
import { Project } from '../../../app/(studio)/projects/types/project.types';

interface ProjectOverviewTabProps {
    project: Project;
    onRefresh: () => void;
}

const PROJECT_PHASES = [
    'overview',
    'creative',
    'preproduction',
    'production',
    'postproduction',
    'delivery'
];

const PHASE_LABELS = {
    overview: 'Project Overview',
    creative: 'Creative Development',
    preproduction: 'Pre Production',
    production: 'Production',
    postproduction: 'Post Production',
    delivery: 'Delivery'
};

export default function ProjectOverviewTab({ project, onRefresh }: ProjectOverviewTabProps) {
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

            const response = await fetch(`http://localhost:3002/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editData),
            });

            if (!response.ok) {
                throw new Error(`Failed to update project: ${response.statusText}`);
            }

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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Main Project Information */}
                <Grid item xs={12} md={8}>
                    <Card sx={{
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(52, 58, 68, 0.3)',
                        background: 'rgba(16, 18, 22, 0.95)',
                        backdropFilter: 'blur(10px)'
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
                                        <Button
                                            startIcon={<SaveIcon />}
                                            onClick={handleSaveEdit}
                                            disabled={loading}
                                            variant="contained"
                                            size="small"
                                            sx={{
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                color: '#10b981',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                '&:hover': {
                                                    background: 'rgba(16, 185, 129, 0.3)',
                                                },
                                            }}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            startIcon={<CancelIcon />}
                                            onClick={handleCancelEdit}
                                            disabled={loading}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                                color: '#ef4444',
                                                '&:hover': {
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                },
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Stack>
                                ) : (
                                    <IconButton
                                        onClick={handleStartEdit}
                                        sx={{
                                            color: '#9ca3af',
                                            '&:hover': {
                                                background: 'rgba(52, 58, 68, 0.4)',
                                                color: '#d1d5db',
                                            }
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                )}
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Project Name"
                                        value={isEditing ? editData.project_name || '' : project.project_name || 'Untitled Project'}
                                        onChange={(e) => updateEditData('project_name', e.target.value)}
                                        disabled={!isEditing}
                                        fullWidth
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(75, 85, 99, 0.6)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6b7280',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#9ca3af',
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: '#9ca3af',
                                                '&.Mui-focused': {
                                                    color: '#d1d5db',
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                color: '#f3f4f6'
                                            }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Wedding Date"
                                        type="date"
                                        value={isEditing ?
                                            (editData.wedding_date ? new Date(editData.wedding_date).toISOString().split('T')[0] : '') :
                                            new Date(project.wedding_date).toISOString().split('T')[0]
                                        }
                                        onChange={(e) => updateEditData('wedding_date', e.target.value)}
                                        disabled={!isEditing}
                                        fullWidth
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(75, 85, 99, 0.6)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6b7280',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#9ca3af',
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: '#9ca3af',
                                                '&.Mui-focused': {
                                                    color: '#d1d5db',
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                color: '#f3f4f6'
                                            }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth disabled={!isEditing}>
                                        <InputLabel sx={{ color: '#9ca3af', '&.Mui-focused': { color: '#d1d5db' } }}>
                                            Current Phase
                                        </InputLabel>
                                        <Select
                                            value={isEditing ? editData.phase || '' : project.phase || ''}
                                            onChange={(e) => updateEditData('phase', e.target.value)}
                                            label="Current Phase"
                                            sx={{
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(75, 85, 99, 0.6)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6b7280',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#9ca3af',
                                                },
                                                '& .MuiSelect-select': {
                                                    color: '#f3f4f6'
                                                }
                                            }}
                                        >
                                            {PROJECT_PHASES.map((phase) => (
                                                <MenuItem key={phase} value={phase}>
                                                    {PHASE_LABELS[phase as keyof typeof PHASE_LABELS]}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Booking Date"
                                        type="date"
                                        value={isEditing ?
                                            (editData.booking_date ? new Date(editData.booking_date).toISOString().split('T')[0] : '') :
                                            (project.booking_date ? new Date(project.booking_date).toISOString().split('T')[0] : '')
                                        }
                                        onChange={(e) => updateEditData('booking_date', e.target.value)}
                                        disabled={!isEditing}
                                        fullWidth
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(75, 85, 99, 0.6)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6b7280',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#9ca3af',
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: '#9ca3af',
                                                '&.Mui-focused': {
                                                    color: '#d1d5db',
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                color: '#f3f4f6'
                                            }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Edit Start Date"
                                        type="date"
                                        value={isEditing ?
                                            (editData.edit_start_date ? new Date(editData.edit_start_date).toISOString().split('T')[0] : '') :
                                            (project.edit_start_date ? new Date(project.edit_start_date).toISOString().split('T')[0] : '')
                                        }
                                        onChange={(e) => updateEditData('edit_start_date', e.target.value)}
                                        disabled={!isEditing}
                                        fullWidth
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(75, 85, 99, 0.6)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6b7280',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#9ca3af',
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: '#9ca3af',
                                                '&.Mui-focused': {
                                                    color: '#d1d5db',
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                color: '#f3f4f6'
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar Information */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        {/* Client Information */}
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(52, 58, 68, 0.3)',
                            background: 'rgba(16, 18, 22, 0.95)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <PersonIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 24 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                        Client Information
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                            Name
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                            {project.client?.contact?.first_name} {project.client?.contact?.last_name}
                                        </Typography>
                                    </Box>
                                    {project.client?.contact?.email && (
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                                Email
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#f3f4f6' }}>
                                                {project.client?.contact?.email}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Project Status */}
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(52, 58, 68, 0.3)',
                            background: 'rgba(16, 18, 22, 0.95)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <ProgressIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 24 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                        Project Status
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                            Current Phase
                                        </Typography>
                                        <Chip
                                            label={PHASE_LABELS[project.phase as keyof typeof PHASE_LABELS] || 'Not Set'}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                                color: '#60a5fa',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                            Wedding Date
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                            {formatDate(project.wedding_date)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                            Booking Date
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#f3f4f6' }}>
                                            {formatDate(project.booking_date)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                            Edit Start Date
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#f3f4f6' }}>
                                            {formatDate(project.edit_start_date)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Brand Information */}
                        {project.brand && (
                            <Card sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(52, 58, 68, 0.3)',
                                background: 'rgba(16, 18, 22, 0.95)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <WorkflowIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 24 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                            Brand
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ color: '#f3f4f6' }}>
                                        {project.brand.display_name || project.brand.name}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
