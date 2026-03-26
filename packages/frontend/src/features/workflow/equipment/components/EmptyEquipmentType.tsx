"use client";

import React from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
} from "@mui/material";
import {
    Add as AddIcon,
} from "@mui/icons-material";

interface EmptyEquipmentTypeProps {
    type: string;
    onAddClick: () => void;
}

export function EmptyEquipmentType({
    type,
    onAddClick,
}: EmptyEquipmentTypeProps) {
    return (
        <Paper
            sx={{
                p: 4,
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: 2,
                m: 2,
            }}
        >
            <Typography variant="h6" color="text.secondary" gutterBottom>
                No {type} Equipment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by adding your first {type.toLowerCase()} equipment item.
            </Typography>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddClick}
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                }}
            >
                Add {type} Equipment
            </Button>
        </Paper>
    );
}
