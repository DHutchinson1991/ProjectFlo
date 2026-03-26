'use client';

import React from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
} from '@mui/material';
import type { CreateLocationRequest } from '../types';

interface LocationCreateDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    form: CreateLocationRequest;
    onFormChange: (form: CreateLocationRequest) => void;
    isEditing: boolean;
}

export function LocationCreateDialog({
    open,
    onClose,
    onSave,
    form,
    onFormChange,
    isEditing,
}: LocationCreateDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{isEditing ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            label="Location Name"
                            fullWidth
                            required
                            value={form.name}
                            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Address Line 1"
                            fullWidth
                            value={form.address_line1}
                            onChange={(e) => onFormChange({ ...form, address_line1: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Address Line 2"
                            fullWidth
                            value={form.address_line2}
                            onChange={(e) => onFormChange({ ...form, address_line2: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="City"
                            fullWidth
                            value={form.city}
                            onChange={(e) => onFormChange({ ...form, city: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="State"
                            fullWidth
                            value={form.state}
                            onChange={(e) => onFormChange({ ...form, state: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Postal Code"
                            fullWidth
                            value={form.postal_code}
                            onChange={(e) => onFormChange({ ...form, postal_code: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Contact Name"
                            fullWidth
                            value={form.contact_name}
                            onChange={(e) => onFormChange({ ...form, contact_name: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Contact Phone"
                            fullWidth
                            value={form.contact_phone}
                            onChange={(e) => onFormChange({ ...form, contact_phone: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Contact Email"
                            type="email"
                            fullWidth
                            value={form.contact_email}
                            onChange={(e) => onFormChange({ ...form, contact_email: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Capacity"
                            type="number"
                            fullWidth
                            value={form.capacity || ''}
                            onChange={(e) =>
                                onFormChange({
                                    ...form,
                                    capacity: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                            }
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Notes"
                            fullWidth
                            multiline
                            rows={3}
                            value={form.notes}
                            onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={onSave}>
                    {isEditing ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
