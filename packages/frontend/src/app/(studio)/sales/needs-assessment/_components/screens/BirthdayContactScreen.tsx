"use client";

import React from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { C, fieldSx, BIRTHDAY_RELATIONS } from "../../constants";
import { fadeInUp } from "../../animations";
import { NACtx } from "../../types";
import { Q, Chp } from "../Shared";

export default function BirthdayContactScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange } = ctx;
    return (
        <Q title="Tell us about yourself">
            <Stack spacing={3} sx={{ width: "100%" }}>
                <Box>
                    <Typography sx={{ color: alpha(C.text, 0.9), fontSize: "0.95rem", fontWeight: 500, mb: 2, textAlign: "center" }}>
                        Are you the birthday star?
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                        <Chp label="Yes, it's my birthday!" emoji="🎉"
                            selected={responses.is_birthday_person === "yes"}
                            onClick={() => handleChange("is_birthday_person", "yes")} wide />
                        <Chp label="No, I'm booking for someone" emoji="🎁"
                            selected={responses.is_birthday_person === "no"}
                            onClick={() => handleChange("is_birthday_person", "no")} wide />
                    </Box>
                </Box>

                {responses.is_birthday_person === "no" && (
                    <Box sx={{ animation: `${fadeInUp} 0.3s ease-out both` }}>
                        <TextField label="Birthday person's name" value={responses.birthday_person_name || ""}
                            onChange={(e) => handleChange("birthday_person_name", e.target.value)}
                            fullWidth sx={{ ...fieldSx, mb: 2 }} />
                        <Typography sx={{ color: C.muted, fontSize: "0.82rem", mb: 1.5 }}>Your relation to them</Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                            {BIRTHDAY_RELATIONS.map((rel) => (
                                <Chp key={rel} label={rel}
                                    selected={responses.birthday_relation === rel}
                                    onClick={() => handleChange("birthday_relation", rel)} />
                            ))}
                        </Box>
                    </Box>
                )}
            </Stack>
        </Q>
    );
}
