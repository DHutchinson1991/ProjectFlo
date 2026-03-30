"use client";

import React, { useState } from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import {
    EquipmentCategory,
    EQUIPMENT_CATEGORY_LABELS,
    Equipment,
} from "@/features/workflow/equipment/types/equipment.types";
import { useEquipmentList } from "@/features/workflow/equipment/hooks/useEquipmentList";
import { EquipmentListHeader } from "@/features/workflow/equipment/components/EquipmentListHeader";
import { CategoryCardsGrid } from "@/features/workflow/equipment/components/CategoryCardsGrid";
import { EquipmentFilterToolbar } from "@/features/workflow/equipment/components/EquipmentFilterToolbar";
import { EquipmentTable } from "@/features/workflow/equipment/components/EquipmentTable";
import { EquipmentDetailPanel } from "@/features/workflow/equipment/components/EquipmentDetailPanel";
import { EquipmentSnackbar } from "@/features/workflow/equipment/components/EquipmentSnackbar";
import { DeleteConfirmDialog } from "@/features/workflow/equipment/components/DeleteConfirmDialog";

export function EquipmentListScreen() {
    const [hoveredEquipment, setHoveredEquipment] = useState<Equipment | null>(null);

    const {
        equipmentByCategory,
        flatEquipment,
        filteredEquipment,
        searchTerm,
        categoryFilter,
        statusFilter,
        conditionFilter,
        selectedEquipment,
        setSearchTerm,
        setCategoryFilter,
        setStatusFilter,
        setConditionFilter,
        setSelectedEquipment,
        crew,
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
        startInlineEdit,
        cancelInlineEdit,
        updateInlineEditData,
        saveInlineEdit,
        startQuickAdd,
        cancelQuickAdd,
        updateQuickAddData,
        saveQuickAdd,
        handleDeleteConfirm,
        updateEquipment,
    } = useEquipmentList();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    const totalEquipment = flatEquipment.length;
    const categoryStats = Object.entries(equipmentByCategory).map(([category, group]) => ({
        category,
        label: EQUIPMENT_CATEGORY_LABELS[category as EquipmentCategory] || category,
        count: group.count,
        totalValue: group.equipment.reduce((sum, e) => sum + parseFloat(String(e.purchase_price || "0")), 0),
    }));

    const handleAdd = () => {
        const target = categoryFilter !== "all" ? categoryFilter : EquipmentCategory.CAMERA;
        startQuickAdd(target);
    };

    const editingBase = inlineEditingEquipment
        ? flatEquipment.find((e) => e.id === inlineEditingEquipment) ?? null
        : null;
    const detailEquipment = editingBase
        ? ({ ...editingBase, ...inlineEditData } as Equipment)
        : selectedEquipment ?? hoveredEquipment;

    const handleSelectEquipment = (equipment: Equipment) => {
        setSelectedEquipment(equipment);
    };

    return (
        <Box sx={{ p: 3 }}>
            <EquipmentListHeader onAdd={handleAdd} />

            <CategoryCardsGrid
                categoryStats={categoryStats}
                selectedCategory={categoryFilter}
                totalCount={totalEquipment}
                onSelect={setCategoryFilter}
            />

            <EquipmentFilterToolbar
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                conditionFilter={conditionFilter}
                filteredCount={filteredEquipment.length}
                totalCount={totalEquipment}
                onSearchChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
                onConditionFilterChange={setConditionFilter}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Two-column layout: table + detail panel */}
            <Box sx={{
                display: "grid",
                gridTemplateColumns: "1fr 560px",
                gap: 2,
                alignItems: "start",
            }}>
                <EquipmentTable
                    equipment={filteredEquipment}
                    crew={crew}
                    selectedEquipmentId={selectedEquipment?.id ?? null}
                    inlineEditingEquipment={inlineEditingEquipment}
                    inlineEditData={inlineEditData}
                    updateInlineEditData={updateInlineEditData}
                    startInlineEdit={startInlineEdit}
                    cancelInlineEdit={cancelInlineEdit}
                    saveInlineEdit={saveInlineEdit}
                    quickAddCategory={quickAddCategory}
                    quickAddData={quickAddData}
                    cancelQuickAdd={cancelQuickAdd}
                    saveQuickAdd={saveQuickAdd}
                    updateQuickAddData={updateQuickAddData}
                    onSelectEquipment={handleSelectEquipment}
                    onHoverEquipment={setHoveredEquipment}
                />

                <EquipmentDetailPanel
                    equipment={detailEquipment}
                    onClose={() => {
                        setSelectedEquipment(null);
                        setHoveredEquipment(null);
                    }}
                    onUpdate={updateEquipment}
                    onDelete={selectedEquipment ? () => {
                        setEquipmentToDelete(selectedEquipment);
                        setDeleteConfirmOpen(true);
                    } : undefined}
                />
            </Box>

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
