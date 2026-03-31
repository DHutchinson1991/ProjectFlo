"use client";

import React from "react";
import { Box } from "@mui/material";
import { useReveal, revealSx } from "@/features/workflow/proposals/utils/portal/animations";

export default function RevealBox({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, visible } = useReveal();
    return (
        <Box ref={ref} sx={revealSx(visible, delay)}>
            {children}
        </Box>
    );
}
