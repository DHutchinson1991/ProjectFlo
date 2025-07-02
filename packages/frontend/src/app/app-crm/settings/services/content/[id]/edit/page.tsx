"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function ContentEditPage() {
    const params = useParams();
    const router = useRouter();
    const [loading] = useState(true);

    const contentId = params.id as string;

    useEffect(() => {
        // For now, redirect to the main content page since we have inline editing
        router.push(`/app-crm/settings/services/content/${contentId}`);
    }, [contentId, router]);

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="200px"
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6">Redirecting to content page...</Typography>
        </Box>
    );
}
