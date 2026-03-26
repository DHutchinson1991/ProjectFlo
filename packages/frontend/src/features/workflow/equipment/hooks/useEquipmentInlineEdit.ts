import { useState, useCallback } from "react";
import { Equipment, CreateEquipmentDto } from "@/features/workflow/equipment/types/equipment.types";

interface UseEquipmentInlineEditProps {
    saveAsync: (args: { id: number; data: Partial<CreateEquipmentDto> }) => Promise<Equipment>;
    showSnackbar: (message: string, severity?: "success" | "error") => void;
}

export function useEquipmentInlineEdit({ saveAsync, showSnackbar }: UseEquipmentInlineEditProps) {
    const [inlineEditingEquipment, setInlineEditingEquipment] = useState<number | null>(null);
    const [inlineEditData, setInlineEditData] = useState<Partial<Equipment>>({});

    const startInlineEdit = useCallback((equipment: Equipment) => {
        setInlineEditingEquipment(equipment.id);
        setInlineEditData({ ...equipment });
    }, []);

    const cancelInlineEdit = useCallback(() => {
        setInlineEditingEquipment(null);
        setInlineEditData({});
    }, []);

    const updateInlineEditData = useCallback((field: keyof Equipment, value: unknown) => {
        setInlineEditData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const saveInlineEdit = useCallback(async () => {
        if (!inlineEditingEquipment) return;
        try {
            const cleanedData: Partial<Equipment> = { ...inlineEditData };
            if (cleanedData.rental_price_per_day && typeof cleanedData.rental_price_per_day === "string") {
                cleanedData.rental_price_per_day = parseFloat(cleanedData.rental_price_per_day as string);
            }
            await saveAsync({ id: inlineEditingEquipment, data: cleanedData as Partial<CreateEquipmentDto> });
            cancelInlineEdit();
            showSnackbar("Equipment updated successfully");
        } catch {
            showSnackbar("Failed to update equipment", "error");
        }
    }, [inlineEditingEquipment, inlineEditData, saveAsync, cancelInlineEdit, showSnackbar]);

    return {
        inlineEditingEquipment,
        inlineEditData,
        startInlineEdit,
        cancelInlineEdit,
        updateInlineEditData,
        saveInlineEdit,
    };
}

export type UseEquipmentInlineEditReturn = ReturnType<typeof useEquipmentInlineEdit>;
