"use client";

import React, { useState } from "react";
import { Box, Typography, Tabs, Tab, Switch, FormControlLabel, Chip, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    QuestionAnswer as InquiryIcon,
    Language as PortalIcon,
    ArrowForward as ArrowIcon,
    Assignment as FormIcon,
    Palette as DesignIcon,
    Description as ProposalTabIcon,
    Gavel as ContractTabIcon,
    Inventory2 as PackageIcon,
    ViewList as SectionsIcon,
} from "@mui/icons-material";
import FormsSettings from "./FormsSettings";
import ProposalSettings from "./ProposalSettings";

/* ------------------------------------------------------------------ */
/* Two-step flow data                                                  */
/* ------------------------------------------------------------------ */

const FLOW_STEPS = [
    {
        icon: <FormIcon sx={{ fontSize: 22 }} />,
        label: "Inquiry Wizard",
        description: "Questionnaire & intake",
        color: "#7c4dff",
    },
    {
        icon: <PortalIcon sx={{ fontSize: 22 }} />,
        label: "Client Portal",
        description: "Post-inquiry hub",
        color: "#3b82f6",
    },
];

/* ------------------------------------------------------------------ */
/* Portal theme catalogue (mirrors ProposalSettings)                   */
/* ------------------------------------------------------------------ */

const PORTAL_THEMES = [
    { id: "cinematic-dark", label: "Cinematic Dark", description: "Bold dark theme with vibrant accents", bg: "#0d1117", accent: "#7c4dff", text: "#e0e0e0" },
    { id: "minimal-light", label: "Minimal Light", description: "Clean white with subtle grays", bg: "#ffffff", accent: "#1a1a1a", text: "#666666" },
    { id: "classic-elegant", label: "Classic Elegant", description: "Warm tones with serif accents", bg: "#faf8f5", accent: "#8b6914", text: "#4a4a4a" },
    { id: "modern-clean", label: "Modern Clean", description: "Contemporary with sharp contrasts", bg: "#f5f5f5", accent: "#2196f3", text: "#333333" },
];

/* ------------------------------------------------------------------ */
/* Portal sections list                                                */
/* ------------------------------------------------------------------ */

const PORTAL_SECTIONS = [
    { key: "questionnaire", label: "Questionnaire", description: "Client's submitted answers" },
    { key: "package", label: "Package", description: "Selected or recommended package" },
    { key: "estimate", label: "Estimate", description: "Cost breakdown & payment info" },
    { key: "proposal", label: "Proposal", description: "Custom proposal document" },
    { key: "contract", label: "Contract", description: "Agreement & signatures" },
    { key: "invoices", label: "Invoices", description: "Payment tracking" },
];

/* ------------------------------------------------------------------ */
/* Helper: sub-tab panel                                               */
/* ------------------------------------------------------------------ */

function SubTabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
    if (value !== index) return null;
    return <Box sx={{ mt: 3 }}>{children}</Box>;
}

/* ------------------------------------------------------------------ */
/* Portal sub-tabs                                                     */
/* ------------------------------------------------------------------ */

function PortalDesignTab() {
    const [selectedTheme, setSelectedTheme] = useState("cinematic-dark");
    return (
        <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 0.5 }}>Portal Theme</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose the default look and feel for your client portal pages.
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                {PORTAL_THEMES.map((t) => {
                    const selected = selectedTheme === t.id;
                    return (
                        <Box
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            sx={{
                                cursor: "pointer", borderRadius: 2, overflow: "hidden", transition: "all 0.2s",
                                border: (theme) => `2px solid ${selected ? t.accent : theme.palette.mode === "dark" ? alpha("#fff", 0.08) : alpha("#000", 0.08)}`,
                                "&:hover": { borderColor: alpha(t.accent, 0.5) },
                            }}
                        >
                            <Box sx={{ height: 64, bgcolor: t.bg, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: t.accent }} />
                                <Box sx={{ width: 60, height: 4, borderRadius: 2, bgcolor: t.text, opacity: 0.4 }} />
                            </Box>
                            <Box sx={{ p: 1.5 }}>
                                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.label}</Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{t.description}</Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

function PortalContractTab() {
    const [autoSend, setAutoSend] = useState(false);
    return (
        <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 0.5 }}>Contract Delivery</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure how contracts are presented inside the client portal.
            </Typography>
            <FormControlLabel
                control={<Switch checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />}
                label="Auto-send contract after proposal is accepted"
                sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }}
            />
        </Box>
    );
}

function PortalPackageTab() {
    const [allowCustomize, setAllowCustomize] = useState(true);
    return (
        <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 0.5 }}>Package Settings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Control what clients see in the package section of their portal.
            </Typography>
            <FormControlLabel
                control={<Switch checked={allowCustomize} onChange={(e) => setAllowCustomize(e.target.checked)} />}
                label="Allow clients to request package customisations"
                sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }}
            />
        </Box>
    );
}

