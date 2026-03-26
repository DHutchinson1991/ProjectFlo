"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Check as CheckIcon } from "@mui/icons-material";
import { C } from '../constants/wizard-config';
import type { EventDayActivity } from "@/features/catalog/event-types/types";

interface Props {
    presets: EventDayActivity[];
    selectedIds: number[];
    toggleActivity: (id: number) => void;
}

export function BuilderActivityStep({ presets, selectedIds, toggleActivity }: Props) {
    if (presets.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 5 }}>
                <Typography sx={{ color: C.muted, fontSize: "0.9rem" }}>
                    No activity presets found for this event type.
                </Typography>
                <Typography sx={{ color: alpha(C.muted, 0.6), fontSize: "0.75rem", mt: 1 }}>
                    You can still continue and we'll customise your package.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ position: "relative", pl: { xs: 3, sm: 4 } }}>
                <Box sx={{
                    position: "absolute", left: { xs: 10, sm: 14 }, top: 8, bottom: 8,
                    width: 2, bgcolor: alpha(C.border, 0.35),
                    "&::before": { content: '""', position: "absolute", top: 0, left: -3, width: 8, height: 8, borderRadius: "50%", bgcolor: alpha(C.accent, 0.4) },
                    "&::after": { content: '""', position: "absolute", bottom: 0, left: -3, width: 8, height: 8, borderRadius: "50%", bgcolor: alpha(C.accent, 0.4) },
                }} />
                {presets.map((p: EventDayActivity, i: number) => {
                    const on = selectedIds.includes(p.id);
                    const col = p.color || C.accent;
                    return (
                        <Box key={p.id} onClick={() => toggleActivity(p.id)} sx={{
                            position: "relative", mb: i < presets.length - 1 ? 0.5 : 0,
                            cursor: "pointer", display: "flex", alignItems: "stretch",
                            transition: "all 0.2s",
                            "&:hover .timeline-card": { borderColor: alpha(col, 0.5), transform: "translateX(4px)" },
                        }}>
                            <Box sx={{
                                position: "absolute", left: { xs: -19, sm: -22 }, top: "50%", transform: "translateY(-50%)",
                                width: on ? 14 : 10, height: on ? 14 : 10, borderRadius: "50%",
                                bgcolor: on ? col : "transparent",
                                border: `2px solid ${on ? col : alpha(C.border, 0.5)}`,
                                transition: "all 0.25s",
                                boxShadow: on ? `0 0 12px ${alpha(col, 0.5)}` : "none",
                                zIndex: 2,
                            }} />
                            <Box className="timeline-card" sx={{
                                flex: 1, p: "12px 14px", ml: 1, borderRadius: 2.5,
                                border: `1px solid ${on ? alpha(col, 0.5) : alpha(C.border, 0.3)}`,
                                bgcolor: on ? alpha(col, 0.06) : alpha(C.card, 0.4),
                                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                                display: "flex", alignItems: "center", gap: 1,
                            }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography sx={{
                                            color: on ? C.text : alpha(C.text, 0.75),
                                            fontSize: "0.85rem", fontWeight: on ? 600 : 500, lineHeight: 1.2,
                                        }}>{p.name}</Typography>
                                        {on && (
                                            <Box sx={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, bgcolor: alpha(col, 0.15), border: `1.5px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <CheckIcon sx={{ fontSize: 11, color: col }} />
                                            </Box>
                                        )}
                                    </Box>
                                    {p.description && (
                                        <Typography sx={{ color: alpha(C.muted, on ? 0.8 : 0.55), fontSize: "0.66rem", mt: 0.2, lineHeight: 1.3 }}>{p.description}</Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
