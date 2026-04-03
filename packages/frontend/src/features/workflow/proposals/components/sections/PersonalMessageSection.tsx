"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SectionBaseProps, PublicProposalContent, PublicProposalBrand } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import { useReveal, revealSx } from "@/features/workflow/proposals/utils/portal/animations";
import { useProposalScrollRef } from "@/features/workflow/proposals/components/ProposalScrollContext";

interface PersonalMessageSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    brand: PublicProposalBrand | null;
    producerName?: string | null;
    /** Backend-generated personal message (not from DB content) */
    personalMessage?: string | null;
}

/* ── Helpers ── */

/** Convert EditorJS-style blocks to simple HTML. Falls back to data.body if present. */
function blocksToHtml(data: Record<string, unknown> | undefined): string | null {
    if (!data) return null;
    if (typeof data.body === "string" && data.body) return data.body;
    const blocks = data.blocks as Array<{ type: string; data: Record<string, unknown> }> | undefined;
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    return blocks.map((b) => {
        const text = (b.data?.text as string) || "";
        switch (b.type) {
            case "header": return `<h${(b.data?.level as number) || 2}>${text}</h${(b.data?.level as number) || 2}>`;
            case "list": {
                const items = (b.data?.items as string[]) || [];
                const tag = b.data?.style === "ordered" ? "ol" : "ul";
                return `<${tag}>${items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`;
            }
            default: return `<p>${text}</p>`;
        }
    }).join("");
}

/* ── Main component ── */

export default function PersonalMessageSection({ content, brand, producerName, personalMessage, colors }: PersonalMessageSectionProps) {
    if (!isSectionVisible(content, "text")) return null;

    // Prefer the backend-generated template message; fall back to DB content
    const pm = content?.sections?.find((s) => s.type === "text");
    let greeting: string | null = null;
    let bodyHtml: string | null;
    if (personalMessage) {
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const parts = personalMessage.split('|');
        if (parts.length > 1) {
            greeting = parts[0];
            bodyHtml = `<p>${esc(parts.slice(1).join('|'))}</p>`;
        } else {
            bodyHtml = `<p>${esc(personalMessage)}</p>`;
        }
    } else {
        const raw = blocksToHtml(pm?.data);
        // Split "Dear Name, ..." into greeting + body when it arrives as a single block
        if (raw) {
            const match = raw.match(/^<p>(Dear\s+\w+,)\s*(.*)<\/p>$/s);
            if (match) {
                greeting = match[1];
                bodyHtml = `<p>${match[2]}</p>`;
            } else {
                bodyHtml = raw;
            }
        } else {
            bodyHtml = null;
        }
    }
    if (!bodyHtml && !greeting) return null;

    const brandName = brand?.display_name || brand?.name || "";
    const sigName = producerName || brandName || null;

    const scrollRootRef = useProposalScrollRef();
    const { ref, visible } = useReveal({ threshold: 0.15, rootRef: scrollRootRef });

    return (
        <Box
            ref={ref}
            sx={{
                maxWidth: 620,
                mx: "auto",
                px: { xs: 1, md: 0 },
                py: { xs: 2, md: 3 },
                ...revealSx(visible),
            }}
        >
            {/* Section label */}
            <Typography sx={{
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                fontSize: "0.6rem",
                fontWeight: 700,
                mb: { xs: 3.5, md: 4.5 },
                textAlign: "center",
            }}>
                {getSectionTitle(content, "text", "A Note For You")}
            </Typography>

            {/* Greeting — pulled out as its own element */}
            {greeting && (
                <Box sx={{ textAlign: "center", mb: { xs: 2, md: 2.5 } }}>
                    <Typography sx={{
                        color: alpha(colors.text, 0.92),
                        fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
                        fontSize: { xs: "1.35rem", md: "1.55rem" },
                        fontStyle: "italic",
                        fontWeight: 400,
                        lineHeight: 1.6,
                    }}>
                        {greeting}
                    </Typography>

                    {/* Thin accent divider */}
                    <Box sx={{
                        width: 40,
                        height: "1px",
                        bgcolor: alpha(colors.accent, 0.3),
                        mx: "auto",
                        mt: { xs: 2, md: 2.5 },
                    }} />
                </Box>
            )}

            {/* Letter body */}
            {bodyHtml && (
                <Box sx={{
                    position: "relative",
                    px: { xs: 2.5, md: 4 },
                    py: { xs: 1.5, md: 2 },
                    textAlign: "center",
                }}>
                    <Box
                        dangerouslySetInnerHTML={{ __html: bodyHtml }}
                        sx={{
                            color: alpha(colors.text, 0.6),
                            fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
                            fontSize: { xs: "1.15rem", md: "1.35rem" },
                            fontStyle: "italic",
                            fontWeight: 300,
                            lineHeight: 1.75,
                            "& p": { mb: 1 },
                            "& p:last-child": { mb: 0 },
                        }}
                    />
                </Box>
            )}

            {/* Signature */}
            {sigName && (
                <Box sx={{
                    mt: { xs: 4, md: 5 },
                    px: { xs: 2.5, md: 4 },
                    textAlign: "center",
                }}>
                    {/* Rule */}
                    <Box sx={{
                        width: 48,
                        height: "1px",
                        bgcolor: alpha(colors.accent, 0.4),
                        mb: 2.5,
                        mx: "auto",
                    }} />

                    {/* Role label */}
                    <Typography sx={{
                        fontFamily: '"Cormorant Garamond", Georgia, serif',
                        fontSize: "0.62rem",
                        fontWeight: 400,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: alpha(colors.muted, 0.75),
                        mb: 0.75,
                    }}>
                        Your producer
                    </Typography>

                    {/* Name in script */}
                    <Typography sx={{
                        fontFamily: '"Great Vibes", "Dancing Script", cursive',
                        fontSize: { xs: "2.1rem", md: "2.5rem" },
                        fontWeight: 400,
                        color: colors.text,
                        lineHeight: 1.2,
                        letterSpacing: "0.01em",
                    }}>
                        {sigName}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
