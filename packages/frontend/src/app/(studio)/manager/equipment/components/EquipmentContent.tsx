"use client";

import React from "react";
import {
    Box,
    Alert,
    CircularProgress,
} from "@mui/material";
import { Equipment, EquipmentByCategory, EquipmentCategory, EQUIPMENT_CATEGORY_LABELS } from "@/lib/types";
import { EquipmentHeader } from "./EquipmentHeader";
import { EquipmentSummaryCards } from "./EquipmentSummaryCards";
import { CategoryCardsGrid } from "./CategoryCardsGrid";
import { EquipmentAccordionList } from "./EquipmentAccordionList";
import { EquipmentSnackbar } from "./EquipmentSnackbar";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface EquipmentContentProps {
    equipmentByCategory: EquipmentByCategory;
    loading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    onCategoryToggle: (category: string) => void;
    onCategoryCardClick: (category: string) => void;
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
    deleteConfirmOpen: boolean;
    onDeleteConfirm: () => void;
    onDeleteCancel: () => void;
    snackbarOpen: boolean;
    snackbarMessage: string;
    snackbarSeverity: "success" | "error";
    onSnackbarClose: () => void;
}

export function EquipmentContent({
    equipmentByCategory,
    loading,
    error,
    setError,
    onCategoryToggle,
    onCategoryCardClick,
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
    deleteConfirmOpen,
    onDeleteConfirm,
    onDeleteCancel,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    onSnackbarClose,
}: EquipmentContentProps) {
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    // Calculate statistics
    const totalEquipment = Object.values(equipmentByCategory).reduce(
        (sum, group) => sum + group.count,
        0
    );
    const totalAvailable = Object.values(equipmentByCategory).reduce(
        (sum, group) => sum + group.equipment.filter(e => e.availability_status === 'AVAILABLE').length,
        0
    );

    const categoryStats = Object.entries(equipmentByCategory).map(([category, group]) => ({
        category,
        label: EQUIPMENT_CATEGORY_LABELS[category as EquipmentCategory] || category,
        count: group.count,
        availableCount: group.equipment.filter(e => e.availability_status === 'AVAILABLE').length,
        totalValue: group.equipment.reduce((sum, e) => sum + parseFloat(String(e.purchase_price || '0')), 0),
    }));

    // Convert equipmentByCategory to equipment arrays for CategoryCardsGrid
    const equipmentArraysByCategory = Object.entries(equipmentByCategory).reduce((acc, [category, group]) => {
        acc[category] = group.equipment;
        return acc;
    }, {} as Record<string, Equipment[]>);

    return (
        <Box sx={{ p: 3 }}>
            <EquipmentHeader />

            <Box sx={{ mb: 3 }}>
                <EquipmentSummaryCards
                    totalEquipment={totalEquipment}
                    totalAvailable={totalAvailable}
                    categoryStats={categoryStats}
                />

                <CategoryCardsGrid
                    categoryStats={categoryStats}
                    equipmentByCategory={equipmentArraysByCategory}
                    onCategoryCardClick={onCategoryCardClick}
                />
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Equipment Accordions */}
            <EquipmentAccordionList
                equipmentByCategory={equipmentByCategory}
                onCategoryToggle={onCategoryToggle}
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

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onConfirm={onDeleteConfirm}
                onCancel={onDeleteCancel}
            />

            {/* Snackbar */}
            <EquipmentSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={onSnackbarClose}
            />
        </Box>
    );
}
