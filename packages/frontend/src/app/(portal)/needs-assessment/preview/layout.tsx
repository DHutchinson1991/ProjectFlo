"use client";

import React from "react";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute/ProtectedRoute";

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
