"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LoginForm } from "@/features/platform/auth/components/LoginForm";

export function LoginModal() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pt: "12vh",
        backdropFilter: "blur(12px) saturate(0.6)",
        WebkitBackdropFilter: "blur(12px) saturate(0.6)",
        backgroundColor: "rgba(10, 10, 18, 0.72)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "640px",
          height: "640px",
          background:
            "radial-gradient(circle, rgba(33,150,243,0.10) 0%, rgba(33,203,243,0.05) 40%, transparent 70%)",
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
          animation: "loginModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
          "@keyframes loginModalIn": {
            from: { opacity: 0, transform: "translateY(18px) scale(0.97)" },
            to:   { opacity: 1, transform: "translateY(0)    scale(1)" },
          },
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
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
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.875rem",
              mt: 0.75,
              letterSpacing: "0.04em",
            }}
          >
            Your session has ended — please sign in again
          </Typography>
        </Box>

        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: "20px",
            bgcolor: "rgba(22, 24, 36, 0.82)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: "1.25rem", mb: 0.5, color: "#ffffff" }}
          >
            Welcome back
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", mb: 3 }}>
            Sign in to your account to continue
          </Typography>

          <LoginForm emailFieldId="modal-email" passwordFieldId="modal-password" />
        </Box>

        <Typography
          sx={{
            textAlign: "center",
            mt: 3,
            color: "rgba(255,255,255,0.2)",
            fontSize: "0.75rem",
          }}
        >
          ProjectFlo &mdash; Creative Production Platform
        </Typography>
      </Box>
    </Box>
  );
}
