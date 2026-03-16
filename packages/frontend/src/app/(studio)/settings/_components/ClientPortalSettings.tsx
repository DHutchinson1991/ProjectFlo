"use client";

import React, { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    QuestionAnswer as InquiryIcon,
    Description as ProposalIcon,
    Gavel as ContractIcon,
    Language as PortalIcon,
    ArrowForward as ArrowIcon,
    Assignment as FormIcon,
} from "@mui/icons-material";
import FormsSettings from "./FormsSettings";
import ProposalSettings from "./ProposalSettings";

/* ------------------------------------------------------------------ */
/* Flow step data                                                      */
/* ------------------------------------------------------------------ */

const FLOW_STEPS = [
    {
        icon: <FormIcon sx={{ fontSize: 22 }} />,
        label: "Inquiry Form",
        description: "Questionnaire",
        color: "#7c4dff",
    },
    {
        icon: <ProposalIcon sx={{ fontSize: 22 }} />,
        label: "Proposal",
        description: "Pricing & details",
        color: "#a855f7",
    },
    {
        icon: <ContractIcon sx={{ fontSize: 22 }} />,
        label: "Contract",
        description: "Agreement",
        color: "#6366f1",
    },
    {
        icon: <PortalIcon sx={{ fontSize: 22 }} />,
        label: "Client Portal",
        description: "Project hub",
        color: "#3b82f6",
    },
];

/* ------------------------------------------------------------------ */
/* Sub-tab panel                                                       */
/* ------------------------------------------------------------------ */

function SubTabPanel({
    children,
    value,
    index,
}: {
    children: React.ReactNode;
    value: number;
    index: number;
}) {
    if (value !== index) return null;
    return <Box sx={{ mt: 3 }}>{children}</Box>;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ClientPortalSettings() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Box>
            {/* ── Header ───────────────────────────────────────── */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                    Client Portal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Configure the experience your clients see — from the first
                    inquiry form through to the final deliverables.
                </Typography>
            </Box>

            {/* ── Flow visualization ───────────────────────────── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: { xs: 1, sm: 2 },
                    py: 3,
                    px: 2,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                            ? alpha("#fff", 0.02)
                            : alpha("#000", 0.02),
                    border: (theme) =>
                        `1px solid ${
                            theme.palette.mode === "dark"
                                ? alpha("#fff", 0.06)
                                : alpha("#000", 0.08)
                        }`,
                    overflowX: "auto",
                }}
            >
                {FLOW_STEPS.map((step, idx) => {
                    // Highlight the steps that match the active tab
                    const isActive =
                        (activeTab === 0 && idx === 0) ||
                        (activeTab === 1 && idx === 1);

                    return (
                        <React.Fragment key={step.label}>
                            {/* Step node */}
                            <Box
                                onClick={() => {
                                    if (idx === 0) setActiveTab(0);
                                    if (idx === 1) setActiveTab(1);
                                }}
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 0.75,
                                    minWidth: 90,
                                    cursor:
                                        idx <= 1 ? "pointer" : "default",
                                    transition: "all 0.2s ease",
                                    opacity: isActive ? 1 : 0.55,
                                    transform: isActive
                                        ? "scale(1.05)"
                                        : "scale(1)",
                                    "&:hover":
                                        idx <= 1
                                            ? { opacity: 0.85 }
                                            : {},
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "14px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: isActive
                                            ? alpha(step.color, 0.15)
                                            : (theme) =>
                                                  theme.palette.mode ===
                                                  "dark"
                                                      ? alpha(
                                                            "#fff",
                                                            0.04,
                                                        )
                                                      : alpha(
                                                            "#000",
                                                            0.04,
                                                        ),
                                        border: `1.5px solid ${
                                            isActive
                                                ? alpha(step.color, 0.4)
                                                : "transparent"
                                        }`,
                                        color: isActive
                                            ? step.color
                                            : "text.secondary",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {step.icon}
                                </Box>
                                <Typography
                                    sx={{
                                        fontSize: "0.75rem",
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive
                                            ? "text.primary"
                                            : "text.secondary",
                                        textAlign: "center",
                                        lineHeight: 1.2,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {step.label}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: "0.65rem",
                                        color: "text.disabled",
                                        textAlign: "center",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {step.description}
                                </Typography>
                            </Box>

                            {/* Arrow connector */}
                            {idx < FLOW_STEPS.length - 1 && (
                                <ArrowIcon
                                    sx={{
                                        fontSize: 18,
                                        color: "text.disabled",
                                        flexShrink: 0,
                                        opacity: 0.4,
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </Box>

            {/* ── Tabs ─────────────────────────────────────────── */}
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                    minHeight: 42,
                    borderBottom: 1,
                    borderColor: "divider",
                    "& .MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        minHeight: 42,
                        gap: 1,
                    },
                }}
            >
                <Tab
                    icon={<InquiryIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Inquiry Form"
                />
                <Tab
                    icon={<ProposalIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Proposal"
                />
            </Tabs>

            {/* ── Tab panels ───────────────────────────────────── */}
            <SubTabPanel value={activeTab} index={0}>
                <FormsSettings />
            </SubTabPanel>
            <SubTabPanel value={activeTab} index={1}>
                <ProposalSettings />
            </SubTabPanel>
        </Box>
    );
}
