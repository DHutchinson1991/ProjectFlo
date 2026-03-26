import { useState, useCallback } from "react";
import {
    Equipment,
    EquipmentAvailability,
    EquipmentCategory,
    EquipmentCondition,
    CreateEquipmentDto,
} from "@/features/workflow/equipment/types/equipment.types";

export const DEFAULT_QUICK_ADD: Partial<Equipment> = {
    item_name: "",
    description: "",
    category: EquipmentCategory.CAMERA,
    availability_status: EquipmentAvailability.AVAILABLE,
    condition: EquipmentCondition.GOOD,
    rental_price_per_day: 0,
};

interface UseEquipmentQuickAddProps {
    createAsync: (data: CreateEquipmentDto) => Promise<Equipment>;
    showSnackbar: (message: string, severity?: "success" | "error") => void;
}

export function useEquipmentQuickAdd({ createAsync, showSnackbar }: UseEquipmentQuickAddProps) {
    const [quickAddCategory, setQuickAddCategory] = useState<string | null>(null);
    const [quickAddData, setQuickAddData] = useState<Partial<Equipment>>(DEFAULT_QUICK_ADD);

    const startQuickAdd = useCallback((category: string) => {
        setQuickAddCategory(category);
        setQuickAddData((prev) => ({ ...prev, category: category as EquipmentCategory }));
    }, []);

    const cancelQuickAdd = useCallback(() => {
        setQuickAddCategory(null);
        setQuickAddData(DEFAULT_QUICK_ADD);
    }, []);

    const updateQuickAddData = useCallback((field: keyof Equipment, value: unknown) => {
        setQuickAddData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const saveQuickAdd = useCallback(async () => {
        if (!quickAddData.item_name || !quickAddCategory) return;
        try {
            await createAsync(quickAddData as CreateEquipmentDto);
            cancelQuickAdd();
            showSnackbar("Equipment added successfully");
        } catch {
            showSnackbar("Failed to add equipment", "error");
        }
    }, [quickAddData, quickAddCategory, createAsync, cancelQuickAdd, showSnackbar]);

    return {
        quickAddCategory,
        quickAddData,
        startQuickAdd,
        cancelQuickAdd,
        updateQuickAddData,
        saveQuickAdd,
    };
}

export type UseEquipmentQuickAddReturn = ReturnType<typeof useEquipmentQuickAdd>;
