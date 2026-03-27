"use client";

import React from "react";
import { Box, TextField } from "@mui/material";
import { LEAD_SOURCES, fieldSx } from '../../constants/wizard-config';
import { fadeInUp } from '../../constants/animations';
import { NACtx } from '../../types';
import { Q } from '../QuestionWrapper';
import { Chp } from '../SelectionChip';

export default function SourceScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, handleContinue } = ctx;
    const needsDetail = ["Referral", "Other"].includes(responses.lead_source);

    return (
        <Q title="How did you find us?">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                {LEAD_SOURCES.map((src) => (
                    <Chp
                        key={src}
                        label={src}
                        selected={responses.lead_source === src}
                        onClick={() => {
                            handleChange("lead_source", src);

                        }}
                    />
                ))}
            </Box>
            {needsDetail && (
                <Box sx={{ mt: 2.5, animation: `${fadeInUp} 0.3s ease-out both` }}>
                    <TextField
                        value={responses.lead_source_details || ""}
                        placeholder={responses.lead_source === "Referral" ? "Who referred you?" : "Tell us more…"}
                        onChange={(e) => handleChange("lead_source_details", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                        fullWidth sx={fieldSx} autoFocus
                    />
                </Box>
            )}
        </Q>
    );
}
