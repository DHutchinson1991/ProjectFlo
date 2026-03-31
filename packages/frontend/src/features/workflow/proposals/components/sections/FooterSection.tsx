"use client";

import { Box, Typography, Stack, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationOnIcon,
    Language as LanguageIcon,
} from "@mui/icons-material";
import { useReveal, revealSx } from "@/features/workflow/proposals/utils/portal/animations";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";
import type { PublicProposalBrand } from "@/features/workflow/proposals/types";

interface FooterSectionProps {
    brand: PublicProposalBrand | null;
    colors: PortalThemeColors;
    isDark: boolean;
}

export default function FooterSection({ brand, colors, isDark }: FooterSectionProps) {
    const footerReveal = useReveal();
    if (!brand) return null;

    const brandName = brand.display_name || brand.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();

    return (
        <Box
            ref={footerReveal.ref}
            sx={{
                borderTop: `1px solid ${alpha(colors.border, 0.4)}`,
                background: isDark
                    ? `radial-gradient(ellipse 80% 50% at 50% 0%, ${alpha(colors.accent, 0.04)} 0%, ${alpha(colors.card, 0.5)} 70%)`
                    : colors.card,
                py: { xs: 6, md: 8 }, px: 3,
                ...revealSx(footerReveal.visible, 0),
            }}
        >
            <Box sx={{ maxWidth: 680, mx: "auto" }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={4}>
                    <Box>
                        {brand.logo_url ? (
                            <Box component="img" src={brand.logo_url} alt={brandName} sx={{ height: 24, width: "auto", objectFit: "contain", mb: 1.5, opacity: 0.8 }} />
                        ) : brandInitial ? (
                            <Box
                                sx={{
                                    width: 32, height: 32, borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                    display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5, opacity: 0.8,
                                }}
                            >
                                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", lineHeight: 1 }}>{brandInitial}</Typography>
                            </Box>
                        ) : null}
                        <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.95rem", mb: 0.75 }}>{brandName}</Typography>
                        {brand.description && (
                            <Typography sx={{ color: colors.muted, maxWidth: 280, fontSize: "0.82rem", lineHeight: 1.6 }}>{brand.description}</Typography>
                        )}
                        {brand.website && (
                            <IconButton
                                size="small" component="a" href={brand.website} target="_blank" rel="noopener noreferrer"
                                sx={{ color: colors.muted, mt: 1.5, transition: "color 0.2s ease, transform 0.2s ease", "&:hover": { color: colors.accent, transform: "scale(1.1)" } }}
                            >
                                <LanguageIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                    </Box>
                    <Box>
                        <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, display: "block", mb: 2, fontSize: "0.6rem" }}>
                            Get in Touch
                        </Typography>
                        <Stack spacing={1.5}>
                            {brand.email && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <EmailIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6) }} />
                                    <Typography component="a" href={`mailto:${brand.email}`} sx={{ color: colors.muted, textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s ease", "&:hover": { color: colors.accent } }}>
                                        {brand.email}
                                    </Typography>
                                </Box>
                            )}
                            {brand.phone && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <PhoneIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6) }} />
                                    <Typography component="a" href={`tel:${brand.phone}`} sx={{ color: colors.muted, textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s ease", "&:hover": { color: colors.accent } }}>
                                        {brand.phone}
                                    </Typography>
                                </Box>
                            )}
                            {brand.address_line1 && (
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                    <LocationOnIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6), mt: 0.15 }} />
                                    <Typography sx={{ color: colors.muted, fontSize: "0.85rem" }}>
                                        {brand.address_line1}
                                        {brand.city && `, ${brand.city}`}
                                        {brand.state && `, ${brand.state}`}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}
