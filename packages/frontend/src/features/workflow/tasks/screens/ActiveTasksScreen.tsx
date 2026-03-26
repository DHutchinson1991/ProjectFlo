"use client";

import React from "react";
import { Box, Typography, Paper, Button, Skeleton, IconButton, Tooltip } from "@mui/material";
import { Assignment as TaskIcon, Refresh as RefreshIcon, Sync as SyncIcon } from "@mui/icons-material";
import { SummaryStrip, TaskGroup, ActiveTasksToolbar } from "../components";
import { useActiveTasks } from "../hooks/use-active-tasks";

export function ActiveTasksScreen() {
    const {
        tasks, contributors, loading, syncing, error,
        searchQuery, statusFilter, sourceFilter, groupMode, showAuto,
        filteredTasks, groups,
        setSearchQuery, setStatusFilter, setSourceFilter, setGroupMode,
        loadTasks, handleSyncFromLibrary, handleAssign, handleNavigateToTask, handleToggle, handleShowAutoToggle,
    } = useActiveTasks();

    const visibleNonSubtasks = filteredTasks.filter(t => t.task_kind !== "subtask").length;
    const totalNonSubtasks = tasks.filter(t => t.task_kind !== "subtask").length;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
            {/* Page Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                <Box>
                    <Typography component="div" sx={{
                        fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.025em", lineHeight: 1.1,
                        display: "flex", alignItems: "center", gap: 1.25,
                    }}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: "10px",
                            bgcolor: "rgba(87,155,252,0.15)", border: "1px solid rgba(87,155,252,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <TaskIcon sx={{ fontSize: 19, color: "#579BFC" }} />
                        </Box>
                        Active Tasks
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem", mt: 0.5, ml: 0.25 }}>
                        All active tasks across inquiries and projects
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Tooltip title="Sync people from task library defaults" arrow>
                        <span>
                            <Button
                                onClick={handleSyncFromLibrary} disabled={syncing} size="small"
                                startIcon={<SyncIcon sx={{ fontSize: "15px !important", ...(syncing && { animation: "spin 1s linear infinite" }) }} />}
                                sx={{
                                    fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
                                    px: 1.5, height: 34, borderRadius: 1.5,
                                    color: syncing ? "primary.main" : "text.secondary",
                                    border: "1px solid", borderColor: syncing ? "rgba(87,155,252,0.3)" : "rgba(255,255,255,0.1)",
                                    bgcolor: syncing ? "rgba(87,155,252,0.06)" : "transparent",
                                    "&:hover": { bgcolor: "rgba(87,155,252,0.08)", borderColor: "rgba(87,155,252,0.25)", color: "#579BFC" },
                                    "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
                                }}
                            >
                                {syncing ? "Syncing…" : "Sync People"}
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Refresh" arrow>
                        <IconButton onClick={loadTasks} size="small" sx={{
                            width: 34, height: 34, borderRadius: 1.5,
                            border: "1px solid rgba(255,255,255,0.1)", color: "text.secondary",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "text.primary" },
                        }}>
                            <RefreshIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {!loading && tasks.length > 0 && <SummaryStrip tasks={filteredTasks} />}

            <ActiveTasksToolbar
                groupMode={groupMode} statusFilter={statusFilter} sourceFilter={sourceFilter}
                showAuto={showAuto} searchQuery={searchQuery}
                totalVisible={visibleNonSubtasks} totalAll={totalNonSubtasks}
                onGroupModeChange={setGroupMode}
                onStatusFilterChange={setStatusFilter}
                onSourceFilterChange={setSourceFilter}
                onShowAutoToggle={handleShowAutoToggle}
                onSearchChange={setSearchQuery}
            />

            <Paper elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2.5, overflow: "hidden", bgcolor: "rgba(255,255,255,0.01)" }}>
                {loading ? (
                    <Box sx={{ p: 3 }}>
                        {[1, 2, 3].map(i => (
                            <Box key={i} sx={{ mb: 3 }}>
                                <Skeleton variant="rectangular" height={46} sx={{ borderRadius: 1.5, mb: 1 }} />
                                {[1, 2, 3, 4].map(j => <Skeleton key={j} variant="rectangular" height={48} sx={{ mb: 0.375 }} />)}
                            </Box>
                        ))}
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 6, textAlign: "center" }}>
                        <Typography color="error" sx={{ mb: 1.5, fontWeight: 600 }}>{error}</Typography>
                        <Button onClick={loadTasks} size="small" variant="outlined">Try again</Button>
                    </Box>
                ) : groups.length === 0 ? (
                    <Box sx={{ p: 8, textAlign: "center" }}>
                        <Box sx={{
                            width: 64, height: 64, borderRadius: "16px", mx: "auto", mb: 2,
                            bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <TaskIcon sx={{ fontSize: 30, color: "text.disabled" }} />
                        </Box>
                        <Typography sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5 }}>
                            {searchQuery || statusFilter !== "active" || sourceFilter !== "all"
                                ? "No tasks match your filters"
                                : "No active tasks"}
                        </Typography>
                        <Typography sx={{ color: "text.disabled", fontSize: "0.8125rem" }}>
                            Tasks appear here when created from inquiries or projects
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {groups.map((group, idx) => (
                            <TaskGroup
                                key={group.key} title={group.title} color={group.color}
                                tasks={group.tasks} defaultExpanded={idx < 5}
                                icon={group.icon} badge={group.badge} contributors={contributors}
                                onAssign={handleAssign} onNavigate={handleNavigateToTask} onToggle={handleToggle}
                            />
                        ))}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
