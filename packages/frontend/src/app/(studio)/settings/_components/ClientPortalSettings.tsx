// Re-export shim — canonical ClientPortalSettings has moved to @/features/platform/settings
export { default } from "@/features/platform/settings/components/ClientPortalSettings";
export { default as ClientPortalSettings } from "@/features/platform/settings/components/ClientPortalSettings";

import React, { useState } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Language as PortalIcon,
    ArrowForward as ArrowIcon,
    Assignment as FormIcon,
    Construction as ConstructionIcon,
} from "@mui/icons-material";
import FormsSettings from "./FormsSettings";

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
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ClientPortalSettings() {
    const [activeStep, setActiveStep] = useState(0); // 0 = Inquiry Wizard, 1 = Client Portal

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

            {/* ── Step 1: Client Portal — coming soon ──────────── */}
            {activeStep === 1 && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 8,
                        px: 4,
                        borderRadius: 3,
                        bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                                ? alpha("#fff", 0.02)
                                : alpha("#000", 0.02),
                        border: (theme) =>
                            `1px solid ${
                                theme.palette.mode === "dark"
                                    ? alpha("#fff", 0.06)
                                    : alpha("#000", 0.06)
                            }`,
                    }}
                >
                    <ConstructionIcon
                        sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                    />
                    <Typography
                        sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 0.5 }}
                    >
                        Portal Customisation
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, textAlign: "center", maxWidth: 400 }}
                    >
                        Theme, section, and layout options for the client portal
                        are being redesigned and will be available soon.
                    </Typography>
                    <Chip label="Coming Soon" size="small" />
                </Box>
            )}
        </Box>
    );
}
