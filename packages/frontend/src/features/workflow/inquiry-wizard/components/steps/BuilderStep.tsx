"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { C, glassSx } from '../../constants/wizard-config';
import { NACtx } from '../../types';
import { Q } from "../QuestionWrapper";
import { BuilderActivityStep } from "../BuilderActivityStep";
import { BuilderFilmsStep } from "../BuilderFilmsStep";
import { BuilderCrewStep } from "../BuilderCrewStep";
import type { EventType, EventTypeDay, EventDayActivity } from "@/features/catalog/event-types/types";

export default function BuilderScreen({ ctx }: { ctx: NACtx }) {
    const { responses, handleChange, maxVideographers, maxCamerasPerOp, eventTypes } = ctx;

    const etName = (String(responses.event_type || "")).toLowerCase().trim();
    const matchedET: EventType | undefined =
        eventTypes.find((e: EventType) => e.name?.toLowerCase().trim() === etName) ||
        eventTypes.find((e: EventType) => {
            const n = e.name?.toLowerCase() || "";
            return n.includes(etName) || (etName.length > 2 && etName.includes(n));
        }) ||
        eventTypes[0];

    const presets: EventDayActivity[] = (() => {
        if (!matchedET?.event_days?.length) return [];
        const days = [...matchedET.event_days].sort(
            (a: EventTypeDay, b: EventTypeDay) => (a.order_index ?? 0) - (b.order_index ?? 0)
        );
        const weddingDay: EventTypeDay | undefined =
            days.find((d: EventTypeDay) => d.event_day_template?.name?.toLowerCase() === "wedding day") ||
            days.find((d: EventTypeDay) => d.event_day_template?.name?.toLowerCase().startsWith("wedding day")) ||
            days.reduce((best: EventTypeDay, d: EventTypeDay) =>
                (d.event_day_template?.activity_presets?.length || 0) >
                (best?.event_day_template?.activity_presets?.length || 0) ? d : best
            , days[0]);
        return weddingDay?.event_day_template?.activity_presets?.filter((p: EventDayActivity) => p.is_active !== false) || [];
    })();

    const builderStep: number = (responses.builder_step as number) || 1;
    const selectedIds: number[] = (responses.builder_activities as number[]) || [];
    const selectedFilms: Array<{ type: string; activityPresetId?: number; activityName?: string }> = (responses.builder_films as Array<{ type: string; activityPresetId?: number; activityName?: string }>) || [];
    const opCount: number = (responses.operator_count as number) || 0;
    const camCount: number = (responses.camera_count as number) || 0;

    if (presets.length > 0 && !responses._builder_initialized) {
        const commonNames = ["ceremony", "bridal prep", "couple portraits", "reception"];
        const defaults = presets
            .filter((p: EventDayActivity) => commonNames.some((n) => p.name?.toLowerCase().includes(n)))
            .map((p: EventDayActivity) => p.id);
        handleChange("builder_activities", defaults);
        handleChange("builder_films", [{ type: "FEATURE" }]);
        handleChange("operator_count", 1);
        handleChange("camera_count", 1);
        handleChange("builder_step", 1);
        handleChange("_builder_initialized", true);
        return null;
    }

    const toggleActivity = (id: number) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter((x) => x !== id)
            : [...selectedIds, id];
        handleChange("builder_activities", next);
        if (selectedIds.includes(id)) {
            handleChange("builder_films", selectedFilms.filter(
                (f) => !(f.type === "ACTIVITY" && f.activityPresetId === id)
            ));
        }
    };

    const toggleFilm = (film: { type: string; activityPresetId?: number; activityName?: string }) => {
        const idx = selectedFilms.findIndex(
            (f) => f.type === film.type && (f.activityPresetId || null) === (film.activityPresetId || null)
        );
        handleChange("builder_films", idx >= 0
            ? selectedFilms.filter((_, i) => i !== idx)
            : [...selectedFilms, film]
        );
    };

    const isFSel = (type: string, presetId?: number) =>
        selectedFilms.some(
            (f) => f.type === type && (f.activityPresetId || null) === (presetId || null)
        );

    const totalMins = presets
        .filter((p: EventDayActivity) => selectedIds.includes(p.id))
        .reduce((s: number, p: EventDayActivity) => s + (p.default_duration_minutes || 60), 0);
    const hrs = Math.round((totalMins / 60) * 2) / 2;
    const selectedPresets = presets.filter((p: EventDayActivity) => selectedIds.includes(p.id));
    const editedFilmCount = selectedFilms.filter((f) => f.type === "FEATURE" || f.type === "MONTAGE").length;
    const fullFilmCount = selectedFilms.filter((f) => f.type === "ACTIVITY").length;

    const stepTitles = [
        "What would you like us to film?",
        "What films would you like?",
        "How many videographers?",
    ];
    const stepSubs = [
        "Select every moment you want captured on camera",
        selectedPresets.length
            ? `You've chosen ${selectedPresets.length} moment${selectedPresets.length === 1 ? "" : "s"} to film — now pick the final edits you'd like delivered`
            : "Choose the deliverables that tell your story",
        "Choose your crew and camera setup",
    ];

    return (
        <Q title={stepTitles[builderStep - 1]} subtitle={stepSubs[builderStep - 1]}>
            <Box sx={{ width: "100%" }}>
                {builderStep === 1 && (
                    <BuilderActivityStep presets={presets} selectedIds={selectedIds} toggleActivity={toggleActivity} />
                )}
                {builderStep === 2 && (
                    <BuilderFilmsStep selectedPresets={selectedPresets} isFSel={isFSel} toggleFilm={toggleFilm} />
                )}
                {builderStep === 3 && (
                    <BuilderCrewStep opCount={opCount} camCount={camCount} maxVideographers={maxVideographers} maxCamerasPerOp={maxCamerasPerOp} handleChange={handleChange} />
                )}

                {/* Step progress dots */}
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 3 }}>
                    {[1, 2, 3].map((s) => (
                        <Box key={s} onClick={() => s < builderStep && handleChange("builder_step", s)} sx={{
                            width: s === builderStep ? 20 : 6, height: 6, borderRadius: 3,
                            bgcolor: s === builderStep ? C.accent : s < builderStep ? alpha(C.accent, 0.4) : alpha(C.muted, 0.25),
                            transition: "all 0.3s",
                            cursor: s < builderStep ? "pointer" : "default",
                        }} />
                    ))}
                </Box>

                {/* Sticky summary bar */}
                <Box sx={{ position: "sticky", bottom: 64, zIndex: 49, mt: 2 }}>
                    <Box sx={{
                        ...glassSx, p: "12px 20px",
                        border: `1px solid ${alpha(C.accent, 0.2)}`,
                        background: `linear-gradient(135deg, ${alpha(C.card, 0.92)}, ${alpha(C.card, 0.82)})`,
                        backdropFilter: "blur(28px) saturate(2)",
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2,
                    }}>
                        <Box sx={{ display: "flex", gap: 3 }}>
                            {[
                                { v: selectedIds.length, l: "activities" },
                                { v: `~${hrs}h`, l: "coverage" },
                                { v: selectedFilms.length, l: (() => {
                                    const parts: string[] = [];
                                    if (editedFilmCount > 0) parts.push(`${editedFilmCount} cinematic`);
                                    if (fullFilmCount > 0) parts.push(`${fullFilmCount} full`);
                                    return parts.length > 0 ? parts.join(" + ") : "films";
                                })() },
                                { v: opCount || 0, l: "videographers" },
                            ].map(({ v, l }) => (
                                <Box key={l} sx={{ textAlign: "center", minWidth: 44 }}>
                                    <Typography sx={{ color: C.accent, fontSize: "1rem", fontWeight: 700, lineHeight: 1 }}>{v}</Typography>
                                    <Typography sx={{ color: C.muted, fontSize: "0.6rem", mt: 0.25 }}>{l}</Typography>
                                </Box>
                            ))}
                        </Box>
                        <Typography sx={{ color: alpha(C.muted, 0.6), fontSize: "0.65rem", fontStyle: "italic" }}>
                            We'll prepare your personalised quote
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Q>
    );
}