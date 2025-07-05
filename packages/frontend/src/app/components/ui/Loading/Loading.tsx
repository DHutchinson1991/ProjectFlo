"use client";

import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { LoadingProps } from "@/lib/types";

// Component definition continues with the imported type...

export function Loading({
  variant = "circular",
  message,
  size = "medium",
}: LoadingProps) {
  const getSizes = () => {
    switch (size) {
      case "small":
        return { circularSize: 24, typography: "body2" as const };
      case "large":
        return { circularSize: 64, typography: "h6" as const };
      default:
        return { circularSize: 40, typography: "body1" as const };
    }
  };

  const { circularSize, typography } = getSizes();

  if (variant === "skeleton") {
    return (
      <Stack spacing={1}>
        <Skeleton variant="text" sx={{ fontSize: "2rem" }} />
        <Skeleton variant="rectangular" width="100%" height={60} />
        <Skeleton variant="rounded" width="100%" height={40} />
      </Stack>
    );
  }

  if (variant === "dots") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                animation: "bounce 1.4s ease-in-out infinite both",
                animationDelay: `${index * 0.16}s`,
                "@keyframes bounce": {
                  "0%, 80%, 100%": {
                    transform: "scale(0)",
                  },
                  "40%": {
                    transform: "scale(1.0)",
                  },
                },
              }}
            />
          ))}
        </Box>
        {message && (
          <Typography variant={typography} color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
      }}
    >
      <CircularProgress size={circularSize} />
      {message && (
        <Typography variant={typography} color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
