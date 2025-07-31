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
    CloudUpload as DeliveryIcon,
    VideoFile as VideoIcon,
    Photo as PhotoIcon,
    Album as AlbumIcon,
    Download as DownloadIcon,
    Link as LinkIcon,
    Schedule as ScheduleIcon,
    CloudDone as CloudDoneIcon,
} from '@mui/icons-material';
import { Project } from '../../../app/(studio)/projects/types/project.types';

interface Deliverable {
    id: number;
    name: string;
    description?: string;
    deliverable_type: 'video' | 'photos' | 'album' | 'digital_gallery' | 'raw_footage' | 'highlights' | 'custom';
    format: string;
    file_size?: string;
    resolution?: string;
    duration?: string;
    status: 'pending' | 'processing' | 'ready' | 'delivered' | 'approved';
    delivery_method: 'digital_download' | 'cloud_link' | 'physical_media' | 'online_gallery' | 'usb_drive';
    delivery_date?: string;
    download_url?: string;
    tracking_number?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface DeliveryTabProps {
    project: Project;
    onRefresh: () => void;
}

const DELIVERABLE_TYPES = {
    video: { label: 'Wedding Video', icon: <VideoIcon />, color: '#8b5cf6' },
    photos: { label: 'Wedding Photos', icon: <PhotoIcon />, color: '#06b6d4' },
    album: { label: 'Wedding Album', icon: <AlbumIcon />, color: '#f59e0b' },
    digital_gallery: { label: 'Digital Gallery', icon: <CloudDoneIcon />, color: '#10b981' },
    raw_footage: { label: 'Raw Footage', icon: <VideoIcon />, color: '#6b7280' },
    highlights: { label: 'Highlight Reel', icon: <VideoIcon />, color: '#ef4444' },
    custom: { label: 'Custom Deliverable', icon: <DeliveryIcon />, color: '#6366f1' },
};

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#6b7280' },
    processing: { label: 'Processing', color: '#f59e0b' },
    ready: { label: 'Ready', color: '#10b981' },
    delivered: { label: 'Delivered', color: '#3b82f6' },
    approved: { label: 'Approved', color: '#8b5cf6' },
};

const DELIVERY_METHODS = {
    digital_download: { label: 'Digital Download', icon: <DownloadIcon /> },
    cloud_link: { label: 'Cloud Link', icon: <LinkIcon /> },
    physical_media: { label: 'Physical Media', icon: <AlbumIcon /> },
    online_gallery: { label: 'Online Gallery', icon: <PhotoIcon /> },
    usb_drive: { label: 'USB Drive', icon: <DeliveryIcon /> },
};

