"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
    Equipment,
    EquipmentByCategory,
    EquipmentCategory,
    EquipmentAvailability,
    EquipmentCondition,
    CreateEquipmentDto,
    Contributor,
} from "@/lib/types";
import { useBrand } from "@/app/providers/BrandProvider";
import { EquipmentContent } from "./components/EquipmentContent";

export default function EquipmentPage() {
    const { currentBrand } = useBrand();

    // State
    const [equipmentByCategory, setEquipmentByCategory] = useState<EquipmentByCategory>({});
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

    // Inline editing state
    const [inlineEditingEquipment, setInlineEditingEquipment] = useState<number | null>(null);
    const [inlineEditData, setInlineEditData] = useState<Partial<Equipment>>({});

    // Quick add state
    const [quickAddCategory, setQuickAddCategory] = useState<string | null>(null);
    const [quickAddData, setQuickAddData] = useState<Partial<Equipment>>({
        item_name: '',
        description: '',
        category: EquipmentCategory.CAMERA,
        availability_status: EquipmentAvailability.AVAILABLE,
        condition: EquipmentCondition.GOOD,
        rental_price_per_day: 0,
    });

    // Expanded categories state
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // Load equipment data
    const loadEquipment = async () => {
        try {
            setLoading(true);
            setError(null);

            const grouped = await api.equipment.getGroupedByCategory();

            // Preserve expanded state
            const preservedExpanded: EquipmentByCategory = {};
            Object.entries(grouped).forEach(([key, group]) => {
                preservedExpanded[key] = {
                    ...group,
                    expanded: expandedCategories[key] ?? false,
                };
            });

            setEquipmentByCategory(preservedExpanded);
        } catch (err) {
            console.error("Failed to load equipment:", err);
            setError("Failed to load equipment. Please try again.");
            showSnackbar("Failed to load equipment", "error");
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount and brand change
    useEffect(() => {
        if (currentBrand?.id) {
            loadEquipment();
            api.contributors.getAll().then(setContributors).catch(console.error);
        }
    }, [currentBrand?.id]);

    // Snackbar helper
    const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Toggle expanded state for equipment category
    const toggleCategoryExpansion = (category: string) => {
        setExpandedCategories(prev => {
            const newState = { ...prev, [category]: !prev[category] };

            // Update the equipmentByCategory state as well
            setEquipmentByCategory(current => ({
                ...current,
                [category]: {
                    ...current[category],
                    expanded: newState[category],
                }
            }));

            return newState;
        });
    };

    // Handle category card click - toggle specific category
    const handleCategoryCardClick = (category: string) => {
        const isCurrentlyExpanded = expandedCategories[category];

        setExpandedCategories(prev => ({
            ...prev,
            [category]: !isCurrentlyExpanded
        }));

        // Update the equipmentByCategory state as well
        setEquipmentByCategory(current => ({
            ...current,
            [category]: {
                ...current[category],
                expanded: !isCurrentlyExpanded,
            }
        }));
    };

    // Inline editing methods
    const startInlineEdit = (equipment: Equipment) => {
        setInlineEditingEquipment(equipment.id);
        setInlineEditData({ ...equipment });
    };

    const cancelInlineEdit = () => {
        setInlineEditingEquipment(null);
        setInlineEditData({});
    };

    const updateInlineEditData = (field: keyof Equipment, value: unknown) => {
        setInlineEditData(prev => ({ ...prev, [field]: value }));
    };

    const saveInlineEdit = async () => {
        if (!inlineEditingEquipment || !inlineEditData) return;

        try {
            // Convert string numbers to actual numbers for API compatibility
            const cleanedData: Partial<Equipment> = { ...inlineEditData };
            if (cleanedData.rental_price_per_day && typeof cleanedData.rental_price_per_day === 'string') {
                cleanedData.rental_price_per_day = parseFloat(cleanedData.rental_price_per_day);
            }

            await api.equipment.update(inlineEditingEquipment, cleanedData as Partial<CreateEquipmentDto>);
            await loadEquipment(); // Reload to get fresh data
            cancelInlineEdit();
            showSnackbar("Equipment updated successfully");
        } catch (err) {
            console.error("Failed to update equipment:", err);
            showSnackbar("Failed to update equipment", "error");
        }
    };

    // Quick add methods
    const startQuickAdd = (category: string) => {
        setQuickAddCategory(category);
        setQuickAddData(prev => ({
            ...prev,
            category: category as EquipmentCategory
        }));

        // Ensure the accordion is expanded when adding a new item
        setExpandedCategories(prev => ({
            ...prev,
            [category]: true
        }));

        setEquipmentByCategory(current => ({
            ...current,
            [category]: {
                ...current[category],
                expanded: true,
            }
        }));
    };

    const cancelQuickAdd = () => {
        setQuickAddCategory(null);
        setQuickAddData({
            item_name: '',
            description: '',
            category: EquipmentCategory.CAMERA,
            availability_status: EquipmentAvailability.AVAILABLE,
            condition: EquipmentCondition.GOOD,
            rental_price_per_day: 0,
        });
    };

    const updateQuickAddData = (field: keyof Equipment, value: unknown) => {
        setQuickAddData(prev => ({ ...prev, [field]: value }));
    };

    const saveQuickAdd = async () => {
        if (!quickAddData.item_name || !quickAddCategory) return;

        try {
            await api.equipment.create(quickAddData as CreateEquipmentDto);
            await loadEquipment(); // Reload to get fresh data
            cancelQuickAdd();
            showSnackbar("Equipment added successfully");
        } catch (err) {
            console.error("Failed to add equipment:", err);
            showSnackbar("Failed to add equipment", "error");
        }
    };

    // Delete methods
    const handleDeleteConfirm = async () => {
        if (!equipmentToDelete) return;

        try {
            await api.equipment.delete(equipmentToDelete.id);
            await loadEquipment(); // Reload to get fresh data
            setDeleteConfirmOpen(false);
            setEquipmentToDelete(null);
            showSnackbar("Equipment deleted successfully");
        } catch (err) {
            console.error("Failed to delete equipment:", err);
            showSnackbar("Failed to delete equipment", "error");
        }
    };

    return (
        <EquipmentContent
            equipmentByCategory={equipmentByCategory}
            loading={loading}
            error={error}
            setError={setError}
            onCategoryToggle={toggleCategoryExpansion}
            onCategoryCardClick={handleCategoryCardClick}
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
            deleteConfirmOpen={deleteConfirmOpen}
            onDeleteConfirm={handleDeleteConfirm}
            onDeleteCancel={() => {
                setDeleteConfirmOpen(false);
                setEquipmentToDelete(null);
            }}
            snackbarOpen={snackbarOpen}
            snackbarMessage={snackbarMessage}
            snackbarSeverity={snackbarSeverity}
            onSnackbarClose={() => setSnackbarOpen(false)}
        />
    );
}
