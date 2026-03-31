"use client";

import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function SectionDivider({ color }: { color: string }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3, gap: 2 }}>
            <Box sx={{ width: 28, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(color, 0.3)})`, borderRadius: 1 }} />
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: alpha(color, 0.15), border: `1px solid ${alpha(color, 0.1)}` }} />
            <Box sx={{ width: 28, height: 1, background: `linear-gradient(90deg, ${alpha(color, 0.3)}, transparent)`, borderRadius: 1 }} />
        </Box>
    );
}
