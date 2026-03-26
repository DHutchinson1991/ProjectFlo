"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { C } from '../constants/wizard-config';
import { chipBounce, selectPulse } from '../constants/animations';
import { NACtx } from '../types';
import { Q } from './QuestionWrapper';

export default function BudgetScreen({ ctx }: { ctx: NACtx }) {
    const { responses, singleSelect, budgetLabels } = ctx;

    return (
        <Q title="What's your investment range?" subtitle="This helps us recommend the right package">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%", maxWidth: 420, mx: "auto" }}>
                {budgetLabels.map((label, i) => {
                    const sel = responses.budget_range === label;
                    const pct = Math.min(30 + (i / (budgetLabels.length - 1)) * 70, 100);
                    return (
                        <Box key={label} onClick={() => singleSelect("budget_range", label)}
                            sx={{
                                position: "relative", px: 2.5, py: 1.5, borderRadius: "12px",
                                cursor: "pointer", userSelect: "none", overflow: "hidden",
                                border: `1.5px solid ${sel ? C.accent : C.border}`,
                                bgcolor: sel ? alpha(C.accent, 0.12) : alpha(C.card, 0.4),
                                transition: "all 0.2s ease",
                                animation: sel ? `${chipBounce} 0.25s ease-out, ${selectPulse} 0.6s ease-out` : "none",
                                "&:hover": { borderColor: alpha(C.accent, 0.45), bgcolor: alpha(C.accent, 0.06) },
                            }}>
                            {/* Background fill bar */}
                            <Box sx={{
                                position: "absolute", top: 0, left: 0, bottom: 0,
                                width: `${pct}%`, borderRadius: "12px",
                                bgcolor: sel ? alpha(C.accent, 0.10) : alpha(C.text, 0.02),
                                transition: "all 0.3s ease",
                            }} />
                            <Typography sx={{
                                position: "relative", zIndex: 1,
                                fontSize: "0.88rem", fontWeight: sel ? 600 : 400,
                                color: sel ? C.text : alpha(C.text, 0.8),
                            }}>{label}</Typography>
                        </Box>
                    );
                })}
            </Box>
        </Q>
    );
}
