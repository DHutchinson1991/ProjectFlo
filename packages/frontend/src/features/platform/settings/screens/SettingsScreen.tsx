"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Chip,
} from "@mui/material";
import {
    Person as ProfileIcon,
    Business as CompanyIcon,
    Notifications as NotificationsIcon,
    Palette as AppearanceIcon,
    IntegrationInstructions as IntegrationsIcon,
    Security as SecurityIcon,
    Receipt as BillingIcon,
    Tune as WorkflowIcon,
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
import {
    NotificationSettings,
    AppearanceSettings,
    IntegrationSettings,
    SecuritySettings,
    BillingSettings,
    WorkflowSettings,
} from "../components/PlaceholderSettings";
import ClientPortalSettings from "../components/ClientPortalSettings";
import SocialLinksSettings from "../components/SocialLinksSettings";
import ContractSettings from "@/features/finance/contracts/components/ContractSettings";
import { TabPanel } from "../components/SettingsHelpers";

interface SettingsSection {
    label: string;
    icon: React.ReactElement;
    component: React.ReactNode;
    placeholder?: boolean;
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
        label: "Notifications",
        icon: <NotificationsIcon />,
        component: <NotificationSettings />,
        placeholder: true,
    },
    {
        label: "Appearance",
        icon: <AppearanceIcon />,
        component: <AppearanceSettings />,
        placeholder: true,
    },
    {
        label: "Integrations",
        icon: <IntegrationsIcon />,
        component: <IntegrationSettings />,
        placeholder: true,
    },
    {
        label: "Security",
        icon: <SecurityIcon />,
        component: <SecuritySettings />,
        placeholder: true,
    },
    {
        label: "Billing & Plans",
        icon: <BillingIcon />,
        component: <BillingSettings />,
        placeholder: true,
    },
    {
        label: "Workflow",
        icon: <WorkflowIcon />,
        component: <WorkflowSettings />,
        placeholder: true,
    },
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
                                label={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {section.label}
                                        {section.placeholder && (
                                            <Chip
                                                label="Soon"
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.65rem",
                                                    opacity: 0.6,
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
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
