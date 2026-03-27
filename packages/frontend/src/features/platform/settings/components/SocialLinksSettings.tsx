import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    Alert,
    CircularProgress,
    TextField,
    InputAdornment,
} from "@mui/material";
import {
    Save as SaveIcon,
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { settingsApi } from "@/features/platform/settings/api";
import { WelcomeSettings, Testimonial } from "@/features/platform/brand/types";
import { useBrand } from "@/features/platform/brand";

// ── Dark design tokens ──────────────────────────────────────────────────────
const border0 = "rgba(255,255,255,0.07)";
const border1 = "rgba(255,255,255,0.12)";
const accent = "#3b82f6";
const accentBorder = "rgba(59,130,246,0.35)";
const muted = "#64748b";
const body = "#cbd5e1";
const heading = "#f1f5f9";
const bg1 = "rgba(255,255,255,0.025)";
const successGreen = "#22c55e";
const successBg = "rgba(34,197,94,0.08)";

const cardSx = {
    bgcolor: bg1,
    border: `1px solid ${border0}`,
    borderRadius: "14px",
    backdropFilter: "blur(8px)",
};

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        color: body, fontSize: "0.82rem", borderRadius: "10px",
        bgcolor: "rgba(255,255,255,0.03)",
        "& fieldset": { borderColor: border0 },
        "&:hover fieldset": { borderColor: border1 },
        "&.Mui-focused fieldset": { borderColor: accentBorder, borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root": { color: muted, fontSize: "0.8rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: accent },
};

// ── Platform definitions with SVG paths ─────────────────────────────────────
const SOCIAL_PLATFORMS: { key: string; label: string; color: string; svg: string }[] = [
    {
        key: "instagram", label: "Instagram", color: "#E1306C",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>`,
    },
    {
        key: "tiktok", label: "TikTok", color: "#00f2ea",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>`,
    },
    {
        key: "youtube", label: "YouTube", color: "#FF0000",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>`,
    },
    {
        key: "facebook", label: "Facebook", color: "#1877F2",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04z"/></svg>`,
    },
    {
        key: "website", label: "Website", color: "#64748b",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2 0-.68.06-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2M12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.923 7.923 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8.008 8.008 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26M12 4.03c.83 1.2 1.48 2.54 1.91 3.97h-3.82c.43-1.43 1.08-2.77 1.91-3.97M19.92 8h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/></svg>`,
    },
    {
        key: "vimeo", label: "Vimeo", color: "#1ab7ea",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 7.42c-.09 1.95-1.45 4.63-4.09 8.02C15.17 19.14 12.7 21 10.65 21c-1.27 0-2.35-1.17-3.23-3.52l-1.76-6.47c-.65-2.35-1.35-3.52-2.09-3.52-.16 0-.73.34-1.7 1.02L1 7.37c1.07-.94 2.12-1.88 3.16-2.82C5.57 3.37 6.85 2.73 7.75 2.65c1.76-.17 2.84 1.03 3.25 3.61.44 2.78.74 4.51.92 5.18.51 2.31 1.07 3.47 1.68 3.47.47 0 1.19-.75 2.14-2.25.95-1.5 1.46-2.64 1.53-3.42.14-1.29-.37-1.93-1.52-1.93-.54 0-1.1.12-1.67.37 1.11-3.63 3.23-5.39 6.36-5.29 2.32.07 3.41 1.57 3.27 4.51l.29.02z"/></svg>`,
    },
    {
        key: "pinterest", label: "Pinterest", color: "#E60023",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.14-1.32-.57-2.15-2.46-2.15-3.9 0-3.16 2.29-6.04 6.61-6.04 3.45 0 6.14 2.47 6.14 5.77 0 3.45-2.18 6.24-5.2 6.24-1.01 0-1.95-.52-2.3-1.15l-.63 2.35c-.23.86-.86 1.95-1.22 2.58z"/></svg>`,
    },
];

