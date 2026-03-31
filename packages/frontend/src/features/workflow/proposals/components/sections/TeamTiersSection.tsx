"use client";

import { Box, Typography, Divider } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Person as PersonIcon,
    Videocam as VideocamIcon,
    Mic as MicIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
} from "@mui/icons-material";
import type { SectionBaseProps, PublicProposalContent, PublicProposalEventDay, SlotGroup } from "@/features/workflow/proposals/types";
import {
    isSectionVisible,
    getSectionTitle,
    buildTeamTiers,
    isAudioEquipment,
    breathe,
} from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

interface TeamTiersSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    eventDays: PublicProposalEventDay[];
}

export default function TeamTiersSection({ content, eventDays, colors, isDark, cardSx }: TeamTiersSectionProps) {
    if (!isSectionVisible(content, "crew") && !isSectionVisible(content, "equipment")) return null;

    const allCrewSlots = eventDays.flatMap((d) => d.day_crew_slots || []);

    if (allCrewSlots.length === 0) {
        return (
            <RevealBox>
                <Box sx={cardSx}>
                    <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                        <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700, textAlign: "center" }}>
                            {getSectionTitle(content, "crew", "Your Team")}
                        </Typography>
                    </Box>
                    <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />
                    <Box sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2, md: 2.5 }, textAlign: "center" }}>
                        <Typography sx={{ color: colors.muted, fontSize: "0.85rem", py: 2 }}>
                            Your dedicated team will be confirmed closer to the event.
                        </Typography>
                    </Box>
                </Box>
            </RevealBox>
        );
    }

    const { onSiteMerged, leadershipGroups, postProdGroups, assignedCount, confirmedCount, totalCount } = buildTeamTiers(allCrewSlots);
    const allAssigned = assignedCount === totalCount;
    const allConfirmed = confirmedCount === totalCount;

    const tierColors = {
        leadership: isDark ? "#66bb6a" : "#388e3c",
        onSite: isDark ? "#42a5f5" : "#1976d2",
        postProd: isDark ? "#8f6197" : "#5c186e",
    };
    const tierSizes = { leadership: 56, onSite: 48, postProd: 42 };
    const confirmedGreen = isDark ? "#66bb6a" : "#388e3c";

    const renderSlot = (group: SlotGroup, tierColor: string, iconSize: number) => {
        const isAssigned = group.assigned;
        const isConfirmed = group.confirmed;
        const assignedOnly = isAssigned && !isConfirmed;
        return (
            <Box key={group.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25, width: { xs: 80, md: 100 } }}>
                <Box sx={{ position: "relative" }}>
                    {isConfirmed && (
                        <Box sx={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", width: iconSize, height: 14, borderRadius: "50%", background: `radial-gradient(ellipse, ${alpha(tierColor, 0.35)} 0%, transparent 70%)`, opacity: 0.4, filter: "blur(6px)" }} />
                    )}
                    {assignedOnly && (
                        <Box sx={{ position: "absolute", inset: 2, borderRadius: "50%", border: `1.5px dashed ${alpha(tierColor, 0.5)}`, animation: `${breathe} 2.8s ease-in-out infinite` }} />
                    )}
                    <PersonIcon sx={{
                        fontSize: iconSize,
                        color: isConfirmed ? tierColor : "transparent",
                        stroke: isConfirmed ? "none" : alpha(tierColor, assignedOnly ? 0.7 : 0.18),
                        strokeWidth: isConfirmed ? 0 : assignedOnly ? 1.2 : 0.6,
                        filter: isConfirmed ? `drop-shadow(0 3px 12px ${alpha(tierColor, 0.3)})` : "none",
                        transition: "all 0.4s ease", display: "block",
                    }} />
                </Box>
                <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: isAssigned ? alpha(tierColor, 0.7) : alpha(colors.muted, 0.2), textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.2, maxWidth: 110, mt: 0.25 }}>
                    {group.roles.join(" / ")}
                </Typography>
                {isAssigned && group.fullName && (
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 300, color: alpha(colors.text, isConfirmed ? 0.65 : 0.5), textAlign: "center", lineHeight: 1.25, letterSpacing: "0.02em" }}>
                        {group.fullName}
                    </Typography>
                )}
                {!isAssigned && (
                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 400, color: alpha(colors.muted, 0.2), textAlign: "center", lineHeight: 1.2, fontStyle: "italic" }}>
                        Awaiting
                    </Typography>
                )}
            </Box>
        );
    };

    const renderEquipmentIcon = (eq: { id: number; item_name: string }, assigned: boolean, tColor: string) => {
        const EquipIcon = isAudioEquipment(eq.item_name) ? MicIcon : VideocamIcon;
        return (
            <Box key={eq.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25, width: 60 }}>
                <EquipIcon sx={{ fontSize: 32, color: assigned ? alpha(tColor, 0.6) : alpha(colors.muted, 0.1), filter: assigned ? `drop-shadow(0 2px 8px ${alpha(tColor, 0.2)})` : "none", transition: "all 0.4s ease" }} />
                <Typography sx={{ fontSize: "0.48rem", fontWeight: 500, color: assigned ? alpha(colors.text, 0.45) : alpha(colors.muted, 0.18), textAlign: "center", lineHeight: 1.15, maxWidth: 70 }}>
                    {eq.item_name}
                </Typography>
            </Box>
        );
    };

    const tierDividerLabeled = (label: string, colorAbove: string, colorBelow: string) => (
        <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1.5, py: 1.5 }}>
            <Box sx={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${alpha(colorAbove, 0.15)})` }} />
            <Typography sx={{ fontSize: "0.5rem", fontWeight: 600, color: alpha(colorBelow, 0.45), textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${alpha(colorBelow, 0.15)})` }} />
        </Box>
    );

    return (
        <RevealBox>
            <Box sx={cardSx}>
                <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                    <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700, textAlign: "center" }}>
                        {getSectionTitle(content, "crew", "Your Team")}
                    </Typography>
                </Box>
                <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />

                <Box sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    {/* Leadership tier */}
                    {leadershipGroups.length > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 2, md: 3 }, flexWrap: "wrap" }}>
                            {leadershipGroups.map((g) => renderSlot(g, tierColors.leadership, tierSizes.leadership))}
                        </Box>
                    )}

                    {leadershipGroups.length > 0 && onSiteMerged.length > 0 && tierDividerLabeled("Production", tierColors.leadership, tierColors.onSite)}

                    {/* On-site tier with bezier-connected equipment */}
                    {onSiteMerged.length > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 3, md: 4 }, flexWrap: "wrap" }}>
                            {onSiteMerged.map((group) => {
                                const eqCount = group.equipment.length;
                                const itemW = 60;
                                const gapPx = 12;
                                const totalW = eqCount > 0 ? eqCount * itemW + (eqCount - 1) * gapPx : 0;
                                const svgH = 32;
                                const midX = totalW / 2;
                                const lineColor = alpha(group.assigned ? tierColors.onSite : colors.muted, group.assigned ? 0.25 : 0.08);
                                const dotColor = alpha(group.assigned ? tierColors.onSite : colors.muted, group.assigned ? 0.45 : 0.12);
                                return (
                                    <Box key={group.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        {renderSlot(group, tierColors.onSite, tierSizes.onSite)}
                                        {eqCount > 0 && (
                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 0.5 }}>
                                                <svg width={Math.max(totalW, 20)} height={svgH} style={{ display: "block", overflow: "visible" }}>
                                                    <circle cx={midX} cy={2} r={2.5} fill={dotColor} />
                                                    <line x1={midX} y1={2} x2={midX} y2={svgH * 0.4} stroke={lineColor} strokeWidth={1} />
                                                    {group.equipment.map((_, i) => {
                                                        const eqCenterX = i * (itemW + gapPx) + itemW / 2;
                                                        const branchY = svgH * 0.4;
                                                        const endY = svgH - 2;
                                                        return (
                                                            <g key={i}>
                                                                <path d={`M ${midX} ${branchY} C ${midX} ${branchY + 6}, ${eqCenterX} ${endY - 8}, ${eqCenterX} ${endY}`} stroke={lineColor} strokeWidth={1} fill="none" />
                                                                <circle cx={eqCenterX} cy={endY} r={2} fill={dotColor} />
                                                            </g>
                                                        );
                                                    })}
                                                </svg>
                                                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
                                                    {group.equipment.map((eq) => renderEquipmentIcon(eq, group.assigned, tierColors.onSite))}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {(leadershipGroups.length > 0 || onSiteMerged.length > 0) && postProdGroups.length > 0 && tierDividerLabeled("Post-Production", tierColors.onSite, tierColors.postProd)}

                    {/* Post-production tier */}
                    {postProdGroups.length > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 2, md: 3 }, flexWrap: "wrap" }}>
                            {postProdGroups.map((g) => renderSlot(g, tierColors.postProd, tierSizes.postProd))}
                        </Box>
                    )}

                    {/* Summary bar */}
                    <Box sx={{
                        mt: 1.5, px: 2.5, py: 1, borderRadius: 2,
                        bgcolor: allConfirmed ? alpha(confirmedGreen, isDark ? 0.1 : 0.06) : allAssigned ? alpha(colors.accent, isDark ? 0.08 : 0.05) : alpha(colors.border, 0.12),
                        border: `1px solid ${allConfirmed ? alpha(confirmedGreen, 0.25) : allAssigned ? alpha(colors.accent, 0.2) : alpha(colors.border, 0.2)}`,
                        display: "flex", alignItems: "center", gap: 1,
                    }}>
                        {allConfirmed ? (
                            <CheckCircleIcon sx={{ fontSize: 15, color: confirmedGreen }} />
                        ) : allAssigned ? (
                            <CheckCircleIcon sx={{ fontSize: 15, color: alpha(colors.accent, 0.6) }} />
                        ) : (
                            <ScheduleIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.35) }} />
                        )}
                        <Typography sx={{
                            fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em",
                            color: allConfirmed ? confirmedGreen : allAssigned ? alpha(colors.accent, 0.7) : alpha(colors.muted, 0.5),
                        }}>
                            {allConfirmed ? "All Confirmed" : `${assignedCount} / ${totalCount} Assigned${confirmedCount > 0 ? ` · ${confirmedCount} Confirmed` : ""}`}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </RevealBox>
    );
}
