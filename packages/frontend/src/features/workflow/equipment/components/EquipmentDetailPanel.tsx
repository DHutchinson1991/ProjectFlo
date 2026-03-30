"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Chip,
    Divider,
    IconButton,
    TextField,
    Select,
    MenuItem,
    FormControl,
    Button,
} from "@mui/material";
import {
    Close as CloseIcon,
    CameraAlt as CameraAltIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import {
    Equipment,
    EquipmentCategory,
    EquipmentAvailability,
    EquipmentCondition,
    EQUIPMENT_AVAILABILITY_COLORS,
    EQUIPMENT_CONDITION_COLORS,
    EQUIPMENT_CATEGORY_LABELS,
} from "../types/equipment.types";
import { getCategoryColor, getCategoryIcon } from "../constants/categoryConfig";
import { useBrand } from "@/features/platform/brand";
import { DEFAULT_CURRENCY } from "@projectflo/shared";

interface EquipmentDetailPanelProps {
    equipment: Equipment | null;
    onClose?: () => void;
    onUpdate?: (id: number, data: Partial<Equipment>) => Promise<void>;
    onDelete?: () => void;
}

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        fontSize: "0.8125rem",
        bgcolor: "rgba(255,255,255,0.03)",
        borderRadius: 1.5,
        "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
        "&.Mui-focused fieldset": { borderColor: "#1976d2" },
    },
};

const selectSx = {
    fontSize: "0.8125rem",
    bgcolor: "rgba(255,255,255,0.03)",
    borderRadius: 1.5,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1976d2" },
};

function SectionLabel({ label }: { label: string }) {
    return (
        <>
            <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5, mt: 1.5 }}>
                {label}
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />
        </>
    );
}

function FieldLabel({ label }: { label: string }) {
    return (
        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.35 }}>
            {label}
        </Typography>
    );
}

function toDateInput(val?: string | null): string {
    if (!val) return "";
    return val.slice(0, 10);
}

