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
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [conditionFilter, setConditionFilter] = useState("all");
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    const equipmentQuery = useQuery({
        queryKey: ["equipment", "grouped", brandId],
        queryFn: () => equipmentApi.getGroupedByCategory(),
        enabled: !!brandId,
    });
    const crewQuery = useQuery({
        queryKey: ["crew", brandId],
        queryFn: () => equipmentApi.getCrew(),
        enabled: !!brandId,
    });

    useEffect(() => { setErrorDismissed(false); }, [equipmentQuery.errorUpdatedAt]);

    const equipmentByCategory: EquipmentByCategory = {};
    if (equipmentQuery.data) {
        Object.entries(equipmentQuery.data).forEach(([key, group]) => {
            equipmentByCategory[key] = { ...group, expanded: expandedCategories[key] ?? false };
        });
    }

    // Flat list of all equipment across all categories
    const flatEquipment: Equipment[] = Object.values(equipmentByCategory).flatMap((g) => g.equipment);

    // Filtered by search + category + status + condition
    const filteredEquipment: Equipment[] = flatEquipment.filter((item) => {
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        const matchesStatus = statusFilter === "all" || item.availability_status === statusFilter;
        const matchesCondition = conditionFilter === "all" || item.condition === conditionFilter;
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            !q ||
            item.item_name?.toLowerCase().includes(q) ||
            item.model?.toLowerCase().includes(q) ||
            item.brand_name?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q);
        return matchesCategory && matchesStatus && matchesCondition && matchesSearch;
    });

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
        crew: crewQuery.data ?? [],
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
        updateEquipment: async (id: number, data: Partial<Equipment>) => {
            try {
                await updateMutation.mutateAsync({ id, data: data as Partial<CreateEquipmentDto> });
                showSnackbar("Equipment updated");
            } catch {
                showSnackbar("Failed to update equipment", "error");
            }
        },
    };
}
