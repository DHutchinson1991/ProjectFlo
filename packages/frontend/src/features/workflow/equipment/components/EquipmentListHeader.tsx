"use client";

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Inventory as InventoryIcon, Add as AddIcon } from "@mui/icons-material";

interface EquipmentListHeaderProps {
    onAdd: () => void;
}

export const EquipmentListHeader: React.FC<EquipmentListHeaderProps> = ({ onAdd }) => {
    return (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
            <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", mr: 1.5,
            }}>
                <InventoryIcon sx={{ fontSize: 20, color: "white" }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>Equipment Library</Typography>
            <Box sx={{ ml: "auto" }}>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={onAdd}
                    sx={{ borderRadius: 1.5 }}
                >
                    + Add Equipment
                </Button>
            </Box>
        </Box>
    );
};


