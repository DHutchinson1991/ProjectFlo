"use client";

import React from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { C, fieldSx } from '../../constants/wizard-config';
import { fadeInUp } from '../../constants/animations';
import { NACtx } from '../../types';
import { Q } from '../QuestionWrapper';
import { Chp } from '../SelectionChip';
import { Suc } from '../SuccessCheck';

type CoupleType = "bride_groom" | "bride_bride" | "groom_groom";

const COUPLE_OPTIONS: { key: CoupleType; label: string; emoji: string }[] = [
    { key: "bride_groom", label: "Bride & Groom", emoji: "👰🤵" },
    { key: "bride_bride", label: "Bride & Bride", emoji: "👰👰" },
    { key: "groom_groom", label: "Groom & Groom", emoji: "🤵🤵" },
];

function nameLabels(coupleType: CoupleType): { person1: string; person2: string } {
    switch (coupleType) {
        case "bride_groom": return { person1: "Bride", person2: "Groom" };
        case "bride_bride": return { person1: "Bride 1", person2: "Bride 2" };
        case "groom_groom": return { person1: "Groom 1", person2: "Groom 2" };
    }
}

function person1Keys(coupleType: CoupleType): { first: string; last: string } {
    if (coupleType === "groom_groom") return { first: "groom_first_name", last: "groom_last_name" };
    return { first: "bride_first_name", last: "bride_last_name" };
}

function person2Keys(coupleType: CoupleType): { first: string; last: string } {
    switch (coupleType) {
        case "bride_groom": return { first: "groom_first_name", last: "groom_last_name" };
        case "bride_bride": return { first: "bride2_first_name", last: "bride2_last_name" };
        case "groom_groom": return { first: "groom2_first_name", last: "groom2_last_name" };
    }
}

export default function BrideGroomNamesScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, handleContinue } = ctx;
    const coupleType = (responses.couple_type as CoupleType) || "";

    const selectCoupleType = (value: CoupleType) => {
        handleChange("couple_type", value);
    };

    const labels = coupleType ? nameLabels(coupleType) : null;
    const p1 = coupleType ? person1Keys(coupleType) : null;
    const p2 = coupleType ? person2Keys(coupleType) : null;

    const hasNames = !!(p1 && p2 && responses[p1.first] && responses[p2.first]);

    return (
        <Q title="Tell us about the happy couple" subtitle="So we can personalise their experience">
            <Stack spacing={3} sx={{ width: "100%" }}>
                <Box>
                    <Typography sx={{ color: alpha(C.text, 0.9), fontSize: "0.95rem", fontWeight: 500, mb: 2, textAlign: "center" }}>
                        Who&apos;s getting married?
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                        {COUPLE_OPTIONS.map((opt) => (
                            <Chp key={opt.key} label={opt.label} emoji={opt.emoji}
                                selected={coupleType === opt.key}
                                onClick={() => selectCoupleType(opt.key)} wide />
                        ))}
                    </Box>
                </Box>

                {labels && p1 && p2 && (
                    <Box sx={{ animation: `${fadeInUp} 0.3s ease-out both` }}>
                        <Typography sx={{ color: C.muted, fontSize: "0.85rem", mb: 1.5, textAlign: "center" }}>
                            {labels.person1}&apos;s name
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                            <TextField
                                value={responses[p1.first] || ""}
                                placeholder="First name *"
                                onChange={(e) => handleChange(p1.first, e.target.value)}
                                fullWidth sx={fieldSx} autoFocus
                            />
                            <TextField
                                value={responses[p1.last] || ""}
                                placeholder="Last name"
                                onChange={(e) => handleChange(p1.last, e.target.value)}
                                fullWidth sx={fieldSx}
                            />
                        </Box>

                        <Typography sx={{ color: C.muted, fontSize: "0.85rem", mb: 1.5, textAlign: "center" }}>
                            {labels.person2}&apos;s name
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                value={responses[p2.first] || ""}
                                placeholder="First name *"
                                onChange={(e) => handleChange(p2.first, e.target.value)}
                                fullWidth sx={fieldSx}
                            />
                            <TextField
                                value={responses[p2.last] || ""}
                                placeholder="Last name"
                                onChange={(e) => handleChange(p2.last, e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && hasNames && handleContinue()}
                                fullWidth sx={fieldSx}
                            />
                        </Box>
                        <Suc show={hasNames} />
                    </Box>
                )}
            </Stack>
        </Q>
    );
}
