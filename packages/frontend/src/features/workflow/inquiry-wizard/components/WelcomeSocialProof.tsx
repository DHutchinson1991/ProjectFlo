"use client";

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Star as StarIcon } from "@mui/icons-material";
import { C } from '../constants/wizard-config';
import { fadeInUp } from '../constants/animations';

const PLATFORM_ICONS: Record<string, { svg: string; label: string; color: string }> = {
    instagram: {
        label: "Instagram", color: "#E1306C",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>`,
    },
    tiktok: {
        label: "TikTok", color: "#00f2ea",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>`,
    },
    youtube: {
        label: "YouTube", color: "#FF0000",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>`,
    },
    facebook: {
        label: "Facebook", color: "#1877F2",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04z"/></svg>`,
    },
    website: {
        label: "Website", color: "#94a3b8",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2 0-.68.06-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2M12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.923 7.923 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8.008 8.008 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26M12 4.03c.83 1.2 1.48 2.54 1.91 3.97h-3.82c.43-1.43 1.08-2.77 1.91-3.97M19.92 8h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/></svg>`,
    },
    vimeo: {
        label: "Vimeo", color: "#1ab7ea",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 7.42c-.09 1.95-1.45 4.63-4.09 8.02C15.17 19.14 12.7 21 10.65 21c-1.27 0-2.35-1.17-3.23-3.52l-1.76-6.47c-.65-2.35-1.35-3.52-2.09-3.52-.16 0-.73.34-1.7 1.02L1 7.37c1.07-.94 2.12-1.88 3.16-2.82C5.57 3.37 6.85 2.73 7.75 2.65c1.76-.17 2.84 1.03 3.25 3.61.44 2.78.74 4.51.92 5.18.51 2.31 1.07 3.47 1.68 3.47.47 0 1.19-.75 2.14-2.25.95-1.5 1.46-2.64 1.53-3.42.14-1.29-.37-1.93-1.52-1.93-.54 0-1.1.12-1.67.37 1.11-3.63 3.23-5.39 6.36-5.29 2.32.07 3.41 1.57 3.27 4.51l.29.02z"/></svg>`,
    },
    pinterest: {
        label: "Pinterest", color: "#E60023",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.14-1.32-.57-2.15-2.46-2.15-3.9 0-3.16 2.29-6.04 6.61-6.04 3.45 0 6.14 2.47 6.14 5.77 0 3.45-2.18 6.24-5.2 6.24-1.01 0-1.95-.52-2.3-1.15l-.63 2.35c-.23.86-.86 1.95-1.22 2.58z"/></svg>`,
    },
};

interface SocialLink { platform: string; url: string; }
interface Testimonial { name: string; text: string; image_url?: string; rating?: number; }

interface Props {
    socialProofCount: number;
    socialProofText: string;
    socialLinks: SocialLink[];
    testimonials: Testimonial[];
}

export default function WelcomeSocialProof({ socialProofCount, socialProofText, socialLinks, testimonials }: Props) {
    if (socialProofCount === 0 && socialLinks.length === 0 && testimonials.length === 0) return null;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, animation: `${fadeInUp} 0.7s ease-out 0.65s both`, width: "100%", maxWidth: 860 }}>
            <Box sx={{ width: 48, height: 1, bgcolor: alpha(C.border, 0.4) }} />

            {socialProofCount > 0 && (
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                    <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", background: `linear-gradient(135deg, ${C.accent}, ${C.gradient2})`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {socialProofCount.toLocaleString()}+
                    </Typography>
                    <Typography sx={{ color: alpha(C.muted, 0.55), fontSize: "0.85rem", fontWeight: 500 }}>
                        {socialProofText}
                    </Typography>
                </Box>
            )}

            {testimonials.length > 0 && (
                <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap", width: "100%", px: 1, mt: 0.5 }}>
                    {testimonials.slice(0, 3).map((t, i) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, minWidth: 250, flex: "1 1 250px", maxWidth: 320, borderRadius: "14px", bgcolor: alpha(C.card, 0.35), border: `1px solid ${alpha(C.border, 0.15)}` }}>
                            {t.image_url && (
                                <Box sx={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: `2px solid ${alpha(C.accent, 0.12)}`, flexShrink: 0 }}>
                                    <Box component="img" src={t.image_url} alt={t.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </Box>
                            )}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
                                    <Typography sx={{ color: alpha(C.text, 0.7), fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                                        {t.name}
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.1 }}>
                                        {Array.from({ length: t.rating || 5 }).map((_, s) => (
                                            <StarIcon key={s} sx={{ fontSize: "0.65rem", color: "#facc15" }} />
                                        ))}
                                    </Box>
                                </Box>
                                <Typography sx={{ color: alpha(C.muted, 0.6), fontSize: "0.7rem", lineHeight: 1.45, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                    &ldquo;{t.text}&rdquo;
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            {socialLinks.length > 0 && (
                <Box sx={{ display: "inline-flex", gap: 0.5, alignItems: "center" }}>
                    {socialLinks.map((link, i) => {
                        const platform = PLATFORM_ICONS[link.platform];
                        if (!platform) return null;
                        return (
                            <IconButton key={i} component="a" href={link.url} target="_blank" rel="noopener noreferrer" size="small"
                                sx={{ width: 40, height: 40, color: alpha(C.muted, 0.5), borderRadius: "50%", transition: "all 0.25s ease", "&:hover": { color: platform.color, bgcolor: alpha(platform.color, 0.1), transform: "translateY(-2px) scale(1.1)" } }}
                                aria-label={platform.label}>
                                <Box sx={{ width: 20, height: 20 }} dangerouslySetInnerHTML={{ __html: platform.svg }} />
                            </IconButton>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}
