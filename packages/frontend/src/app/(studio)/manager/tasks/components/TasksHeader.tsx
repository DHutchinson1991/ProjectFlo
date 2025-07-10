"use client";

import React from "react";
import {
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import {
    FilterList as FilterIcon,
    Search as SearchIcon,
} from "@mui/icons-material";

interface TasksHeaderProps {
    onFilter?: () => void;
    onSearch?: () => void;
}

export const TasksHeader: React.FC<TasksHeaderProps> = ({
    onFilter,
    onSearch,
}) => {
    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3
            }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Tasks Library
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage task definitions, effort estimates, and pricing organized by project phases
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <IconButton onClick={onFilter}>
                        <FilterIcon />
                    </IconButton>
                    <IconButton onClick={onSearch}>
                        <SearchIcon />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};
