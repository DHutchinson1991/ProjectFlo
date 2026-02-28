'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, Box, IconButton, MenuItem, Select, FormControl, InputLabel,
    List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import { api } from '@/lib/api';
import { ServicePackage } from '@/lib/types/domains/sales';
import { useBrand } from '@/app/providers/BrandProvider'; // ADDED
import FilmConfigurationDialog from './FilmConfigurationDialog';

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<ServicePackage>) => void;
    initialData: ServicePackage | null;
    categories: any[];
}

export default function PackageCustomizationDialog({ open, onClose, onSave, initialData, categories }: Props) {
    const { currentBrand } = useBrand(); // ADDED
    const [formData, setFormData] = useState<Partial<ServicePackage>>({
        name: '',
        description: '',
        category: '', // CHANGED DEFAULT
        base_price: 0,
        contents: { items: [] }
    });
    
    // Available reusable films
    const [films, setFilms] = useState<any[]>([]);
    
    // Form state for new item
    const [newItemType, setNewItemType] = useState<'film' | 'service'>('film');
    const [selectedFilmId, setSelectedFilmId] = useState<string>('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [servicePrice, setServicePrice] = useState<string>('0');

    // Configuration Dialog State
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [configItemIndex, setConfigItemIndex] = useState<number | null>(null);

    // PackageFilm records (for looking up packageFilmId when configuring a film)
    const [packageFilmMap, setPackageFilmMap] = useState<Map<number, number>>(new Map());

    useEffect(() => {
        if (open) {
            // Load films
            api.films.getAll().then(setFilms).catch(console.error);

            // Load PackageFilm records to get packageFilmId for each film
            if (initialData?.id) {
                api.schedule.packageFilms.getAll(initialData.id).then((pfs: any[]) => {
                    const map = new Map<number, number>();
                    for (const pf of pfs) {
                        map.set(pf.film_id ?? pf.film?.id, pf.id);
                    }
                    setPackageFilmMap(map);
                }).catch(console.error);
            }

            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    name: '',
                    description: '',
                    category: '',
                    base_price: 0,
                    contents: { items: [] }
                });
            }
        }
    }, [open, initialData]);

    const handleAddItem = () => {
        const items = formData.contents?.items || [];
        
        if (newItemType === 'film') {
            const film = films.find(f => f.id === Number(selectedFilmId));
            if (!film) return;
            
            items.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'film',
                referenceId: film.id,
                description: film.name, // Snapshot name
                price: Number(servicePrice) // Allow price definition for films too
            });
            setServicePrice('0');
        } else {
            if (!serviceDescription) return;
            items.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'service',
                description: serviceDescription,
                price: Number(servicePrice)
            });
            setServiceDescription('');
            setServicePrice('0');
        }

        setFormData({ ...formData, contents: { items } });
    };

    const handleRemoveItem = (index: number) => {
        const items = [...(formData.contents?.items || [])];
        items.splice(index, 1);
        setFormData({ ...formData, contents: { items } });
    };

    const handleConfigureItem = (index: number) => {
        setConfigItemIndex(index);
        setConfigDialogOpen(true);
    };

    const handleSaveConfiguration = (newConfig: any) => {
        if (configItemIndex === null) return;
        
        const items = [...(formData.contents?.items || [])];
        const item = items[configItemIndex];
        
        if (item.type === 'film') {
            items[configItemIndex] = {
                ...item,
                config: {
                    ...(item.config || {}),
                    ...newConfig
                } // Merge new config
            };
            setFormData({ ...formData, contents: { items } });
        }
    };
    
    // Auto-sum helper
    const calculateTotal = () => {
        return (formData.contents?.items || []).reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    };

    const handleSave = () => {
        onSave(formData);
    };

    // Calculate suggested total value based on items? 
    // For now simple manual pricing.
    
    const activeConfigItem = configItemIndex !== null ? formData.contents?.items?.[configItemIndex] : null;

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>{initialData ? 'Edit Package' : 'Create New Package'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Package Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Category"
                            fullWidth
                            select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                </MenuItem>
                            ))}
                            {categories.length === 0 && <MenuItem value="" disabled>No categories defined</MenuItem>}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Base Price ($)"
                            fullWidth
                            type="number"
                            value={formData.base_price}
                            onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                        />
                    </Grid>

                    {/* CONTENTS BUILDER */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }}>Package Contents</Divider>
                        
                        {/* List Existing */}
                        <Paper variant="outlined" sx={{ mb: 2 }}>
                            <List dense>
                                {formData.contents?.items?.map((item, idx) => (
                                    <ListItem key={idx}>
                                        <ListItemText 
                                            primary={item.description}
                                            secondary={item.type === 'film' ? 'Film Template' : `Add-on Service ($${item.price})`}
                                        />
                                        <ListItemSecondaryAction>
                                            {item.type === 'film' && (
                                                <IconButton edge="end" size="small" onClick={() => handleConfigureItem(idx)} sx={{ mr: 1 }} title="Configure Resources">
                                                    <SettingsIcon />
                                                </IconButton>
                                            )}
                                            <IconButton edge="end" size="small" onClick={() => handleRemoveItem(idx)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                                {(!formData.contents?.items?.length) && (
                                    <ListItem>
                                        <ListItemText secondary="No items added yet" />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>

                        {/* Add New */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                    value={newItemType}
                                    onChange={(e) => setNewItemType(e.target.value as 'film' | 'service')}
                                >
                                    <MenuItem value="film">Add Film</MenuItem>
                                    <MenuItem value="service">Add Service</MenuItem>
                                </Select>
                            </FormControl>

                            {newItemType === 'film' ? (
                                <>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Select Film</InputLabel>
                                        <Select
                                            value={selectedFilmId}
                                            label="Select Film"
                                            onChange={(e) => setSelectedFilmId(e.target.value as string)}
                                        >
                                            {films.map(f => (
                                                <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField 
                                        label="Price ($)" type="number" size="small" sx={{ width: 100 }}
                                        value={servicePrice}
                                        onChange={e => setServicePrice(e.target.value)}
                                        helperText="List Price"
                                    />
                                </>
                            ) : (
                                <>
                                    <TextField 
                                        label="Description" size="small" fullWidth
                                        value={serviceDescription}
                                        onChange={e => setServiceDescription(e.target.value)}
                                    />
                                    <TextField 
                                        label="Price ($)" type="number" size="small" sx={{ width: 100 }}
                                        value={servicePrice}
                                        onChange={e => setServicePrice(e.target.value)}
                                        helperText="List Price"
                                    />
                                </>
                            )}
                            
                            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem}>
                                Add
                            </Button>
                        </Box>
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button 
                                size="small" 
                                color="secondary"
                                onClick={() => setFormData({ ...formData, base_price: calculateTotal() })}
                            >
                                Set Base Price to Sum (${calculateTotal()})
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save Package</Button>
            </DialogActions>
        </Dialog>

        {configDialogOpen && activeConfigItem && activeConfigItem.type === 'film' && (
            <FilmConfigurationDialog 
                open={configDialogOpen}
                onClose={() => setConfigDialogOpen(false)}
                filmId={activeConfigItem.referenceId || 0}
                filmName={activeConfigItem.description || 'Film'}
                brandId={currentBrand?.id}
                packageFilmId={packageFilmMap.get(activeConfigItem.referenceId || 0) ?? null}
                packageId={initialData?.id}
                initialConfig={activeConfigItem.config || {}}
                onSave={handleSaveConfiguration}
            />
        )}
        </>
    );
}
