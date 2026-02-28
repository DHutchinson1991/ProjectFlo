/**
 * Film Locations Tab - Read-only from package locations when packageId provided,
 * or editable film-level locations otherwise.
 */
import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography, MenuItem, Button, IconButton, Tooltip, TextField, Chip, CircularProgress, Alert } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PlaceIcon from "@mui/icons-material/Place";
import { useFilmLocations } from "@/hooks/locations/useFilmLocations";
import { api } from "@/lib/api";

interface FilmLocationsTabProps {
    filmId: number;
    brandId?: number;
    packageId?: number | null;
}

export const FilmLocationsTab: React.FC<FilmLocationsTabProps> = ({ filmId, brandId, packageId }) => {
    // ── Package-linked read-only mode ──────────────────────────
    const [pkgLoading, setPkgLoading] = useState(false);
    const [pkgError, setPkgError] = useState<string | null>(null);
    const [packageLocations, setPackageLocations] = useState<any[]>([]);
    const [eventDays, setEventDays] = useState<any[]>([]);

    useEffect(() => {
        if (!packageId) return;
        setPkgLoading(true);
        Promise.all([
            api.schedule.packageEventDayLocations.getAll(packageId),
            api.schedule.packageEventDays.getAll(packageId),
        ])
            .then(([locs, days]) => {
                setPackageLocations(locs || []);
                setEventDays(days || []);
            })
            .catch(() => setPkgError("Failed to load package locations"))
            .finally(() => setPkgLoading(false));
    }, [packageId]);

    if (packageId) {
        if (pkgLoading) return <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
        if (pkgError) return <Alert severity="error" sx={{ m: 2 }}>{pkgError}</Alert>;

        // Group by event day
        const grouped = eventDays.map(day => ({
            day,
            locations: packageLocations.filter((l: any) => l.event_day_template_id === day.id),
        })).filter(g => g.locations.length > 0);

        const dayIds = new Set(eventDays.map((d: any) => d.id));
        const ungrouped = packageLocations.filter((l: any) => !dayIds.has(l.event_day_template_id));

        return (
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PlaceIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#f1f5f9" }}>
                        Locations from Package
                    </Typography>
                    <Chip
                        label={packageLocations.length}
                        size="small"
                        sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, bgcolor: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "none" }}
                    />
                </Box>

                {packageLocations.length === 0 && (
                    <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.72rem", textAlign: "center", py: 2 }}>
                        No locations assigned to this package yet.
                    </Typography>
                )}

                {grouped.map(({ day, locations: dayLocs }) => (
                    <Box key={day.id}>
                        <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 0.5 }}>
                            {day.name}
                        </Typography>
                        {dayLocs.map((loc: any) => (
                            <Box
                                key={loc.id}
                                sx={{
                                    display: "flex", alignItems: "center", gap: 1.5, py: 0.75, px: 1,
                                    borderRadius: 1, bgcolor: "rgba(245,158,11,0.04)",
                                    border: "1px solid rgba(245,158,11,0.12)", mb: 0.5,
                                }}
                            >
                                <PlaceIcon sx={{ fontSize: 13, color: "#f59e0b", flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.72rem", color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {loc.location?.name || "Location"}
                                    </Typography>
                                    {(loc.location?.city || loc.location?.state) && (
                                        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.58rem" }}>
                                            {[loc.location.city, loc.location.state].filter(Boolean).join(", ")}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                ))}

                {ungrouped.map((loc: any) => (
                    <Box
                        key={loc.id}
                        sx={{
                            display: "flex", alignItems: "center", gap: 1.5, py: 0.75, px: 1,
                            borderRadius: 1, bgcolor: "rgba(245,158,11,0.04)",
                            border: "1px solid rgba(245,158,11,0.12)",
                        }}
                    >
                        <PlaceIcon sx={{ fontSize: 13, color: "#f59e0b", flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.72rem", color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {loc.location?.name || "Location"}
                        </Typography>
                    </Box>
                ))}

                <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.6rem", textAlign: "center" }}>
                    Locations are managed on the Package page
                </Typography>
            </Box>
        );
    }

    // ── Film-level editable mode (no packageId) ────────────────
    return <FilmLocationsEditable filmId={filmId} brandId={brandId} />;
};

// Extracted editable component to avoid calling hooks conditionally
const FilmLocationsEditable: React.FC<{ filmId: number; brandId?: number }> = ({ filmId, brandId }) => {
    const { filmLocations, allLocations, addLocation, removeLocation } = useFilmLocations(filmId, brandId);
    const [selectedLocationId, setSelectedLocationId] = useState<number | "">("");

    const availableLocations = useMemo(() => {
        const assigned = new Set(filmLocations.map((item) => item.location_id));
        return allLocations.filter((location) => !assigned.has(location.id));
    }, [allLocations, filmLocations]);

    const handleAddLocation = async () => {
        if (!selectedLocationId) return;
        await addLocation(Number(selectedLocationId));
        setSelectedLocationId("");
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6">Locations</Typography>
            <Typography variant="body2" color="text.secondary">
                {filmLocations.length} locations
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                    select
                    label="Add Location"
                    value={selectedLocationId}
                    onChange={(event) => setSelectedLocationId(event.target.value as number | "")}
                    size="small"
                    fullWidth
                >
                    {availableLocations.map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                            {location.name}
                        </MenuItem>
                    ))}
                </TextField>
                <Button
                    variant="contained"
                    onClick={handleAddLocation}
                    disabled={!selectedLocationId}
                >
                    Add
                </Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {filmLocations.map((assignment) => (
                    <Box
                        key={assignment.id}
                        sx={{
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 1,
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box>
                            <Typography variant="subtitle2">{assignment.location?.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {assignment.location?.city || ""}{assignment.location?.state ? `, ${assignment.location?.state}` : ""}
                            </Typography>
                        </Box>
                        <Tooltip title="Remove location">
                            <IconButton
                                size="small"
                                onClick={() => removeLocation(assignment.location_id)}
                                sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ))}
                {!filmLocations.length && (
                    <Typography variant="body2" color="text.secondary">
                        No locations assigned yet.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};
