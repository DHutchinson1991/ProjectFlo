import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Grid,
    Box
} from '@mui/material';
import {
    Straighten as DimensionsIcon,
} from '@mui/icons-material';
import { CreateLocationSpaceRequest } from '@/lib/types/locations';

interface SpaceDimensionsProps {
    spaceForm: Partial<CreateLocationSpaceRequest>;
    onUpdateForm: (updates: Partial<CreateLocationSpaceRequest>) => void;
    isEditing: boolean;
}

export const SpaceDimensions: React.FC<SpaceDimensionsProps> = ({
    spaceForm,
    onUpdateForm,
    isEditing
}) => {
    const calculateSquareFootage = (): string | null => {
        const length = spaceForm.dimensions_length;
        const width = spaceForm.dimensions_width;
        if (length && width) {
            return (length * width).toFixed(0);
        }
        return null;
    };

    const calculateArea = (): string => {
        const sqft = calculateSquareFootage();
        if (sqft) {
            return `${sqft} sq ft`;
        }
        return 'Enter dimensions to calculate';
    };

    return (
        <Card>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <DimensionsIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Space Dimensions</Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Length */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Length (feet)"
                            value={spaceForm.dimensions_length || ''}
                            onChange={(e) => onUpdateForm({
                                dimensions_length: parseFloat(e.target.value) || undefined
                            })}
                            disabled={!isEditing}
                            variant={isEditing ? 'outlined' : 'filled'}
                            InputProps={{
                                readOnly: !isEditing,
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.1
                            }}
                        />
                    </Grid>

                    {/* Width */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Width (feet)"
                            value={spaceForm.dimensions_width || ''}
                            onChange={(e) => onUpdateForm({
                                dimensions_width: parseFloat(e.target.value) || undefined
                            })}
                            disabled={!isEditing}
                            variant={isEditing ? 'outlined' : 'filled'}
                            InputProps={{
                                readOnly: !isEditing,
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.1
                            }}
                        />
                    </Grid>

                    {/* Height */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Ceiling Height (feet)"
                            value={spaceForm.dimensions_height || ''}
                            onChange={(e) => onUpdateForm({
                                dimensions_height: parseFloat(e.target.value) || undefined
                            })}
                            disabled={!isEditing}
                            variant={isEditing ? 'outlined' : 'filled'}
                            InputProps={{
                                readOnly: !isEditing,
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.1
                            }}
                        />
                    </Grid>

                    {/* Calculated Square Footage */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Total Area"
                            value={calculateArea()}
                            disabled
                            variant="filled"
                            sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                    fontWeight: 'medium'
                                }
                            }}
                        />
                    </Grid>

                    {/* Additional Notes */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Dimension Notes"
                            value={spaceForm.dimensions_notes || ''}
                            onChange={(e) => onUpdateForm({ dimensions_notes: e.target.value })}
                            disabled={!isEditing}
                            variant={isEditing ? 'outlined' : 'filled'}
                            placeholder="Any additional notes about space dimensions, irregular shapes, obstacles, etc."
                            InputProps={{
                                readOnly: !isEditing,
                            }}
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
