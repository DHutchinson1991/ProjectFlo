"use client";

import { Box, Typography, Divider } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { formatCurrency } from "@/features/workflow/proposals/utils/portal/formatting";
import { DEFAULT_CURRENCY } from "@projectflo/shared";
import type { SectionBaseProps, PublicProposalContent, PackageData } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

interface PackageDetailsSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    pkg?: PackageData | null;
}

export default function PackageDetailsSection({ content, pkg, colors, isDark, cardSx }: PackageDetailsSectionProps) {
    if (!isSectionVisible(content, "package-details")) return null;
    if (!pkg || !(pkg.contents?.items?.length)) return null;

    const currency = pkg.currency ?? DEFAULT_CURRENCY;

    return (
        <RevealBox>
            <Box sx={cardSx}>
                <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                    <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700, textAlign: "center" }}>
                        {getSectionTitle(content, "package-details", "Package Details")}
                    </Typography>
                </Box>
                <Box sx={{ px: { xs: 3.5, md: 5 }, pb: { xs: 3, md: 4 } }}>
                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: { xs: "1.15rem", md: "1.25rem" }, mt: 1.5, mb: 0.5 }}>
                        {pkg.name}
                    </Typography>
                    {pkg.description && (
                        <Typography sx={{ color: colors.muted, fontSize: "0.88rem", lineHeight: 1.6, mb: 2.5 }}>{pkg.description}</Typography>
                    )}
                    <Divider sx={{ borderColor: alpha(colors.border, 0.5), mb: 1 }} />
                    {pkg.contents!.items!.map((item, idx) => (
                        <Box
                            key={idx}
                            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 0.5, borderTop: idx > 0 ? `1px solid ${alpha(colors.border, 0.35)}` : "none" }}
                        >
                            <Box>
                                <Typography sx={{ color: colors.text, fontWeight: 500, fontSize: "0.88rem" }}>{item.description}</Typography>
                                {item.type && <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: "0.72rem", mt: 0.25 }}>{item.type}</Typography>}
                            </Box>
                            {Number(item.price) > 0 && (
                                <Typography sx={{ color: colors.accent, fontWeight: 500, fontSize: "0.88rem", fontFamily: "monospace" }}>
                                    {formatCurrency(item.price, currency)}
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>
        </RevealBox>
    );
}
