/**
 * Film Equipment Tab - Equipment configuration for film timeline
 * When linked to a package, shows package-inherited equipment (read-only).
 * Otherwise, shows the editable FilmEquipmentPanel.
 */
import React from "react";
import { FilmEquipmentPanel } from "../FilmEquipmentPanel";
import type { EquipmentSummary, FilmEquipmentAssignmentsBySlot } from "@/features/content/films/types/film-equipment.types";
import { PackageEquipmentView } from "./PackageEquipmentView";

interface FilmEquipmentTabProps {
    filmId: number;
    packageId?: number | null;
    onEquipmentChange?: (summary: EquipmentSummary) => void;
    onEquipmentAssignmentsChange?: (assignments: FilmEquipmentAssignmentsBySlot) => void;
}

export const FilmEquipmentTab: React.FC<FilmEquipmentTabProps> = ({
    filmId,
    packageId,
    onEquipmentChange,
    onEquipmentAssignmentsChange,
}) => {
    if (packageId) {
        return <PackageEquipmentView packageId={packageId} filmId={filmId} />;
    }

    return (
        <FilmEquipmentPanel
            filmId={filmId}
            onEquipmentChange={onEquipmentChange}
            onEquipmentAssignmentsChange={onEquipmentAssignmentsChange}
        />
    );
};
