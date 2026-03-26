import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Grid,
    Box,
    MenuItem,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    Apartment as SpaceIcon,
    People as CapacityIcon,
} from '@mui/icons-material';
import { CreateLocationSpaceRequest } from '@/features/workflow/locations/types';

interface SpaceInformationProps {
    spaceForm: Partial<CreateLocationSpaceRequest>;
    onUpdateForm: (updates: Partial<CreateLocationSpaceRequest>) => void;
    isEditing: boolean;
    spaceTypes: string[];
}

export const SpaceInformation: React.FC<SpaceInformationProps> = ({
    spaceForm,
    onUpdateForm,
    isEditing,
    spaceTypes
}) => {
    // Space type configuration for display
    const getSpaceTypeLabel = (type: string) => {
        const typeLabels: Record<string, string> = {
            'reception': 'Reception Area',
            'ballroom': 'Ballroom',
            'ceremony': 'Ceremony Space',
            'cocktail': 'Cocktail Area',
            'dining': 'Dining Room',
            'outdoor': 'Outdoor Space',
            'other': 'Other Space'
        };
        return typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SpaceIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                        Space Information
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Space Name */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Space Name"
                            value={spaceForm.space_name || ''}
                            onChange={(e) => onUpdateForm({ space_name: e.target.value })}
                            disabled={!isEditing}
                            required
                            variant={isEditing ? 'outlined' : 'filled'}
                            InputProps={{
                                readOnly: !isEditing,
                            }}
                        />
                    </Grid>

                    {/* Space Type */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            select
                            label="Space Type"
                            value={spaceForm.space_type || ''}
                            onChange={(e) => onUpdateForm({ space_type: e.target.value })}
                            disabled={!isEditing}
                            required
                            variant={isEditing ? 'outlined' : 'filled'}
                            InputProps={{
                                readOnly: !isEditing,
                            }}
                        >
                            {spaceTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {getSpaceTypeLabel(type)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Maximum Capacity */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Maximum Capacity"
                            value={spaceForm.capacity || ''}
                            onChange={(e) => onUpdateForm({ capacity: parseInt(e.target.value) || undefined })}
                            disabled={!isEditing}
                            variant={isEditing ? 'outlined' : 'filled'}
                            InputProps={{
                                readOnly: !isEditing,
                                startAdornment: <CapacityIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                            helperText="Maximum number of people this space can accommodate"
                        />
                    </Grid>

                    {/* Active Status */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={spaceForm.is_active ?? true}
                                        onChange={(e) => onUpdateForm({ is_active: e.target.checked })}
                                        disabled={!isEditing}
                                    />
                                }
                                label="Active Space"
                            />
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
