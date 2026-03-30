import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentApi } from "../api";
import { useBrand } from "@/features/platform/brand";
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import {
    Equipment,
    EquipmentRental,
    EquipmentMaintenance,
    UpdateEquipmentDto,
} from "@/features/workflow/equipment/types/equipment.types";
import type { Crew } from "@/shared/types/users";

export interface EquipmentDetailState {
    equipment: Equipment | null;
    rentals: EquipmentRental[];
    maintenance: EquipmentMaintenance[];
    crew: Crew[];
    loading: boolean;
    error: string | null;
    isEditing: boolean;
    editData: Partial<Equipment>;
    tabValue: number;
    snackbarOpen: boolean;
    snackbarMessage: string;
    snackbarSeverity: "success" | "error";
    currencyCode: string;
}

export interface EquipmentDetailActions {
    handleStartEdit: () => void;
    handleCancelEdit: () => void;
    handleSaveEdit: () => Promise<void>;
    updateEditData: (field: keyof Equipment, value: unknown) => void;
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    setSnackbarOpen: (open: boolean) => void;
}

export function useEquipmentDetail(equipmentId: number): EquipmentDetailState & EquipmentDetailActions {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;
    const queryClient = useQueryClient();

    // UI-only state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Equipment>>({});
    const [tabValue, setTabValue] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

    const showSnackbar = useCallback((message: string, severity: "success" | "error" = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    }, []);

    // Server state — equipment detail (includes rental_bookings + maintenance_logs from API)
    const equipmentQuery = useQuery({
        queryKey: ["equipment", equipmentId, brandId],
        queryFn: async () => {
            const data = await equipmentApi.getById(equipmentId);
            const raw = data as Equipment & {
                rental_bookings?: EquipmentRental[];
                maintenance_logs?: EquipmentMaintenance[];
            };
            return {
                equipment: { ...raw, rentals: raw.rental_bookings ?? [], maintenance_records: raw.maintenance_logs ?? [] } as Equipment,
                rentals: raw.rental_bookings ?? [],
                maintenance: raw.maintenance_logs ?? [],
            };
        },
        enabled: !!equipmentId && !!brandId,
    });

    // Server state — crew (brand-scoped)
    const crewQuery = useQuery({
        queryKey: ["crew", brandId],
        queryFn: () => equipmentApi.getCrew(),
        enabled: !!brandId,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateEquipmentDto }) =>
            equipmentApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipment", equipmentId, brandId] });
        },
    });

    const equipment = equipmentQuery.data?.equipment ?? null;
    const rentals = equipmentQuery.data?.rentals ?? [];
    const maintenance = equipmentQuery.data?.maintenance ?? [];

    const handleStartEdit = useCallback(() => {
        setIsEditing(true);
        setEditData({ ...equipment } as Partial<Equipment>);
    }, [equipment]);

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setEditData({ ...equipment } as Partial<Equipment>);
    }, [equipment]);

    const handleSaveEdit = useCallback(async () => {
        if (!equipment || !editData) return;
        try {
            const processedEditData = {
                ...editData,
                rental_price_per_day: editData.rental_price_per_day ? Number(editData.rental_price_per_day) : undefined,
                purchase_price: editData.purchase_price ? Number(editData.purchase_price) : undefined,
            };
            await updateMutation.mutateAsync({ id: equipment.id, data: processedEditData as UpdateEquipmentDto });
            setIsEditing(false);
            showSnackbar("Equipment updated successfully");
        } catch {
            showSnackbar("Failed to update equipment", "error");
        }
    }, [equipment, editData, updateMutation, showSnackbar]);

    const updateEditData = useCallback((field: keyof Equipment, value: unknown) => {
        setEditData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    }, []);

    return {
        equipment,
        rentals,
        maintenance,
        crew: crewQuery.data ?? [],
        loading: equipmentQuery.isPending,
        error: equipmentQuery.isError ? "Failed to load equipment. Please try again." : null,
        isEditing,
        editData,
        tabValue,
        snackbarOpen,
        snackbarMessage,
        snackbarSeverity,
        currencyCode,
        handleStartEdit,
        handleCancelEdit,
        handleSaveEdit,
        updateEditData,
        handleTabChange,
        setSnackbarOpen,
    };
}
