/**
 * Film Right Panel - Tabbed sidebar for film management
 */
import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import type { Film } from "@/features/content/films/types";
import type { TimelineLayer } from "@/features/content/films/types";
import { type FilmSubject, type SubjectTemplate } from '@/features/content/subjects';
import type { EquipmentSummary, FilmEquipmentAssignmentsBySlot } from "@/features/content/films/types/film-equipment.types";
import { FilmEquipmentTab } from "./FilmEquipmentTab";
import { FilmSubjectsTab } from "./FilmSubjectsTab";
import { FilmCrewSlotsTab } from "./FilmCrewSlotsTab";
import { FilmActivitiesTab } from "./FilmActivitiesTab";

interface FilmRightPanelProps {
    film: Film;
    filmId: number;
    packageId?: number | null;
    subjects: FilmSubject[];
    subjectTemplates: SubjectTemplate[];
    layers: TimelineLayer[];
    scenes?: Array<{ id: number; name: string; order_index?: number; mode?: string }>;
    onEquipmentChange?: (summary: EquipmentSummary) => void;
    onEquipmentAssignmentsChange?: (assignments: FilmEquipmentAssignmentsBySlot) => void;
    onAddSubject: (name: string, roleTemplateId?: number) => Promise<void>;
    onDeleteSubject: (subjectId: number) => Promise<void>;
    onSaveFilm: (name: string) => Promise<void>;
}

export const FilmRightPanel: React.FC<FilmRightPanelProps> = ({
    film,
    filmId,
    packageId,
    subjects,
    subjectTemplates,
    layers,
    scenes = [],
    onEquipmentChange,
    onEquipmentAssignmentsChange,
    onAddSubject,
    onDeleteSubject,
    onSaveFilm,
}) => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ '& .MuiTab-root': { minWidth: 0, fontSize: '0.72rem', textTransform: 'none', px: 1.5 } }}
            >
                <Tab label="Activities" />
                <Tab label="Equipment" />
                <Tab label="Subjects" />
                <Tab label="Crew Slots" />
            </Tabs>

            <Box sx={{ overflow: "auto" }}>
                {activeTab === 0 && (
                    <FilmActivitiesTab
                        packageId={packageId}
                    />
                )}
                {activeTab === 1 && (
                    <FilmEquipmentTab
                        filmId={filmId}
                        packageId={packageId}
                        onEquipmentChange={onEquipmentChange}
                        onEquipmentAssignmentsChange={onEquipmentAssignmentsChange}
                    />
                )}
                {activeTab === 2 && (
                    <FilmSubjectsTab
                        filmId={filmId}
                        brandId={film.brand_id}
                        packageId={packageId}
                        subjects={subjects}
                        subjectTemplates={subjectTemplates}
                        onAddSubject={onAddSubject}
                        onDeleteSubject={onDeleteSubject}
                    />
                )}
                {activeTab === 3 && (
                    <FilmCrewSlotsTab
                        filmId={filmId}
                        packageId={packageId}
                    />
                )}

            </Box>
        </Box>
    );
};