function PortalSectionsTab() {
    const [sections, setSections] = useState(PORTAL_SECTIONS.map((s) => ({ ...s, enabled: true })));

    const toggleSection = (key: string) => {
        setSections((prev) => prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s)));
    };

    return (
        <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 0.5 }}>Portal Sections</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose which sections appear on the client portal. Drag to reorder.
            </Typography>
            <Stack spacing={1}>
                {sections.map((s) => (
                    <Box
                        key={s.key}
                        sx={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            p: 2, borderRadius: 2,
                            bgcolor: (theme) => theme.palette.mode === "dark" ? alpha("#fff", 0.03) : alpha("#000", 0.02),
                            border: (theme) => `1px solid ${theme.palette.mode === "dark" ? alpha("#fff", 0.06) : alpha("#000", 0.06)}`,
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>{s.label}</Typography>
                            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{s.description}</Typography>
                        </Box>
                        <Switch checked={s.enabled} onChange={() => toggleSection(s.key)} size="small" />
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ClientPortalSettings() {
    const [activeStep, setActiveStep] = useState(0); // 0 = Inquiry Wizard, 1 = Client Portal
    const [portalTab, setPortalTab] = useState(0);

    return (
        <Box>
            {/* ── Header ───────────────────────────────────────── */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                    Client Portal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Configure the experience your clients see — from the first
                    inquiry through to the final deliverables.
                </Typography>
            </Box>

            {/* ── 2-step flow visualization ────────────────────── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: { xs: 2, sm: 4 },
                    py: 3,
                    px: 2,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: (theme) => theme.palette.mode === "dark" ? alpha("#fff", 0.02) : alpha("#000", 0.02),
                    border: (theme) => `1px solid ${theme.palette.mode === "dark" ? alpha("#fff", 0.06) : alpha("#000", 0.08)}`,
                }}
            >
                {FLOW_STEPS.map((step, idx) => {
                    const isActive = activeStep === idx;
                    return (
                        <React.Fragment key={step.label}>
                            <Box
                                onClick={() => setActiveStep(idx)}
                                sx={{
                                    display: "flex", flexDirection: "column", alignItems: "center",
                                    gap: 0.75, minWidth: 110, cursor: "pointer", transition: "all 0.2s ease",
                                    opacity: isActive ? 1 : 0.55,
                                    transform: isActive ? "scale(1.05)" : "scale(1)",
                                    "&:hover": { opacity: 0.85 },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 52, height: 52, borderRadius: "14px",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        bgcolor: isActive ? alpha(step.color, 0.15) : (theme) => theme.palette.mode === "dark" ? alpha("#fff", 0.04) : alpha("#000", 0.04),
                                        border: `1.5px solid ${isActive ? alpha(step.color, 0.4) : "transparent"}`,
                                        color: isActive ? step.color : "text.secondary",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {step.icon}
                                </Box>
                                <Typography sx={{ fontSize: "0.8rem", fontWeight: isActive ? 700 : 500, color: isActive ? "text.primary" : "text.secondary", textAlign: "center", whiteSpace: "nowrap" }}>
                                    {step.label}
                                </Typography>
                                <Typography sx={{ fontSize: "0.65rem", color: "text.disabled", textAlign: "center", whiteSpace: "nowrap" }}>
                                    {step.description}
                                </Typography>
                            </Box>
                            {idx < FLOW_STEPS.length - 1 && (
                                <ArrowIcon sx={{ fontSize: 20, color: "text.disabled", flexShrink: 0, opacity: 0.4 }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </Box>

            {/* ── Step 0: Inquiry Wizard ───────────────────────── */}
            {activeStep === 0 && <FormsSettings />}

            {/* ── Step 1: Client Portal with nested tabs ───────── */}
            {activeStep === 1 && (
                <Box>
                    <Tabs
                        value={portalTab}
                        onChange={(_, v) => setPortalTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            minHeight: 40, borderBottom: 1, borderColor: "divider",
                            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.825rem", minHeight: 40, gap: 0.75 },
                        }}
                    >
                        <Tab icon={<DesignIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Design" />
                        <Tab icon={<ProposalTabIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Proposal" />
                        <Tab icon={<ContractTabIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Contract" />
                        <Tab icon={<PackageIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Package" />
                        <Tab icon={<SectionsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Sections" />
                    </Tabs>

                    <SubTabPanel value={portalTab} index={0}>
                        <PortalDesignTab />
                    </SubTabPanel>
                    <SubTabPanel value={portalTab} index={1}>
                        <ProposalSettings />
                    </SubTabPanel>
                    <SubTabPanel value={portalTab} index={2}>
                        <PortalContractTab />
                    </SubTabPanel>
                    <SubTabPanel value={portalTab} index={3}>
                        <PortalPackageTab />
                    </SubTabPanel>
                    <SubTabPanel value={portalTab} index={4}>
                        <PortalSectionsTab />
                    </SubTabPanel>
                </Box>
            )}
        </Box>
    );
}