export default function DeliveryTab({ project }: DeliveryTabProps) {
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDeliverable, setNewDeliverable] = useState({
        name: '',
        description: '',
        deliverable_type: 'video' as keyof typeof DELIVERABLE_TYPES,
        format: '',
        file_size: '',
        resolution: '',
        duration: '',
        status: 'pending' as keyof typeof STATUS_CONFIG,
        delivery_method: 'digital_download' as keyof typeof DELIVERY_METHODS,
        delivery_date: '',
        download_url: '',
        notes: '',
    });

    useEffect(() => {
        fetchDeliverables();
    }, [project.id]);

    const fetchDeliverables = async () => {
        try {
            setLoading(true);
            // Mock data for now - replace with actual API call
            const mockDeliverables: Deliverable[] = [
                {
                    id: 1,
                    name: 'Full Wedding Video',
                    description: 'Complete wedding ceremony and reception video',
                    deliverable_type: 'video',
                    format: 'MP4 (H.264)',
                    file_size: '2.1 GB',
                    resolution: '4K (3840x2160)',
                    duration: '45 minutes',
                    status: 'ready',
                    delivery_method: 'cloud_link',
                    delivery_date: '2024-04-15',
                    download_url: 'https://example.com/wedding-video-download',
                    notes: 'High-quality 4K version with professional audio',
                    created_at: '2024-03-20T10:00:00Z',
                    updated_at: '2024-04-10T14:30:00Z',
                },
                {
                    id: 2,
                    name: 'Highlight Reel',
                    description: '3-minute wedding highlights video',
                    deliverable_type: 'highlights',
                    format: 'MP4 (H.264)',
                    file_size: '180 MB',
                    resolution: '1080p',
                    duration: '3 minutes',
                    status: 'delivered',
                    delivery_method: 'digital_download',
                    delivery_date: '2024-04-01',
                    download_url: 'https://example.com/highlights-download',
                    notes: 'Perfect for social media sharing',
                    created_at: '2024-03-22T11:00:00Z',
                    updated_at: '2024-04-01T09:15:00Z',
                },
                {
                    id: 3,
                    name: 'Wedding Photo Gallery',
                    description: 'Complete collection of edited wedding photos',
                    deliverable_type: 'photos',
                    format: 'JPEG (High Quality)',
                    file_size: '1.8 GB',
                    resolution: 'Various (up to 6000x4000)',
                    status: 'processing',
                    delivery_method: 'online_gallery',
                    delivery_date: '2024-04-20',
                    notes: '150+ edited photos in online gallery',
                    created_at: '2024-03-25T09:00:00Z',
                    updated_at: '2024-04-05T16:00:00Z',
                },
                {
                    id: 4,
                    name: 'Wedding Album',
                    description: 'Premium leather-bound wedding album',
                    deliverable_type: 'album',
                    format: 'Physical Album (12x12 inches)',
                    status: 'pending',
                    delivery_method: 'physical_media',
                    delivery_date: '2024-05-01',
                    notes: '20-page premium album with custom layout',
                    created_at: '2024-04-01T14:00:00Z',
                    updated_at: '2024-04-01T14:00:00Z',
                },
                {
                    id: 5,
                    name: 'Raw Footage Archive',
                    description: 'Complete raw footage backup on USB drive',
                    deliverable_type: 'raw_footage',
                    format: 'Various (MOV, MP4)',
                    file_size: '120 GB',
                    status: 'ready',
                    delivery_method: 'usb_drive',
                    delivery_date: '2024-04-18',
                    tracking_number: 'TN123456789',
                    notes: 'All raw footage on 128GB USB 3.0 drive',
                    created_at: '2024-04-02T10:00:00Z',
                    updated_at: '2024-04-15T11:30:00Z',
                },
            ];
            setDeliverables(mockDeliverables);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch deliverables');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDeliverable = async () => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            const newDeliverableItem: Deliverable = {
                id: Math.max(...deliverables.map(item => item.id)) + 1,
                name: newDeliverable.name,
                description: newDeliverable.description,
                deliverable_type: newDeliverable.deliverable_type,
                format: newDeliverable.format,
                file_size: newDeliverable.file_size,
                resolution: newDeliverable.resolution,
                duration: newDeliverable.duration,
                status: newDeliverable.status,
                delivery_method: newDeliverable.delivery_method,
                delivery_date: newDeliverable.delivery_date,
                download_url: newDeliverable.download_url,
                notes: newDeliverable.notes,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setDeliverables(prev => [...prev, newDeliverableItem]);
            setNewDeliverable({
                name: '',
                description: '',
                deliverable_type: 'video',
                format: '',
                file_size: '',
                resolution: '',
                duration: '',
                status: 'pending',
                delivery_method: 'digital_download',
                delivery_date: '',
                download_url: '',
                notes: '',
            });
            setShowAddForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add deliverable');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (deliverableId: number, newStatus: keyof typeof STATUS_CONFIG) => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            setDeliverables(prev =>
                prev.map(deliverable =>
                    deliverable.id === deliverableId
                        ? { ...deliverable, status: newStatus, updated_at: new Date().toISOString() }
                        : deliverable
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDeliverable = async (deliverableId: number) => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            setDeliverables(prev => prev.filter(deliverable => deliverable.id !== deliverableId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete deliverable');
        } finally {
            setLoading(false);
        }
    };

    const getProgressPercentage = () => {
        if (deliverables.length === 0) return 0;
        const completedDeliverables = deliverables.filter(item =>
            item.status === 'delivered' || item.status === 'approved'
        ).length;
        return Math.round((completedDeliverables / deliverables.length) * 100);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No delivery date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getUpcomingDeliveries = () => {
        const today = new Date();
        return deliverables.filter(item => {
            if (!item.delivery_date) return false;
            const deliveryDate = new Date(item.delivery_date);
            const diffTime = deliveryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7 && (item.status === 'ready' || item.status === 'processing');
        }).sort((a, b) => new Date(a.delivery_date!).getTime() - new Date(b.delivery_date!).getTime());
    };

    const upcomingDeliveries = getUpcomingDeliveries();

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    {error}
                </Alert>
            )}

            {/* Delivery Overview */}
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
                            <DeliveryIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 28 }} />
                            Delivery & Final Products
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
                            Add Deliverable
                        </Button>
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={8}>
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                        Delivery Progress
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
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
                                    Upcoming Deliveries
                                </Typography>
                                <Typography variant="h6" sx={{ color: upcomingDeliveries.length > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                                    {upcomingDeliveries.length}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                    This week
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                            const count = deliverables.filter(item => item.status === status).length;
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

            {/* Upcoming Deliveries Alert */}
            {upcomingDeliveries.length > 0 && (
                <Alert
                    severity="warning"
                    sx={{
                        mb: 3,
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}
                    icon={<ScheduleIcon sx={{ color: '#f59e0b' }} />}
                >
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        Upcoming Deliveries This Week
                    </Typography>
                    {upcomingDeliveries.map(item => (
                        <Typography key={item.id} variant="body2" sx={{ color: '#f59e0b' }}>
                            • {item.name} - Due {formatDate(item.delivery_date)}
                        </Typography>
                    ))}
                </Alert>
            )}

            {/* Add New Deliverable Form */}
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
                            Add New Deliverable
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Deliverable Name"
                                    value={newDeliverable.name}
                                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, name: e.target.value }))}
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
                                        Type
                                    </InputLabel>
                                    <Select
                                        value={newDeliverable.deliverable_type}
                                        onChange={(e) => setNewDeliverable(prev => ({ ...prev, deliverable_type: e.target.value as keyof typeof DELIVERABLE_TYPES }))}
                                        label="Type"
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
                                        {Object.entries(DELIVERABLE_TYPES).map(([type, config]) => (
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
                                    value={newDeliverable.description}
                                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, description: e.target.value }))}
                                    fullWidth
                                    multiline
                                    rows={2}
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
                                    label="Format"
                                    value={newDeliverable.format}
                                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, format: e.target.value }))}
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
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#9ca3af', '&.Mui-focused': { color: '#d1d5db' } }}>
                                        Delivery Method
                                    </InputLabel>
                                    <Select
                                        value={newDeliverable.delivery_method}
                                        onChange={(e) => setNewDeliverable(prev => ({ ...prev, delivery_method: e.target.value as keyof typeof DELIVERY_METHODS }))}
                                        label="Delivery Method"
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
                                        {Object.entries(DELIVERY_METHODS).map(([method, config]) => (
                                            <MenuItem key={method} value={method}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Delivery Date"
                                    type="date"
                                    value={newDeliverable.delivery_date}
                                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, delivery_date: e.target.value }))}
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
                                onClick={handleAddDeliverable}
                                disabled={!newDeliverable.name || loading}
                                variant="contained"
                                sx={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                            >
                                Save Deliverable
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

            {/* Deliverables Table */}
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
                                        Deliverable
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Type
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Format & Size
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Delivery Method
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Due Date
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
                                {deliverables.map((deliverable) => (
                                    <TableRow key={deliverable.id} sx={{ '&:hover': { backgroundColor: 'rgba(75, 85, 99, 0.1)' } }}>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Box>
                                                <Typography variant="body1" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                                    {deliverable.name}
                                                </Typography>
                                                {deliverable.description && (
                                                    <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
                                                        {deliverable.description}
                                                    </Typography>
                                                )}
                                                {deliverable.download_url && (
                                                    <Typography variant="caption" sx={{ color: '#60a5fa' }}>
                                                        Download Available
                                                    </Typography>
                                                )}
                                                {deliverable.tracking_number && (
                                                    <Typography variant="caption" sx={{ color: '#f59e0b' }}>
                                                        Tracking: {deliverable.tracking_number}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Chip
                                                icon={DELIVERABLE_TYPES[deliverable.deliverable_type].icon}
                                                label={DELIVERABLE_TYPES[deliverable.deliverable_type].label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${DELIVERABLE_TYPES[deliverable.deliverable_type].color}20`,
                                                    color: DELIVERABLE_TYPES[deliverable.deliverable_type].color,
                                                    border: `1px solid ${DELIVERABLE_TYPES[deliverable.deliverable_type].color}40`,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                                    {deliverable.format}
                                                </Typography>
                                                {deliverable.file_size && (
                                                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                                        Size: {deliverable.file_size}
                                                    </Typography>
                                                )}
                                                {deliverable.resolution && (
                                                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                                                        {deliverable.resolution}
                                                    </Typography>
                                                )}
                                                {deliverable.duration && (
                                                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                                                        Duration: {deliverable.duration}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Chip
                                                icon={DELIVERY_METHODS[deliverable.delivery_method].icon}
                                                label={DELIVERY_METHODS[deliverable.delivery_method].label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                                    color: '#6366f1',
                                                    border: '1px solid rgba(99, 102, 241, 0.4)',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                                {formatDate(deliverable.delivery_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Chip
                                                label={STATUS_CONFIG[deliverable.status].label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${STATUS_CONFIG[deliverable.status].color}20`,
                                                    color: STATUS_CONFIG[deliverable.status].color,
                                                    border: `1px solid ${STATUS_CONFIG[deliverable.status].color}40`,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Stack direction="row" spacing={1}>
                                                {deliverable.status !== 'delivered' && deliverable.status !== 'approved' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleUpdateStatus(deliverable.id, 'delivered')}
                                                        sx={{ color: '#10b981' }}
                                                    >
                                                        <CheckIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                {deliverable.download_url && (
                                                    <IconButton
                                                        size="small"
                                                        component="a"
                                                        href={deliverable.download_url}
                                                        target="_blank"
                                                        sx={{ color: '#60a5fa' }}
                                                    >
                                                        <DownloadIcon fontSize="small" />
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
                                                    onClick={() => handleDeleteDeliverable(deliverable.id)}
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
