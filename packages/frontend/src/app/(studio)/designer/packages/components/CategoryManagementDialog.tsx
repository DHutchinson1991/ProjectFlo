import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
    Box, CircularProgress, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '@/lib/api';
// removed useBrand import

interface Category {
    id: number;
    name: string;
    description?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    brandId: number;
}

export default function CategoryManagementDialog({ open, onClose, brandId }: Props) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Create Mode
    const [newCategoryName, setNewCategoryName] = useState('');

    // Edit Mode
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        if (open && brandId) {
            loadCategories();
        }
    }, [open, brandId]);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await api.servicePackageCategories.getAll(brandId);
            setCategories(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!brandId || !newCategoryName.trim()) return;
        try {
            await api.servicePackageCategories.create(brandId, { name: newCategoryName });
            setNewCategoryName('');
            loadCategories();
        } catch (error) {
            console.error(error);
            alert('Failed to create category');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? Default categories might be needed.')) return;
        try {
            await api.servicePackageCategories.delete(brandId, id);
            loadCategories();
        } catch (error) {
            console.error(error);
            alert('Failed to delete category');
        }
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async () => {
        if (!editingId || !editName.trim()) return;
        try {
            await api.servicePackageCategories.update(brandId, editingId, { name: editName });
            setEditingId(null);
            loadCategories();
        } catch (error) {
            console.error(error);
            alert('Failed to update category');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Manage Package Categories</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 3, mt: 1 }}>
                    <TextField 
                        label="New Category Name" 
                        fullWidth 
                        size="small"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g., Wedding, Corporate, Add-ons"
                    />
                    <Button variant="contained" onClick={handleCreate} disabled={!newCategoryName.trim()}>
                        Add
                    </Button>
                </Box>

                {loading ? <CircularProgress size={24} sx={{ mx: 'auto', display: 'block' }} /> : (
                    <List>
                        {categories.map((cat) => (
                            <ListItem key={cat.id} divider>
                                {editingId === cat.id ? (
                                    <TextField 
                                        fullWidth 
                                        size="small" 
                                        value={editName} 
                                        onChange={(e) => setEditName(e.target.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <ListItemText primary={cat.name} />
                                )}
                                
                                <ListItemSecondaryAction>
                                    {editingId === cat.id ? (
                                        <>
                                            <IconButton edge="end" onClick={saveEdit} color="primary"><SaveIcon /></IconButton>
                                            <IconButton edge="end" onClick={cancelEdit}><CloseIcon /></IconButton> 
                                        </>
                                    ) : (
                                        <>
                                            <IconButton edge="end" onClick={() => startEdit(cat)}><EditIcon /></IconButton>
                                            <IconButton edge="end" onClick={() => handleDelete(cat.id)}><DeleteIcon /></IconButton>
                                        </>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        {categories.length === 0 && (
                            <Typography variant="body2" color="text.secondary" align="center">
                                No categories defined yet. Add one above.
                            </Typography>
                        )}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Done</Button>
            </DialogActions>
        </Dialog>
    );
}
