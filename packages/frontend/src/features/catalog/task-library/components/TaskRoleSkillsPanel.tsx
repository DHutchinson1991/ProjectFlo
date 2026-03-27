"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Box,
    Typography,
    Chip,
    Collapse,
    CircularProgress,
    Divider,
    alpha,
} from "@mui/material";
import {
    AutoAwesome as AutoIcon,
} from "@mui/icons-material";
import { skillRoleMappingsApi } from "@/features/workflow/crew/api";
import { TaskLibrary, SkillRoleMapping } from "@/features/catalog/task-library/types";

interface TaskRoleSkillsPanelProps {
    task: TaskLibrary;
    open: boolean;
    onUpdate: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
}

/** Tier display metadata keyed by bracket level */
const TIER_META: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: "Junior", color: "rgba(100, 200, 255, 0.85)", bg: "rgba(100, 200, 255, 0.10)" },
    2: { label: "Mid-Level", color: "rgba(160, 140, 255, 0.85)", bg: "rgba(160, 140, 255, 0.10)" },
    3: { label: "Senior", color: "rgba(255, 180, 100, 0.85)", bg: "rgba(255, 180, 100, 0.10)" },
    4: { label: "Lead", color: "rgba(255, 100, 130, 0.85)", bg: "rgba(255, 100, 130, 0.10)" },
    5: { label: "Executive", color: "rgba(255, 80, 200, 0.85)", bg: "rgba(255, 80, 200, 0.10)" },
};

/** Group skills by tier level, sorted by level then alphabetically within each tier */
function groupSkillsByTier(mappings: SkillRoleMapping[]): { level: number; skills: string[] }[] {
    const groups: Record<number, Set<string>> = {};
    for (const m of mappings) {
        const level = m.payment_bracket?.level ?? 0;
        if (!groups[level]) groups[level] = new Set();
        groups[level].add(m.skill_name);
    }
    return Object.entries(groups)
        .map(([lvl, set]) => ({ level: Number(lvl), skills: Array.from(set).sort() }))
        .sort((a, b) => a.level - b.level);
}

