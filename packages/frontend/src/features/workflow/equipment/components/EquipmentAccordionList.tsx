"use client";

import React from "react";
import { Box } from "@mui/material";
import { Equipment, EquipmentByCategory } from "@/features/workflow/equipment/types/equipment.types";
import type { CrewMember } from "@/shared/types/users";
import { EquipmentAccordion } from "./EquipmentAccordion";

interface EquipmentAccordionListProps {
    equipmentByCategory: EquipmentByCategory;
    onCategoryToggle: (category: string) => void;
    crewMembers: CrewMember[];
    inlineEditingEquipment: number | null;
    inlineEditData: Partial<Equipment>;
    updateInlineEditData: (field: keyof Equipment, value: unknown) => void;
    startInlineEdit: (equipment: Equipment) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
    setEquipmentToDelete: (equipment: Equipment) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    quickAddCategory: string | null;
    quickAddData: Partial<Equipment>;
    startQuickAdd: (category: string) => void;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof Equipment, value: unknown) => void;
}

export function EquipmentAccordionList({
    equipmentByCategory,
    onCategoryToggle,
    crewMembers,
    inlineEditingEquipment,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    setEquipmentToDelete,
    setDeleteConfirmOpen,
    quickAddCategory,
    quickAddData,
    startQuickAdd,
    cancelQuickAdd,
    saveQuickAdd,
    updateQuickAddData,
}: EquipmentAccordionListProps) {
    return (
        <Box sx={{ width: '100%' }}>
            {Object.values(equipmentByCategory)
                .filter(group => group.count > 0) // Only show types that have equipment
                .map((group) => (
                    <EquipmentAccordion
                        key={group.category}
                        group={group}
                        onTypeToggle={onCategoryToggle}
                        contributors={crewMembers}
                        inlineEditingEquipment={inlineEditingEquipment}
                        inlineEditData={inlineEditData}
                        updateInlineEditData={updateInlineEditData}
                        startInlineEdit={startInlineEdit}
                        cancelInlineEdit={cancelInlineEdit}
                        saveInlineEdit={saveInlineEdit}
                        setEquipmentToDelete={setEquipmentToDelete}
                        setDeleteConfirmOpen={setDeleteConfirmOpen}
                        quickAddType={quickAddCategory}
                        quickAddData={quickAddData}
                        startQuickAdd={startQuickAdd}
                        cancelQuickAdd={cancelQuickAdd}
                        saveQuickAdd={saveQuickAdd}
                        updateQuickAddData={updateQuickAddData}
                    />
                ))}
        </Box>
    );
}
