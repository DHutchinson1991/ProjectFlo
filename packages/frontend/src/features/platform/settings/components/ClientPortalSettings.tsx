import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Construction as ConstructionIcon } from "@mui/icons-material";

export default function ClientPortalSettings() {
    return (
        <Box>
            {/* ── Header ───────────────────────────────────────── */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                    Client Portal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Configure the experience your clients see — from the first
                    inquiry through to the final deliverables.
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 8,
                    px: 4,
                    borderRadius: 3,
                    bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                            ? alpha("#fff", 0.02)
                            : alpha("#000", 0.02),
                    border: (theme) =>
                        `1px solid ${
                            theme.palette.mode === "dark"
                                ? alpha("#fff", 0.06)
                                : alpha("#000", 0.06)
                        }`,
                }}
            >
                <ConstructionIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 0.5 }}>
                    Portal Customisation
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, textAlign: "center", maxWidth: 400 }}
                >
                    Theme, section, and layout options for the client portal
                    are being redesigned and will be available soon.
                </Typography>
                <Chip label="Coming Soon" size="small" />
            </Box>
        </Box>
    );
}
