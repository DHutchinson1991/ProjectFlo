"use client";

import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface TasksSnackbarProps {
    open: boolean;
    message: string;
    severity: "success" | "error";
    onClose: () => void;
}

export function TasksSnackbar({ open, message, severity, onClose }: TasksSnackbarProps) {
    return (
        <Snackbar
            open={open}
            autoHideDuration={6000}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                sx={{ width: "100%" }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}
