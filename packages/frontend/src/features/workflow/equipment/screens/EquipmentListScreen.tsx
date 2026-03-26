"use client";

import React from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import {
    Equipment,
    EquipmentByCategory,
    EquipmentCategory,
    EQUIPMENT_CATEGORY_LABELS,
} from "@/features/workflow/equipment/types/equipment.types";
import { useEquipmentList } from "@/features/workflow/equipment/hooks/useEquipmentList";
import { EquipmentListHeader } from "@/features/workflow/equipment/components/EquipmentListHeader";
import { EquipmentSummaryCards } from "@/features/workflow/equipment/components/EquipmentSummaryCards";
import { CategoryCardsGrid } from "@/features/workflow/equipment/components/CategoryCardsGrid";
import { EquipmentAccordionList } from "@/features/workflow/equipment/components/EquipmentAccordionList";
import { EquipmentSnackbar } from "@/features/workflow/equipment/components/EquipmentSnackbar";
import { DeleteConfirmDialog } from "@/features/workflow/equipment/components/DeleteConfirmDialog";

export function EquipmentListScreen() {
    const {
        equipmentByCategory,
        contributors,
        loading,
        error,
        deleteConfirmOpen,
        snackbarOpen,
        snackbarMessage,
        snackbarSeverity,
        inlineEditingEquipment,
        inlineEditData,
        quickAddCategory,
        quickAddData,
        setError,
        setEquipmentToDelete,
        setDeleteConfirmOpen,
        setSnackbarOpen,
        toggleCategoryExpansion,
        handleCategoryCardClick,
        startInlineEdit,
        cancelInlineEdit,
        updateInlineEditData,
        saveInlineEdit,
        startQuickAdd,
        cancelQuickAdd,
        updateQuickAddData,
        saveQuickAdd,
        handleDeleteConfirm,
    } = useEquipmentList();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    const totalEquipment = Object.values(equipmentByCategory).reduce((sum, g) => sum + g.count, 0);
    const totalAvailable = Object.values(equipmentByCategory).reduce(
        (sum, g) => sum + g.equipment.filter((e) => e.availability_status === "AVAILABLE").length,
        0,
    );
    const categoryStats = Object.entries(equipmentByCategory).map(([category, group]) => ({
        category,
        label: EQUIPMENT_CATEGORY_LABELS[category as EquipmentCategory] || category,
        count: group.count,
        availableCount: group.equipment.filter((e) => e.availability_status === "AVAILABLE").length,
        totalValue: group.equipment.reduce((sum, e) => sum + parseFloat(String(e.purchase_price || "0")), 0),
    }));
    const equipmentArraysByCategory = Object.entries(equipmentByCategory).reduce(
        (acc, [category, group]) => {
            acc[category] = group.equipment;
            return acc;
        },
        {} as Record<string, Equipment[]>,
    );

    return (
        <Box sx={{ p: 3 }}>
            <EquipmentListHeader />

            <Box sx={{ mb: 3 }}>
                <EquipmentSummaryCards
                    totalEquipment={totalEquipment}
                    totalAvailable={totalAvailable}
                    categoryStats={categoryStats}
                />
                <CategoryCardsGrid
                    categoryStats={categoryStats}
                    equipmentByCategory={equipmentArraysByCategory}
                    onCategoryCardClick={handleCategoryCardClick}
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <EquipmentAccordionList
                equipmentByCategory={equipmentByCategory}
                onCategoryToggle={toggleCategoryExpansion}
                contributors={contributors}
                inlineEditingEquipment={inlineEditingEquipment}
                inlineEditData={inlineEditData}
                updateInlineEditData={updateInlineEditData}
                startInlineEdit={startInlineEdit}
                cancelInlineEdit={cancelInlineEdit}
                saveInlineEdit={saveInlineEdit}
                setEquipmentToDelete={setEquipmentToDelete}
                setDeleteConfirmOpen={setDeleteConfirmOpen}
                quickAddCategory={quickAddCategory}
                quickAddData={quickAddData}
                startQuickAdd={startQuickAdd}
                cancelQuickAdd={cancelQuickAdd}
                saveQuickAdd={saveQuickAdd}
                updateQuickAddData={updateQuickAddData}
            />

            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    setEquipmentToDelete(null);
                }}
            />

            <EquipmentSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={() => setSnackbarOpen(false)}
            />
        </Box>
    );
}
