"use client";

import React, { useRef, useLayoutEffect, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Person as PersonIcon,
    Videocam as VideocamIcon,
    Mic as MicIcon,
} from "@mui/icons-material";
import type { SectionBaseProps, PublicProposalContent, PublicProposalEventDay, SlotGroup } from "@/features/workflow/proposals/types";
import {
    isSectionVisible,
    getSectionTitle,
    buildTeamTiers,
    breathe,
    isAudioEquipment,
} from "@/features/workflow/proposals/utils/portal/section-helpers";
import { useReveal, revealSx } from "@/features/workflow/proposals/utils/portal/animations";

interface TeamTiersSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    eventDays: PublicProposalEventDay[];
}

/* ── Phase config ───────────────────────────────────────────────── */
interface PhaseConfig {
    label: string;
    groups: SlotGroup[];
    color: (isDark: boolean) => string;
}

/* ── Person icon (shared across phases) ─────────────────────────── */
function PersonNode({ group, tc, size, colors, isDark }: {
    group: SlotGroup; tc: string; size: number;
    colors: SectionBaseProps["colors"]; isDark: boolean;
}) {
    const { assigned: isAssigned, confirmed: isConfirmed } = group;

    return (
        <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75,
            width: { xs: 100, md: 120 },
        }}>
            <Box sx={{ position: "relative" }}>
                {isConfirmed && (
                    <Box sx={{
                        position: "absolute", bottom: -3, left: "50%", transform: "translateX(-50%)",
                        width: size + 8, height: 18, borderRadius: "50%",
                        background: `radial-gradient(ellipse, ${alpha(tc, 0.35)} 0%, transparent 70%)`,
                        opacity: 0.5, filter: "blur(8px)",
                    }} />
                )}
                {isAssigned && !isConfirmed && (
                    <Box sx={{
                        position: "absolute", inset: 2, borderRadius: "50%",
                        border: `1.5px dashed ${alpha(tc, 0.5)}`,
                        animation: `${breathe} 2.8s ease-in-out infinite`,
                    }} />
                )}
                <PersonIcon sx={{
                    fontSize: size,
                    color: isConfirmed ? tc : "transparent",
                    stroke: isConfirmed ? "none" : alpha(tc, isAssigned ? 0.7 : 0.18),
                    strokeWidth: isConfirmed ? 0 : isAssigned ? 1.2 : 0.6,
                    filter: isConfirmed ? `drop-shadow(0 4px 16px ${alpha(tc, 0.35)})` : "none",
                    transition: "all 0.4s ease", display: "block",
                }} />
            </Box>
            <Typography sx={{
                fontSize: "0.6rem", fontWeight: 700,
                color: isAssigned ? alpha(tc, 0.75) : alpha(colors.muted, 0.25),
                textAlign: "center", textTransform: "uppercase",
                letterSpacing: "0.08em", lineHeight: 1.2, maxWidth: 120,
            }}>
                {group.roles.join(" / ")}
            </Typography>
            {isAssigned && group.fullName && (
                <Typography sx={{
                    fontSize: "0.78rem", fontWeight: 300,
                    color: alpha(colors.text, isConfirmed ? 0.7 : 0.5),
                    textAlign: "center", lineHeight: 1.25, letterSpacing: "0.02em",
                }}>
                    {group.fullName}
                </Typography>
            )}
        </Box>
    );
}

