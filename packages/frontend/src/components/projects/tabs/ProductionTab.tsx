import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    TextField,
    Chip,
    IconButton,
    Stack,
    LinearProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    VideoCall as ProductionIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    Group as TeamIcon,
    Camera as CameraIcon,
    Mic as AudioIcon,
} from '@mui/icons-material';
import { Project } from '../../../app/(studio)/projects/types/project.types';

interface ProductionShoot {
    id: number;
    title: string;
    description?: string;
    shoot_type: 'ceremony' | 'reception' | 'preparation' | 'portraits' | 'b_roll' | 'other';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    location?: string;
    start_time?: string;
    end_time?: string;
    equipment_needed?: string[];
    crew_assigned?: string[];
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface ProductionTabProps {
    project: Project;
    onRefresh: () => void;
}

const SHOOT_TYPES = {
    ceremony: { label: 'Ceremony', icon: <CameraIcon />, color: '#8b5cf6' },
    reception: { label: 'Reception', icon: <ProductionIcon />, color: '#06b6d4' },
    preparation: { label: 'Preparation', icon: <ScheduleIcon />, color: '#10b981' },
    portraits: { label: 'Portraits', icon: <CameraIcon />, color: '#f59e0b' },
    b_roll: { label: 'B-Roll', icon: <CameraIcon />, color: '#ef4444' },
    other: { label: 'Other', icon: <ProductionIcon />, color: '#6b7280' },
};

const STATUS_CONFIG = {
    scheduled: { label: 'Scheduled', color: '#6b7280' },
    in_progress: { label: 'In Progress', color: '#f59e0b' },
    completed: { label: 'Completed', color: '#10b981' },
    cancelled: { label: 'Cancelled', color: '#ef4444' },
};

export default function ProductionTab({ project }: ProductionTabProps) {
    const [shoots, setShoots] = useState<ProductionShoot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newShoot, setNewShoot] = useState({
        title: '',
        description: '',
        shoot_type: 'ceremony' as keyof typeof SHOOT_TYPES,
        status: 'scheduled' as keyof typeof STATUS_CONFIG,
        location: '',
        start_time: '',
        end_time: '',
        notes: '',
    });

    useEffect(() => {
        fetchShoots();
    }, [project.id]);

    const fetchShoots = async () => {
        try {
            setLoading(true);
            // Mock data for now - replace with actual API call
            const mockShoots: ProductionShoot[] = [
                {
                    id: 1,
                    title: 'Ceremony Shoot',
                    description: 'Main wedding ceremony filming',
                    shoot_type: 'ceremony',
                    status: 'scheduled',
                    location: 'St. Mary\'s Church',
                    start_time: '2024-03-15T14:00:00Z',
                    end_time: '2024-03-15T15:30:00Z',
                    equipment_needed: ['Camera A', 'Camera B', 'Audio Kit', 'Drone'],
                    crew_assigned: ['John Doe', 'Sarah Wilson'],
                    notes: 'Indoor ceremony, natural lighting',
                    created_at: '2024-02-15T10:00:00Z',
                    updated_at: '2024-02-20T14:30:00Z',
                },
                {
                    id: 2,
                    title: 'Reception Coverage',
                    description: 'Reception party and dancing',
                    shoot_type: 'reception',
                    status: 'scheduled',
                    location: 'Grand Ballroom',
                    start_time: '2024-03-15T18:00:00Z',
                    end_time: '2024-03-15T23:00:00Z',
                    equipment_needed: ['Camera A', 'Camera B', 'LED Lights', 'Audio Kit'],
                    crew_assigned: ['John Doe', 'Mike Johnson'],
                    notes: 'Low light conditions, multiple angles needed',
                    created_at: '2024-02-15T10:00:00Z',
                    updated_at: '2024-02-20T14:30:00Z',
                },
                {
                    id: 3,
                    title: 'Bridal Preparation',
                    description: 'Getting ready shots',
                    shoot_type: 'preparation',
                    status: 'completed',
                    location: 'Bridal Suite',
                    start_time: '2024-03-15T10:00:00Z',
                    end_time: '2024-03-15T12:00:00Z',
                    equipment_needed: ['Camera A', 'Portable Lights'],
                    crew_assigned: ['Sarah Wilson'],
                    notes: 'Intimate setting, natural style',
                    created_at: '2024-02-10T10:00:00Z',
                    updated_at: '2024-03-15T12:30:00Z',
                },
            ];
            setShoots(mockShoots);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch shoots');
        } finally {
            setLoading(false);
        }
    };

