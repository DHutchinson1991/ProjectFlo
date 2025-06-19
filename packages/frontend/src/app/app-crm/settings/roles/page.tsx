'use client';

import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function RolesSettingsPage() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Roles Settings
            </Typography>
            <Typography variant="body1">
                Manage user roles and permissions here.
            </Typography>
            {/* TODO: Implement roles management */}
        </Box>
    );
}
