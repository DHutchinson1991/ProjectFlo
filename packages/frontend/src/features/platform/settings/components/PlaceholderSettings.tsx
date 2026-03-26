"use client";

import React from "react";
import { Paper, List, Divider } from "@mui/material";
import { SectionHeader, PlaceholderRow } from "./SettingsHelpers";

export function NotificationSettings() {
    return (
        <>
            <SectionHeader title="Notifications" description="Choose how and when you receive notifications." />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow label="Email Notifications" description="Receive email updates for project activity." hasToggle />
                    <Divider />
                    <PlaceholderRow label="In-App Notifications" description="Show notification badges inside the app." hasToggle />
                    <Divider />
                    <PlaceholderRow label="Weekly Digest" description="Get a summary email of activity each week." hasToggle />
                    <Divider />
                    <PlaceholderRow label="Inquiry Alerts" description="Notify when a new lead inquiry is received." hasToggle />
                </List>
            </Paper>
        </>
    );
}

export function AppearanceSettings() {
    return (
        <>
            <SectionHeader title="Appearance" description="Customise the look and feel of your workspace." />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow label="Theme" description="Switch between light, dark, or system theme." />
                    <Divider />
                    <PlaceholderRow label="Accent Colour" description="Choose a primary accent colour for the UI." />
                    <Divider />
                    <PlaceholderRow label="Compact Mode" description="Reduce spacing for denser information display." hasToggle />
                    <Divider />
                    <PlaceholderRow label="Sidebar Behaviour" description="Auto-collapse sidebar on smaller screens." hasToggle />
                </List>
            </Paper>
        </>
    );
}

export function IntegrationSettings() {
    return (
        <>
            <SectionHeader title="Integrations" description="Connect third-party services to enhance your workflow." />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow label="Calendar Sync" description="Sync project dates with Google Calendar or Outlook." />
                    <Divider />
                    <PlaceholderRow label="Cloud Storage" description="Connect Google Drive, Dropbox, or OneDrive for file management." />
                    <Divider />
                    <PlaceholderRow label="Payment Gateway" description="Link Stripe or PayPal for invoice payments." />
                    <Divider />
                    <PlaceholderRow label="Email Provider" description="Configure SMTP or a transactional email service." />
                </List>
            </Paper>
        </>
    );
}

export function SecuritySettings() {
    return (
        <>
            <SectionHeader title="Security" description="Manage passwords, sessions, and access controls." />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow label="Change Password" description="Update your account password." />
                    <Divider />
                    <PlaceholderRow label="Two-Factor Authentication" description="Add an extra layer of security to your account." hasToggle />
                    <Divider />
                    <PlaceholderRow label="Active Sessions" description="View and manage devices where you are logged in." />
                    <Divider />
                    <PlaceholderRow label="API Keys" description="Generate and revoke API keys for external access." />
                </List>
            </Paper>
        </>
    );
}

export function BillingSettings() {
    return (
        <>
            <SectionHeader title="Billing & Plans" description="View your subscription, invoices, and payment method." />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow label="Current Plan" description="View or change your subscription tier." />
                    <Divider />
                    <PlaceholderRow label="Payment Method" description="Manage credit card or payment details on file." />
                    <Divider />
                    <PlaceholderRow label="Billing History" description="Download past invoices and receipts." />
                    <Divider />
                    <PlaceholderRow label="Usage" description="Track storage and feature usage against plan limits." />
                </List>
            </Paper>
        </>
    );
}

export function WorkflowSettings() {
    return (
        <>
            <SectionHeader title="Workflow & Defaults" description="Set default values and automation rules for projects." />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow label="Default Project Template" description="Template automatically applied to new projects." />
                    <Divider />
                    <PlaceholderRow label="Task Auto-Assignment" description="Automatically assign tasks based on crew roles." hasToggle />
                    <Divider />
                    <PlaceholderRow label="Estimate Defaults" description="Pre-fill tax rate, terms, and payment schedule on new estimates." />
                    <Divider />
                    <PlaceholderRow label="Numbering Format" description="Configure invoice and quote numbering sequences." />
                </List>
            </Paper>
        </>
    );
}
