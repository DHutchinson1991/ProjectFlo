"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
} from "@mui/material";
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
}

// ---------------------------------------------------------------------------
// Settings sections registry
// ---------------------------------------------------------------------------

const settingsSections: SettingsSection[] = [
    { label: "Profile", icon: <ProfileIcon />, component: <ProfileSettings /> },
    { label: "Brand", icon: <CompanyIcon />, component: <CompanySettings /> },
    { label: "Payment Details", icon: <PaymentsIcon />, component: <PaymentScheduleSettings /> },
    { label: "Meetings", icon: <ScheduleIcon />, component: <MeetingsSettings /> },
    { label: "Roles", icon: <RolesIcon />, component: <RolesSettings /> },
    { label: "Users", icon: <UsersIcon />, component: <UsersSettings /> },
    {
        label: "Social Links",
        icon: <ShareIcon />,
        component: <SocialLinksSettings />,
    },
    {
        label: "Client Portal",
        icon: <PortalIcon />,
        component: <ClientPortalSettings />,
    },
    {
        label: "Contracts",
        icon: <ContractsIcon />,
        component: <ContractSettings />,
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
                    <Tabs
                        orientation="vertical"
                        variant="scrollable"
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        sx={{
                            "& .MuiTab-root": {
                                justifyContent: "flex-start",
                                textTransform: "none",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                minHeight: 48,
                                px: 2,
                            },
                            "& .Mui-selected": {
                                fontWeight: 600,
                            },
                        }}
                    >
                        {settingsSections.map((section, idx) => (
                            <Tab
                                key={section.label}
                                icon={section.icon}
                                iconPosition="start"
                                label={section.label}
                                id={`settings-tab-${idx}`}
                                aria-controls={`settings-tabpanel-${idx}`}
                                sx={{ gap: 1.5 }}
                            />
                        ))}
                    </Tabs>
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
