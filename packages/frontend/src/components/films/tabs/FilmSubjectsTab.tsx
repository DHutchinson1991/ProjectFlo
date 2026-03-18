/**
 * Film Subjects Tab - Read-only from package subjects when packageId provided,
 * or editable SubjectsCard when filmId-only mode.
 *
 * In package mode: shows role templates derived from the package's event day type
 * templates (e.g. "Wedding Day" → "Wedding" template → Bride, Groom, etc.), plus
 * any explicitly added PackageEventDaySubject records.
 */
import React, { useState, useEffect } from "react";
import { Box, Typography, Chip, CircularProgress, Alert } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import { SubjectCategory } from "@/lib/types/domains/subjects";
import { SubjectsCard } from "@/app/(studio)/designer/components/SubjectsCard";
import { api } from "@/lib/api";
import { request } from "@/hooks/utils/api";

interface FilmSubjectsTabProps {
    filmId: number;
    brandId?: number;
    packageId?: number | null;
    subjects: any[];
    subjectTemplates: any[];
    onAddSubject?: (name: string, category: SubjectCategory) => Promise<void>;
    onDeleteSubject?: (subjectId: number) => Promise<void>;
}

export const FilmSubjectsTab: React.FC<FilmSubjectsTabProps> = ({
    filmId,
    brandId,
    packageId,
    subjects,
    subjectTemplates,
    onAddSubject,
    onDeleteSubject,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [packageSubjects, setPackageSubjects] = useState<any[]>([]);
    const [eventDays, setEventDays] = useState<any[]>([]);
    const [typeTemplates, setTypeTemplates] = useState<any[]>([]);

    useEffect(() => {
        if (!packageId) return;
        setLoading(true);
        const fetches: Promise<any>[] = [
            api.schedule.packageEventDaySubjects.getAll(packageId),
            api.schedule.packageEventDays.getAll(packageId),
        ];
        if (brandId) {
            fetches.push(
                request<any[]>(`/subjects/type-templates/brand/${brandId}`, {}, { includeBrandQuery: false })
                    .catch(() => [])
            );
        }
        Promise.all(fetches)
            .then(([subs, days, templates]) => {
                setPackageSubjects(subs || []);
                setEventDays(days || []);
                setTypeTemplates(templates || []);
            })
            .catch(() => setError("Failed to load package subjects"))
            .finally(() => setLoading(false));
    }, [packageId, brandId]);

    // ── Package-linked read-only mode ──────────────────────────
    if (packageId) {
        if (loading) return <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
        if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

        // Build per-day display: template-derived roles + any explicit subjects
        type DayEntry = { day: any; roles: string[] };
        const dayEntries: DayEntry[] = eventDays.map(day => {
            // Match type templates to this day by name fuzzy match
            const matched = typeTemplates.filter(t =>
                day.name.toLowerCase().includes(t.name.toLowerCase()) ||
                t.name.toLowerCase().includes(day.name.toLowerCase().split(' ')[0])
            );
            const templateRoles: string[] = matched.flatMap((t: any) =>
                (t.roles || []).map((r: any) => r.role_name as string)
            );
            // Also include any explicitly added PackageEventDaySubject names
            const explicitNames: string[] = packageSubjects
                .filter((s: any) => s.event_day_template_id === day.id)
                .map((s: any) => s.name as string);
            // Merge & deduplicate, template order first
            const allNames = Array.from(new Set([...templateRoles, ...explicitNames]));
            return { day, roles: allNames };
        }).filter(e => e.roles.length > 0);

        // Fallback: subjects with no matching event day
        const knownDayIds = new Set(eventDays.map((d: any) => d.id));
        const ungrouped = packageSubjects.filter((s: any) => !knownDayIds.has(s.event_day_template_id));

        const totalCount = dayEntries.reduce((acc, e) => acc + e.roles.length, 0) + ungrouped.length;

        return (
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PeopleIcon sx={{ fontSize: 16, color: "#a78bfa" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#f1f5f9" }}>
                        Subjects from Package
                    </Typography>
                    <Chip
                        label={totalCount}
                        size="small"
                        sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, bgcolor: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "none" }}
                    />
                </Box>

                {totalCount === 0 && (
                    <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.72rem", textAlign: "center", py: 2 }}>
                        No subject templates matched for this package&apos;s event days.
                    </Typography>
                )}

                {dayEntries.map(({ day, roles }) => (
                    <Box key={day.id}>
                        {eventDays.length > 1 && (
                            <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 0.5 }}>
                                {day.name}
                            </Typography>
                        )}
                        {roles.map((roleName) => (
                            <Box
                                key={roleName}
                                sx={{
                                    display: "flex", alignItems: "center", gap: 1.5, py: 0.75, px: 1,
                                    borderRadius: 1, bgcolor: "rgba(167,139,250,0.04)",
                                    border: "1px solid rgba(167,139,250,0.1)", mb: 0.5,
                                }}
                            >
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#a78bfa", flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.72rem", color: "#f1f5f9" }}>
                                    {roleName}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                ))}

                {ungrouped.map((subj: any) => (
                    <Box
                        key={subj.id}
                        sx={{
                            display: "flex", alignItems: "center", gap: 1.5, py: 0.75, px: 1,
                            borderRadius: 1, bgcolor: "rgba(167,139,250,0.04)",
                            border: "1px solid rgba(167,139,250,0.1)", mb: 0.5,
                        }}
                    >
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#a78bfa", flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.72rem", color: "#f1f5f9" }}>
                            {subj.name}
                        </Typography>
                    </Box>
                ))}
            </Box>
        );
    }

    // ── Film-level editable mode (no packageId) ────────────────
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {loading && <CircularProgress />}
            {brandId && (
                <SubjectsCard
                    filmId={filmId}
                    brandId={brandId}
                    subjects={subjects}
                    onSubjectsChange={() => {
                        // Subjects updated via SubjectsCard
                    }}
                />
            )}
        </Box>
    );
};