export default function SocialLinksSettings() {
    const { currentBrand } = useBrand();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [welcomeSettings, setWelcomeSettings] = useState<WelcomeSettings | null>(null);
    const [draft, setDraft] = useState<Partial<WelcomeSettings>>({});
    const [saving, setSaving] = useState(false);

    // ── Load ────────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!currentBrand?.id) return;
        try {
            setLoading(true);
            const ws = await settingsApi.getWelcomeSettings(currentBrand.id).catch(() => null);
            if (ws) {
                setWelcomeSettings(ws);
                setDraft(ws);
            }
        } catch {
            setError("Failed to load social settings.");
        } finally {
            setLoading(false);
        }
    }, [currentBrand?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const updateDraft = (key: keyof WelcomeSettings, value: unknown) => {
        setDraft(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!currentBrand?.id) return;
        setSaving(true);
        try {
            const saved = await settingsApi.saveWelcomeSettings(currentBrand.id, draft);
            setWelcomeSettings(saved);
            setDraft(saved);
            setSuccess("Social settings saved");
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError("Failed to save social settings.");
        } finally {
            setSaving(false);
        }
    };

    // Build a map from platform key -> url for quick lookup
    const linkMap = new Map((draft.social_links || []).map(l => [l.platform, l.url]));

    const togglePlatform = (platformKey: string) => {
        const links = [...(draft.social_links || [])];
        const idx = links.findIndex(l => l.platform === platformKey);
        if (idx >= 0) {
            // Remove it
            links.splice(idx, 1);
            updateDraft("social_links", links);
        } else {
            // Add it
            links.push({ platform: platformKey, url: "" });
            updateDraft("social_links", links);
        }
    };

    const updateLinkUrl = (platformKey: string, url: string) => {
        const links = [...(draft.social_links || [])];
        const idx = links.findIndex(l => l.platform === platformKey);
        if (idx >= 0) {
            links[idx] = { ...links[idx], url };
            updateDraft("social_links", links);
        }
    };

    // ── Testimonial helpers ─────────────────────────────────────────────────
    const testimonials: Testimonial[] = (draft.testimonials as Testimonial[]) || [];

    const addTestimonial = () => {
        updateDraft("testimonials", [...testimonials, { name: "", text: "", rating: 5, image_url: "" }]);
    };

    const updateTestimonial = (idx: number, field: keyof Testimonial, value: string | number) => {
        const updated = [...testimonials];
        updated[idx] = { ...updated[idx], [field]: value };
        updateDraft("testimonials", updated);
    };

    const removeTestimonial = (idx: number) => {
        updateDraft("testimonials", testimonials.filter((_, i) => i !== idx));
    };

    const seedTestimonials = () => {
        const seeds: Testimonial[] = [
            { name: "Emily & James", text: "Absolutely blown away by our wedding film. Every emotion captured perfectly.", rating: 5, image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=120&h=120&fit=crop&crop=faces" },
            { name: "Sophie & Dan", text: "We've watched it a hundred times and cry every single time. Pure magic.", rating: 5, image_url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=120&h=120&fit=crop&crop=faces" },
            { name: "Rachel & Tom", text: "Worth every penny. Our families can't stop talking about how beautiful it is.", rating: 5, image_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=120&h=120&fit=crop&crop=faces" },
        ];
        updateDraft("testimonials", seeds);
    };

    const hasChanges = JSON.stringify(draft) !== JSON.stringify(welcomeSettings);

    // ── Loading ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={36} sx={{ color: accent }} />
                    <Typography sx={{ color: muted, fontSize: "0.8rem" }}>Loading…</Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
            {/* Header */}
            <Box sx={{ pt: 3, pb: 2 }}>
                <Typography sx={{ color: heading, fontWeight: 700, fontSize: "1.25rem" }}>Social Links</Typography>
                <Typography sx={{ color: muted, fontSize: "0.8rem", mt: 0.25 }}>
                    Social proof & links displayed on your inquiry welcome page
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, bgcolor: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", "& .MuiAlert-icon": { color: "#ef4444" } }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, bgcolor: successBg, color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", "& .MuiAlert-icon": { color: successGreen } }}>
                    {success}
                </Alert>
            )}

            {/* ── Social Proof ───────────────────────────────────────────── */}
            <Box sx={{ ...cardSx, mb: 3, maxWidth: 900, p: 2.5 }}>
                <Typography sx={{ color: heading, fontWeight: 600, fontSize: "0.95rem", mb: 0.5 }}>Social Proof</Typography>
                <Typography sx={{ color: muted, fontSize: "0.68rem", mb: 2 }}>
                    The displayed count = starting number + completed jobs ({welcomeSettings?.social_proof_count ?? 0} total)
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField label="Starting Number" size="small" type="number" sx={{ ...fieldSx, width: 160 }}
                        value={draft.social_proof_start ?? 0}
                        onChange={e => updateDraft("social_proof_start", Math.max(0, parseInt(e.target.value) || 0))} />
                    <TextField label="Proof Text" size="small" sx={{ ...fieldSx, flex: 1 }}
                        value={draft.social_proof_text || ""} placeholder="happy customers"
                        onChange={e => updateDraft("social_proof_text", e.target.value)} />
                </Box>
            </Box>

            {/* ── Social Links ───────────────────────────────────────────── */}
            <Box sx={{ ...cardSx, mb: 3, maxWidth: 900, p: 2.5 }}>
                <Typography sx={{ color: heading, fontWeight: 600, fontSize: "0.95rem", mb: 0.5 }}>Social Links</Typography>
                <Typography sx={{ color: muted, fontSize: "0.68rem", mb: 2.5 }}>
                    Click a platform to toggle it on. Active links are displayed on your welcome page.
                </Typography>

                {/* Platform icon row */}
                <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
                    {SOCIAL_PLATFORMS.map(p => {
                        const isActive = linkMap.has(p.key);
                        return (
                            <Box
                                key={p.key}
                                onClick={() => togglePlatform(p.key)}
                                sx={{
                                    width: 48, height: 48, borderRadius: "12px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", transition: "all 0.2s ease",
                                    border: `1.5px solid ${isActive ? p.color : border0}`,
                                    bgcolor: isActive ? `${p.color}18` : "rgba(255,255,255,0.02)",
                                    color: isActive ? p.color : "rgba(255,255,255,0.2)",
                                    "&:hover": {
                                        borderColor: isActive ? p.color : border1,
                                        bgcolor: isActive ? `${p.color}22` : "rgba(255,255,255,0.05)",
                                        color: isActive ? p.color : "rgba(255,255,255,0.4)",
                                        transform: "translateY(-1px)",
                                    },
                                    "& svg": { width: 22, height: 22 },
                                    position: "relative",
                                }}
                                title={p.label}
                            >
                                <Box
                                    component="span"
                                    dangerouslySetInnerHTML={{ __html: p.svg }}
                                    sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                />
                            </Box>
                        );
                    })}
                </Box>

                {/* URL fields for active platforms */}
                {SOCIAL_PLATFORMS.filter(p => linkMap.has(p.key)).length > 0 && (
                    <Stack spacing={1.5}>
                        {SOCIAL_PLATFORMS.filter(p => linkMap.has(p.key)).map(p => (
                            <TextField
                                key={p.key}
                                size="small"
                                fullWidth
                                sx={fieldSx}
                                value={linkMap.get(p.key) || ""}
                                placeholder={`https://${p.key === "website" ? "yoursite.com" : p.key + ".com/yourhandle"}`}
                                onChange={e => updateLinkUrl(p.key, e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Box sx={{
                                                display: "flex", alignItems: "center", gap: 1,
                                                color: p.color, "& svg": { width: 16, height: 16 },
                                            }}>
                                                <Box component="span" dangerouslySetInnerHTML={{ __html: p.svg }}
                                                    sx={{ display: "flex", alignItems: "center" }} />
                                                <Typography sx={{ color: body, fontSize: "0.75rem", fontWeight: 500,  minWidth: 60 }}>
                                                    {p.label}
                                                </Typography>
                                            </Box>
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Box
                                                onClick={() => togglePlatform(p.key)}
                                                sx={{
                                                    cursor: "pointer", display: "flex", alignItems: "center",
                                                    color: muted, "&:hover": { color: "#ef4444" },
                                                }}
                                            >
                                                <CloseIcon sx={{ fontSize: "0.85rem" }} />
                                            </Box>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        ))}
                    </Stack>
                )}
            </Box>

            {/* ── Testimonials ───────────────────────────────────────────── */}
            <Box sx={{ ...cardSx, mb: 3, maxWidth: 900, p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ color: heading, fontWeight: 600, fontSize: "0.95rem" }}>Testimonials</Typography>
                    {testimonials.length === 0 && (
                        <Button size="small" onClick={seedTestimonials}
                            sx={{ color: accent, fontSize: "0.7rem", textTransform: "none" }}>
                            Load examples
                        </Button>
                    )}
                </Box>
                <Typography sx={{ color: muted, fontSize: "0.68rem", mb: 2.5 }}>
                    Client reviews displayed on your welcome page. Add a photo, name, short review and star rating.
                </Typography>

                <Stack spacing={2}>
                    {testimonials.map((t, i) => (
                        <Box key={i} sx={{
                            display: "flex", gap: 2, alignItems: "flex-start",
                            p: 2, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.02)",
                            border: `1px solid ${border0}`,
                        }}>
                            {/* Photo */}
                            <Box sx={{ flexShrink: 0 }}>
                                <Box sx={{
                                    width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
                                    bgcolor: "rgba(255,255,255,0.06)", border: `1px solid ${border0}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {t.image_url ? (
                                        <Box component="img" src={t.image_url} alt={t.name}
                                            sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <Typography sx={{ color: muted, fontSize: "0.65rem" }}>Photo</Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Fields */}
                            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
                                <Box sx={{ display: "flex", gap: 1.5 }}>
                                    <TextField label="Name" size="small" sx={{ ...fieldSx, flex: 1 }}
                                        value={t.name} onChange={e => updateTestimonial(i, "name", e.target.value)} />
                                    <TextField label="Image URL" size="small" sx={{ ...fieldSx, flex: 1.5 }}
                                        value={t.image_url} placeholder="https://..."
                                        onChange={e => updateTestimonial(i, "image_url", e.target.value)} />
                                </Box>
                                <TextField label="Review" size="small" multiline minRows={2} fullWidth sx={fieldSx}
                                    value={t.text} placeholder="What did they love about their film?"
                                    onChange={e => updateTestimonial(i, "text", e.target.value)} />
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    {/* Star rating */}
                                    <Box sx={{ display: "flex", gap: 0.25 }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Box key={star} onClick={() => updateTestimonial(i, "rating", star)}
                                                sx={{ cursor: "pointer", color: star <= t.rating ? "#facc15" : muted,
                                                    "&:hover": { color: "#facc15" }, transition: "color 0.15s" }}>
                                                {star <= t.rating
                                                    ? <StarIcon sx={{ fontSize: "1.1rem" }} />
                                                    : <StarBorderIcon sx={{ fontSize: "1.1rem" }} />}
                                            </Box>
                                        ))}
                                    </Box>
                                    <Box onClick={() => removeTestimonial(i)}
                                        sx={{ cursor: "pointer", color: muted, "&:hover": { color: "#ef4444" },
                                            display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <DeleteIcon sx={{ fontSize: "0.85rem" }} />
                                        <Typography sx={{ fontSize: "0.7rem" }}>Remove</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Stack>

                {/* Add button */}
                <Button size="small" startIcon={<AddIcon sx={{ fontSize: "0.85rem !important" }} />}
                    onClick={addTestimonial}
                    sx={{ mt: 2, color: accent, fontSize: "0.75rem", textTransform: "none",
                        border: `1px dashed ${border0}`, borderRadius: "8px", px: 2,
                        "&:hover": { borderColor: accent, bgcolor: "rgba(59,130,246,0.06)" } }}>
                    Add testimonial
                </Button>
            </Box>

            {/* ── Save ───────────────────────────────────────────────────── */}
            <Box sx={{ maxWidth: 900, display: "flex", justifyContent: "flex-end" }}>
                <Button
                    variant="contained" size="small"
                    disabled={!hasChanges || saving}
                    startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon sx={{ fontSize: "0.85rem !important" }} />}
                    onClick={handleSave}
                    sx={{
                        bgcolor: accent, color: "#fff", fontSize: "0.78rem", textTransform: "none",
                        borderRadius: "8px", px: 2.5,
                        "&:hover": { bgcolor: "#2563eb" },
                        "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.06)", color: muted },
                    }}>
                    {saving ? "Saving…" : "Save"}
                </Button>
            </Box>
        </Box>
    );
}
