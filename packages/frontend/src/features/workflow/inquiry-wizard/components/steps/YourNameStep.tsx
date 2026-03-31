"use client";

import React from "react";
import { Box, Stack, TextField } from "@mui/material";
import { fieldSx } from '../../constants/wizard-config';
import { NACtx } from '../../types';
import { Q } from '../QuestionWrapper';
import { Suc } from '../SuccessCheck';

export default function YourNameScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, handleContinue } = ctx;

    return (
        <Q title="First, what's your name?" subtitle="So we know who we're speaking with">
            <Stack spacing={2} sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                        value={responses.contact_first_name || ""}
                        placeholder="First name *"
                        onChange={(e) => handleChange("contact_first_name", e.target.value)}
                        fullWidth sx={fieldSx} autoFocus
                    />
                    <TextField
                        value={responses.contact_last_name || ""}
                        placeholder="Last name"
                        onChange={(e) => handleChange("contact_last_name", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && responses.contact_first_name && handleContinue()}
                        fullWidth sx={fieldSx}
                    />
                </Box>
                <Suc show={!!responses.contact_first_name} />
            </Stack>
        </Q>
    );
}
