import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Chip,
    CircularProgress,
    Alert,
    Collapse
} from '@mui/material';
import {
    Category as CategoryIcon,
    Add as AddIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { categoryAPI, deliverableAPI } from '../../../_shared/api';
import { DeliverableCategory, DeliverableTemplate } from '../../../_shared/types';

interface DeliverableCategoryCardProps {
    deliverable: DeliverableTemplate;
    onDeliverableUpdated: (updatedDeliverable: DeliverableTemplate) => void;
}

interface CategoryDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (name: string, description?: string) => void;
}

function CategoryDialog({ open, onClose, onSave }: CategoryDialogProps) {
    const [categoryName, setCategoryName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        const trimmed = categoryName.trim();

        if (!trimmed) {
            setError('Category name is required');
            return;
        }

        if (trimmed.length < 2) {
            setError('Category name must be at least 2 characters');
            return;
        }

        onSave(trimmed, description.trim() || undefined);
        setCategoryName('');
        setDescription('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Category Name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    error={!!error}
                    helperText={error || 'Descriptive name for the category'}
                    sx={{ mt: 1, mb: 2 }}
                    autoFocus
                />
                <TextField
                    fullWidth
                    label="Description (Optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3}
                    helperText="Optional description to explain the category's purpose"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Add Category</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function DeliverableCategoryCard({
    deliverable,
    onDeliverableUpdated
}: DeliverableCategoryCardProps) {
    const [categories, setCategories] = useState<DeliverableCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await categoryAPI.getAll();
            setCategories(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load categories');
            console.error('Failed to load categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = async (newCategoryCode: string) => {
        try {
            setUpdating(true);
            setError(null);

            // Update the deliverable with the new category
            const updatedDeliverable = await deliverableAPI.update(deliverable.id, {
                type: newCategoryCode as DeliverableTemplate['type']
            });

            onDeliverableUpdated(updatedDeliverable);
            setIsEditing(false); // Close the dropdown after selection
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update category');
            console.error('Failed to update deliverable category:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleAddCategory = async (name: string, description?: string) => {
        try {
            const code = name.toUpperCase().replace(/\s+/g, '_');
            await categoryAPI.create({ name, code, description });
            await loadCategories();

            // Auto-select the new category
            await handleCategoryChange(code);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create category');
            console.error('Failed to create category:', err);
        }
    };

    const getCurrentCategory = () => {
        return categories.find(cat => cat.code === deliverable.type);
    };

    const currentCategory = getCurrentCategory();

    if (loading) {
        return (
            <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', minHeight: 120 }}>
                    <CircularProgress size={32} sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        Loading categories...
                    </Typography>
                </Paper>
            </Grid>
        );
    }

    return (
        <>
            <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2, minHeight: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon color="primary" sx={{ fontSize: 24 }} />
                            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                Category
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                                size="small"
                                onClick={() => setIsEditing(!isEditing)}
                                title="Edit category"
                                color={isEditing ? "primary" : "default"}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => setDialogOpen(true)}
                                title="Add new category"
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Category Display */}
                    {!isEditing && currentCategory && (
                        <Box>
                            <Chip
                                label={currentCategory.name}
                                color="primary"
                                sx={{ mb: 1 }}
                            />
                            {currentCategory.description && (
                                <Typography variant="body2" color="text.secondary">
                                    {currentCategory.description}
                                </Typography>
                            )}
                            {updating && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <CircularProgress size={16} sx={{ mr: 1 }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Updating...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Category Editing Dropdown */}
                    <Collapse in={isEditing}>
                        <FormControl fullWidth>
                            <Select
                                value={deliverable.type}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                disabled={updating}
                                size="small"
                                autoFocus
                            >
                                {categories.map((category) => (
                                    <MenuItem key={category.id} value={category.code}>
                                        <Box>
                                            <Typography variant="body2">
                                                {category.name}
                                            </Typography>
                                            {category.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {category.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Collapse>
                </Paper>
            </Grid>

            <CategoryDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleAddCategory}
            />
        </>
    );
}
