"use client";

import React from "react";
import { IconButton } from "@mui/material";
import { Close as CancelIcon } from "@mui/icons-material";

interface EquipmentTableRowActionsProps {
    isEditing: boolean;
    onCancelEdit: () => void;
}

export function EquipmentTableRowActions({
    isEditing,
    onCancelEdit,
}: EquipmentTableRowActionsProps) {
    if (!isEditing) return null;
    return (
        <IconButton size="small" onClick={onCancelEdit} title="Discard changes" sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "error.main" } }}>
            <CancelIcon sx={{ fontSize: 16 }} />
        </IconButton>
    );
}
