"use client";

import React from "react";
import { TextField, InputAdornment, Grid } from "@mui/material";

interface MomentEditorFieldsProps {
    name: string;
    onNameChange: (val: string) => void;
    duration: number;
    onDurationChange: (val: number) => void;
    errors: {
        name?: string;
        duration?: string;
    };
    readOnly?: boolean;
}

export const MomentEditorFields: React.FC<MomentEditorFieldsProps> = ({
    name,
    onNameChange,
    duration,
    onDurationChange,
    errors,
    readOnly,
}) => {
    return (
        <Grid container spacing={2}>
            {/* NAME FIELD */}
            <Grid item xs={12} sm={8}>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Moment Name"
                    fullWidth
                    variant="outlined"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    disabled={readOnly}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                            '&:hover fieldset': { borderColor: 'white' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    }}
                />
            </Grid>

            {/* DURATION FIELD */}
            <Grid item xs={12} sm={4}>
                <TextField
                    margin="dense"
                    id="duration"
                    label="Duration"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={duration}
                    onChange={(e) => onDurationChange(Number(e.target.value))}
                    error={!!errors.duration}
                    helperText={errors.duration}
                    disabled={readOnly}
                    InputProps={{
                        endAdornment: <InputAdornment position="end" sx={{ color: 'rgba(255,255,255,0.7)' }}>sec</InputAdornment>,
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                            '&:hover fieldset': { borderColor: 'white' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    }}
                />
            </Grid>
        </Grid>
    );
};
