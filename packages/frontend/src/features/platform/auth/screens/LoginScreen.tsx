"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAuth } from "@/features/platform/auth";
import { LoginForm } from "@/features/platform/auth/components/LoginForm";

function getSafeReturnPath(searchParams: ReturnType<typeof useSearchParams>): string | null {
  const raw = searchParams.get("returnTo");
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) {
    return null;
  }
  return raw;
}

function LoginScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(getSafeReturnPath(searchParams) || "/");
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSuccess = () => {
    router.replace(getSafeReturnPath(searchParams) || "/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pt: "15vh",
        bgcolor: "#121212",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(33,150,243,0.08) 0%, rgba(33,203,243,0.04) 40%, transparent 70%)",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          mx: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: "2rem",
              letterSpacing: "-0.02em",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 800,
              }}
            >
              ProjectFlo
            </Box>
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.875rem",
              mt: 1,
              letterSpacing: "0.04em",
            }}
          >
            Creative production, simplified
          </Typography>
        </Box>

        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: "16px",
            bgcolor: "rgba(30, 30, 30, 0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: "1.25rem", mb: 0.5, color: "#ffffff" }}
          >
            Welcome back
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", mb: 3 }}>
            Sign in to your account to continue
          </Typography>

          <LoginForm onSuccess={handleSuccess} />
        </Box>

        <Typography
          sx={{
            textAlign: "center",
            mt: 3,
            color: "rgba(255,255,255,0.25)",
            fontSize: "0.75rem",
          }}
        >
          ProjectFlo &mdash; Creative Production Platform
        </Typography>
      </Box>
    </Box>
  );
}

export function LoginScreen() {
  return (
    <Suspense>
      <LoginScreenContent />
    </Suspense>
  );
}
