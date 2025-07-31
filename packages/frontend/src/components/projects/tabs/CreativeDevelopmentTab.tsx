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
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    LinearProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Lightbulb as IdeaIcon,
    Palette as CreativeIcon,
    Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Project } from '../../../app/(studio)/projects/types/project.types';

interface CreativeItem {
    id: number;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
    category: 'concept' | 'mood_board' | 'storyboard' | 'timeline' | 'shot_list' | 'other';
    created_at: string;
    updated_at: string;
}

interface CreativeDevelopmentTabProps {
    project: Project;
    onRefresh: () => void;
}

const CREATIVE_CATEGORIES = {
    concept: { label: 'Concept Development', icon: <IdeaIcon />, color: '#8b5cf6' },
    mood_board: { label: 'Mood Board', icon: <CreativeIcon />, color: '#06b6d4' },
    storyboard: { label: 'Storyboard', icon: <TimelineIcon />, color: '#10b981' },
    timeline: { label: 'Timeline Planning', icon: <TimelineIcon />, color: '#f59e0b' },
    shot_list: { label: 'Shot List', icon: <CheckIcon />, color: '#ef4444' },
    other: { label: 'Other', icon: <IdeaIcon />, color: '#6b7280' },
};

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#6b7280' },
    in_progress: { label: 'In Progress', color: '#f59e0b' },
    completed: { label: 'Completed', color: '#10b981' },
    approved: { label: 'Approved', color: '#3b82f6' },
    rejected: { label: 'Rejected', color: '#ef4444' },
};

export default function CreativeDevelopmentTab({ project, onRefresh }: CreativeDevelopmentTabProps) {
    const [creativeItems, setCreativeItems] = useState<CreativeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        category: 'concept' as keyof typeof CREATIVE_CATEGORIES,
        status: 'pending' as keyof typeof STATUS_CONFIG,
    });

    useEffect(() => {
        fetchCreativeItems();
    }, [project.id]);

    const fetchCreativeItems = async () => {
        try {
            setLoading(true);
            // Mock data for now - replace with actual API call
            const mockItems: CreativeItem[] = [
                {
                    id: 1,
                    title: 'Wedding Day Concept',
                    description: 'Overall creative vision and style for the wedding video',
                    status: 'approved',
                    category: 'concept',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-16T14:30:00Z',
                },
                {
                    id: 2,
                    title: 'Romantic Mood Board',
                    description: 'Visual inspiration including colors, lighting, and emotional tone',
                    status: 'completed',
                    category: 'mood_board',
                    created_at: '2024-01-16T09:00:00Z',
                    updated_at: '2024-01-17T11:00:00Z',
                },
                {
                    id: 3,
                    title: 'Ceremony Shot List',
                    description: 'Detailed list of key moments to capture during ceremony',
                    status: 'in_progress',
                    category: 'shot_list',
                    created_at: '2024-01-17T16:00:00Z',
                    updated_at: '2024-01-18T10:00:00Z',
                },
            ];
            setCreativeItems(mockItems);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch creative items');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            const newCreativeItem: CreativeItem = {
                id: Math.max(...creativeItems.map(item => item.id)) + 1,
                title: newItem.title,
                description: newItem.description,
                status: newItem.status,
                category: newItem.category,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setCreativeItems(prev => [...prev, newCreativeItem]);
            setNewItem({
                title: '',
                description: '',
                category: 'concept',
                status: 'pending',
            });
            setShowAddForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add creative item');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (itemId: number, newStatus: keyof typeof STATUS_CONFIG) => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            setCreativeItems(prev =>
                prev.map(item =>
                    item.id === itemId
                        ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
                        : item
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            setCreativeItems(prev => prev.filter(item => item.id !== itemId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        } finally {
            setLoading(false);
        }
    };

    const getProgressPercentage = () => {
        if (creativeItems.length === 0) return 0;
        const completedItems = creativeItems.filter(item =>
            item.status === 'completed' || item.status === 'approved'
        ).length;
        return Math.round((completedItems / creativeItems.length) * 100);
    };

    const groupedItems = creativeItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, CreativeItem[]>);

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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center' }}>
                            <CreativeIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 28 }} />
                            Creative Development Progress
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
                            Add Creative Item
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
                            const count = creativeItems.filter(item => item.status === status).length;
                            return (
                                <Grid item xs={6} sm={2.4} key={status}>
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

            {/* Add New Item Form */}
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
                            Add New Creative Item
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Title"
                                    value={newItem.title}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
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
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
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
                        </Grid>

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                startIcon={<SaveIcon />}
                                onClick={handleAddItem}
                                disabled={!newItem.title || loading}
                                variant="contained"
                                sx={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                            >
                                Save Item
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

            {/* Creative Items by Category */}
            <Grid container spacing={3}>
                {Object.entries(CREATIVE_CATEGORIES).map(([category, config]) => {
                    const categoryItems = groupedItems[category] || [];

                    return (
                        <Grid item xs={12} lg={6} key={category}>
                            <Card sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(52, 58, 68, 0.3)',
                                background: 'rgba(16, 18, 22, 0.95)',
                                minHeight: 300,
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{ color: config.color, mr: 2 }}>
                                            {config.icon}
                                        </Box>
                                        <Typography variant="h6" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                            {config.label}
                                        </Typography>
                                        <Chip
                                            label={categoryItems.length}
                                            size="small"
                                            sx={{
                                                ml: 'auto',
                                                backgroundColor: `${config.color}20`,
                                                color: config.color,
                                                border: `1px solid ${config.color}40`,
                                            }}
                                        />
                                    </Box>

                                    {categoryItems.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                                No items in this category yet
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <List sx={{ p: 0 }}>
                                            {categoryItems.map((item, index) => (
                                                <Box key={item.id}>
                                                    <ListItem sx={{ px: 0, py: 2 }}>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body1" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                                                    {item.title}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Box sx={{ mt: 1 }}>
                                                                    {item.description && (
                                                                        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
                                                                            {item.description}
                                                                        </Typography>
                                                                    )}
                                                                    <Chip
                                                                        label={STATUS_CONFIG[item.status].label}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: `${STATUS_CONFIG[item.status].color}20`,
                                                                            color: STATUS_CONFIG[item.status].color,
                                                                            border: `1px solid ${STATUS_CONFIG[item.status].color}40`,
                                                                        }}
                                                                    />
                                                                </Box>
                                                            }
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <Stack direction="row" spacing={1}>
                                                                {item.status !== 'completed' && item.status !== 'approved' && (
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleUpdateStatus(item.id, 'completed')}
                                                                        sx={{ color: '#10b981' }}
                                                                    >
                                                                        <CheckIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    sx={{ color: '#ef4444' }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Stack>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                    {index < categoryItems.length - 1 && (
                                                        <Divider sx={{ backgroundColor: 'rgba(75, 85, 99, 0.3)' }} />
                                                    )}
                                                </Box>
                                            ))}
                                        </List>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
