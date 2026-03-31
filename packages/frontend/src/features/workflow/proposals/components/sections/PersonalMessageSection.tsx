"use client";

import { Box, Typography, Divider } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { sanitizeHtml } from "@/features/workflow/proposals/utils/portal/formatting";
import type { SectionBaseProps, PublicProposalContent, PublicProposalBrand } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

interface PersonalMessageSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    brand: PublicProposalBrand | null;
}

/** Convert EditorJS-style blocks to simple HTML. Falls back to data.body if present. */
function blocksToHtml(data: Record<string, unknown> | undefined): string | null {
    if (!data) return null;
    // Legacy: already-rendered HTML in body field
    if (typeof data.body === "string" && data.body) return data.body;
    // EditorJS blocks array
    const blocks = data.blocks as Array<{ type: string; data: Record<string, unknown> }> | undefined;
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    return blocks
        .map((b) => {
            const text = (b.data?.text as string) || "";
            switch (b.type) {
                case "header": {
                    const level = (b.data?.level as number) || 2;
                    return `<h${level}>${text}</h${level}>`;
                }
                case "list": {
                    const items = (b.data?.items as string[]) || [];
                    const tag = b.data?.style === "ordered" ? "ol" : "ul";
                    return `<${tag}>${items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`;
                }
                default:
                    return `<p>${text}</p>`;
            }
        })
        .join("");
}

export default function PersonalMessageSection({ content, brand, colors, isDark, cardSx }: PersonalMessageSectionProps) {
    if (!isSectionVisible(content, "text")) return null;

    const pm = content?.sections?.find((s) => s.type === "text");
    const pmHtml = blocksToHtml(pm?.data);
    if (!pmHtml) return null;

    const brandName = brand?.display_name || brand?.name || "";

    return (
        <RevealBox>
            <Box sx={{ textAlign: "center", py: { xs: 1, md: 1.5 } }}>
                <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700, mb: 2 }}>
                    {getSectionTitle(content, "text", "A Note For You")}
                </Typography>
                <Box
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(pmHtml) }}
                    sx={{
                        "& p": { color: colors.text, fontSize: { xs: "0.95rem", md: "1.05rem" }, lineHeight: 1.9, mb: 2, fontWeight: 300, "&:last-child": { mb: 0 } },
                        "& h2": { color: colors.text, fontSize: "1.2rem", fontWeight: 500, mt: 3, mb: 1.5 },
                        "& h3": { color: colors.text, fontSize: "1.05rem", fontWeight: 500, mt: 2, mb: 1 },
                        "& ul, & ol": { color: colors.text, pl: 2.5, mb: 2, "& li": { fontSize: "0.95rem", lineHeight: 1.7, mb: 0.5 } },
                    }}
                />
                <Divider sx={{ borderColor: alpha(colors.border, 0.4), my: 2 }} />
                <Typography sx={{ color: colors.muted, fontSize: "0.75rem", fontStyle: "italic" }}>— {brandName || "Your team"}</Typography>
            </Box>
        </RevealBox>
    );
}
