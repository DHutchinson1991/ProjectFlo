"use client";

import React from "react";
import { Box } from "@mui/material";
import { NACtx } from '../../types';
import { Q } from '../QuestionWrapper';
import { Chp } from '../SelectionChip';

export default function PartnerRoleScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, autoAdvance } = ctx;
    const partnerRole = (responses.partner_role as string) || "";
    const contactRole = (responses.contact_role as string) || "";

    const selectPartnerRole = (value: string) => {
        handleChange("partner_role", value);
        // Derive couple_type
        const roles = [contactRole, value].sort();
        const coupleType = `${roles[0]}_${roles[1]}`;
        handleChange("couple_type", coupleType);
        autoAdvance();
    };

    return (
        <Q title="And your partner is the..." subtitle="This helps us personalise everything for your big day">
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                <Chp label="Bride" emoji="👰" selected={partnerRole === "bride"} onClick={() => selectPartnerRole("bride")} wide />
                <Chp label="Groom" emoji="🤵" selected={partnerRole === "groom"} onClick={() => selectPartnerRole("groom")} wide />
            </Box>
        </Q>
    );
}
