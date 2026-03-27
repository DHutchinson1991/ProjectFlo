"use client";

import React from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Build as MaintenanceIcon } from "@mui/icons-material";
import { EquipmentMaintenance } from "@/features/workflow/equipment/types/equipment.types";
import { DEFAULT_CURRENCY, formatCurrency } from "@projectflo/shared";

interface EquipmentMaintenanceTabProps {
    maintenance: EquipmentMaintenance[];
    currency: string;
}

export function EquipmentMaintenanceTab({ maintenance, currency }: EquipmentMaintenanceTabProps) {
    return (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                border: "1px solid rgba(52, 58, 68, 0.3)",
                background: "rgba(16, 18, 22, 0.95)",
                backdropFilter: "blur(10px)",
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <MaintenanceIcon sx={{ mr: 2, color: "#6b7280", fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#f3f4f6" }}>
                        Maintenance History
                    </Typography>
                </Box>
                {maintenance.length > 0 ? (
                    <TableContainer
                        component={Paper}
                        sx={{
                            borderRadius: 2,
                            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                            border: "1px solid rgba(52, 58, 68, 0.3)",
                            background: "rgba(22, 32, 43, 0.6)",
                            overflow: "hidden",
                        }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow
                                    sx={{
                                        background: "rgba(30, 41, 59, 0.8)",
                                        "& .MuiTableCell-head": {
                                            color: "#d1d5db",
                                            fontWeight: 600,
                                            fontSize: "0.8rem",
                                            py: 1.5,
                                            borderBottom: "1px solid rgba(52, 58, 68, 0.4)",
                                        },
                                    }}
                                >
                                    <TableCell>Type</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Scheduled Date</TableCell>
                                    <TableCell>Completed Date</TableCell>
                                    <TableCell>Cost</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {maintenance.map((record) => (
                                    <TableRow
                                        key={record.id}
                                        sx={{
                                            "&:nth-of-type(odd)": { backgroundColor: "rgba(30, 41, 59, 0.3)" },
                                            "&:hover": { backgroundColor: "rgba(52, 58, 68, 0.4)", transform: "translateY(-1px)" },
                                            transition: "all 0.2s",
                                            "& .MuiTableCell-root": { borderBottom: "1px solid rgba(52, 58, 68, 0.2)", py: 1.5, fontSize: "0.85rem" },
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 600, color: "#f3f4f6" }}>{record.maintenance_type}</TableCell>
                                        <TableCell sx={{ color: "#9ca3af", maxWidth: "200px" }}>{record.description}</TableCell>
                                        <TableCell sx={{ color: "#9ca3af" }}>{new Date(record.scheduled_date).toLocaleDateString()}</TableCell>
                                        <TableCell sx={{ color: "#9ca3af" }}>
                                            {record.completed_date ? (
                                                new Date(record.completed_date).toLocaleDateString()
                                            ) : (
                                                <Chip label="Not completed" size="small" sx={{ backgroundColor: alpha("#6b7280", 0.2), color: "#9ca3af", border: "1px solid rgba(107, 114, 128, 0.3)", fontSize: "0.7rem" }} />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: record.cost ? "#ef4444" : "#6b7280" }}>
                                            {record.cost != null ? formatCurrency(Number(record.cost), currency || DEFAULT_CURRENCY) : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={record.status}
                                                size="small"
                                                sx={{
                                                    ...(record.status === "Completed" && { backgroundColor: alpha("#10b981", 0.2), color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }),
                                                    ...(record.status === "In_Progress" && { backgroundColor: alpha("#f59e0b", 0.2), color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" }),
                                                    ...(record.status !== "Completed" && record.status !== "In_Progress" && { backgroundColor: alpha("#6b7280", 0.2), color: "#9ca3af", border: "1px solid rgba(107, 114, 128, 0.3)" }),
                                                    fontWeight: 600,
                                                    fontSize: "0.75rem",
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ textAlign: "center", py: 6, background: "rgba(30, 41, 59, 0.4)", borderRadius: 2, border: "2px dashed rgba(52, 58, 68, 0.6)" }}>
                        <MaintenanceIcon sx={{ fontSize: 48, color: "#6b7280", mb: 2 }} />
                        <Typography variant="h6" sx={{ color: "#9ca3af", fontWeight: 600 }}>No maintenance history available</Typography>
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>This equipment has no recorded maintenance activities</Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
