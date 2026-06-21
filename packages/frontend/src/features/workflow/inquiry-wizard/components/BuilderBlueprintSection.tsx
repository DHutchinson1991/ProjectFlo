"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Typography,
    Chip,
    Stack,
    CircularProgress,
    FormControl,
    Select,
    MenuItem,
    Button,
    TextField,
    LinearProgress,
    Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { C, glassSx } from "../constants/wizard-config";
import {
    useDayBlueprintVersion,
    useDayBlueprints,
    usePublishedDayBlueprintVersions,
} from "@/features/content/day-blueprints/hooks";
import { useSimulatorAnswers } from "@/features/content/day-blueprints/components/simulator/useSimulatorAnswers";
import {
    StepActivities,
    StepEventDayDetail,
    StepEventDays,
    StepGuestCount,
} from "@/features/content/day-blueprints/components/simulator/simulator-steps";
import { WEDDING_TEMPLATE_KEYS } from "@/features/catalog/packages/day-design/wedding-template-keys";
import { useBlueprintDayDesignPipeline } from "@/features/catalog/packages/day-design/useBlueprintDayDesignPipeline";
import type { EventType, EventTypeDay } from "@/features/catalog/package-templates/types";
import type { AnyRecord } from "../types";
import {
    initBlueprintDayMappings,
    normalizeCategory,
    readBlueprintDayMappingsRecord,
    readBlueprintId,
    readBlueprintVersionId,
    readSelectedBlueprintActivityIds,
    writeBlueprintDayMappings,
} from "../utils/builder-blueprint-responses";

interface Props {
    matchedET: EventType | undefined;
    responses: AnyRecord;
    handleChange: (key: string, value: unknown) => void;
}

