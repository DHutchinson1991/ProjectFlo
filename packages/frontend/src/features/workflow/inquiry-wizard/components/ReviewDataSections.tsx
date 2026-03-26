import React from "react";
import { Box, Typography, Paper, Stack, Chip, Grid } from "@mui/material";
import { Person, Event, Videocam, Notes } from "@mui/icons-material";

function renderSection(title: string, icon: React.ReactNode, content: React.ReactNode) {
    return (
        <Paper variant="outlined" sx={{ height: "100%", overflow: "hidden" }}>
            <Box sx={{ p: 2, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                {icon}
                <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
            </Box>
            <Box sx={{ p: 3 }}>{content}</Box>
        </Paper>
    );
}

function Field({ label, value, isChip = false, fullWidth = false }: { label: string; value: unknown; isChip?: boolean; fullWidth?: boolean }) {
    if (!value && value !== 0) return null;
    return (
        <Box sx={{ mb: 2, width: fullWidth ? "100%" : "auto" }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {label}
            </Typography>
            {isChip && Array.isArray(value) ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {value.map((v: string, i: number) => <Chip key={i} label={v} size="small" />)}
                </Box>
            ) : (
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{String(value)}</Typography>
            )}
        </Box>
    );
}

interface Props { data: Record<string, unknown>; }

export default function ReviewDataSections({ data }: Props) {
    const KNOWN_KEYS = [
        "contact_first_name", "contact_last_name", "contact_email", "contact_phone", "preferred_contact_method",
        "budget_range", "budget_flexible", "decision_timeline", "priority_level",
        "wedding_date", "event_date", "venue_details", "stakeholders",
        "coverage_hours", "deliverables", "add_ons", "notes",
    ];

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                {renderSection("Contact Information", <Person color="primary" />, (
                    <Stack spacing={0}>
                        <Field label="Name" value={`${data.contact_first_name || ""} ${data.contact_last_name || ""}`.trim() || "-"} />
                        <Field label="Email" value={data.contact_email} />
                        <Field label="Phone" value={data.contact_phone} />
                        <Field label="Preferred Method" value={data.preferred_contact_method} />
                    </Stack>
                ))}
            </Grid>
            <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        {renderSection("Event Details", <Event color="primary" />, (
                            <Stack spacing={0}>
                                <Field label="Event Date" value={data.wedding_date || data.event_date} />
                                <Field label="Venue" value={data.venue_details} />
                                <Field label="Stakeholders" value={data.stakeholders} />
                            </Stack>
                        ))}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {renderSection("Project Scope", <Videocam color="primary" />, (
                            <Stack spacing={0}>
                                <Field label="Coverage Hours" value={data.coverage_hours} />
                                <Field label="Deliverables" value={data.deliverables} isChip />
                                <Box sx={{ mt: 2 }}><Field label="Add-ons" value={data.add_ons} isChip /></Box>
                            </Stack>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        {renderSection("Notes & Additional Details", <Notes color="primary" />, (
                            <Box>
                                <Field label="Additional Notes" value={data.notes} fullWidth />
                                <Box sx={{ mt: 2 }}>
                                    {Object.entries(data).filter(([k]) => !KNOWN_KEYS.includes(k)).map(([k, v]) => (
                                        <Field key={k} label={k.replace(/_/g, " ")} value={v} isChip={Array.isArray(v)} />
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}
