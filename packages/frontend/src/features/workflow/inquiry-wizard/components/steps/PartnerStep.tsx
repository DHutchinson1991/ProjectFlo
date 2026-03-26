"use client";

import React from "react";
import { TextField } from "@mui/material";
import { fieldSx } from '../constants/wizard-config';
import { NACtx } from '../types';
import { Q } from './QuestionWrapper';
import { Suc } from './SuccessCheck';

export default function PartnerScreen({ ctx }: { ctx: NACtx }) {
    const { eventConfig, responses, handleChange, handleContinue } = ctx;
    return (
        <Q title={eventConfig.partnerLabel} subtitle="So we know who the stars of the show are">
            <TextField value={responses.partner_name || ""} placeholder="Their name"
                onChange={(e) => handleChange("partner_name", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && responses.partner_name && handleContinue()}
                fullWidth sx={fieldSx} autoFocus />
            <Suc show={!!responses.partner_name} />
        </Q>
    );
}