export function BuilderBlueprintSection({ matchedET, responses, handleChange }: Props) {
    const versionId = readBlueprintVersionId(responses);
    const blueprintId = readBlueprintId(responses);
    const selectedIds = readSelectedBlueprintActivityIds(responses);
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const dayMappings = readBlueprintDayMappingsRecord(responses);
    const initializedForVersionRef = useRef<number | null>(null);
    const pipeline = useBlueprintDayDesignPipeline();
    const answersStore = useSimulatorAnswers(null);
    const [aiExpanded, setAiExpanded] = useState(false);
    const [aiDisplayName, setAiDisplayName] = useState("");
    const { data: seededBlueprints = [] } = useDayBlueprints({ includeSeeded: true });

    const isWeddingType = matchedET?.name?.toLowerCase().includes("wedding") ?? false;
    const availableTemplates = useMemo(
        () =>
            WEDDING_TEMPLATE_KEYS.map((template) => ({
                ...template,
                blueprint: seededBlueprints.find((bp) => bp.key === template.key) ?? null,
            })),
        [seededBlueprints],
    );

    const applyBlueprintSelection = (blueprintId: number, selectedVersionId: number, name: string) => {
        handleChange("source_day_blueprint_version_id", selectedVersionId);
        handleChange("source_day_blueprint_id", blueprintId);
        handleChange("source_day_blueprint_name", name);
        handleChange("selected_day_blueprint_activity_ids", []);
        handleChange("blueprint_day_mappings", []);
        initializedForVersionRef.current = null;
    };

    const handleTemplateStart = async (templateKey: string, label: string) => {
        const template = availableTemplates.find((row) => row.key === templateKey);
        if (!template?.blueprint || pipeline.isRunning) return;
        try {
            const result = await pipeline.runTemplate({
                templateBlueprintId: template.blueprint.id,
                displayName: label,
                enhanceWithAi: false,
            });
            applyBlueprintSelection(result.blueprintId, result.versionId, label);
        } catch {
            // pipeline.error is internal; inquiry UI stays on presets path
        }
    };

    const handleBuildAi = async () => {
        if (!matchedET || !aiDisplayName.trim() || pipeline.isRunning) return;
        try {
            const result = await pipeline.runAiBrief({
                eventCategory: matchedET.name,
                displayName: aiDisplayName.trim(),
                answers: answersStore.answers,
                isWeddingType,
            });
            applyBlueprintSelection(result.blueprintId, result.versionId, aiDisplayName.trim());
            setAiExpanded(false);
        } catch {
            // pipeline.error shown inline
        }
    };

    const eventDayCount = Math.max(1, Math.min(3, answersStore.answers.basics.eventDays ?? 1));

    const simulatorStepProps = {
        answers: answersStore.answers,
        patchBasics: answersStore.patchBasics,
        patchPeople: answersStore.patchPeople,
        patchLocations: answersStore.patchLocations,
        day: null,
        version: null,
        completeness: null,
    };

    const { data: publishedVersions = [], isLoading: loadingBlueprints } =
        usePublishedDayBlueprintVersions();

    const filteredBlueprints = useMemo(() => {
        if (!matchedET) return [];
        const category = normalizeCategory(matchedET.name);
        return publishedVersions.filter(
            (row) => normalizeCategory(row.eventCategory) === category,
        );
    }, [publishedVersions, matchedET]);

    const resolvedBlueprintId =
        blueprintId ??
        publishedVersions.find((row) => row.versionId === versionId)?.blueprintId ??
        null;

    const versionQuery = useDayBlueprintVersion(resolvedBlueprintId, versionId);
    const version = versionQuery.data;

    const blueprintDays = useMemo(
        () => (version?.days ?? []).slice().sort((a, b) => a.order_index - b.order_index),
        [version?.days],
    );

    const allActivityIds = useMemo(
        () =>
            blueprintDays.flatMap((day) =>
                (day.activities ?? []).map((activity) => activity.id),
            ),
        [blueprintDays],
    );

    const templateDays = useMemo(() => {
        if (!matchedET?.event_days?.length) return [];
        return [...matchedET.event_days].sort(
            (a: EventTypeDay, b: EventTypeDay) => (a.order_index ?? 0) - (b.order_index ?? 0),
        );
    }, [matchedET]);

    const showMatchDays = blueprintDays.length > 1 || templateDays.length > 1;

    const latestPublishedForBlueprint = useMemo(() => {
        if (!blueprintId) return null;
        const rows = publishedVersions.filter((row) => row.blueprintId === blueprintId);
        return rows.reduce(
            (best, row) => (!best || row.versionNumber > best.versionNumber ? row : best),
            null as (typeof rows)[number] | null,
        );
    }, [publishedVersions, blueprintId]);

    const isStaleBlueprintVersion =
        latestPublishedForBlueprint != null &&
        versionId !== latestPublishedForBlueprint.versionId;

    const selectBlueprint = (row: (typeof filteredBlueprints)[number]) => {
        if (versionId === row.versionId) return;
        applyBlueprintSelection(row.blueprintId, row.versionId, row.blueprintName);
    };

    const clearBlueprint = () => {
        handleChange("source_day_blueprint_version_id", null);
        handleChange("source_day_blueprint_id", null);
        handleChange("source_day_blueprint_name", null);
        handleChange("selected_day_blueprint_activity_ids", []);
        handleChange("blueprint_day_mappings", []);
        initializedForVersionRef.current = null;
    };

    const toggleActivity = (activityId: number) => {
        const next = selectedSet.has(activityId)
            ? selectedIds.filter((id) => id !== activityId)
            : [...selectedIds, activityId];
        handleChange("selected_day_blueprint_activity_ids", next);
    };

    const setDayMapping = (blueprintDayId: number, eventTypeDayLinkId: number) => {
        writeBlueprintDayMappings(handleChange, {
            ...dayMappings,
            [blueprintDayId]: eventTypeDayLinkId,
        });
    };

    useEffect(() => {
        if (!versionId || !showMatchDays || blueprintDays.length === 0 || templateDays.length === 0) {
            return;
        }
        if (Object.keys(dayMappings).length >= blueprintDays.length) return;
        writeBlueprintDayMappings(
            handleChange,
            initBlueprintDayMappings(blueprintDays, templateDays),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps -- seed positional 1:1 once
    }, [versionId, showMatchDays, version?.id, blueprintDays.length, templateDays.length]);

    useEffect(() => {
        if (!versionId || !version || allActivityIds.length === 0) return;
        if (initializedForVersionRef.current === versionId) return;
        initializedForVersionRef.current = versionId;
        handleChange("selected_day_blueprint_activity_ids", allActivityIds);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per blueprint version
    }, [versionId, version?.id, allActivityIds.length]);

    useEffect(() => {
        if (!versionId) initializedForVersionRef.current = null;
    }, [versionId]);

    useEffect(() => {
        if (!matchedET) return;
        setAiDisplayName(`${matchedET.name.trim()} Day Design`);
    }, [matchedET]);

    if (!matchedET) return null;

    const pipelineProgressLabel = (() => {
        switch (pipeline.status) {
            case "creating": return "Preparing day design…";
            case "generating": return "Generating moments with AI…";
            case "publishing": return "Publishing day design…";
            default: return "";
        }
    })();

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <DesignServicesIcon sx={{ fontSize: "0.95rem", color: C.accent }} />
                    <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.85rem" }}>
                        Day design
                    </Typography>
                </Box>
                {versionId ? (
                    <Typography
                        onClick={clearBlueprint}
                        sx={{
                            color: C.muted,
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            "&:hover": { color: C.text },
                        }}
                    >
                        Use presets instead
                    </Typography>
                ) : null}
            </Box>
            <Typography sx={{ color: C.muted, fontSize: "0.75rem", mb: 1.5 }}>
                Optional — pick a day design template, build with AI, or choose a published design.
                We&apos;ll build your package from its activities and moments.
            </Typography>

            {pipeline.error && (
                <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => pipeline.reset()}>
                    {pipeline.error}
                </Alert>
            )}

            {pipeline.isRunning && (
                <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: C.muted, fontSize: "0.72rem", mb: 0.75 }}>
                        {pipelineProgressLabel}
                    </Typography>
                    <LinearProgress
                        sx={{
                            borderRadius: 1,
                            bgcolor: alpha(C.border, 0.2),
                            "& .MuiLinearProgress-bar": { bgcolor: C.accent },
                        }}
                    />
                </Box>
            )}

            {isWeddingType && !versionId && (
                <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: C.muted, fontSize: "0.72rem", mb: 1 }}>
                        Wedding templates
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {availableTemplates.map((template) => (
                            <Box
                                key={template.key}
                                component="button"
                                type="button"
                                disabled={!template.blueprint || pipeline.isRunning}
                                onClick={() => void handleTemplateStart(template.key, template.label)}
                                sx={{
                                    px: 1.25,
                                    py: 0.75,
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(C.border, 0.35)}`,
                                    bgcolor: alpha(C.card, 0.5),
                                    color: C.text,
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: template.blueprint && !pipeline.isRunning ? "pointer" : "not-allowed",
                                    opacity: template.blueprint ? 1 : 0.45,
                                }}
                            >
                                {template.label}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {!versionId && (
                <Box sx={{ mb: 2 }}>
                    {!aiExpanded ? (
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={pipeline.isRunning}
                            onClick={() => setAiExpanded(true)}
                            startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
                            sx={{
                                borderColor: alpha(C.accent, 0.45),
                                color: C.accent,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                            }}
                        >
                            Build with AI
                        </Button>
                    ) : (
                        <Box sx={{ ...glassSx, p: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                                <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.78rem" }}>
                                    AI day design brief
                                </Typography>
                                <Typography
                                    onClick={() => !pipeline.isRunning && setAiExpanded(false)}
                                    sx={{
                                        color: C.muted,
                                        fontSize: "0.68rem",
                                        cursor: pipeline.isRunning ? "not-allowed" : "pointer",
                                        "&:hover": { color: C.text },
                                    }}
                                >
                                    Cancel
                                </Typography>
                            </Box>
                            <TextField
                                size="small"
                                fullWidth
                                label="Day design name"
                                value={aiDisplayName}
                                onChange={(e) => setAiDisplayName(e.target.value)}
                                disabled={pipeline.isRunning}
                                sx={{ mb: 1.5 }}
                            />
                            <StepEventDays {...simulatorStepProps} />
                            {eventDayCount > 1 &&
                                Array.from({ length: eventDayCount }, (_, index) => (
                                    <StepEventDayDetail
                                        key={index + 1}
                                        dayNumber={index + 1}
                                        {...simulatorStepProps}
                                    />
                                ))}
                            <StepActivities {...simulatorStepProps} />
                            <StepGuestCount {...simulatorStepProps} />
                            <Button
                                variant="contained"
                                disabled={!aiDisplayName.trim() || pipeline.isRunning}
                                onClick={() => void handleBuildAi()}
                                sx={{
                                    mt: 1.5,
                                    bgcolor: C.accent,
                                    color: "#0f172a",
                                    fontWeight: 700,
                                    fontSize: "0.75rem",
                                }}
                            >
                                {pipeline.isRunning ? (
                                    <CircularProgress size={16} sx={{ color: "#0f172a" }} />
                                ) : (
                                    "Generate with AI"
                                )}
                            </Button>
                        </Box>
                    )}
                </Box>
            )}

            {loadingBlueprints ? (
                <Typography sx={{ color: C.muted, fontSize: "0.8rem", fontStyle: "italic" }}>
                    Loading blueprints…
                </Typography>
            ) : filteredBlueprints.length === 0 ? (
                <Box sx={{ ...glassSx, p: 2 }}>
                    <Typography sx={{ color: alpha("#f59e0b", 0.9), fontSize: "0.78rem" }}>
                        No published {matchedET.name} designs yet. Use a wedding template below or continue with preset activities.
                    </Typography>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        gap: 1.25,
                        overflowX: "auto",
                        pb: 1,
                        scrollSnapType: "x mandatory",
                        "&::-webkit-scrollbar": { height: 4 },
                        "&::-webkit-scrollbar-thumb": {
                            bgcolor: alpha(C.border, 0.4),
                            borderRadius: 2,
                        },
                    }}
                >
                    {filteredBlueprints.map((row) => {
                        const isSelected = versionId === row.versionId;
                        return (
                            <Box
                                key={row.versionId}
                                onClick={() => selectBlueprint(row)}
                                sx={{
                                    flex: "0 0 150px",
                                    minWidth: 150,
                                    scrollSnapAlign: "start",
                                    p: 1.5,
                                    borderRadius: 2.5,
                                    cursor: "pointer",
                                    border: `2px solid ${isSelected ? C.accent : alpha(C.border, 0.35)}`,
                                    bgcolor: isSelected ? alpha(C.accent, 0.08) : alpha(C.card, 0.5),
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        borderColor: isSelected ? C.accent : alpha(C.text, 0.25),
                                        transform: "translateY(-1px)",
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: C.text,
                                        fontWeight: 700,
                                        fontSize: "0.8rem",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {row.blueprintName}
                                </Typography>
                                <Typography sx={{ color: C.muted, fontSize: "0.68rem", mt: 0.5 }}>
                                    v{row.versionNumber}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {versionId ? (
                <Box sx={{ mt: 2.5 }}>
                    {versionQuery.isLoading ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
                            <CircularProgress size={18} sx={{ color: C.accent }} />
                            <Typography sx={{ color: C.muted, fontSize: "0.82rem" }}>
                                Loading blueprint activities…
                            </Typography>
                        </Box>
                    ) : versionQuery.isError || !version ? (
                        <Typography sx={{ color: alpha("#f59e0b", 0.9), fontSize: "0.78rem" }}>
                            Could not load this blueprint. Clear your selection and try again.
                        </Typography>
                    ) : (
                        <>
                            {isStaleBlueprintVersion && latestPublishedForBlueprint ? (
                                <Typography
                                    sx={{ color: alpha("#f59e0b", 0.9), fontSize: "0.72rem", mb: 1.5 }}
                                >
                                    A newer version (v{latestPublishedForBlueprint.versionNumber}) is
                                    available. Your package will use v{version.version_number ?? "?"}.
                                </Typography>
                            ) : null}

                            {showMatchDays ? (
                                <Box
                                    sx={{
                                        ...glassSx,
                                        p: 1.5,
                                        mb: 2,
                                        border: `1px solid ${alpha(C.accent, 0.2)}`,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            color: C.text,
                                            fontWeight: 600,
                                            fontSize: "0.78rem",
                                            mb: 0.5,
                                        }}
                                    >
                                        Match days
                                    </Typography>
                                    <Typography sx={{ color: C.muted, fontSize: "0.68rem", mb: 1.25 }}>
                                        Pair each blueprint day with a template day for this package.
                                    </Typography>
                                    <Stack spacing={1}>
                                        {blueprintDays.map((bpDay) => (
                                            <Box
                                                key={bpDay.id}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        color: C.muted,
                                                        fontSize: "0.75rem",
                                                        minWidth: 110,
                                                        flex: "1 1 110px",
                                                    }}
                                                >
                                                    {bpDay.name}
                                                </Typography>
                                                <Typography sx={{ color: alpha(C.muted, 0.5), fontSize: "0.7rem" }}>
                                                    →
                                                </Typography>
                                                <FormControl
                                                    size="small"
                                                    sx={{ minWidth: 170, flex: "2 1 170px" }}
                                                >
                                                    <Select
                                                        value={dayMappings[bpDay.id] ?? ""}
                                                        displayEmpty
                                                        onChange={(e) =>
                                                            setDayMapping(bpDay.id, Number(e.target.value))
                                                        }
                                                        sx={{
                                                            color: C.text,
                                                            fontSize: "0.75rem",
                                                            "& .MuiOutlinedInput-notchedOutline": {
                                                                borderColor: alpha(C.border, 0.45),
                                                            },
                                                        }}
                                                    >
                                                        <MenuItem value="" disabled>
                                                            Select template day
                                                        </MenuItem>
                                                        {templateDays.map((link) => (
                                                            <MenuItem key={link.id} value={link.id}>
                                                                {link.event_day_template?.name ?? "Day"}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            ) : null}

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mb: 1.5,
                                }}
                            >
                                <Typography sx={{ color: C.muted, fontSize: "0.8rem" }}>
                                    Blueprint activities
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Chip
                                        label={`${selectedIds.length}/${allActivityIds.length}`}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: "0.68rem",
                                            bgcolor: alpha(C.accent, 0.12),
                                            color: C.accent,
                                            border: "none",
                                        }}
                                    />
                                    <Typography
                                        onClick={() =>
                                            handleChange(
                                                "selected_day_blueprint_activity_ids",
                                                allActivityIds,
                                            )
                                        }
                                        sx={{
                                            color: C.accent,
                                            fontSize: "0.68rem",
                                            cursor: "pointer",
                                            "&:hover": { textDecoration: "underline" },
                                        }}
                                    >
                                        All
                                    </Typography>
                                    <Typography
                                        onClick={() =>
                                            handleChange("selected_day_blueprint_activity_ids", [])
                                        }
                                        sx={{
                                            color: C.muted,
                                            fontSize: "0.68rem",
                                            cursor: "pointer",
                                            "&:hover": { color: C.text },
                                        }}
                                    >
                                        None
                                    </Typography>
                                </Box>
                            </Box>

                            {allActivityIds.length === 0 ? (
                                <Typography
                                    sx={{ color: C.muted, fontSize: "0.78rem", fontStyle: "italic" }}
                                >
                                    This blueprint has no activities yet.
                                </Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {blueprintDays.map((day) => {
                                        const activities = (day.activities ?? [])
                                            .slice()
                                            .sort((a, b) => a.order_index - b.order_index);
                                        if (activities.length === 0) return null;
                                        return (
                                            <Box key={day.id}>
                                                <Typography
                                                    sx={{
                                                        color: alpha(C.muted, 0.85),
                                                        fontSize: "0.65rem",
                                                        fontWeight: 600,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.35px",
                                                        mb: 0.75,
                                                    }}
                                                >
                                                    {day.name}
                                                </Typography>
                                                <Stack spacing={0.5}>
                                                    {activities.map((activity) => {
                                                        const sel = selectedSet.has(activity.id);
                                                        const col = activity.color || C.accent;
                                                        const momentCount =
                                                            activity.moments?.length ?? 0;
                                                        return (
                                                            <Box
                                                                key={activity.id}
                                                                onClick={() =>
                                                                    toggleActivity(activity.id)
                                                                }
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 1,
                                                                    p: "8px 10px",
                                                                    borderRadius: 2,
                                                                    cursor: "pointer",
                                                                    border: `1px solid ${sel ? alpha(col, 0.45) : alpha(C.border, 0.3)}`,
                                                                    bgcolor: sel
                                                                        ? alpha(col, 0.06)
                                                                        : alpha(C.card, 0.35),
                                                                    transition: "all 0.15s",
                                                                    "&:hover": {
                                                                        borderColor: alpha(col, 0.5),
                                                                    },
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 18,
                                                                        height: 18,
                                                                        borderRadius: "50%",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        border: `2px solid ${sel ? col : alpha(C.border, 0.5)}`,
                                                                        bgcolor: sel ? col : "transparent",
                                                                        flexShrink: 0,
                                                                    }}
                                                                >
                                                                    {sel ? (
                                                                        <CheckCircleIcon
                                                                            sx={{
                                                                                fontSize: "0.65rem",
                                                                                color: "#fff",
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                </Box>
                                                                <Typography
                                                                    sx={{
                                                                        color: sel ? C.text : C.muted,
                                                                        fontSize: "0.8rem",
                                                                        fontWeight: sel ? 600 : 400,
                                                                        flex: 1,
                                                                        minWidth: 0,
                                                                    }}
                                                                >
                                                                    {activity.name}
                                                                </Typography>
                                                                <Typography
                                                                    sx={{
                                                                        color: alpha(C.muted, 0.7),
                                                                        fontSize: "0.65rem",
                                                                        flexShrink: 0,
                                                                    }}
                                                                >
                                                                    {momentCount} moment
                                                                    {momentCount === 1 ? "" : "s"}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </>
                    )}
                </Box>
            ) : null}
        </Box>
    );
}
