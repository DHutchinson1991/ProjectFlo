"use client";

import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import {
    format as fnsFormat,
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addMonths, subMonths, eachDayOfInterval, isSameMonth,
    isSameDay, isBefore, isAfter, startOfDay, parseISO,
} from "date-fns";
import { C, DAY_NAMES, MONTH_NAMES } from '../constants/wizard-config';
import { fadeInUp } from '../constants/animations';

const glowPulse = keyframes`
    0%, 100% { box-shadow: 0 0 20px ${alpha("#7c4dff", 0.15)}, 0 0 40px ${alpha("#7c4dff", 0.05)}; }
    50% { box-shadow: 0 0 25px ${alpha("#7c4dff", 0.25)}, 0 0 50px ${alpha("#7c4dff", 0.1)}; }
`;

export const DateCal = ({
    value, onChange: onPick, minDate, maxDate, highlightRange, selectedBelow,
}: {
    value: string; onChange: (v: string) => void; minDate?: Date; maxDate?: Date; highlightRange?: { start: Date; end: Date }; selectedBelow?: boolean;
}) => {
    const selected = value ? parseISO(value) : null;
    const [viewMonth, setViewMonth] = useState(() => selected || new Date());
    const [viewMode, setViewMode] = useState<"days" | "months">("days");

    const monthStart = startOfMonth(viewMonth);
    const monthEnd   = endOfMonth(viewMonth);
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd     = endOfWeek(monthEnd,   { weekStartsOn: 1 });
    const days       = eachDayOfInterval({ start: calStart, end: calEnd });
    const today      = startOfDay(new Date());
    const min        = minDate ? startOfDay(minDate) : today;
    const max        = maxDate ? startOfDay(maxDate) : undefined;
    const hlStart    = highlightRange ? startOfDay(highlightRange.start) : undefined;
    const hlEnd      = highlightRange ? startOfDay(highlightRange.end) : undefined;
    const viewYear   = viewMonth.getFullYear();

    const selectedBadge = selected ? (
        <Box sx={{
            textAlign: "center", py: 1.8, px: 3, borderRadius: "18px",
            bgcolor: alpha(C.accent, 0.08),
            border: `1px solid ${alpha(C.accent, 0.2)}`,
            animation: `${fadeInUp} 0.3s ease-out both, ${glowPulse} 3s ease-in-out infinite 0.3s`,
            ...(selectedBelow ? { mt: 3 } : { mb: 3 }),
        }}>
            <Typography sx={{
                color: C.accent, fontSize: "0.65rem", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", mb: 0.3,
            }}>
                {fnsFormat(selected, "EEEE")}
            </Typography>
            <Typography sx={{ color: C.text, fontSize: "1.35rem", fontWeight: 300, letterSpacing: "-0.01em" }}>
                {fnsFormat(selected, "d MMMM yyyy")}
            </Typography>
        </Box>
    ) : null;

    return (
        <Box sx={{ width: "100%", maxWidth: 380, mx: "auto" }}>
            {!selectedBelow && selectedBadge}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, px: 0.5 }}>
                <IconButton size="small"
                    onClick={() => setViewMonth((m) => viewMode === "months"
                        ? new Date(m.getFullYear() - 1, m.getMonth(), 1)
                        : subMonths(m, 1))}
                    sx={{ color: C.muted, "&:hover": { color: C.text, bgcolor: alpha(C.text, 0.05) } }}>
                    <ArrowBackIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography
                    onClick={() => setViewMode((m) => m === "days" ? "months" : "days")}
                    sx={{
                        color: C.text, fontSize: "0.92rem", fontWeight: 600, letterSpacing: "0.02em",
                        cursor: "pointer", borderRadius: "8px", px: 1.5, py: 0.5,
                        transition: "all 0.15s ease",
                        "&:hover": { bgcolor: alpha(C.accent, 0.1), color: C.accent },
                    }}>
                    {viewMode === "months" ? String(viewYear) : fnsFormat(viewMonth, "MMMM yyyy")}
                </Typography>
                <IconButton size="small"
                    onClick={() => setViewMonth((m) => viewMode === "months"
                        ? new Date(m.getFullYear() + 1, m.getMonth(), 1)
                        : addMonths(m, 1))}
                    sx={{ color: C.muted, "&:hover": { color: C.text, bgcolor: alpha(C.text, 0.05) } }}>
                    <ArrowForwardIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {viewMode === "months" ? (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                    {MONTH_NAMES.map((name, i) => {
                        const monthDate = new Date(viewYear, i, 1);
                        const isPast = isBefore(endOfMonth(monthDate), min);
                        const isFuture = max ? isAfter(startOfMonth(monthDate), max) : false;
                        const isDisabled = isPast || isFuture;
                        const isCur  = viewMonth.getMonth() === i && viewMonth.getFullYear() === viewYear;
                        return (
                            <Box key={name} onClick={() => {
                                if (isDisabled) return;
                                setViewMonth(new Date(viewYear, i, 1));
                                setViewMode("days");
                            }} sx={{
                                py: 1.5, textAlign: "center", borderRadius: "12px",
                                cursor: isDisabled ? "default" : "pointer", userSelect: "none",
                                transition: "all 0.15s ease", opacity: isDisabled ? 0.25 : 1,
                                bgcolor: isCur ? alpha(C.accent, 0.15) : "transparent",
                                border: isCur ? `1px solid ${alpha(C.accent, 0.3)}` : "1px solid transparent",
                                "&:hover": !isDisabled ? { bgcolor: alpha(C.accent, 0.1), borderColor: alpha(C.accent, 0.25) } : {},
                            }}>
                                <Typography sx={{ fontSize: "0.85rem", fontWeight: isCur ? 600 : 400, color: isCur ? C.accent : C.text }}>
                                    {name}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            ) : (
                <>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 1 }}>
                        {DAY_NAMES.map((d) => (
                            <Typography key={d} sx={{
                                textAlign: "center", color: alpha(C.muted, 0.5),
                                fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.05em",
                                textTransform: "uppercase", py: 0.5,
                            }}>{d}</Typography>
                        ))}
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
                        {days.map((day) => {
                            const inMonth  = isSameMonth(day, viewMonth);
                            const isSel    = selected ? isSameDay(day, selected) : false;
                            const isToday  = isSameDay(day, today);
                            const pastMin  = isBefore(day, min);
                            const pastMax  = max ? isAfter(day, max) : false;
                            const disabled = pastMin || pastMax;
                            const inHighlight = hlStart && hlEnd
                                ? !isBefore(day, hlStart) && !isAfter(day, hlEnd)
                                : false;

                            return (
                                <Box key={day.toISOString()}
                                    onClick={() => { if (disabled) return; onPick(fnsFormat(day, "yyyy-MM-dd")); }}
                                    sx={{
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        width: 42, height: 42, mx: "auto", borderRadius: "12px",
                                        cursor: disabled ? "default" : "pointer", userSelect: "none",
                                        transition: "all 0.2s ease",
                                        opacity: !inMonth ? 0.2 : disabled ? 0.25 : 1,
                                        bgcolor: isSel
                                            ? C.accent
                                            : inHighlight && inMonth && !disabled
                                                ? alpha(C.accent, 0.06)
                                                : "transparent",
                                        border: isSel
                                            ? "1px solid transparent"
                                            : isToday
                                                ? `1px solid ${alpha(C.accent, 0.4)}`
                                                : inHighlight && inMonth && !disabled
                                                    ? `1px solid ${alpha(C.accent, 0.15)}`
                                                    : "1px solid transparent",
                                        boxShadow: isSel ? `0 0 12px ${alpha(C.accent, 0.35)}` : "none",
                                        "&:hover": !disabled && !isSel ? {
                                            bgcolor: alpha(C.accent, 0.1), borderColor: alpha(C.accent, 0.25),
                                        } : {},
                                    }}>
                                    <Typography sx={{
                                        fontSize: "0.82rem",
                                        fontWeight: isSel ? 700 : isToday ? 600 : 400,
                                        color: isSel ? "#fff" : isToday ? C.accent : C.text,
                                    }}>
                                        {fnsFormat(day, "d")}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </>
            )}

            {selectedBelow && selectedBadge}
        </Box>
    );
};