/* ── Equipment icon tile (larger) ───────────────────────────────── */
function EquipmentTile({ item, isAudio, manned, tc, colors }: {
    item: { id: number; item_name: string }; isAudio: boolean; manned: boolean;
    tc: string; colors: SectionBaseProps["colors"];
}) {
    const Icon = isAudio ? MicIcon : VideocamIcon;
    const size = 36;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, width: 90 }}>
            <Box sx={{ position: "relative" }}>
                {manned && (
                    <Box sx={{
                        position: "absolute", bottom: -3, left: "50%", transform: "translateX(-50%)",
                        width: size + 6, height: 12, borderRadius: "50%",
                        background: `radial-gradient(ellipse, ${alpha(tc, 0.3)} 0%, transparent 70%)`,
                        opacity: 0.5, filter: "blur(6px)",
                    }} />
                )}
                <Icon sx={{
                    fontSize: size,
                    color: manned ? tc : "transparent",
                    stroke: manned ? "none" : alpha(tc, 0.3),
                    strokeWidth: manned ? 0 : 0.7,
                    filter: manned ? `drop-shadow(0 3px 10px ${alpha(tc, 0.3)})` : "none",
                    opacity: manned ? 1 : 0.4,
                    transition: "all 0.4s ease", display: "block",
                }} />
            </Box>
            <Typography sx={{
                fontSize: "0.55rem", fontWeight: 500,
                color: alpha(colors.text, manned ? 0.55 : 0.2),
                textAlign: "center", lineHeight: 1.25, maxWidth: 100,
            }}>
                {item.item_name}
            </Typography>
        </Box>
    );
}

/* ── SVG connector lines (trunk + branches) ─────────────────────── */
function ConnectorLines({ containerRef, personRef, equipRefs, tc }: {
    containerRef: React.RefObject<HTMLDivElement | null>;
    personRef: React.RefObject<HTMLDivElement | null>;
    equipRefs: React.RefObject<(HTMLDivElement | null)[]>;
    tc: string;
}) {
    const [paths, setPaths] = useState<string[]>([]);

    const measure = useCallback(() => {
        const container = containerRef.current;
        const person = personRef.current;
        const equips = equipRefs.current;
        if (!container || !person || !equips) return;

        const cRect = container.getBoundingClientRect();
        const pRect = person.getBoundingClientRect();
        const startX = pRect.left + pRect.width / 2 - cRect.left;
        const startY = pRect.bottom - cRect.top;

        const newPaths: string[] = [];
        // Find the junction Y (midpoint between person bottom and first equipment top)
        let junctionY = startY;
        const validEquips = equips.filter(Boolean);
        if (validEquips.length > 0) {
            const firstEq = validEquips[0]!.getBoundingClientRect();
            junctionY = startY + (firstEq.top - cRect.top - startY) * 0.5;
        }

        // Trunk line: straight down from person to junction
        if (validEquips.length > 0) {
            newPaths.push(`M ${startX} ${startY} L ${startX} ${junctionY}`);
        }

        // Branches: bezier from junction to each equipment item
        for (const eq of equips) {
            if (!eq) continue;
            const eRect = eq.getBoundingClientRect();
            const endX = eRect.left + eRect.width / 2 - cRect.left;
            const endY = eRect.top - cRect.top;
            const cpY = junctionY + (endY - junctionY) * 0.55;
            newPaths.push(`M ${startX} ${junctionY} C ${startX} ${cpY}, ${endX} ${cpY}, ${endX} ${endY}`);
        }
        setPaths(newPaths);
    }, [containerRef, personRef, equipRefs]);

    useLayoutEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    if (paths.length === 0) return null;

    return (
        <svg style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            pointerEvents: "none", overflow: "visible",
        }}>
            {paths.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={alpha(tc, 0.18)} strokeWidth={1.5}
                    strokeDasharray={i === 0 ? "none" : "5 3"} />
            ))}
        </svg>
    );
}

