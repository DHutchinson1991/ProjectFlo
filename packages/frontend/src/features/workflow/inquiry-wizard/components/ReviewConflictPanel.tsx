import React from "react";
import { Box, Typography, CircularProgress, Stack, Grid } from "@mui/material";
import { CheckCircle, ErrorOutline, InfoOutlined, Warning } from "@mui/icons-material";
import type { IwDateConflictResult, IwCrewConflictResult } from "../types";

interface Props {
    dateConflicts: IwDateConflictResult | null;
    crewConflicts: IwCrewConflictResult | null;
    loadingConflicts: boolean;
}

export default function ReviewConflictPanel({ dateConflicts, crewConflicts, loadingConflicts }: Props) {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                    Date Conflicts
                </Typography>
                <Box sx={{ mt: 1 }}>
                    {loadingConflicts ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CircularProgress size={14} />
                            <Typography variant="body2" color="text.secondary">Checking&hellip;</Typography>
                        </Box>
                    ) : dateConflicts ? (
                        <Stack spacing={0.5}>
                            {dateConflicts.booked_conflicts.length === 0 && dateConflicts.soft_conflicts.length === 0 ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: "success.main" }} />
                                    <Typography variant="body2" color="success.main">No date conflicts found</Typography>
                                </Box>
                            ) : (
                                <>
                                    {dateConflicts.booked_conflicts.map((c) => (
                                        <Box key={`${c.type}-${c.id}`} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <ErrorOutline sx={{ fontSize: 16, color: "error.main" }} />
                                            <Typography variant="body2" color="error.main"><strong>BOOKED:</strong> {c.name} ({c.status})</Typography>
                                        </Box>
                                    ))}
                                    {dateConflicts.soft_conflicts.map((c) => (
                                        <Box key={`${c.type}-${c.id}`} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <InfoOutlined sx={{ fontSize: 16, color: "warning.main" }} />
                                            <Typography variant="body2" color="warning.main"><strong>UNBOOKED:</strong> {c.name} ({c.status})</Typography>
                                        </Box>
                                    ))}
                                </>
                            )}
                        </Stack>
                    ) : null}
                </Box>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                    Crew Availability
                </Typography>
                <Box sx={{ mt: 1 }}>
                    {loadingConflicts ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CircularProgress size={14} />
                            <Typography variant="body2" color="text.secondary">Checking&hellip;</Typography>
                        </Box>
                    ) : crewConflicts ? (
                        crewConflicts.conflicts.length === 0 ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CheckCircle sx={{ fontSize: 16, color: "success.main" }} />
                                <Typography variant="body2" color="success.main">No crew conflicts found</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={0.5}>
                                {crewConflicts.conflicts.map((c) => (
                                    <Box key={c.contributor_id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Warning sx={{ fontSize: 16, color: "error.main" }} />
                                        <Typography variant="body2" color="error.main"><strong>{c.name}</strong> ({c.role}) — {c.event_title}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )
                    ) : null}
                </Box>
            </Grid>
        </Grid>
    );
}
