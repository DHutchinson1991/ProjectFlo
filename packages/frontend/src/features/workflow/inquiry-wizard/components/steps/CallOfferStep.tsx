"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Check as CheckIcon,
    PhoneInTalk as PhoneInTalkIcon,
    Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { C, glassSx } from '../../constants/wizard-config';
import { fadeInUp, checkPop, selectPulse, pulseRing } from '../../constants/animations';
import { NACtx } from '../../types';
import { Q } from '../QuestionWrapper';

export default function CallOfferScreen({ ctx }: { ctx: NACtx }) {
    const { responses, singleSelect, callSlotsDuration } = ctx;
    const sel = responses.discovery_call_interest;

    return (
        <Q title="Let's bring your vision to life">
            {/* Hero icon with pulse rings */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3, animation: `${fadeInUp} 0.5s ease-out both` }}>
                <Box sx={{ position: "relative", width: 80, height: 80 }}>
                    {[0, 1, 2].map((i) => (
                        <Box key={i} sx={{
                            position: "absolute", inset: -8 - i * 10, borderRadius: "50%",
                            border: `1.5px solid ${alpha(C.accent, 0.25 - i * 0.07)}`,
                            animation: `${pulseRing} 2.5s ease-out ${i * 0.5}s infinite`,
                        }} />
                    ))}
                    <Box sx={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 8px 32px ${alpha(C.accent, 0.35)}`,
                    }}>
                        <PhoneInTalkIcon sx={{ fontSize: 36, color: "#fff" }} />
                    </Box>
                </Box>
            </Box>

            {/* Copy */}
            <Box sx={{ maxWidth: 540, mx: "auto", mb: 4, textAlign: "center" }}>
                <Typography sx={{ color: C.text, fontSize: "1rem", fontWeight: 500, lineHeight: 1.7, mb: 1.5 }}>
                    Every unforgettable film starts with a conversation.
                </Typography>
                <Typography sx={{ color: alpha(C.text, 0.6), fontSize: "0.84rem", lineHeight: 1.75 }}>
                    {`In a relaxed ${callSlotsDuration}-minute call we'll explore your story, answer every question, and craft a plan that's uniquely yours — no commitment, no pressure, just clarity.`}
                </Typography>
            </Box>

            {/* Social proof */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3.5, animation: `${fadeInUp} 0.6s 0.15s ease-out both` }}>
                <Box sx={{
                    display: "inline-flex", alignItems: "center", gap: 1, px: 2.5, py: 0.8,
                    borderRadius: "20px", bgcolor: alpha(C.success, 0.08), border: `1px solid ${alpha(C.success, 0.15)}`,
                }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.success, animation: `${pulseRing} 2s ease-out infinite` }} />
                    <Typography sx={{ color: alpha(C.success, 0.9), fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.03em" }}>
                        Most couples book within 48 hours of their call
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5, maxWidth: 580, mx: "auto" }}>
                {/* YES */}
                <Box onClick={() => singleSelect("discovery_call_interest", "yes")} sx={{
                    ...glassSx, p: 0, cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column",
                    borderColor: sel === "yes" ? alpha(C.accent, 0.5) : undefined,
                    bgcolor: sel === "yes" ? alpha(C.accent, 0.06) : undefined,
                    animation: sel === "yes" ? `${selectPulse} 0.6s ease-out` : "none",
                    transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                    "&:hover": { borderColor: alpha(C.accent, 0.35), transform: "translateY(-3px)" },
                }}>
                    <Box sx={{ height: 3, background: sel === "yes" ? `linear-gradient(90deg, ${C.gradient1}, ${C.gradient2})` : alpha(C.border, 0.3) }} />
                    <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 28, color: sel === "yes" ? C.accent : C.muted, mb: 1.5, transition: "color 0.2s" }} />
                        <Typography sx={{ color: C.text, fontSize: "1.05rem", fontWeight: 700, mb: 1 }}>{"Yes — let's talk!"}</Typography>
                        <Typography sx={{ color: alpha(C.text, 0.55), fontSize: "0.78rem", lineHeight: 1.55 }}>
                            Pick a time that works and we'll take it from there. No strings attached.
                        </Typography>
                        {sel === "yes" && <Box sx={{ mt: 2, animation: `${checkPop} 0.3s ease-out both` }}><CheckIcon sx={{ fontSize: 20, color: C.success }} /></Box>}
                    </Box>
                </Box>

                {/* NO */}
                <Box onClick={() => singleSelect("discovery_call_interest", "no")} sx={{
                    ...glassSx, p: 0, cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column",
                    borderColor: sel === "no" ? alpha(C.accent, 0.5) : undefined,
                    bgcolor: sel === "no" ? alpha(C.accent, 0.06) : undefined,
                    animation: sel === "no" ? `${selectPulse} 0.6s ease-out` : "none",
                    transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                    "&:hover": { borderColor: alpha(C.accent, 0.35), transform: "translateY(-3px)" },
                }}>
                    <Box sx={{ height: 3, background: sel === "no" ? `linear-gradient(90deg, ${C.gradient1}, ${C.gradient2})` : alpha(C.border, 0.3) }} />
                    <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1 }}>
                        <Typography sx={{ fontSize: "1.6rem", mb: 1.5, opacity: 0.8 }}>{"✉️"}</Typography>
                        <Typography sx={{ color: C.text, fontSize: "1.05rem", fontWeight: 700, mb: 1 }}>Not right now</Typography>
                        <Typography sx={{ color: alpha(C.text, 0.55), fontSize: "0.78rem", lineHeight: 1.55 }}>
                            {"We'll review your enquiry and send a personalised recommendation by email."}
                        </Typography>
                        {sel === "no" && <Box sx={{ mt: 2, animation: `${checkPop} 0.3s ease-out both` }}><CheckIcon sx={{ fontSize: 20, color: C.success }} /></Box>}
                    </Box>
                </Box>
            </Box>
        </Q>
    );
}
