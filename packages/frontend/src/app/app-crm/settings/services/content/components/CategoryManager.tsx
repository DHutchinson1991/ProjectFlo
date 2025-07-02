import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Category as CategoryIcon
} from '@mui/icons-material';
import { categoryAPI } from '../../_shared/api';
import { ContentCategory } from '../../_shared/types';

interface CategoryManagerProps {
    onCategoriesChanged?: () => void;
}

interface CategoryDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (name: string, description?: string) => void;
    title: string;
    initialCategory?: ContentCategory;
}

function CategoryDialog({ open, onClose, onSave, title, initialCategory }: CategoryDialogProps) {
    const [categoryName, setCategoryName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (initialCategory) {
            setCategoryName(initialCategory.name);
            setDescription(initialCategory.description || '');
        } else {
            setCategoryName('');
            setDescription('');
        }
        setError('');
    }, [open, initialCategory]);

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
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
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
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function CategoryManager({ onCategoriesChanged }: CategoryManagerProps) {
    const [categories, setCategories] = useState<DeliverableCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [editingCategory, setEditingCategory] = useState<DeliverableCategory | undefined>();

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

    useEffect(() => {
        loadCategories();
    }, []);

    const handleAddCategory = () => {
        setDialogMode('add');
        setEditingCategory(undefined);
        setDialogOpen(true);
    };

    const handleEditCategory = (category: DeliverableCategory) => {
        setDialogMode('edit');
        setEditingCategory(category);
        setDialogOpen(true);
    };

    const handleDeleteCategory = async (category: DeliverableCategory) => {
        if (window.confirm(`Are you sure you want to delete the "${category.name}" category? This cannot be undone.`)) {
            try {
                await categoryAPI.delete(category.id);
                await loadCategories();
                onCategoriesChanged?.();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete category');
                console.error('Failed to delete category:', err);
            }
        }
    };

    const handleSaveCategory = async (name: string, description?: string) => {
        try {
            if (dialogMode === 'add') {
                const code = name.toUpperCase().replace(/\s+/g, '_');
                await categoryAPI.create({ name, code, description });
            } else if (editingCategory) {
                const code = name.toUpperCase().replace(/\s+/g, '_');
                await categoryAPI.update(editingCategory.id, { name, code, description });
            }
            await loadCategories();
            onCategoriesChanged?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save category');
            console.error('Failed to save category:', err);
        }
    };

    if (loading) {
        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon color="primary" />
                        <Typography variant="h6">Deliverable Categories</Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddCategory}
                        size="small"
                    >
                        Add Category
                    </Button>
                </Box>

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        action={
                            <Button size="small" onClick={loadCategories}>
                                Retry
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {categories.length === 0 ? (
                    <Alert severity="info">
                        No categories available. Add a category to get started.
                    </Alert>
                ) : (
                    <List dense>
                        {categories.map((category) => (
                            <ListItem key={category.id} divider>
                                <ListItemText
                                    primary={category.name}
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Code: {category.code}
                                            </Typography>
                                            {category.description && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {category.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditCategory(category)}
                                            color="primary"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteCategory(category)}
                                            color="error"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}

                <CategoryDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onSave={handleSaveCategory}
                    title={dialogMode === 'add' ? 'Add New Category' : 'Edit Category'}
                    initialCategory={editingCategory}
                />
            </CardContent>
        </Card>
    );
}
