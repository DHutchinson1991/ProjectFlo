"use client";

import React from "react";
import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Check as CheckIcon,
    PhoneInTalk as PhoneInTalkIcon,
    Videocam as VideocamIcon,
    AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { format as fnsFormat, parseISO } from "date-fns";
import { C } from "../../constants";
import { chipBounce, fadeInUp } from "../../animations";
import { NACtx } from "../../types";
import { Q, DateCal } from "../Shared";

export default function CallDetailsScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, callSlots, callSlotsLoading, callSlotsDuration, fetchCallSlots } = ctx;
    const selectedDate = responses.discovery_call_date || "";
    const selectedTime = responses.discovery_call_time || "";
    const availableSlots = callSlots.filter((s) => s.available);
    const hasSlots = availableSlots.length > 0;

    const handleDatePick = (date: string) => {
        handleChange("discovery_call_date", date);
        handleChange("discovery_call_time", "");
        fetchCallSlots(date);
    };

    const formatSlotLabel = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        const suffix = h >= 12 ? "pm" : "am";
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
    };

    return (
        <Q title="Pick a time for your call">
            <Stack spacing={3.5} sx={{ width: "100%" }}>
                {/* Method */}
                <Box>
                    <Typography sx={{ color: C.muted, fontSize: "0.76rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1.5, textAlign: "center" }}>
                        How would you like to connect?
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                        {[
                            { key: "Phone Call", icon: <PhoneInTalkIcon sx={{ fontSize: 20 }} /> },
                            { key: "Video Call", icon: <VideocamIcon sx={{ fontSize: 20 }} /> },
                        ].map((m) => {
                            const active = responses.discovery_call_method === m.key;
                            return (
                                <Box key={m.key} onClick={() => handleChange("discovery_call_method", m.key)} sx={{
                                    display: "flex", alignItems: "center", gap: 1.2,
                                    px: 3, py: 1.5, borderRadius: "14px", cursor: "pointer",
                                    border: `1.5px solid ${active ? C.accent : C.border}`,
                                    bgcolor: active ? alpha(C.accent, 0.12) : alpha(C.card, 0.5),
                                    transition: "all 0.2s ease",
                                    animation: active ? `${chipBounce} 0.25s ease-out` : "none",
                                    "&:hover": { borderColor: alpha(C.accent, 0.5) },
                                }}>
                                    <Box sx={{ color: active ? C.accent : C.muted, display: "flex" }}>{m.icon}</Box>
                                    <Typography sx={{ color: active ? C.text : alpha(C.text, 0.85), fontSize: "0.88rem", fontWeight: active ? 600 : 400 }}>{m.key}</Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* Date picker */}
                <Box>
                    <Typography sx={{ color: C.muted, fontSize: "0.76rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1.5, textAlign: "center" }}>
                        Choose a date
                    </Typography>
                    <DateCal value={selectedDate} onChange={handleDatePick} minDate={new Date()} />
                </Box>

                {/* Time slots */}
                {selectedDate && (
                    <Box sx={{ animation: `${fadeInUp} 0.3s ease-out both` }}>
                        <Typography sx={{ color: C.muted, fontSize: "0.76rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1.5, textAlign: "center" }}>
                            Available times
                            {callSlotsDuration > 0 && (
                                <Typography component="span" sx={{ color: alpha(C.muted, 0.6), fontSize: "0.68rem", fontWeight: 400, ml: 1, letterSpacing: 0, textTransform: "none" }}>
                                    ({callSlotsDuration} min each)
                                </Typography>
                            )}
                        </Typography>

                        {callSlotsLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress size={24} sx={{ color: C.accent }} />
                            </Box>
                        ) : !hasSlots ? (
                            <Box sx={{ textAlign: "center", py: 3 }}>
                                <Typography sx={{ color: alpha(C.text, 0.5), fontSize: "0.84rem" }}>
                                    No slots available on this date — try another day.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1, maxWidth: 420, mx: "auto" }}>
                                {callSlots.map((slot) => {
                                    const active = selectedTime === slot.time;
                                    return (
                                        <Box key={slot.time}
                                            onClick={() => slot.available && handleChange("discovery_call_time", slot.time)}
                                            sx={{
                                                py: 1.3, px: 1, borderRadius: "12px", textAlign: "center",
                                                cursor: slot.available ? "pointer" : "default",
                                                userSelect: "none",
                                                border: `1.5px solid ${active ? C.accent : slot.available ? alpha(C.border, 0.8) : alpha(C.border, 0.25)}`,
                                                bgcolor: active ? alpha(C.accent, 0.14) : slot.available ? alpha(C.card, 0.5) : alpha(C.card, 0.2),
                                                opacity: slot.available ? 1 : 0.35,
                                                transition: "all 0.2s ease",
                                                animation: active ? `${chipBounce} 0.25s ease-out` : "none",
                                                "&:hover": slot.available ? { borderColor: alpha(C.accent, 0.5), bgcolor: alpha(C.accent, 0.06) } : {},
                                            }}>
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 13, color: active ? C.accent : C.muted, transition: "color 0.2s" }} />
                                                <Typography sx={{
                                                    fontSize: "0.8rem", fontWeight: active ? 700 : 500,
                                                    color: active ? C.accent : slot.available ? C.text : C.muted,
                                                    transition: "color 0.2s",
                                                }}>
                                                    {formatSlotLabel(slot.time)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Confirmation badge */}
                {selectedDate && selectedTime && responses.discovery_call_method && (
                    <Box sx={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5,
                        py: 1.5, px: 3, borderRadius: "16px", mx: "auto",
                        bgcolor: alpha(C.success, 0.08), border: `1px solid ${alpha(C.success, 0.2)}`,
                        animation: `${fadeInUp} 0.3s ease-out both`,
                    }}>
                        <CheckIcon sx={{ fontSize: 18, color: C.success }} />
                        <Typography sx={{ color: C.text, fontSize: "0.82rem", fontWeight: 500 }}>
                            {`${responses.discovery_call_method} · ${fnsFormat(parseISO(selectedDate), "EEE, d MMM")} · ${formatSlotLabel(selectedTime)}`}
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Q>
    );
}
