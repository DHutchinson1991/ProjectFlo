"use client";

import React from "react";
import {
    Box,
    Typography,
    ListItem,
    ListItemText,
    Switch,
} from "@mui/material";

// ---------------------------------------------------------------------------
// TabPanel wrapper
// ---------------------------------------------------------------------------

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export function TabPanel({ children, value, index }: TabPanelProps) {
    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            sx={{ flexGrow: 1, minWidth: 0 }}
        >
            {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Section header helper
// ---------------------------------------------------------------------------

export function SectionHeader({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
            </Typography>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Placeholder row for future settings toggles / inputs
// ---------------------------------------------------------------------------

export function PlaceholderRow({
    label,
    description,
    hasToggle = false,
}: {
    label: string;
    description: string;
    hasToggle?: boolean;
}) {
    return (
        <ListItem
            sx={{
                px: 0,
                py: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
            }}
        >
            <ListItemText
                primary={label}
                secondary={description}
                primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9rem" }}
                secondaryTypographyProps={{ fontSize: "0.8rem", mt: 0.25 }}
            />
            {hasToggle && <Switch disabled />}
        </ListItem>
    );
}
