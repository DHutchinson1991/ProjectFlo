import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Box
} from '@mui/material';
import {
    Description as NotesIcon,
} from '@mui/icons-material';
import { CreateLocationSpaceRequest } from '@/lib/types/locations';

interface SpaceDescriptionProps {
    spaceForm: Partial<CreateLocationSpaceRequest>;
    onUpdateForm: (updates: Partial<CreateLocationSpaceRequest>) => void;
    isEditing: boolean;
}

export const SpaceDescription: React.FC<SpaceDescriptionProps> = ({
    spaceForm,
    onUpdateForm,
    isEditing
}) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" alignItems="center" mb={2}>
                    <NotesIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Description & Notes</Typography>
                </Box>

                <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="Space Description"
                    value={spaceForm.description || ''}
                    onChange={(e) => onUpdateForm({ description: e.target.value })}
                    disabled={!isEditing}
                    variant={isEditing ? 'outlined' : 'filled'}
                    placeholder="Describe this space, its features, limitations, or any special requirements..."
                    InputProps={{
                        readOnly: !isEditing,
                    }}
                    sx={{ flex: 1 }}
                />
            </CardContent>
        </Card>
    );
};
