"use client";

import React from "react";
import { Box, Stack, TextField } from "@mui/material";
import { fieldSx } from '../../constants/wizard-config';
import { NACtx } from '../../types';
import { Q } from '../QuestionWrapper';
import { Suc } from '../SuccessCheck';

export default function PartnerScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, handleContinue } = ctx;

    const partnerRole = (responses.partner_role as string) || "partner";
    const label = partnerRole === "bride" ? "Bride" : partnerRole === "groom" ? "Groom" : "Partner";

    return (
        <Q title={`What's your ${label.toLowerCase()}'s name?`} subtitle="So we know who the stars of the show are">
            <Stack spacing={2} sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                        value={responses.partner_first_name || ""}
                        placeholder="First name *"
                        onChange={(e) => handleChange("partner_first_name", e.target.value)}
                        fullWidth sx={fieldSx} autoFocus
                    />
                    <TextField
                        value={responses.partner_last_name || ""}
                        placeholder="Last name"
                        onChange={(e) => handleChange("partner_last_name", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && responses.partner_first_name && handleContinue()}
                        fullWidth sx={fieldSx}
                    />
                </Box>
                <Suc show={!!responses.partner_first_name} />
            </Stack>
        </Q>
    );
}
