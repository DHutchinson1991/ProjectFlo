"use client";

import React from "react";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import StudioSidebar from "@/features/platform/studio-layout/components/StudioSidebar";
import StudioHeader from "@/features/platform/studio-layout/components/StudioHeader";
import GlobalTaskDrawer from "@/features/workflow/tasks/components/GlobalTaskDrawer";
import { ProtectedRoute } from "@/features/platform/auth";

interface StudioLayoutProps {
    children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
    const pathname = usePathname();
    const isCalendarPage = pathname.startsWith("/calendar");
    const isInquiryPackageReviewPage = /^\/inquiries\/[^/]+\/package(?:\/|$)/.test(pathname);
    const isFilmDetailPage = /^\/films\/\d+/.test(pathname);
    const isInstanceFilmDetailPage = /^\/instance-films\/\d+/.test(pathname);
    const isFullBleedStudioPage = isCalendarPage || isFilmDetailPage || isInstanceFilmDetailPage;
    const hideGlobalTaskDrawer = isInquiryPackageReviewPage || isFilmDetailPage || isInstanceFilmDetailPage || ["/settings", "/packages", "/ai-playground"].some((prefix) => pathname.startsWith(prefix));

    return (
        <ProtectedRoute>
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
                        minHeight: "calc(100dvh - 64px)", // Ensure proper minimum height
                        height: isFullBleedStudioPage ? "calc(100dvh - 64px)" : "auto",
                        overflow: isFullBleedStudioPage ? "hidden" : "visible",
                    }}
                >
                    {/* Page content */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            p: isFullBleedStudioPage ? 0 : 3,
                            pb: 0,
                            overflow: isFullBleedStudioPage ? "hidden" : "visible",
                            minHeight: "calc(100dvh - 64px)",
                            height: isFullBleedStudioPage ? "calc(100dvh - 64px)" : "auto",
                        }}
                    >
                        {children}
                    </Box>
                </Box>
            </Box>
            {!hideGlobalTaskDrawer && <GlobalTaskDrawer />}
        </ProtectedRoute>
    );
}
