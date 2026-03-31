"use client";

import { Box, Typography, Divider } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Person as PersonIcon, Groups as GroupsIcon } from "@mui/icons-material";
import type { SectionBaseProps, PublicProposalContent, PublicProposalEventDay } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

interface SubjectsSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    eventDays: PublicProposalEventDay[];
}

export default function SubjectsSection({ content, eventDays, colors, isDark, cardSx }: SubjectsSectionProps) {
    if (!isSectionVisible(content, "subjects")) return null;

    const allSubjects = eventDays.flatMap((d) => d.subjects || []);
    const uniqueSubjects = allSubjects.filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i);
    if (uniqueSubjects.length === 0) return null;

    return (
        <RevealBox>
            <Box sx={cardSx}>
                <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                    <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700, textAlign: "center" }}>
                        {getSectionTitle(content, "subjects", "Key People")}
                    </Typography>
                </Box>
                <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />
                <Box
                    sx={{
                        display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: 0,
                        px: { xs: 3.5, md: 5 }, py: { xs: 2, md: 2.5 },
                    }}
                >
                    {uniqueSubjects.map((s) => {
                        const isGroup = (s.count || 0) > 1;
                        const SubjectIcon = isGroup ? GroupsIcon : PersonIcon;
                        return (
                            <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        bgcolor: alpha(colors.accent, isDark ? 0.1 : 0.06),
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}
                                >
                                    <SubjectIcon sx={{ color: colors.accent, fontSize: 16 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.85rem", lineHeight: 1.2 }}>{s.name}</Typography>
                                    {s.real_name && <Typography sx={{ color: colors.muted, fontSize: "0.72rem", mt: 0.15 }}>{s.real_name}</Typography>}
                                    {isGroup && <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: "0.68rem", mt: 0.15 }}>{s.count} people</Typography>}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </RevealBox>
    );
}
