"use client";

import React from "react";
import { ProtectedRoute } from "@/features/platform/auth";

export default function PreviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
}
