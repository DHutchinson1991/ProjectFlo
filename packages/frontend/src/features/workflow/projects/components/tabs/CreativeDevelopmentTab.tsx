import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add as AddIcon, Check as CheckIcon, Delete as DeleteIcon, Lightbulb as IdeaIcon, Palette as CreativeIcon, Timeline as TimelineIcon } from '@mui/icons-material';
import { Project } from '@/features/workflow/projects/types/project.types';

type CreativeItemStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
type CreativeItemCategory = 'concept' | 'mood_board' | 'storyboard' | 'timeline' | 'shot_list' | 'other';

interface CreativeItem {
    id: number;
    title: string;
    description?: string;
    status: CreativeItemStatus;
    category: CreativeItemCategory;
    created_at: string;
    updated_at: string;
}

interface CreativeDevelopmentTabProps {
    project: Project;
    onRefresh: () => void;
}

const CATEGORY_CONFIG: Record<CreativeItemCategory, { label: string; color: string; icon: React.ReactNode }> = {
    concept: { label: 'Concept Development', color: '#8b5cf6', icon: <IdeaIcon /> },
    mood_board: { label: 'Mood Board', color: '#06b6d4', icon: <CreativeIcon /> },
    storyboard: { label: 'Storyboard', color: '#10b981', icon: <TimelineIcon /> },
    timeline: { label: 'Timeline Planning', color: '#f59e0b', icon: <TimelineIcon /> },
    shot_list: { label: 'Shot List', color: '#ef4444', icon: <CheckIcon /> },
    other: { label: 'Other', color: '#6b7280', icon: <IdeaIcon /> },
};

const STATUS_CONFIG: Record<CreativeItemStatus, { label: string; color: string }> = {
    pending: { label: 'Pending', color: '#6b7280' },
    in_progress: { label: 'In Progress', color: '#f59e0b' },
    completed: { label: 'Completed', color: '#10b981' },
    approved: { label: 'Approved', color: '#3b82f6' },
    rejected: { label: 'Rejected', color: '#ef4444' },
};

export default function CreativeDevelopmentTab({ project, onRefresh }: CreativeDevelopmentTabProps) {
    const [items, setItems] = useState<CreativeItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', description: '', category: 'concept' as CreativeItemCategory, status: 'pending' as CreativeItemStatus });

    useEffect(() => {
        setItems([]);
        setError(null);
    }, [project.id]);

    const progress = items.length === 0 ? 0 : Math.round((items.filter((item) => item.status === 'completed' || item.status === 'approved').length / items.length) * 100);

    const handleAddItem = () => {
        if (!newItem.title.trim()) {
            setError('Creative item title is required');
            return;
        }

        const createdAt = new Date().toISOString();
        setItems((prev) => [...prev, {
            id: Math.max(0, ...prev.map((item) => item.id)) + 1,
            title: newItem.title.trim(),
            description: newItem.description.trim() || undefined,
            status: newItem.status,
            category: newItem.category,
            created_at: createdAt,
            updated_at: createdAt,
        }]);
        setNewItem({ title: '', description: '', category: 'concept', status: 'pending' });
        setShowAddForm(false);
        setError(null);
        onRefresh();
    };

    const updateStatus = (itemId: number, status: CreativeItemStatus) => setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status, updated_at: new Date().toISOString() } : item)));
    const deleteItem = (itemId: number) => setItems((prev) => prev.filter((item) => item.id !== itemId));

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            <Card sx={{ mb: 3, borderRadius: 3, background: 'rgba(16, 18, 22, 0.95)', border: '1px solid rgba(52, 58, 68, 0.3)' }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 1 }}><CreativeIcon sx={{ color: '#9ca3af' }} />Creative Development</Typography>
                        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setShowAddForm(true)}>Add Item</Button>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2" sx={{ color: '#9ca3af' }}>Overall Progress</Typography><Typography variant="body2" sx={{ color: '#9ca3af' }}>{progress}%</Typography></Box>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                    <Grid container spacing={2}>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => <Grid item xs={6} sm={2.4} key={status}><Card variant="outlined" sx={{ background: 'rgba(30, 41, 59, 0.5)' }}><CardContent sx={{ py: 2 }}><Typography variant="h6" sx={{ color: config.color, fontWeight: 700 }}>{items.filter((item) => item.status === status).length}</Typography><Typography variant="body2" sx={{ color: '#9ca3af' }}>{config.label}</Typography></CardContent></Card></Grid>)}
                    </Grid>
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, background: 'rgba(16, 18, 22, 0.95)', border: '1px solid rgba(52, 58, 68, 0.3)' }}>
                <CardContent sx={{ p: 3 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Category</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                            <TableBody>
                                {items.length === 0 ? <TableRow><TableCell colSpan={4}><Typography color="text.secondary">No creative items yet.</Typography></TableCell></TableRow> : items.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell><Typography fontWeight={600}>{item.title}</Typography>{item.description ? <Typography variant="body2" color="text.secondary">{item.description}</Typography> : null}</TableCell>
                                        <TableCell><Chip size="small" label={CATEGORY_CONFIG[item.category].label} sx={{ bgcolor: `${CATEGORY_CONFIG[item.category].color}20`, color: CATEGORY_CONFIG[item.category].color }} /></TableCell>
                                        <TableCell><Select size="small" value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as CreativeItemStatus)}>{Object.entries(STATUS_CONFIG).map(([value, config]) => <MenuItem key={value} value={value}>{config.label}</MenuItem>)}</Select></TableCell>
                                        <TableCell align="right"><IconButton color="error" onClick={() => deleteItem(item.id)}><DeleteIcon /></IconButton></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog open={showAddForm} onClose={() => setShowAddForm(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Creative Item</DialogTitle>
                <DialogContent sx={{ pt: 2, display: 'grid', gap: 2 }}>
                    <TextField label="Title" fullWidth value={newItem.title} onChange={(event) => setNewItem((prev) => ({ ...prev, title: event.target.value }))} />
                    <TextField label="Description" fullWidth multiline minRows={3} value={newItem.description} onChange={(event) => setNewItem((prev) => ({ ...prev, description: event.target.value }))} />
                    <FormControl fullWidth><InputLabel>Category</InputLabel><Select label="Category" value={newItem.category} onChange={(event) => setNewItem((prev) => ({ ...prev, category: event.target.value as CreativeItemCategory }))}>{Object.entries(CATEGORY_CONFIG).map(([value, config]) => <MenuItem key={value} value={value}>{config.label}</MenuItem>)}</Select></FormControl>
                    <FormControl fullWidth><InputLabel>Status</InputLabel><Select label="Status" value={newItem.status} onChange={(event) => setNewItem((prev) => ({ ...prev, status: event.target.value as CreativeItemStatus }))}>{Object.entries(STATUS_CONFIG).map(([value, config]) => <MenuItem key={value} value={value}>{config.label}</MenuItem>)}</Select></FormControl>
                </DialogContent>
                <DialogActions><Button onClick={() => setShowAddForm(false)}>Cancel</Button><Button variant="contained" onClick={handleAddItem}>Add</Button></DialogActions>
            </Dialog>
        </Box>
    );
}
