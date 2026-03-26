"use client";

import React from "react";
import { Box, IconButton } from "@mui/material";
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";

interface EquipmentTableRowActionsProps {
    isEditing: boolean;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
}

export function EquipmentTableRowActions({
    isEditing,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
}: EquipmentTableRowActionsProps) {
    return (
        <Box display="flex" gap={1} justifyContent="center">
            {isEditing ? (
                <>
                    <IconButton size="small" onClick={onSaveEdit} color="primary" title="Save changes">
                        <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={onCancelEdit} color="secondary" title="Cancel editing">
                        <CancelIcon fontSize="small" />
                    </IconButton>
                </>
            ) : (
                <>
                    <IconButton size="small" onClick={onStartEdit} color="secondary" title="Edit equipment">
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={onDelete} color="error" title="Delete equipment">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </>
            )}
        </Box>
    );
}
