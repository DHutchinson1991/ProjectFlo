"use client";

import React from "react";
import {
    Snackbar,
    Alert,
} from "@mui/material";

interface EquipmentSnackbarProps {
    open: boolean;
    message: string;
    severity: "success" | "error";
    onClose: () => void;
}

export function EquipmentSnackbar({
    open,
    message,
    severity,
    onClose,
}: EquipmentSnackbarProps) {
    return (
        <Snackbar
            open={open}
            autoHideDuration={6000}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
}
