"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    TextField,
    Switch,
    FormControlLabel,
    Paper,
    IconButton,
    Alert,
    Snackbar,
    Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Save as SaveIcon,
    Title as TitleIcon,
    TextFields as TextFieldsIcon,
    AttachMoney as AttachMoneyIcon,
    Image as ImageIcon,
    Schedule as ScheduleIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Check as CheckIcon,
    Instagram as InstagramIcon,
    Facebook as FacebookIcon,
    YouTube as YouTubeIcon,
    Language as LanguageIcon,
    Videocam as VideocamIcon,
    People as PeopleIcon,
    Place as PlaceIcon,
    Event as EventIcon,
    Inventory as PackageIcon,
    Gavel as TermsIcon,
    CameraRoll as EquipmentIcon,
    Groups as CrewIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { useBrand } from "@/features/platform/brand";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SectionDefault {
    type: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    enabled: boolean;
}

interface ProposalDefaults {
    theme: string;
    primaryColor: string;
    accentColor: string;
    sections: SectionDefault[];
    heroTitleTemplate: string;
    heroSubtitleTemplate: string;
    heroBackgroundUrl: string;
    introMessageTemplate: string;
    showFooter: boolean;
    footerText: string;
    // Branding fields for client-facing proposals
    tagline: string;
    aboutText: string;
    socialLinks: {
        instagram: string;
        facebook: string;
        youtube: string;
        website: string;
    };
    contactDisplay: {
        showEmail: boolean;
        showPhone: boolean;
        showAddress: boolean;
    };
    termsText: string;
}

/* ------------------------------------------------------------------ */
/* Theme catalogue                                                     */
/* ------------------------------------------------------------------ */

const THEMES = [
    {
        id: "cinematic-dark",
        label: "Cinematic Dark",
        description: "Bold dark theme with vibrant accents",
        bg: "#0d1117",
        accent: "#7c4dff",
        text: "#e0e0e0",
    },
    {
        id: "minimal-light",
        label: "Minimal Light",
        description: "Clean white with subtle grays",
        bg: "#ffffff",
        accent: "#1a1a1a",
        text: "#666666",
    },
    {
        id: "classic-elegant",
        label: "Classic Elegant",
        description: "Warm tones with serif accents",
        bg: "#faf8f5",
        accent: "#8b6914",
        text: "#4a4a4a",
    },
    {
        id: "modern-clean",
        label: "Modern Clean",
        description: "Contemporary with sharp contrasts",
        bg: "#f5f5f5",
        accent: "#2196f3",
        text: "#333333",
    },
];

/* ------------------------------------------------------------------ */
/* Initial defaults                                                    */
/* ------------------------------------------------------------------ */

const INITIAL_SECTIONS: SectionDefault[] = [
    { type: "hero", label: "Hero", icon: <TitleIcon fontSize="small" />, color: "#7c4dff", enabled: true },
    { type: "text", label: "Text", icon: <TextFieldsIcon fontSize="small" />, color: "#00bcd4", enabled: true },
    { type: "event-details", label: "Event Details", icon: <EventIcon fontSize="small" />, color: "#ff5722", enabled: true },
    { type: "pricing", label: "Pricing", icon: <AttachMoneyIcon fontSize="small" />, color: "#4caf50", enabled: true },
    { type: "package-details", label: "Package Details", icon: <PackageIcon fontSize="small" />, color: "#9c27b0", enabled: true },
    { type: "films", label: "Films & Deliverables", icon: <VideocamIcon fontSize="small" />, color: "#e040fb", enabled: true },
    { type: "schedule", label: "Schedule & Timeline", icon: <ScheduleIcon fontSize="small" />, color: "#e91e63", enabled: true },
    { type: "subjects", label: "Key People", icon: <PeopleIcon fontSize="small" />, color: "#26a69a", enabled: true },
    { type: "locations", label: "Locations", icon: <PlaceIcon fontSize="small" />, color: "#42a5f5", enabled: true },
    { type: "crew", label: "Crew & Team", icon: <CrewIcon fontSize="small" />, color: "#7e57c2", enabled: true },
    { type: "equipment", label: "Equipment", icon: <EquipmentIcon fontSize="small" />, color: "#78909c", enabled: true },
    { type: "media", label: "Media", icon: <ImageIcon fontSize="small" />, color: "#ff9800", enabled: true },
    { type: "terms", label: "Terms & Conditions", icon: <TermsIcon fontSize="small" />, color: "#8d6e63", enabled: true },
];

