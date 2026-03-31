"use client";

import React from "react";
import { Box, MenuItem, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { C, fieldSx, OTHER_ROLES } from '../../constants/wizard-config';
import { fadeInUp } from '../../constants/animations';
import { NACtx } from '../../types';
import { Q } from '../QuestionWrapper';
import { Chp } from '../SelectionChip';

export default function YourRoleScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, autoAdvance } = ctx;
    const role = (responses.contact_role as string) || "";

    const selectRole = (value: string) => {
        handleChange("contact_role", value);
        if (value !== "other") {
            handleChange("contact_role_custom", "");
            autoAdvance();
        }
    };

    return (
        <Q
            title={`Nice to meet you, ${responses.contact_first_name || ""}!`}
            subtitle="Are you the..."
        >
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                <Chp label="Bride" emoji="👰" selected={role === "bride"} onClick={() => selectRole("bride")} wide />
                <Chp label="Groom" emoji="🤵" selected={role === "groom"} onClick={() => selectRole("groom")} wide />
                <Chp label="Other" emoji="💜" selected={role === "other"} onClick={() => selectRole("other")} wide />
            </Box>

            {role === "other" && (
                <Box sx={{ mt: 3, animation: `${fadeInUp} 0.3s ease-out both` }}>
                    <Typography sx={{ color: C.muted, fontSize: "0.85rem", mb: 1.5, textAlign: "center" }}>
                        What&apos;s your role?
                    </Typography>
                    <TextField
                        select
                        value={responses.contact_role_custom || ""}
                        onChange={(e) => handleChange("contact_role_custom", e.target.value)}
                        fullWidth
                        sx={{
                            ...fieldSx,
                            "& .MuiSelect-select": { color: C.text },
                        }}
                        SelectProps={{
                            MenuProps: {
                                PaperProps: {
                                    sx: {
                                        bgcolor: C.card,
                                        border: `1px solid ${alpha(C.border, 0.6)}`,
                                        "& .MuiMenuItem-root": { color: C.text, "&:hover": { bgcolor: alpha(C.accent, 0.1) } },
                                    },
                                },
                            },
                        }}
                    >
                        {OTHER_ROLES.map((r) => (
                            <MenuItem key={r} value={r}>{r}</MenuItem>
                        ))}
                    </TextField>
                </Box>
            )}
        </Q>
    );
}
