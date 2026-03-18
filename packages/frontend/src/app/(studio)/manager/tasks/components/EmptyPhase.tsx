"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Assignment as TaskIcon } from "@mui/icons-material";

export function EmptyPhase() {
    return (
        <Box
            sx={{
                textAlign: 'center',
                py: 6,
                color: 'text.secondary',
                backgroundColor: 'background.default',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider'
            }}
        >
            <TaskIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" sx={{ mb: 1 }} color="text.secondary">
                No tasks defined for this phase
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Create your first task to get started
            </Typography>
        </Box>
    );
}
