"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Person as ProfileIcon,
    Business as CompanyIcon,
    SupervisorAccount as RolesIcon,
    PeopleOutline as UsersIcon,
    Payments as PaymentsIcon,
    Schedule as ScheduleIcon,
    Share as ShareIcon,
    Language as PortalIcon,
    Gavel as ContractsIcon,
} from "@mui/icons-material";
import ProfileSettings from "../components/ProfileSettings";
import CompanySettings from "../components/CompanySettings";
import RolesSettings from "../components/RolesSettings";
import { UsersSettings } from "../components/UsersSettings";
import { PaymentScheduleSettings } from "../components/PaymentScheduleSettings";
import { MeetingsSettings } from "../components/MeetingsSettings";
import ClientPortalSettings from "../components/ClientPortalSettings";
import SocialLinksSettings from "../components/SocialLinksSettings";
import ContractSettings from "@/features/finance/contracts/components/ContractSettings";
import { TabPanel } from "../components/SettingsHelpers";

interface SettingsSection {
    label: string;
    icon: React.ReactElement;
    component: React.ReactNode;
    group: string;
}

// ---------------------------------------------------------------------------
// Settings sections registry
// ---------------------------------------------------------------------------

const settingsSections: SettingsSection[] = [
    { label: "Profile", icon: <ProfileIcon />, component: <ProfileSettings />, group: "Account" },
    { label: "Brand", icon: <CompanyIcon />, component: <CompanySettings />, group: "Account" },
    { label: "Payment Details", icon: <PaymentsIcon />, component: <PaymentScheduleSettings />, group: "Workspace" },
    { label: "Meetings", icon: <ScheduleIcon />, component: <MeetingsSettings />, group: "Workspace" },
    { label: "Roles", icon: <RolesIcon />, component: <RolesSettings />, group: "Workspace" },
    { label: "Users", icon: <UsersIcon />, component: <UsersSettings />, group: "Workspace" },
    {
        label: "Social Links",
        icon: <ShareIcon />,
        component: <SocialLinksSettings />,
        group: "Configuration",
    },
    {
        label: "Client Portal",
        icon: <PortalIcon />,
        component: <ClientPortalSettings />,
        group: "Configuration",
    },
    {
        label: "Contracts",
        icon: <ContractsIcon />,
        component: <ContractSettings />,
        group: "Configuration",
    },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SettingsScreen() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Box>
            {/* Page heading */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight={700}>
                    Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Manage your account, workspace, and application preferences.
                </Typography>
            </Box>

            {/* Two-column layout: vertical tabs + content */}
            <Box
                sx={{
                    display: "flex",
                    gap: 3,
                    minHeight: "calc(100vh - 220px)",
                }}
            >
                {/* Left — vertical tab navigation */}
                <Paper
                    variant="outlined"
                    sx={{
                        width: 220,
                        flexShrink: 0,
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    <Box sx={{ py: 0.5 }}>
                        {settingsSections.map((section, idx) => {
                            const prevGroup = idx > 0 ? settingsSections[idx - 1].group : null;
                            const showGroupHeader = section.group !== prevGroup;
                            return (
                                <React.Fragment key={section.label}>
                                    {showGroupHeader && (
                                        <>
                                            {idx > 0 && <Divider sx={{ my: 0.5 }} />}
                                            <Typography
                                                variant="overline"
                                                sx={{
                                                    px: 2,
                                                    pt: idx > 0 ? 1.5 : 1,
                                                    pb: 0.5,
                                                    display: "block",
                                                    fontSize: "0.65rem",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.08em",
                                                    color: "text.disabled",
                                                }}
                                            >
                                                {section.group}
                                            </Typography>
                                        </>
                                    )}
                                    <Box
                                        component="button"
                                        onClick={() => setActiveTab(idx)}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                            width: "100%",
                                            px: 2,
                                            py: 1.25,
                                            border: "none",
                                            background: activeTab === idx
                                                ? (theme) => alpha(theme.palette.primary.main, 0.08)
                                                : "transparent",
                                            color: activeTab === idx ? "primary.main" : "text.secondary",
                                            fontWeight: activeTab === idx ? 600 : 500,
                                            fontSize: "0.875rem",
                                            fontFamily: "inherit",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            borderLeft: activeTab === idx ? "2px solid" : "2px solid transparent",
                                            borderColor: activeTab === idx ? "primary.main" : "transparent",
                                            "&:hover": {
                                                background: (theme) => alpha(theme.palette.primary.main, 0.04),
                                            },
                                            "& svg": {
                                                fontSize: 20,
                                                opacity: activeTab === idx ? 1 : 0.7,
                                            },
                                        }}
                                    >
                                        {section.icon}
                                        {section.label}
                                    </Box>
                                </React.Fragment>
                            );
                        })}
                    </Box>
                </Paper>

                {/* Right — active section content */}
                <Paper
                    variant="outlined"
                    sx={{
                        flexGrow: 1,
                        borderRadius: 2,
                        minWidth: 0,
                        overflow: "auto",
                    }}
                >
                    {settingsSections.map((section, idx) => (
                        <TabPanel key={section.label} value={activeTab} index={idx}>
                            {section.component}
                        </TabPanel>
                    ))}
                </Paper>
            </Box>
        </Box>
    );
}
