"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { C } from '../constants/wizard-config';
import { chipBounce, selectPulse } from '../constants/animations';

export const Chp = ({
    label, desc, emoji, selected, onClick, wide,
}: {
    label: string; desc?: string; emoji?: string;
    selected: boolean; onClick: () => void; wide?: boolean;
}) => (
    <Box onClick={onClick} sx={{
        px: wide ? 3 : 2, py: wide ? 2 : 1.5, borderRadius: "14px", cursor: "pointer",
        textAlign: "center", minWidth: wide ? 120 : 0, userSelect: "none",
        border: `1.5px solid ${selected ? C.accent : C.border}`,
        bgcolor: selected ? alpha(C.accent, 0.12) : alpha(C.card, 0.5),
        animation: selected ? `${chipBounce} 0.25s ease-out, ${selectPulse} 0.6s ease-out` : "none",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.3s ease",
        "&:hover": { borderColor: alpha(C.accent, 0.5), bgcolor: alpha(C.accent, 0.06) },
    }}>
        {emoji && <Typography sx={{ fontSize: wide ? "1.8rem" : "1.3rem", mb: 0.5, lineHeight: 1 }}>{emoji}</Typography>}
        <Typography sx={{
            color: selected ? C.text : alpha(C.text, 0.85),
            fontSize: wide ? "0.9rem" : "0.82rem",
            fontWeight: selected ? 600 : 400,
        }}>{label}</Typography>
        {desc && <Typography sx={{ color: C.muted, fontSize: "0.68rem", mt: 0.2 }}>{desc}</Typography>}
    </Box>
);