const INITIAL_DEFAULTS: ProposalDefaults = {
    theme: "cinematic-dark",
    primaryColor: "#7c4dff",
    accentColor: "#4caf50",
    sections: INITIAL_SECTIONS,
    heroTitleTemplate: "{client_name}'s Wedding",
    heroSubtitleTemplate: "{event_date}",
    heroBackgroundUrl: "",
    introMessageTemplate: "Dear {first_name}, thank you for considering us for your {event_type}. We're thrilled to be a part of your special day and can't wait to create something truly memorable for you.",
    showFooter: true,
    footerText: "Thank you for considering us for your special day. We can't wait to bring your vision to life.",
    tagline: "Cinematic wedding films crafted with heart",
    aboutText: "We're a boutique wedding videography studio dedicated to capturing authentic moments and turning them into timeless films. Every couple has a unique story — and we're here to tell yours beautifully.",
    socialLinks: {
        instagram: "https://instagram.com/yourstudio",
        facebook: "https://facebook.com/yourstudio",
        youtube: "https://youtube.com/@yourstudio",
        website: "https://yourstudio.com",
    },
    contactDisplay: {
        showEmail: true,
        showPhone: true,
        showAddress: false,
    },
    termsText: "This proposal is valid for 30 days from the date of issue. A 25% non-refundable retainer is required to secure your date, with the remaining balance due 14 days before the event. Cancellations made within 60 days of the event are subject to the full contract amount. Travel fees may apply for venues located more than 50 miles from our studio.",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ProposalSettings() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ?? 1;
    const [defaults, setDefaults] = useState<ProposalDefaults>(INITIAL_DEFAULTS);
    const [notification, setNotification] = useState<{
        message: string;
        severity: "success" | "error" | "info";
    } | null>(null);

    /* --- Load saved defaults from brand settings ------------------- */

    const loadDefaults = useCallback(async () => {
        try {
            const setting = await api.brands.getSetting(brandId, "proposal_defaults");
            if (setting?.value) {
                const parsed = JSON.parse(setting.value) as Partial<ProposalDefaults>;
                setDefaults((prev) => ({ ...prev, ...parsed }));
            }
        } catch {
            // No saved settings yet — use INITIAL_DEFAULTS
        }
    }, [brandId]);

    useEffect(() => { loadDefaults(); }, [loadDefaults]);

    /* --- Section helpers ------------------------------------------- */

    const toggleSection = (type: string) => {
        setDefaults((prev) => ({
            ...prev,
            sections: prev.sections.map((s) =>
                s.type === type ? { ...s, enabled: !s.enabled } : s,
            ),
        }));
    };

    const moveSection = (index: number, direction: "up" | "down") => {
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === defaults.sections.length - 1) return;
        setDefaults((prev) => {
            const arr = [...prev.sections];
            const swap = direction === "up" ? index - 1 : index + 1;
            [arr[index], arr[swap]] = [arr[swap], arr[index]];
            return { ...prev, sections: arr };
        });
    };

    /* --- Save ------------------------------------------------------ */

    const handleSave = async () => {
        try {
            const payload = { value: JSON.stringify(defaults), data_type: "json" };
            try {
                await api.brands.updateSetting(brandId, "proposal_defaults", payload);
            } catch {
                await api.brands.createSetting(brandId, { key: "proposal_defaults", value: JSON.stringify(defaults), data_type: "json", category: "proposals" });
            }
            setNotification({ message: "Proposal defaults saved!", severity: "success" });
        } catch {
            setNotification({ message: "Failed to save defaults", severity: "error" });
        }
    };

    /* --- Field helper ---------------------------------------------- */

    const fieldSx = {
        "& .MuiInputBase-root": { color: "#fff" },
        "& .MuiInputLabel-root": { color: "#666" },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#333" },
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>
                    Proposal Defaults
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Proposals are auto-generated from these settings and the
                    inquiry&rsquo;s data (customer name, event type, date). Configure
                    the look, layout, and messaging here.
                </Typography>
            </Box>

            {/* ── Theme Selection ─────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Default Theme
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 4 }}>
                {THEMES.map((t) => {
                    const selected = defaults.theme === t.id;
                    return (
                        <Paper
                            key={t.id}
                            variant="outlined"
                            onClick={() => setDefaults((p) => ({ ...p, theme: t.id }))}
                            sx={{
                                width: 170,
                                p: 1.5,
                                cursor: "pointer",
                                position: "relative",
                                borderColor: selected ? t.accent : "#222",
                                borderWidth: selected ? 2 : 1,
                                bgcolor: "#161b22",
                                transition: "border-color 0.2s",
                                "&:hover": { borderColor: alpha(t.accent, 0.6) },
                            }}
                        >
                            {/* Colour preview strip */}
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    mb: 1,
                                }}
                            >
                                {[t.bg, t.accent, t.text].map((c, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: "50%",
                                            bgcolor: c,
                                            border: "1px solid #333",
                                        }}
                                    />
                                ))}
                            </Box>

                            <Typography variant="body2" sx={{ color: "#e0e0e0", fontWeight: 600 }}>
                                {t.label}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#666" }}>
                                {t.description}
                            </Typography>

                            {selected && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 8,
                                        right: 8,
                                        width: 20,
                                        height: 20,
                                        borderRadius: "50%",
                                        bgcolor: t.accent,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                                </Box>
                            )}
                        </Paper>
                    );
                })}
            </Box>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Default Sections ────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Default Sections
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                Choose which sections are included by default in new proposals and
                their order.
            </Typography>

            <Stack spacing={0.75} sx={{ mb: 4 }}>
                {defaults.sections.map((section, index) => (
                    <Box
                        key={section.type}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            bgcolor: "#161b22",
                            border: "1px solid #1e1e1e",
                            borderLeft: `3px solid ${section.enabled ? section.color : "#333"}`,
                            opacity: section.enabled ? 1 : 0.45,
                            transition: "opacity 0.2s, border-color 0.2s",
                        }}
                    >
                        <Box sx={{ color: section.color, display: "flex", alignItems: "center" }}>
                            {section.icon}
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{ flex: 1, fontWeight: 500, color: "#ccc" }}
                        >
                            {section.label}
                        </Typography>

                        <Switch
                            size="small"
                            checked={section.enabled}
                            onChange={() => toggleSection(section.type)}
                            sx={{
                                "& .Mui-checked": { color: section.color },
                                "& .Mui-checked+.MuiSwitch-track": {
                                    bgcolor: alpha(section.color, 0.4),
                                },
                            }}
                        />

                        <IconButton
                            size="small"
                            disabled={index === 0}
                            onClick={() => moveSection(index, "up")}
                            sx={{ color: "#444", "&:hover": { color: "#aaa" } }}
                        >
                            <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            disabled={index === defaults.sections.length - 1}
                            onClick={() => moveSection(index, "down")}
                            sx={{ color: "#444", "&:hover": { color: "#aaa" } }}
                        >
                            <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                ))}
            </Stack>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Branding Colours ────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Branding
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                Accent colours used throughout the proposal.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 4, ...fieldSx }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: defaults.primaryColor,
                            border: "1px solid #333",
                            flexShrink: 0,
                        }}
                    />
                    <TextField
                        label="Primary"
                        size="small"
                        value={defaults.primaryColor}
                        onChange={(e) =>
                            setDefaults((p) => ({ ...p, primaryColor: e.target.value }))
                        }
                        sx={{ width: 140 }}
                    />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: defaults.accentColor,
                            border: "1px solid #333",
                            flexShrink: 0,
                        }}
                    />
                    <TextField
                        label="Accent"
                        size="small"
                        value={defaults.accentColor}
                        onChange={(e) =>
                            setDefaults((p) => ({ ...p, accentColor: e.target.value }))
                        }
                        sx={{ width: 140 }}
                    />
                </Box>
            </Stack>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Hero Defaults ───────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Hero Section Defaults
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                Hero titles are auto-generated based on event type (e.g. &ldquo;Mr &amp; Mrs
                Smith&rdquo; for weddings). The template below is the fallback for custom
                event types. Use{" "}
                <code style={{ color: "#7c4dff" }}>{"{client_name}"}</code> and{" "}
                <code style={{ color: "#7c4dff" }}>{"{event_date}"}</code> as
                placeholders.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4, ...fieldSx, maxWidth: 480 }}>
                <TextField
                    label="Title Template"
                    fullWidth
                    size="small"
                    value={defaults.heroTitleTemplate}
                    onChange={(e) =>
                        setDefaults((p) => ({ ...p, heroTitleTemplate: e.target.value }))
                    }
                    helperText="e.g. {client_name}'s Wedding"
                />
                <TextField
                    label="Subtitle Template"
                    fullWidth
                    size="small"
                    value={defaults.heroSubtitleTemplate}
                    onChange={(e) =>
                        setDefaults((p) => ({
                            ...p,
                            heroSubtitleTemplate: e.target.value,
                        }))
                    }
                    helperText="e.g. {event_date}"
                />
                <TextField
                    label="Default Background Image URL"
                    fullWidth
                    size="small"
                    value={defaults.heroBackgroundUrl}
                    onChange={(e) =>
                        setDefaults((p) => ({ ...p, heroBackgroundUrl: e.target.value }))
                    }
                />
            </Stack>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Intro Message Template ──────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Intro Message Template
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                Auto-generated greeting shown below the hero. Use{" "}
                <code style={{ color: "#7c4dff" }}>{"{first_name}"}</code>,{" "}
                <code style={{ color: "#7c4dff" }}>{"{last_name}"}</code>, and{" "}
                <code style={{ color: "#7c4dff" }}>{"{event_type}"}</code> as
                placeholders. Leave blank for smart defaults based on event type.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4, ...fieldSx, maxWidth: 480 }}>
                <TextField
                    label="Intro Message"
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    value={defaults.introMessageTemplate}
                    onChange={(e) =>
                        setDefaults((p) => ({ ...p, introMessageTemplate: e.target.value }))
                    }
                    placeholder="Dear {first_name}, thank you for considering us for your {event_type}..."
                />
            </Stack>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Footer ──────────────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Footer
            </Typography>

            <Stack spacing={2} sx={{ mb: 4, maxWidth: 480 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={defaults.showFooter}
                            onChange={(e) =>
                                setDefaults((p) => ({
                                    ...p,
                                    showFooter: e.target.checked,
                                }))
                            }
                            size="small"
                        />
                    }
                    label={
                        <Typography variant="body2" sx={{ color: "#ccc" }}>
                            Include footer in proposals
                        </Typography>
                    }
                />
                {defaults.showFooter && (
                    <TextField
                        label="Footer Text"
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        value={defaults.footerText}
                        onChange={(e) =>
                            setDefaults((p) => ({ ...p, footerText: e.target.value }))
                        }
                        placeholder="Thank you for considering us for your special day."
                        sx={fieldSx}
                    />
                )}
            </Stack>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Tagline & About ─────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Tagline &amp; About
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                Shown on the client-facing proposal footer and about section.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4, ...fieldSx, maxWidth: 480 }}>
                <TextField
                    label="Tagline"
                    fullWidth
                    size="small"
                    value={defaults.tagline}
                    onChange={(e) =>
                        setDefaults((p) => ({ ...p, tagline: e.target.value }))
                    }
                    placeholder="Cinematic wedding films that tell your story"
                />
                <TextField
                    label="About Text"
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    value={defaults.aboutText}
                    onChange={(e) =>
                        setDefaults((p) => ({ ...p, aboutText: e.target.value }))
                    }
                    placeholder="A short bio or description of your brand that clients will see..."
                />
            </Stack>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Social Links ────────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Social Links
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                Displayed in the proposal footer so clients can find you.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4, ...fieldSx, maxWidth: 480 }}>
                <TextField
                    label="Instagram"
                    fullWidth
                    size="small"
                    value={defaults.socialLinks.instagram}
                    onChange={(e) =>
                        setDefaults((p) => ({
                            ...p,
                            socialLinks: { ...p.socialLinks, instagram: e.target.value },
                        }))
                    }
                    placeholder="https://instagram.com/yourbrand"
                    InputProps={{ startAdornment: <InstagramIcon sx={{ color: "#444", mr: 1, fontSize: 18 }} /> }}
                />
                <TextField
                    label="Facebook"
                    fullWidth
                    size="small"
                    value={defaults.socialLinks.facebook}
                    onChange={(e) =>
                        setDefaults((p) => ({
                            ...p,
                            socialLinks: { ...p.socialLinks, facebook: e.target.value },
                        }))
                    }
                    placeholder="https://facebook.com/yourbrand"
                    InputProps={{ startAdornment: <FacebookIcon sx={{ color: "#444", mr: 1, fontSize: 18 }} /> }}
                />
                <TextField
                    label="YouTube"
                    fullWidth
                    size="small"
                    value={defaults.socialLinks.youtube}
                    onChange={(e) =>
                        setDefaults((p) => ({
                            ...p,
                            socialLinks: { ...p.socialLinks, youtube: e.target.value },
                        }))
                    }
                    placeholder="https://youtube.com/@yourbrand"
                    InputProps={{ startAdornment: <YouTubeIcon sx={{ color: "#444", mr: 1, fontSize: 18 }} /> }}
                />
                <TextField
                    label="Website"
                    fullWidth
                    size="small"
                    value={defaults.socialLinks.website}
                    onChange={(e) =>
                        setDefaults((p) => ({
                            ...p,
                            socialLinks: { ...p.socialLinks, website: e.target.value },
                        }))
                    }
                    placeholder="https://yourbrand.com"
                    InputProps={{ startAdornment: <LanguageIcon sx={{ color: "#444", mr: 1, fontSize: 18 }} /> }}
                />
            </Stack>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Contact Display ─────────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Contact Info Display
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                Choose which contact details are shown on client proposals. Values come from your Brand settings.
            </Typography>

            <Stack spacing={1} sx={{ mb: 4 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={defaults.contactDisplay.showEmail}
                            onChange={(e) =>
                                setDefaults((p) => ({
                                    ...p,
                                    contactDisplay: { ...p.contactDisplay, showEmail: e.target.checked },
                                }))
                            }
                            size="small"
                        />
                    }
                    label={<Typography variant="body2" sx={{ color: "#ccc" }}>Show email address</Typography>}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={defaults.contactDisplay.showPhone}
                            onChange={(e) =>
                                setDefaults((p) => ({
                                    ...p,
                                    contactDisplay: { ...p.contactDisplay, showPhone: e.target.checked },
                                }))
                            }
                            size="small"
                        />
                    }
                    label={<Typography variant="body2" sx={{ color: "#ccc" }}>Show phone number</Typography>}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={defaults.contactDisplay.showAddress}
                            onChange={(e) =>
                                setDefaults((p) => ({
                                    ...p,
                                    contactDisplay: { ...p.contactDisplay, showAddress: e.target.checked },
                                }))
                            }
                            size="small"
                        />
                    }
                    label={<Typography variant="body2" sx={{ color: "#ccc" }}>Show business address</Typography>}
                />
            </Stack>

            <Divider sx={{ borderColor: "#1e1e1e", mb: 3 }} />

            {/* ── Terms & Conditions ──────────────────────────────── */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Terms &amp; Conditions
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                Shown as fine print at the bottom of client proposals.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4, ...fieldSx, maxWidth: 480 }}>
                <TextField
                    label="Terms Text"
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    value={defaults.termsText}
                    onChange={(e) =>
                        setDefaults((p) => ({ ...p, termsText: e.target.value }))
                    }
                    placeholder="By accepting this proposal, you agree to our terms and conditions..."
                />
            </Stack>

            {/* ── Save ────────────────────────────────────────────── */}
            <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{
                    bgcolor: "#7c4dff",
                    "&:hover": { bgcolor: "#651fff" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                }}
            >
                Save Defaults
            </Button>

            <Snackbar
                open={!!notification}
                autoHideDuration={3000}
                onClose={() => setNotification(null)}
            >
                <Alert
                    onClose={() => setNotification(null)}
                    severity={notification?.severity || "info"}
                    sx={{ width: "100%" }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
