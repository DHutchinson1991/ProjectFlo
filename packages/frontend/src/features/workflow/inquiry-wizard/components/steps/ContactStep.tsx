"use client";

import React from "react";
import { Stack, TextField } from "@mui/material";
import { fieldSx } from '../../constants/wizard-config';
import { NACtx } from '../../types';
import { Q } from '../QuestionWrapper';
import { Suc } from '../SuccessCheck';

export default function ContactScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, handleContinue } = ctx;
    const firstName = (responses.contact_first_name as string) || "";
    const greeting = firstName ? `Hi ${firstName}! Where should we send your recommendation?` : "Where should we send your personalized recommendation?";

    return (
        <Q title={greeting} subtitle="We'll never share your details with anyone">
            <Stack spacing={2} sx={{ width: "100%" }}>
                <TextField
                    value={responses.contact_email || ""}
                    placeholder="Email address *"
                    type="email"
                    onChange={(e) => handleChange("contact_email", e.target.value)}
                    fullWidth sx={fieldSx} autoFocus
                />
                <TextField
                    value={responses.contact_phone || ""}
                    placeholder="Phone number *"
                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                    fullWidth sx={fieldSx}
                />
                <Suc show={!!(responses.contact_email && responses.contact_phone)} />
            </Stack>
        </Q>
    );
}
