"use client";

import React from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
} from "@mui/material";
import {
    LocationOn as LocationIcon,
    AttachMoney as MoneyIcon,
    Person as PersonIcon,
    Inventory as InventoryIcon,
} from "@mui/icons-material";
import {
    Equipment,
    EquipmentAvailability,
    EquipmentCondition,
    EQUIPMENT_AVAILABILITY_COLORS,
    EQUIPMENT_CONDITION_COLORS,
} from "@/features/workflow/equipment/types/equipment.types";
import type { Contributor } from "@/lib/types";

const inputSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        backgroundColor: "rgba(30, 41, 59, 0.5)",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(75, 85, 99, 0.6)" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6b7280" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
    },
    "& .MuiInputLabel-root": { color: "#9ca3af", "&.Mui-focused": { color: "#d1d5db" } },
    "& .MuiInputBase-input": { color: "#f3f4f6" },
};

const selectSx = {
    borderRadius: 2,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(75, 85, 99, 0.6)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6b7280" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
    "& .MuiSelect-select": { color: "#f3f4f6" },
};

const labelSx = { color: "#9ca3af", "&.Mui-focused": { color: "#d1d5db" } };

interface EquipmentInfoCardProps {
    equipment: Equipment;
    isEditing: boolean;
    editData: Partial<Equipment>;
    contributors: Contributor[];
    onUpdate: (field: keyof Equipment, value: unknown) => void;
}

export function EquipmentInfoCard({ equipment, isEditing, editData, contributors, onUpdate }: EquipmentInfoCardProps) {
    const val = <K extends keyof Equipment>(field: K) =>
        isEditing ? (editData[field] ?? equipment[field]) : equipment[field];

    return (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                border: "1px solid rgba(52, 58, 68, 0.3)",
                background: "rgba(16, 18, 22, 0.95)",
                backdropFilter: "blur(10px)",
            }}
        >
            <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <InventoryIcon sx={{ mr: 2, color: "#9ca3af", fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#f3f4f6" }}>
                        Equipment Information
                    </Typography>
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Equipment Name" value={val("item_name") || ""} onChange={(e) => onUpdate("item_name", e.target.value)} disabled={!isEditing} fullWidth sx={inputSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Serial Number" value={val("serial_number") || ""} onChange={(e) => onUpdate("serial_number", e.target.value)} disabled={!isEditing} fullWidth sx={inputSx} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField label="Description" value={val("description") || ""} onChange={(e) => onUpdate("description", e.target.value)} disabled={!isEditing} fullWidth multiline rows={3} sx={inputSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Manufacturer" value={val("brand_name") || ""} onChange={(e) => onUpdate("brand_name", e.target.value)} disabled={!isEditing} fullWidth sx={inputSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Model" value={val("model") || ""} onChange={(e) => onUpdate("model", e.target.value)} disabled={!isEditing} fullWidth sx={inputSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel sx={labelSx}>Status</InputLabel>
                            <Select
                                value={val("availability_status") || ""}
                                onChange={(e) => onUpdate("availability_status", e.target.value)}
                                disabled={!isEditing}
                                label="Status"
                                sx={selectSx}
                            >
                                {Object.values(EquipmentAvailability).map((status) => (
                                    <MenuItem key={status} value={status}>
                                        <Chip label={status} size="small" sx={{ backgroundColor: EQUIPMENT_AVAILABILITY_COLORS[status], color: "white", fontWeight: 600 }} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel sx={labelSx}>Condition</InputLabel>
                            <Select
                                value={val("condition") || ""}
                                onChange={(e) => onUpdate("condition", e.target.value)}
                                disabled={!isEditing}
                                label="Condition"
                                sx={selectSx}
                            >
                                {Object.values(EquipmentCondition).map((condition) => (
                                    <MenuItem key={condition} value={condition}>
                                        <Chip label={condition} size="small" variant="outlined" sx={{ borderColor: EQUIPMENT_CONDITION_COLORS[condition], color: EQUIPMENT_CONDITION_COLORS[condition], fontWeight: 600 }} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Location"
                            value={val("location") || ""}
                            onChange={(e) => onUpdate("location", e.target.value)}
                            disabled={!isEditing}
                            fullWidth
                            InputProps={{ startAdornment: <LocationIcon sx={{ mr: 1, color: "#9ca3af" }} /> }}
                            sx={inputSx}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel sx={labelSx}>Owner</InputLabel>
                            <Select
                                value={isEditing ? (editData.owner_id ?? "") : (equipment.owner_id ?? "")}
                                onChange={(e) => onUpdate("owner_id", e.target.value === "" ? null : Number(e.target.value))}
                                disabled={!isEditing}
                                label="Owner"
                                startAdornment={<PersonIcon sx={{ mr: 1, color: "#9ca3af", fontSize: 18 }} />}
                                sx={{ ...selectSx, color: "#f3f4f6" }}
                            >
                                <MenuItem value=""><em style={{ color: "#6b7280" }}>No owner</em></MenuItem>
                                {contributors.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.full_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Daily Rental Rate"
                            type="number"
                            value={val("rental_price_per_day") || 0}
                            onChange={(e) => onUpdate("rental_price_per_day", parseFloat(e.target.value) || 0)}
                            disabled={!isEditing}
                            fullWidth
                            InputProps={{ startAdornment: <MoneyIcon sx={{ mr: 1, color: "#9ca3af" }} /> }}
                            sx={inputSx}
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
