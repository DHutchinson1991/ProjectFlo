'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    TextField,
    MenuItem,
    IconButton,
    Chip,
    InputAdornment,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Add as PlusIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as EyeIcon,
    ContentCopy as CopyIcon,
    ArrowBack as ArrowBackIcon,
    Category as CategoryIcon
} from '@mui/icons-material';
import { deliverableAPI, categoryAPI } from '../_shared/api';
import { DeliverableTemplate } from '../_shared/types';
import { CategoryManagerModal } from './components';

export default function DeliverablesPage() {
    const [deliverables, setDeliverables] = useState<DeliverableTemplate[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);

    useEffect(() => {
        loadDeliverables();
        loadCategories();
    }, []);

    const loadDeliverables = async () => {
        try {
            setLoading(true);
            const data = await deliverableAPI.getAll();
            setDeliverables(data);
        } catch (error) {
            console.error('Error loading deliverables:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const categoryCodes = await categoryAPI.getCodes();
            setCategories(categoryCodes);
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to existing deliverable types
            setCategories([...new Set(deliverables.map(d => d.type))]);
        }
    };

    const handleCategoriesChanged = () => {
        loadCategories();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this deliverable template?')) {
            try {
                await deliverableAPI.delete(id);
                setDeliverables(prev => prev.filter(d => d.id !== id));
            } catch (error) {
                console.error('Error deleting deliverable:', error);
            }
        }
    };

    const handleDuplicate = async (deliverable: DeliverableTemplate) => {
        try {
            const duplicated = await deliverableAPI.create({
                name: `${deliverable.name} (Copy)`,
                description: deliverable.description,
                type: deliverable.type,
                includes_music: deliverable.includes_music,
                delivery_timeline: deliverable.delivery_timeline
            });
            setDeliverables(prev => [...prev, duplicated]);
        } catch (error) {
            console.error('Error duplicating deliverable:', error);
        }
    };

    const filteredDeliverables = deliverables.filter(deliverable => {
        const matchesSearch = deliverable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deliverable.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'all' || deliverable.type === selectedType;
        return matchesSearch && matchesType;
    });

    const deliverableTypes = categories.length > 0 ? categories : [...new Set(deliverables.map(d => d.type))];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton
                    component={Link}
                    href="/app-crm/settings/services"
                    sx={{ mr: 2 }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                        Deliverable Templates
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your deliverable templates and visual builders
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<CategoryIcon />}
                        onClick={() => setCategoryModalOpen(true)}
                    >
                        Manage Categories
                    </Button>
                    <Button
                        component={Link}
                        href="/app-crm/settings/services/deliverables/builder"
                        variant="contained"
                        startIcon={<PlusIcon />}
                    >
                        Create Template
                    </Button>
                </Box>
            </Box>

            {/* Search and Filter */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search deliverables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <FilterIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="all">All Types</MenuItem>
                    {deliverableTypes.map(type => (
                        <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Deliverables List */}
            {filteredDeliverables.length === 0 ? (
                <Card sx={{ textAlign: 'center', py: 4 }}>
                    <CardContent>
                        <PlusIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            No deliverables found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {searchTerm || selectedType !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by creating your first deliverable template.'}
                        </Typography>
                        {!searchTerm && selectedType === 'all' && (
                            <Button
                                component={Link}
                                href="/app-crm/settings/services/deliverables/builder"
                                variant="contained"
                                startIcon={<PlusIcon />}
                            >
                                Create Your First Template
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <List sx={{ width: '100%' }}>
                        {filteredDeliverables.map((deliverable, index) => (
                            <React.Fragment key={deliverable.id}>
                                <ListItem
                                    sx={{
                                        alignItems: 'flex-start',
                                        py: 2,
                                        px: 3
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: 'primary.main',
                                            mr: 2,
                                            mt: 0.5,
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        {deliverable.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="h6" component="span">
                                                    {deliverable.name}
                                                </Typography>
                                                <Chip
                                                    label={deliverable.type.toLowerCase()}
                                                    size="small"
                                                    color="primary"
                                                />
                                                <Chip
                                                    label={`${deliverable.template_defaults?.length || 0} components`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {deliverable.description || 'No description provided'}
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton
                                                component={Link}
                                                href={`/app-crm/settings/services/deliverables/${deliverable.id}`}
                                                size="small"
                                                title="View Details"
                                            >
                                                <EyeIcon />
                                            </IconButton>
                                            <IconButton
                                                component={Link}
                                                href={`/app-crm/settings/services/deliverables/${deliverable.id}`}
                                                size="small"
                                                title="Edit Template"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDuplicate(deliverable)}
                                                size="small"
                                                title="Duplicate"
                                            >
                                                <CopyIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDelete(deliverable.id)}
                                                size="small"
                                                color="error"
                                                title="Delete"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < filteredDeliverables.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Card>
            )}

            {/* Category Management Modal */}
            <Dialog
                open={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogContent>
                    <CategoryManagerModal
                        onCategoriesChanged={() => {
                            handleCategoriesChanged();
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCategoryModalOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
