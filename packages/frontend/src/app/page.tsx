"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { authApi } from "@/features/platform/auth/api";
import { clearAuthTokens, getAuthToken } from "@/shared/api/client";

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if there's a stored token
        const token = getAuthToken();

        if (!token) {
          // No token, redirect to login
          router.push("/login");
          return;
        }

        // Verify token is still valid by getting user profile
        const userProfile = await authApi.getProfile();

        // Redirect based on user role
        if (
          userProfile.roles.includes("Admin") ||
          userProfile.roles.includes("Lead Videographer")
        ) {
          router.push("/dashboard"); // Studio dashboard (route group doesn't create URL segment)
        } else if (
          userProfile.roles.includes("Client Manager") ||
          userProfile.roles.includes("Client")
        ) {
          router.push("/portal"); // Portal for client management
        } else {
          router.push("/dashboard"); // Default dashboard
        }
      } catch (error) {
        // Token invalid or other error, redirect to login
        console.log("Authentication failed:", error);
        clearAuthTokens();
        localStorage.removeItem("userProfile");
        router.push("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Show loading spinner while checking authentication
  return (
    <>
      {/* Glassmorphic overlay spinner */}
      {isChecking && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            background: "rgba(10, 10, 15, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              "0%": { opacity: 0 },
              "100%": { opacity: 1 },
            },
          }}
        >
          {/* Unique ProjectFlo Spinner */}
          <Box
            sx={{
              position: "relative",
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Outer rotating ring */}
            <Box
              sx={{
                position: "absolute",
                width: 80,
                height: 80,
                border: "3px solid transparent",
                borderTop: "3px solid #3b82f6",
                borderRight: "3px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 2s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
            {/* Inner counter-rotating ring */}
            <Box
              sx={{
                position: "absolute",
                width: 60,
                height: 60,
                border: "2px solid transparent",
                borderBottom: "2px solid #10b981",
                borderLeft: "2px solid #10b981",
                borderRadius: "50%",
                animation: "spinReverse 3s linear infinite",
                "@keyframes spinReverse": {
                  "0%": { transform: "rotate(360deg)" },
                  "100%": { transform: "rotate(0deg)" },
                },
              }}
            />
            {/* Center dot */}
            <Box
              sx={{
                position: "absolute",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#3b82f6",
                zIndex: 1,
              }}
            />
          </Box>

          {/* ProjectFlo text */}
          <Typography 
            variant="h6" 
            sx={{
              fontWeight: 600,
              letterSpacing: 2,
              color: "#ffffff",
              fontSize: "0.95rem",
            }}
          >
            ProjectFlo
          </Typography>

          {/* Loading text */}
          <Typography 
            variant="body2" 
            sx={{
              color: "#9ca3af",
              fontSize: "0.85rem",
              animation: "pulse 1.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 0.6 },
                "50%": { opacity: 1 },
              },
            }}
          >
            Loading
          </Typography>
        </Box>
      )}
    </>
  );
}
