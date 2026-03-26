"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { C } from '../constants/wizard-config';
import { fadeInUp } from '../constants/animations';

export const Q = ({
    title, subtitle, children,
}: {
    title: string; subtitle?: string; children: React.ReactNode;
}) => (
    <Box sx={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        py: { xs: 4, md: 6 }, maxWidth: 560, mx: "auto", width: "100%",
    }}>
        <Box sx={{ textAlign: "center" }}>
            <Typography sx={{
                fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 200, color: C.text,
                letterSpacing: "-0.02em", lineHeight: 1.15,
            }}>{title}</Typography>
            {subtitle && (
                <Typography sx={{ color: C.muted, fontSize: "0.92rem", mt: 1.5, maxWidth: 440, mx: "auto", lineHeight: 1.6 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
        <Box sx={{ width: "100%", animation: `${fadeInUp} 0.35s ease-out 0.15s both` }}>
            {children}
        </Box>
    </Box>
);
