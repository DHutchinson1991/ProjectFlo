"use client";

import React from "react";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

interface FilmEditorShellProps {
    loading: boolean;
    error: string | null;
    /** Whether film data failed to load (in addition to error being set) */
    filmReady: boolean;
    onBack: () => void;
    backLabel?: string;
    /** Optional alert banner rendered above the ContentBuilder (e.g. package link) */
    packageAlert?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Shared shell for library and instance film editor screens.
 * Handles loading/error states and outer layout so each editor
 * screen only needs to supply its data-loading logic and children.
 */
export function FilmEditorShell({
    loading,
    error,
    filmReady,
    onBack,
    backLabel = "Back",
    packageAlert,
    children,
}: FilmEditorShellProps) {
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !filmReady) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || "Film not found"}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                    sx={{ mt: 2 }}
                >
                    {backLabel}
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <Box sx={{ flex: 1, overflow: "visible", p: 0 }}>
                    {packageAlert}
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
