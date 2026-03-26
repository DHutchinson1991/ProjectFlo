"use client";

import React from "react";
import { Box, TextField, Stack } from "@mui/material";
import { fieldSx } from '../constants/wizard-config';
import { NACtx } from '../types';
import { Q } from './QuestionWrapper';
import { Suc } from './SuccessCheck';

export default function ContactScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, handleContinue } = ctx;

    return (
        <Q title="Last thing — where should we send your personalized recommendation?" subtitle="We'll never share your details with anyone">
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
                        fullWidth sx={fieldSx}
                    />
                </Box>
                <TextField
                    value={responses.contact_email || ""}
                    placeholder="Email address *"
                    type="email"
                    onChange={(e) => handleChange("contact_email", e.target.value)}
                    fullWidth sx={fieldSx}
                />
                <TextField
                    value={responses.contact_phone || ""}
                    placeholder="Phone number (optional)"
                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                    fullWidth sx={fieldSx}
                />
                <Suc show={!!responses.contact_first_name && !!responses.contact_email} />
            </Stack>
        </Q>
    );
}