    const handleAddShoot = async () => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            const newProductionShoot: ProductionShoot = {
                id: Math.max(...shoots.map(shoot => shoot.id)) + 1,
                title: newShoot.title,
                description: newShoot.description,
                shoot_type: newShoot.shoot_type,
                status: newShoot.status,
                location: newShoot.location,
                start_time: newShoot.start_time,
                end_time: newShoot.end_time,
                notes: newShoot.notes,
                equipment_needed: [],
                crew_assigned: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setShoots(prev => [...prev, newProductionShoot]);
            setNewShoot({
                title: '',
                description: '',
                shoot_type: 'ceremony',
                status: 'scheduled',
                location: '',
                start_time: '',
                end_time: '',
                notes: '',
            });
            setShowAddForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add shoot');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (shootId: number, newStatus: keyof typeof STATUS_CONFIG) => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            setShoots(prev =>
                prev.map(shoot =>
                    shoot.id === shootId
                        ? { ...shoot, status: newStatus, updated_at: new Date().toISOString() }
                        : shoot
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteShoot = async (shootId: number) => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            setShoots(prev => prev.filter(shoot => shoot.id !== shootId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete shoot');
        } finally {
            setLoading(false);
        }
    };

    const getProgressPercentage = () => {
        if (shoots.length === 0) return 0;
        const completedShoots = shoots.filter(shoot => shoot.status === 'completed').length;
        return Math.round((completedShoots / shoots.length) * 100);
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    {error}
                </Alert>
            )}

            {/* Progress Overview */}
            <Card sx={{
                mb: 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                border: '1px solid rgba(52, 58, 68, 0.3)',
                background: 'rgba(16, 18, 22, 0.95)',
                backdropFilter: 'blur(10px)'
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center' }}>
                            <ProductionIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 28 }} />
                            Production Progress
                        </Typography>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => setShowAddForm(true)}
                            variant="contained"
                            sx={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                '&:hover': {
                                    background: 'rgba(59, 130, 246, 0.3)',
                                },
                            }}
                        >
                            Add Shoot
                        </Button>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                Overall Progress
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                {getProgressPercentage()}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={getProgressPercentage()}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(75, 85, 99, 0.3)',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#10b981',
                                    borderRadius: 4,
                                },
                            }}
                        />
                    </Box>

                    <Grid container spacing={2}>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                            const count = shoots.filter(shoot => shoot.status === status).length;
                            return (
                                <Grid item xs={6} sm={3} key={status}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h6" sx={{ color: config.color, fontWeight: 700 }}>
                                            {count}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                            {config.label}
                                        </Typography>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </CardContent>
            </Card>

            {/* Add New Shoot Form */}
            {showAddForm && (
                <Card sx={{
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(52, 58, 68, 0.3)',
                    background: 'rgba(16, 18, 22, 0.95)',
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: '#f3f4f6', mb: 3 }}>
                            Add New Production Shoot
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Shoot Title"
                                    value={newShoot.title}
                                    onChange={(e) => setNewShoot(prev => ({ ...prev, title: e.target.value }))}
                                    fullWidth
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#9ca3af', '&.Mui-focused': { color: '#d1d5db' } }}>
                                        Shoot Type
                                    </InputLabel>
                                    <Select
                                        value={newShoot.shoot_type}
                                        onChange={(e) => setNewShoot(prev => ({ ...prev, shoot_type: e.target.value as keyof typeof SHOOT_TYPES }))}
                                        label="Shoot Type"
                                        sx={{
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                            '& .MuiSelect-select': {
                                                color: '#f3f4f6'
                                            }
                                        }}
                                    >
                                        {Object.entries(SHOOT_TYPES).map(([type, config]) => (
                                            <MenuItem key={type} value={type}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={newShoot.description}
                                    onChange={(e) => setNewShoot(prev => ({ ...prev, description: e.target.value }))}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Location"
                                    value={newShoot.location}
                                    onChange={(e) => setNewShoot(prev => ({ ...prev, location: e.target.value }))}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Start Time"
                                    type="datetime-local"
                                    value={newShoot.start_time}
                                    onChange={(e) => setNewShoot(prev => ({ ...prev, start_time: e.target.value }))}
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
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="End Time"
                                    type="datetime-local"
                                    value={newShoot.end_time}
                                    onChange={(e) => setNewShoot(prev => ({ ...prev, end_time: e.target.value }))}
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
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                startIcon={<SaveIcon />}
                                onClick={handleAddShoot}
                                disabled={!newShoot.title || loading}
                                variant="contained"
                                sx={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                            >
                                Save Shoot
                            </Button>
                            <Button
                                startIcon={<CancelIcon />}
                                onClick={() => setShowAddForm(false)}
                                variant="outlined"
                                sx={{
                                    borderColor: 'rgba(239, 68, 68, 0.4)',
                                    color: '#ef4444',
                                }}
                            >
                                Cancel
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            {/* Shoots Table */}
            <Card sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                border: '1px solid rgba(52, 58, 68, 0.3)',
                background: 'rgba(16, 18, 22, 0.95)',
            }}>
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Shoot
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Type
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Location
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Schedule
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Status
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {shoots.map((shoot) => (
                                    <TableRow key={shoot.id} sx={{ '&:hover': { backgroundColor: 'rgba(75, 85, 99, 0.1)' } }}>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Box>
                                                <Typography variant="body1" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                                    {shoot.title}
                                                </Typography>
                                                {shoot.description && (
                                                    <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
                                                        {shoot.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Chip
                                                icon={SHOOT_TYPES[shoot.shoot_type].icon}
                                                label={SHOOT_TYPES[shoot.shoot_type].label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${SHOOT_TYPES[shoot.shoot_type].color}20`,
                                                    color: SHOOT_TYPES[shoot.shoot_type].color,
                                                    border: `1px solid ${SHOOT_TYPES[shoot.shoot_type].color}40`,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                                {shoot.location || 'Not specified'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                                    {formatDateTime(shoot.start_time)}
                                                </Typography>
                                                {shoot.end_time && (
                                                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                                        to {formatDateTime(shoot.end_time)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Chip
                                                label={STATUS_CONFIG[shoot.status].label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${STATUS_CONFIG[shoot.status].color}20`,
                                                    color: STATUS_CONFIG[shoot.status].color,
                                                    border: `1px solid ${STATUS_CONFIG[shoot.status].color}40`,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Stack direction="row" spacing={1}>
                                                {shoot.status !== 'completed' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleUpdateStatus(shoot.id, 'completed')}
                                                        sx={{ color: '#10b981' }}
                                                    >
                                                        <CheckIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#9ca3af' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteShoot(shoot.id)}
                                                    sx={{ color: '#ef4444' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}
