"use client";

import React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    FormControl,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    IconButton,
} from "@mui/material";
import {
    Search as SearchIcon,
    Close as CloseIcon,
    Circle as CircleIcon,
} from "@mui/icons-material";
import {
    EquipmentAvailability,
    EquipmentCondition,
    EQUIPMENT_AVAILABILITY_COLORS,
    EQUIPMENT_CONDITION_COLORS,
} from "../types/equipment.types";

interface EquipmentFilterToolbarProps {
    searchTerm: string;
    statusFilter: string;
    conditionFilter: string;
    filteredCount: number;
    totalCount: number;
    onSearchChange: (val: string) => void;
    onStatusFilterChange: (val: string) => void;
    onConditionFilterChange: (val: string) => void;
}

const SELECT_SX = {
    borderRadius: 1.5,
    fontSize: "0.75rem",
    height: 32,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
};

export function EquipmentFilterToolbar({
    searchTerm,
    statusFilter,
    conditionFilter,
    filteredCount,
    totalCount,
    onSearchChange,
    onStatusFilterChange,
    onConditionFilterChange,
}: EquipmentFilterToolbarProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 0.875,
                px: 1.25,
                mb: 2,
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.02)",
                flexWrap: "wrap",
            }}
        >
            {/* Status filter */}
            <FormControl size="small" sx={{ minWidth: 136 }}>
                <Select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    sx={SELECT_SX}
                >
                    <MenuItem value="all" sx={{ fontSize: "0.8125rem" }}>All Statuses</MenuItem>
                    {Object.values(EquipmentAvailability).map((s) => (
                        <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CircleIcon sx={{ fontSize: 9, color: EQUIPMENT_AVAILABILITY_COLORS[s] }} />
                                {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.375, borderColor: "rgba(255,255,255,0.07)" }} />

            {/* Condition filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
                <Select
                    value={conditionFilter}
                    onChange={(e) => onConditionFilterChange(e.target.value)}
                    sx={SELECT_SX}
                >
                    <MenuItem value="all" sx={{ fontSize: "0.8125rem" }}>All Conditions</MenuItem>
                    {Object.values(EquipmentCondition).map((c) => (
                        <MenuItem key={c} value={c} sx={{ fontSize: "0.8125rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: EQUIPMENT_CONDITION_COLORS[c] }} />
                                {c.charAt(0) + c.slice(1).toLowerCase()}
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Search */}
            <TextField
                size="small"
                placeholder="Search name, model, brand…"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.3)" }} />
                        </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => onSearchChange("")} sx={{ p: 0.25 }}>
                                <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                }}
                sx={{
                    ml: "auto",
                    minWidth: 220,
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        fontSize: "0.8125rem",
                        height: 32,
                        "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    },
                }}
            />

            <Typography sx={{ fontSize: "0.6875rem", color: "text.disabled", fontWeight: 600, whiteSpace: "nowrap", px: 0.5 }}>
                {filteredCount === totalCount ? `${totalCount} items` : `${filteredCount} / ${totalCount}`}
            </Typography>
        </Paper>
    );
}
