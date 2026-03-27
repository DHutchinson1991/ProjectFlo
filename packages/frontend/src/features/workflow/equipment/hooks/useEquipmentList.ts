import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentApi } from "../api";
import { useBrand } from "@/features/platform/brand";
import {
    Equipment,
    EquipmentByCategory,
    EquipmentListState,
    EquipmentListActions,
    CreateEquipmentDto,
} from "@/features/workflow/equipment/types/equipment.types";
import { useEquipmentInlineEdit } from "./useEquipmentInlineEdit";
import { useEquipmentQuickAdd } from "./useEquipmentQuickAdd";

export type { EquipmentListState, EquipmentListActions };

export function useEquipmentList(): EquipmentListState & EquipmentListActions {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    const [errorDismissed, setErrorDismissed] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const equipmentQuery = useQuery({
        queryKey: ["equipment", "grouped", brandId],
        queryFn: () => equipmentApi.getGroupedByCategory(),
        enabled: !!brandId,
    });
    const contributorsQuery = useQuery({
        queryKey: ["contributors", brandId],
        queryFn: () => equipmentApi.getContributors(),
        enabled: !!brandId,
    });

    useEffect(() => { setErrorDismissed(false); }, [equipmentQuery.errorUpdatedAt]);

    const equipmentByCategory: EquipmentByCategory = {};
    if (equipmentQuery.data) {
        Object.entries(equipmentQuery.data).forEach(([key, group]) => {
            equipmentByCategory[key] = { ...group, expanded: expandedCategories[key] ?? false };
        });
    }

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["equipment", "grouped", brandId] });
    const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<CreateEquipmentDto> }) => equipmentApi.update(id, data), onSuccess: invalidate });
    const createMutation = useMutation({ mutationFn: (data: CreateEquipmentDto) => equipmentApi.create(data), onSuccess: invalidate });
    const deleteMutation = useMutation({ mutationFn: (id: number) => equipmentApi.delete(id), onSuccess: invalidate });

    const showSnackbar = useCallback((message: string, severity: "success" | "error" = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    }, []);

    const inlineEdit = useEquipmentInlineEdit({ saveAsync: updateMutation.mutateAsync, showSnackbar });
    const quickAdd = useEquipmentQuickAdd({ createAsync: createMutation.mutateAsync, showSnackbar });

    const loadEquipment = useCallback(async () => { await equipmentQuery.refetch(); }, [equipmentQuery]);

    const toggleCategoryExpansion = useCallback((category: string) => {
        setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
    }, []);

    const startQuickAdd = useCallback((category: string) => {
        quickAdd.startQuickAdd(category);
        setExpandedCategories((prev) => ({ ...prev, [category]: true }));
    }, [quickAdd]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!equipmentToDelete) return;
        try {
            await deleteMutation.mutateAsync(equipmentToDelete.id);
            setDeleteConfirmOpen(false);
            setEquipmentToDelete(null);
            showSnackbar("Equipment deleted successfully");
        } catch {
            showSnackbar("Failed to delete equipment", "error");
        }
    }, [equipmentToDelete, deleteMutation, showSnackbar]);

    const error = errorDismissed ? null : equipmentQuery.isError ? "Failed to load equipment. Please try again." : null;

    return {
        equipmentByCategory,
        crewMembers: contributorsQuery.data ?? [],
        loading: equipmentQuery.isPending,
        error,
        deleteConfirmOpen,
        equipmentToDelete,
        snackbarOpen,
        snackbarMessage,
        snackbarSeverity,
        expandedCategories,
        ...inlineEdit,
        quickAddCategory: quickAdd.quickAddCategory,
        quickAddData: quickAdd.quickAddData,
        startQuickAdd,
        cancelQuickAdd: quickAdd.cancelQuickAdd,
        updateQuickAddData: quickAdd.updateQuickAddData,
        saveQuickAdd: quickAdd.saveQuickAdd,
        loadEquipment,
        showSnackbar,
        toggleCategoryExpansion,
        handleCategoryCardClick: toggleCategoryExpansion,
        handleDeleteConfirm,
        setEquipmentToDelete,
        setDeleteConfirmOpen,
        setError: (err: string | null) => { if (err === null) setErrorDismissed(true); },
        setSnackbarOpen,
    };
}
