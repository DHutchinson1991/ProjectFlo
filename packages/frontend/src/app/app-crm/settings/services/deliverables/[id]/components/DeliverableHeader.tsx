import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    IconButton,
    Chip,
    Select,
    MenuItem,
    FormControl,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { categoryAPI, deliverableAPI } from '../../../_shared/api';
import { DeliverableCategory, DeliverableTemplate } from '../../../_shared/types';

interface DeliverableHeaderProps {
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

export default function DeliverableHeader({
    deliverable,
    onDeliverableUpdated
}: DeliverableHeaderProps) {
    const [categories, setCategories] = useState<DeliverableCategory[]>([]);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [titleValue, setTitleValue] = useState(deliverable.name || '');
    const [descriptionValue, setDescriptionValue] = useState(deliverable.description || '');

    useEffect(() => {
        loadCategories();
        setTitleValue(deliverable.name || '');
        setDescriptionValue(deliverable.description || '');
    }, [deliverable]);

    const loadCategories = async () => {
        try {
            const data = await categoryAPI.getAll();
            setCategories(data);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const handleCategoryChange = async (newCategoryCode: string) => {
        try {
            setUpdating(true);

            const updatedDeliverable = await deliverableAPI.update(deliverable.id, {
                type: newCategoryCode as DeliverableTemplate['type']
            });

            onDeliverableUpdated(updatedDeliverable);
            setIsEditing(false);
        } catch (err) {
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
            await handleCategoryChange(code);
        } catch (err) {
            console.error('Failed to create category:', err);
        }
    };

    const handleTitleSave = async () => {
        try {
            setUpdating(true);
            const updatedDeliverable = await deliverableAPI.update(deliverable.id, {
                name: titleValue
            });
            onDeliverableUpdated(updatedDeliverable);
            setIsEditingTitle(false);
        } catch (err) {
            console.error('Failed to update title:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleDescriptionSave = async () => {
        try {
            setUpdating(true);
            const updatedDeliverable = await deliverableAPI.update(deliverable.id, {
                description: descriptionValue
            });
            onDeliverableUpdated(updatedDeliverable);
            setIsEditingDescription(false);
        } catch (err) {
            console.error('Failed to update description:', err);
        } finally {
            setUpdating(false);
        }
    };

    const getCurrentCategory = () => {
        return categories.find(cat => cat.code === deliverable.type);
    };

    const currentCategory = getCurrentCategory();

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                    <Link href="/app-crm/settings/services/deliverables" passHref>
                        <IconButton sx={{ mr: 2, mt: 0.5 }}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Link>
                    <Box sx={{ flex: 1 }}>
                        {/* Editable Title */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {!isEditingTitle ? (
                                <>
                                    <Typography variant="h4" component="h1" fontWeight="bold">
                                        {titleValue}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsEditingTitle(true)}
                                        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField
                                        value={titleValue}
                                        onChange={(e) => setTitleValue(e.target.value)}
                                        onBlur={handleTitleSave}
                                        onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
                                        autoFocus
                                        variant="outlined"
                                        size="small"
                                        sx={{ minWidth: 300 }}
                                    />
                                </Box>
                            )}

                            {/* Version Badge */}
                            <Chip
                                label={`v${deliverable.version || '1.0'}`}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 'auto' }}
                            />
                        </Box>

                        {/* Editable Description */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!isEditingDescription ? (
                                <>
                                    <Typography variant="body1" color="text.secondary">
                                        {descriptionValue || 'No description provided'}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsEditingDescription(true)}
                                        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </>
                            ) : (
                                <TextField
                                    value={descriptionValue}
                                    onChange={(e) => setDescriptionValue(e.target.value)}
                                    onBlur={handleDescriptionSave}
                                    onKeyPress={(e) => e.key === 'Enter' && handleDescriptionSave()}
                                    placeholder="Enter description..."
                                    autoFocus
                                    variant="outlined"
                                    size="small"
                                    multiline
                                    rows={2}
                                    sx={{ minWidth: 400 }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Category Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!isEditing && currentCategory && (
                        <Chip
                            label={currentCategory.name}
                            color="primary"
                            onClick={() => setIsEditing(true)}
                            onDelete={() => setIsEditing(true)}
                            deleteIcon={<EditIcon />}
                            sx={{ cursor: 'pointer' }}
                        />
                    )}

                    {updating && <CircularProgress size={20} />}

                    <Collapse in={isEditing} orientation="horizontal">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Select
                                    value={deliverable.type}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    disabled={updating}
                                    autoFocus
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.code}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <IconButton
                                size="small"
                                onClick={() => setDialogOpen(true)}
                                title="Add new category"
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Collapse>
                </Box>
            </Box>

            <CategoryDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleAddCategory}
            />
        </>
    );
}
