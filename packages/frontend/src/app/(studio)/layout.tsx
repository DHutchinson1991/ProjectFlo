"use client";

import React from "react";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import StudioSidebar from "@/features/platform/studio-layout/components/StudioSidebar";
import StudioHeader from "@/features/platform/studio-layout/components/StudioHeader";
import GlobalTaskDrawer from "@/features/workflow/tasks/components/GlobalTaskDrawer";
import { ProjectProvider } from "@/features/workflow/projects";
import { ProtectedRoute } from "../components/auth/ProtectedRoute/ProtectedRoute";

interface StudioLayoutProps {
    children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
    const pathname = usePathname();
    const isCalendarPage = pathname.startsWith("/calendar");
    const isInquiryPackageReviewPage = /^\/sales\/inquiries\/[^/]+\/package(?:\/|$)/.test(pathname);
    const hideGlobalTaskDrawer = isInquiryPackageReviewPage || ["/settings", "/manager", "/resources", "/designer/packages"].some((prefix) => pathname.startsWith(prefix));

    return (
        <ProtectedRoute>
            <ProjectProvider>
                <Box sx={{ display: "flex", minHeight: "100vh" }}>
                    {/* Header - spans across full width */}
                    <StudioHeader />

                    {/* Sidebar - positioned below header */}
                    <StudioSidebar />

                    {/* Main content area */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            bgcolor: "background.default",
                            marginLeft: "280px", // Account for fixed sidebar width
                            marginTop: "64px", // Account for fixed header height
                            minHeight: "calc(100vh - 64px)", // Ensure proper minimum height
                            overflow: "visible", // Allow natural scrolling
                        }}
                    >
                        {/* Page content */}
                        <Box
                            sx={{
                                flexGrow: 1,
                                p: isCalendarPage ? 0 : 3, // No padding for calendar, p: 3 for other pages
                                pb: 0,
                                overflow: "visible",
                                minHeight: "calc(100vh - 64px)", // Ensure minimum height for scrolling
                            }}
                        >
                            {children}
                        </Box>
                    </Box>
                </Box>
                {!hideGlobalTaskDrawer && <GlobalTaskDrawer />}
            </ProjectProvider>
        </ProtectedRoute>
    );
}