/* ── Coverage crew node (person → trunk → branch → equipment) ───── */
function CoverageCrewNode({ group, tc, colors, isDark }: {
    group: SlotGroup; tc: string;
    colors: SectionBaseProps["colors"]; isDark: boolean;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const personRef = useRef<HTMLDivElement>(null);
    const equipRefs = useRef<(HTMLDivElement | null)[]>([]);

    const cameraEquip = group.equipment.filter((e) => !isAudioEquipment(e.item_name));
    const audioEquip = group.equipment.filter((e) => isAudioEquipment(e.item_name));
    const allEquip = [...cameraEquip, ...audioEquip];
    const hasEquipment = allEquip.length > 0;

    return (
        <Box ref={containerRef} sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {hasEquipment && (
                <ConnectorLines containerRef={containerRef} personRef={personRef} equipRefs={equipRefs} tc={tc} />
            )}

            <Box ref={personRef} sx={{ zIndex: 1, mb: hasEquipment ? 4.5 : 0 }}>
                <PersonNode group={group} tc={tc} size={56} colors={colors} isDark={isDark} />
            </Box>

            {hasEquipment && (
                <Box sx={{
                    display: "flex", justifyContent: "center",
                    gap: { xs: 2.5, md: 3.5 }, flexWrap: "wrap", zIndex: 1,
                }}>
                    {allEquip.map((item, idx) => (
                        <Box key={item.id} ref={(el: HTMLDivElement | null) => { equipRefs.current[idx] = el; }}>
                            <EquipmentTile
                                item={item}
                                isAudio={isAudioEquipment(item.item_name)}
                                manned={group.assigned}
                                tc={tc}
                                colors={colors}
                            />
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

/* ── Phase header ───────────────────────────────────────────────── */
function PhaseHeader({ label, tc }: { label: string; tc: string }) {
    return (
        <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 2, mb: 3,
        }}>
            <Box sx={{ flex: 1, maxWidth: 100, height: "1px", bgcolor: alpha(tc, 0.12) }} />
            <Typography sx={{
                fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.14em", color: alpha(tc, 0.55),
            }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, maxWidth: 100, height: "1px", bgcolor: alpha(tc, 0.12) }} />
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Main component                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

export default function TeamTiersSection({ content, eventDays, colors, isDark, cardSx }: TeamTiersSectionProps) {
    if (!isSectionVisible(content, "crew") && !isSectionVisible(content, "equipment")) return null;

    const allCrewSlots = eventDays.flatMap((d) => d.day_crew_slots || []);
    const { ref, visible } = useReveal();

    if (allCrewSlots.length === 0) {
        return (
            <Box ref={ref} sx={{ textAlign: "center", py: 3, ...revealSx(visible, 0) }}>
                <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 3, fontSize: "0.75rem", fontWeight: 700, mb: 2 }}>
                    {getSectionTitle(content, "crew", "Your Team")}
                </Typography>
                <Typography sx={{ color: colors.muted, fontSize: "0.85rem" }}>
                    Your dedicated team will be confirmed closer to the event.
                </Typography>
            </Box>
        );
    }

    const { onSiteMerged, leadershipGroups, postProdGroups } = buildTeamTiers(allCrewSlots);

    const phases: PhaseConfig[] = [
        { label: "Planning", groups: leadershipGroups, color: (d) => d ? "#66bb6a" : "#388e3c" },
        { label: "Coverage", groups: onSiteMerged, color: (d) => d ? "#42a5f5" : "#1976d2" },
        { label: "Post Production", groups: postProdGroups, color: (d) => d ? "#8f6197" : "#5c186e" },
    ].filter((p) => p.groups.length > 0);

    return (
        <Box ref={ref}>
            {/* Section title */}
            <Typography sx={{
                color: colors.accent, textTransform: "uppercase", letterSpacing: 3,
                fontSize: "0.75rem", fontWeight: 700, textAlign: "center", mb: 6,
                ...revealSx(visible, 0),
            }}>
                {getSectionTitle(content, "crew", "Your Team")}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {phases.map((phase, phaseIdx) => {
                    const tc = phase.color(isDark);
                    const isCoverage = phase.label === "Coverage";
                    return (
                        <Box key={phase.label} sx={{ ...revealSx(visible, 0.1 + phaseIdx * 0.15) }}>
                            <PhaseHeader label={phase.label} tc={tc} />

                            {/* Crew tiles / nodes */}
                            <Box sx={{
                                display: "flex", justifyContent: "center",
                                gap: { xs: 3, md: 5 }, flexWrap: "wrap",
                            }}>
                                {phase.groups.map((group) =>
                                    isCoverage ? (
                                        <CoverageCrewNode
                                            key={group.id}
                                            group={group}
                                            tc={tc}
                                            colors={colors}
                                            isDark={isDark}
                                        />
                                    ) : (
                                        <PersonNode
                                            key={group.id}
                                            group={group}
                                            tc={tc}
                                            size={phase.label === "Planning" ? 60 : 52}
                                            colors={colors}
                                            isDark={isDark}
                                        />
                                    ),
                                )}
                            </Box>

                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
