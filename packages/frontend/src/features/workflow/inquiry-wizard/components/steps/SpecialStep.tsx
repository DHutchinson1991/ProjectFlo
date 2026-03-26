"use client";

import React from "react";
import { Box, TextField } from "@mui/material";
import { fieldSx } from '../constants/wizard-config';
import { NACtx } from '../types';
import { Q } from './QuestionWrapper';

export default function SpecialScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange } = ctx;
    return (
        <Q title="Anything else we should know?" subtitle="Special songs, specific moments, surprises — anything goes">
            <TextField
                value={responses.special_requests || ""}
                multiline rows={4}
                placeholder="Share your ideas here…"
                onChange={(e) => handleChange("special_requests", e.target.value)}
                fullWidth sx={fieldSx}
            />
        </Q>
    );
}