export function EquipmentDetailPanel({ equipment, onClose, onUpdate, onDelete }: EquipmentDetailPanelProps) {
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;
    const [editData, setEditData] = useState<Partial<Equipment>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (equipment) setEditData({ ...equipment });
    }, [equipment]);

    if (!equipment) {
        return (
            <Box sx={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 1.5, bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 3, p: 4, minHeight: 320,
            }}>
                <CameraAltIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.08)" }} />
                <Typography sx={{ fontSize: "0.875rem", color: "text.disabled", textAlign: "center" }}>
                    Hover or click an item<br />to see details
                </Typography>
            </Box>
        );
    }

    const set = (field: keyof Equipment, value: unknown) =>
        setEditData((prev) => ({ ...prev, [field]: value }));

    const isDirty = JSON.stringify(editData) !== JSON.stringify(equipment);

    const handleSave = async () => {
        if (!onUpdate || !isDirty) return;
        setIsSaving(true);
        try { await onUpdate(equipment.id, editData); }
        finally { setIsSaving(false); }
    };

    const color = getCategoryColor((editData.category ?? equipment.category) as EquipmentCategory);
    const IconComponent = getCategoryIcon((editData.category ?? equipment.category) as EquipmentCategory);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>

            {/* Header */}
            <Box sx={{ p: 2, pb: 1.5, background: `linear-gradient(135deg, ${color}22 0%, transparent 100%)`, borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <IconComponent sx={{ fontSize: 20, color: "white" }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ lineHeight: 1.2 }}>
                            {editData.item_name || equipment.item_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {[editData.brand_name, editData.model].filter(Boolean).join(" Â· ") || "No brand / model"}
                        </Typography>
                    </Box>
                    {onClose && (
                        <IconButton size="small" onClick={onClose} sx={{ color: "text.disabled", flexShrink: 0 }}>
                            <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}
                </Box>
                <Box sx={{ display: "flex", gap: 0.75, mt: 1.25, flexWrap: "wrap" }}>
                    <Chip
                        label={editData.availability_status ?? equipment.availability_status}
                        size="small"
                        sx={{ bgcolor: EQUIPMENT_AVAILABILITY_COLORS[(editData.availability_status ?? equipment.availability_status) as EquipmentAvailability], color: "white", fontWeight: 700, fontSize: "0.7rem" }}
                    />
                    <Chip
                        label={editData.condition ?? equipment.condition}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: EQUIPMENT_CONDITION_COLORS[(editData.condition ?? equipment.condition) as EquipmentCondition], color: EQUIPMENT_CONDITION_COLORS[(editData.condition ?? equipment.condition) as EquipmentCondition], fontWeight: 700, fontSize: "0.7rem" }}
                    />
                    <Chip
                        label={EQUIPMENT_CATEGORY_LABELS[(editData.category ?? equipment.category) as EquipmentCategory] ?? editData.category}
                        size="small"
                        sx={{ bgcolor: `${color}22`, color, fontWeight: 600, fontSize: "0.7rem", border: `1px solid ${color}44` }}
                    />
                </Box>
            </Box>

            {/* Photo */}
            <Box sx={{ height: 160, flexShrink: 0, position: "relative", overflow: "hidden", bgcolor: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {(editData.photo_url ?? equipment.photo_url) ? (
                    <Box component="img" src={(editData.photo_url ?? equipment.photo_url)!} alt={equipment.item_name} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.75, background: `linear-gradient(160deg, ${color}0d 0%, rgba(0,0,0,0) 100%)` }}>
                        <CameraAltIcon sx={{ fontSize: 28, color: "rgba(255,255,255,0.12)" }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>No photo</Typography>
                    </Box>
                )}
            </Box>

            {/* Editable body */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>

                <SectionLabel label="Identity" />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 0.5 }}>
                    <Box>
                        <FieldLabel label="Name" />
                        <TextField size="small" fullWidth value={editData.item_name ?? ""} onChange={(e) => set("item_name", e.target.value)} sx={fieldSx} />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                        <Box>
                            <FieldLabel label="Brand" />
                            <TextField size="small" fullWidth value={editData.brand_name ?? ""} onChange={(e) => set("brand_name", e.target.value)} sx={fieldSx} />
                        </Box>
                        <Box>
                            <FieldLabel label="Model" />
                            <TextField size="small" fullWidth value={editData.model ?? ""} onChange={(e) => set("model", e.target.value)} sx={fieldSx} />
                        </Box>
                    </Box>
                </Box>

                <SectionLabel label="Status" />
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 0.5 }}>
                    <Box>
                        <FieldLabel label="Availability" />
                        <FormControl fullWidth size="small">
                            <Select value={editData.availability_status ?? ""} onChange={(e) => set("availability_status", e.target.value)} sx={selectSx}>
                                {Object.values(EquipmentAvailability).map((s) => <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <FieldLabel label="Condition" />
                        <FormControl fullWidth size="small">
                            <Select value={editData.condition ?? ""} onChange={(e) => set("condition", e.target.value)} sx={selectSx}>
                                {Object.values(EquipmentCondition).map((c) => <MenuItem key={c} value={c} sx={{ fontSize: "0.8125rem" }}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                <SectionLabel label="Pricing" />
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 0.5 }}>
                    <Box>
                        <FieldLabel label="Daily Rate" />
                        <TextField size="small" fullWidth value={editData.rental_price_per_day ?? ""} onChange={(e) => set("rental_price_per_day", e.target.value)} sx={fieldSx} placeholder={currencyCode} />
                    </Box>
                    <Box>
                        <FieldLabel label="Purchase Price" />
                        <TextField size="small" fullWidth value={editData.purchase_price ?? ""} onChange={(e) => set("purchase_price", e.target.value)} sx={fieldSx} placeholder={currencyCode} />
                    </Box>
                </Box>

                <SectionLabel label="Details" />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 0.5 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                        <Box>
                            <FieldLabel label="Item Code" />
                            <TextField size="small" fullWidth value={editData.item_code ?? ""} onChange={(e) => set("item_code", e.target.value)} sx={fieldSx} />
                        </Box>
                        <Box>
                            <FieldLabel label="Quantity" />
                            <TextField size="small" fullWidth type="number" value={editData.quantity ?? 1} onChange={(e) => set("quantity", parseInt(e.target.value, 10) || 1)} sx={fieldSx} />
                        </Box>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                        <Box>
                            <FieldLabel label="Serial No." />
                            <TextField size="small" fullWidth value={editData.serial_number ?? ""} onChange={(e) => set("serial_number", e.target.value)} sx={fieldSx} />
                        </Box>
                        <Box>
                            <FieldLabel label="Vendor" />
                            <TextField size="small" fullWidth value={editData.vendor ?? ""} onChange={(e) => set("vendor", e.target.value)} sx={fieldSx} />
                        </Box>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                        <Box>
                            <FieldLabel label="Purchase Date" />
                            <TextField size="small" fullWidth type="date" value={toDateInput(editData.purchase_date as string)} onChange={(e) => set("purchase_date", e.target.value)} sx={fieldSx} />
                        </Box>
                        <Box>
                            <FieldLabel label="Warranty Expiry" />
                            <TextField size="small" fullWidth type="date" value={toDateInput(editData.warranty_expiry as string)} onChange={(e) => set("warranty_expiry", e.target.value)} sx={fieldSx} />
                        </Box>
                    </Box>
                </Box>

                <SectionLabel label="Physical" />
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 0.5 }}>
                    <Box>
                        <FieldLabel label="Weight (kg)" />
                        <TextField size="small" fullWidth value={editData.weight_kg ?? ""} onChange={(e) => set("weight_kg", e.target.value)} sx={fieldSx} />
                    </Box>
                    <Box>
                        <FieldLabel label="Power (W)" />
                        <TextField size="small" fullWidth type="number" value={editData.power_usage_watts ?? ""} onChange={(e) => set("power_usage_watts", e.target.value === "" ? undefined : parseInt(e.target.value, 10))} sx={fieldSx} />
                    </Box>
                    <Box sx={{ gridColumn: "1 / -1" }}>
                        <FieldLabel label="Dimensions" />
                        <TextField size="small" fullWidth value={editData.dimensions ?? ""} onChange={(e) => set("dimensions", e.target.value)} sx={fieldSx} />
                    </Box>
                </Box>

                <SectionLabel label="Maintenance" />
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 0.5 }}>
                    <Box>
                        <FieldLabel label="Last Service" />
                        <TextField size="small" fullWidth type="date" value={toDateInput(editData.last_maintenance as string)} onChange={(e) => set("last_maintenance", e.target.value)} sx={fieldSx} />
                    </Box>
                    <Box>
                        <FieldLabel label="Next Service" />
                        <TextField size="small" fullWidth type="date" value={toDateInput(editData.next_maintenance_due as string)} onChange={(e) => set("next_maintenance_due", e.target.value)} sx={fieldSx} />
                    </Box>
                </Box>

                <SectionLabel label="Location & More" />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1 }}>
                    <Box>
                        <FieldLabel label="Storage Location" />
                        <TextField size="small" fullWidth value={editData.location ?? ""} onChange={(e) => set("location", e.target.value)} sx={fieldSx} />
                    </Box>
                    <Box>
                        <FieldLabel label="Compatibility" />
                        <TextField size="small" fullWidth value={editData.compatibility ?? ""} onChange={(e) => set("compatibility", e.target.value)} sx={fieldSx} />
                    </Box>
                    <Box>
                        <FieldLabel label="Photo URL" />
                        <TextField size="small" fullWidth value={editData.photo_url ?? ""} onChange={(e) => set("photo_url", e.target.value)} sx={fieldSx} placeholder="https://..." />
                    </Box>
                    <Box>
                        <FieldLabel label="Description" />
                        <TextField size="small" fullWidth multiline rows={3} value={editData.description ?? ""} onChange={(e) => set("description", e.target.value)} sx={fieldSx} />
                    </Box>
                </Box>

            </Box>

            {/* Footer */}
            <Box sx={{ p: 1.5, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, bgcolor: "rgba(0,0,0,0.15)" }}>
                <Button size="small" variant="text" color="error" startIcon={<DeleteIcon />} onClick={onDelete} disabled={!onDelete} sx={{ fontSize: "0.75rem" }}>
                    Delete
                </Button>
                <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={!isDirty || isSaving || !onUpdate} sx={{ fontSize: "0.75rem", borderRadius: 1.5 }}>
                    {isSaving ? "Savingâ€¦" : "Save Changes"}
                </Button>
            </Box>
        </Box>
    );
}