export function TaskRoleSkillsPanel({
    task,
    open,
    onUpdate,
}: TaskRoleSkillsPanelProps) {
    const roleId = task.default_job_role_id ?? null;
    const [mappings, setMappings] = useState<SkillRoleMapping[]>([]);
    const [loadingMappings, setLoadingMappings] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
        task.skills_needed ?? []
    );
    const [saving, setSaving] = useState(false);
    const [hoveredTier, setHoveredTier] = useState<number | null>(null);

    useEffect(() => {
        setSelectedSkills(task.skills_needed ?? []);
    }, [task.skills_needed]);

    useEffect(() => {
        if (!roleId || !open) {
            setMappings([]);
            return;
        }

        let cancelled = false;
        setLoadingMappings(true);

        skillRoleMappingsApi
            .getAll({ jobRoleId: roleId })
            .then((data) => { if (!cancelled) setMappings(data); })
            .catch(() => { if (!cancelled) setMappings([]); })
            .finally(() => { if (!cancelled) setLoadingMappings(false); });

        return () => { cancelled = true; };
    }, [roleId, open]);

    const skillsByTier = useMemo(() => groupSkillsByTier(mappings), [mappings]);
    const hasSkills = skillsByTier.some((g) => g.skills.length > 0);

    const persist = useCallback(
        async (skills: string[]) => {
            setSaving(true);
            try {
                await onUpdate(task.id, { skills_needed: skills });
            } finally {
                setSaving(false);
            }
        },
        [onUpdate, task.id]
    );

    const handleToggleSkill = useCallback(
        async (skill: string) => {
            const next = selectedSkills.includes(skill)
                ? selectedSkills.filter((s) => s !== skill)
                : [...selectedSkills, skill];
            setSelectedSkills(next);
            await persist(next);
        },
        [selectedSkills, persist]
    );

    /* Derive the tier badge info: hovered tier wins, otherwise null (hidden) */
    const tierBadge = hoveredTier != null ? TIER_META[hoveredTier] ?? null : null;

    return (
        <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
                sx={{
                    px: 2,
                    py: 0.75,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flexWrap: "wrap",
                    minHeight: 34,
                    bgcolor: "rgba(100,255,218,0.025)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    borderLeft: "3px solid rgba(100,255,218,0.2)",
                }}
            >
                {/* Dynamic tier label — appears on skill hover */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            minWidth: 72,
                            height: 24,
                            transition: "all 0.2s ease",
                            opacity: tierBadge ? 1 : 0,
                            background: tierBadge?.bg ?? "transparent",
                            border: tierBadge
                                ? `1px solid ${tierBadge.color.replace("0.85", "0.3")}`
                                : "1px solid transparent",
                        }}
                    >
                        {tierBadge && (
                            <>
                                <Box
                                    sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        backgroundColor: tierBadge.color,
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontSize: "0.68rem",
                                        fontWeight: 600,
                                        color: tierBadge.color,
                                        whiteSpace: "nowrap",
                                        lineHeight: 1,
                                    }}
                                >
                                    {tierBadge.label}
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>

                {saving && <CircularProgress size={14} sx={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />}

                {/* Divider between tier badge and skills */}
                {roleId && !loadingMappings && hasSkills && (
                    <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                )}

                {/* No role selected prompt */}
                {!roleId && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic", fontSize: "0.7rem" }}>
                            Choose a role to see available skills
                        </Typography>
                    </Box>
                )}

                {/* Skill toggle chips — grouped by tier with vertical dividers */}
                {roleId && (
                    <>
                        {loadingMappings ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                <CircularProgress size={14} sx={{ color: "rgba(255,255,255,0.3)" }} />
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>
                                    Loading…
                                </Typography>
                            </Box>
                        ) : !hasSkills ? (
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontSize: "0.7rem" }}>
                                No skills mapped
                            </Typography>
                        ) : (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", flex: 1 }}>
                                {skillsByTier.map((group, groupIdx) => {
                                    const tier = TIER_META[group.level];
                                    return (
                                        <React.Fragment key={group.level}>
                                            {/* Vertical divider between tier groups (not before first) */}
                                            {groupIdx > 0 && (
                                                <Divider
                                                    orientation="vertical"
                                                    flexItem
                                                    sx={{
                                                        mx: 1,
                                                        borderColor: tier?.color
                                                            ? tier.color.replace("0.85", "0.18")
                                                            : "rgba(255,255,255,0.08)",
                                                        borderWidth: 1,
                                                    }}
                                                />
                                            )}
                                            {/* Tier group chips */}
                                            <Box
                                                sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}
                                                onMouseEnter={() => setHoveredTier(group.level)}
                                                onMouseLeave={() => setHoveredTier(null)}
                                            >
                                                {group.skills.map((skill) => {
                                                    const isSelected = selectedSkills.includes(skill);
                                                    return (
                                                        <Chip
                                                            key={skill}
                                                            label={skill.replace(/_/g, " ")}
                                                            size="small"
                                                            onClick={() => handleToggleSkill(skill)}
                                                            onMouseEnter={() => setHoveredTier(group.level)}
                                                            onMouseLeave={() => setHoveredTier(null)}
                                                            sx={{
                                                                cursor: "pointer",
                                                                height: 22,
                                                                fontWeight: isSelected ? 600 : 400,
                                                                fontSize: "0.68rem",
                                                                transition: "all 0.15s ease",
                                                                ...(isSelected
                                                                    ? {
                                                                        background: (theme) =>
                                                                            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)}, ${alpha(theme.palette.primary.main, 0.12)})`,
                                                                        border: (theme) =>
                                                                            `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                                                                        color: "primary.light",
                                                                        boxShadow: (theme) =>
                                                                            `0 0 6px ${alpha(theme.palette.primary.main, 0.12)}`,
                                                                        ...(tier
                                                                            ? {
                                                                                "&:hover": {
                                                                                    background: tier.bg,
                                                                                    borderColor: tier.color.replace("0.85", "0.5"),
                                                                                    color: tier.color,
                                                                                    boxShadow: `0 0 8px ${tier.color.replace("0.85", "0.15")}`,
                                                                                },
                                                                            }
                                                                            : {}),
                                                                    }
                                                                    : {
                                                                        background: "rgba(255,255,255,0.03)",
                                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                                        color: "rgba(255,255,255,0.4)",
                                                                        "&:hover": tier
                                                                            ? {
                                                                                background: tier.bg,
                                                                                borderColor: tier.color.replace("0.85", "0.4"),
                                                                                color: tier.color,
                                                                                boxShadow: `0 0 8px ${tier.color.replace("0.85", "0.12")}`,
                                                                            }
                                                                            : {
                                                                                background: "rgba(255,255,255,0.07)",
                                                                                borderColor: "rgba(255,255,255,0.18)",
                                                                                color: "rgba(255,255,255,0.65)",
                                                                            },
                                                                    }),
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        </React.Fragment>
                                    );
                                })}
                            </Box>
                        )}

                        {/* Hint — prominent when no skills selected */}
                        {!loadingMappings && hasSkills && selectedSkills.length === 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    ml: "auto",
                                    flexShrink: 0,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1.5,
                                    background: "rgba(255, 180, 100, 0.08)",
                                    border: "1px solid rgba(255, 180, 100, 0.2)",
                                    animation: "pulse-hint 2s ease-in-out infinite",
                                    "@keyframes pulse-hint": {
                                        "0%, 100%": { opacity: 0.85 },
                                        "50%": { opacity: 1 },
                                    },
                                }}
                            >
                                <AutoIcon sx={{ fontSize: 13, color: "rgba(255, 180, 100, 0.7)" }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "rgba(255, 180, 100, 0.85)",
                                        fontWeight: 500,
                                        fontSize: "0.68rem",
                                    }}
                                >
                                    Select skills to set tier &amp; rate
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Collapse>
    );
}
