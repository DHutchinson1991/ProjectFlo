"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Skeleton,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccessTime as ClockIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  FolderOpen as ProjectIcon,
  Assignment as TaskIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  AccountTree as PhaseViewIcon,
  Group as PersonViewIcon,
  DateRange as DateViewIcon,
  Circle as CircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { ActiveTask } from "@/lib/types";

// ── Grouping modes ────────────────────────────────────────────
type GroupMode = "project" | "status" | "person" | "date" | "phase";

// ── Phase configuration ───────────────────────────────────────
const PHASE_COLORS: Record<string, string> = {
  Lead: "#FDAB3D",
  Inquiry: "#00C875",
  Booking: "#0086C0",
  Creative_Development: "#A25DDC",
  Pre_Production: "#FDAB3D",
  Production: "#FF158A",
  Post_Production: "#579BFC",
  Delivery: "#00C875",
};

const PHASE_LABELS: Record<string, string> = {
  Lead: "Lead",
  Inquiry: "Inquiry",
  Booking: "Booking",
  Creative_Development: "Creative Development",
  Pre_Production: "Pre-Production",
  Production: "Production",
  Post_Production: "Post-Production",
  Delivery: "Delivery",
};

const PHASE_ORDER = [
  "Lead", "Inquiry", "Booking", "Creative_Development",
  "Pre_Production", "Production", "Post_Production", "Delivery",
];

// ── Status configuration ──────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; order: number }> = {
  To_Do:          { color: "#323338", bg: "#C4C4C4", label: "To Do",    order: 0 },
  Ready_to_Start: { color: "#fff",    bg: "#FDAB3D", label: "Ready",    order: 1 },
  In_Progress:    { color: "#fff",    bg: "#579BFC", label: "Working",  order: 2 },
  Completed:      { color: "#fff",    bg: "#00C875", label: "Done",     order: 3 },
  Archived:       { color: "#fff",    bg: "#999999", label: "Archived", order: 4 },
};

const STATUS_ORDER = ["To_Do", "Ready_to_Start", "In_Progress", "Completed"];

// ── Helpers ───────────────────────────────────────────────────
function formatDueDate(dateStr: string | null) {
  if (!dateStr) return { text: "No date", color: "#676879", urgent: false };
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  const formatted = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diffDays < 0) return { text: `Overdue · ${formatted}`, color: "#D83A52", urgent: true };
  if (diffDays === 0) return { text: "Today", color: "#FDAB3D", urgent: true };
  if (diffDays === 1) return { text: "Tomorrow", color: "#FDAB3D", urgent: false };
  if (diffDays <= 7) return { text: formatted, color: "#579BFC", urgent: false };
  return { text: formatted, color: "#676879", urgent: false };
}

function getDateGroup(dateStr: string | null): string {
  if (!dateStr) return "No Due Date";
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return "This Week";
  if (diffDays <= 14) return "Next Week";
  if (diffDays <= 30) return "This Month";
  return "Later";
}

const DATE_GROUP_ORDER = ["Overdue", "Today", "Tomorrow", "This Week", "Next Week", "This Month", "Later", "No Due Date"];
const DATE_GROUP_COLORS: Record<string, string> = {
  Overdue: "#D83A52", Today: "#FDAB3D", Tomorrow: "#FDAB3D",
  "This Week": "#579BFC", "Next Week": "#A25DDC", "This Month": "#00C875",
  Later: "#676879", "No Due Date": "#676879",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = ["#0086C0", "#A25DDC", "#FF158A", "#FDAB3D", "#00C875", "#579BFC", "#FF5AC4", "#CAB641", "#7F5347", "#66CCFF"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ══════════════════════════════════════════════════════════════
// StatusPill — clickable status chip with dropdown
// ══════════════════════════════════════════════════════════════
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.To_Do;
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: "0.6875rem",
      height: 28, px: 1.5, borderRadius: "4px", whiteSpace: "nowrap",
      minWidth: 60, textAlign: "center",
    }}>
      {cfg.label}
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// TaskRow — single task row (Monday.com table row style)
// ══════════════════════════════════════════════════════════════
function TaskRow({ task, groupColor, showProject }: { task: ActiveTask; groupColor: string; showProject?: boolean }) {
  const dueInfo = formatDueDate(task.due_date);
  const isCompleted = task.status === "Completed";

  return (
    <Box sx={{
      display: "grid",
      gridTemplateColumns: showProject
        ? "minmax(280px, 2fr) 90px 150px 130px 90px 160px"
        : "minmax(280px, 2fr) 90px 150px 130px 90px 160px",
      alignItems: "center", px: 0, py: 0,
      borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.04)",
      transition: "background-color 0.1s", minHeight: 42,
      "&:hover": { bgcolor: "rgba(255,255,255,0.025)" },
      opacity: isCompleted ? 0.55 : 1,
    }}>
      {/* ── Task Name cell ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, overflow: "hidden", borderLeft: `3px solid ${groupColor}` }}>
        {isCompleted
          ? <CheckCircleIcon sx={{ fontSize: 17, color: "#00C875", flexShrink: 0 }} />
          : <UncheckedIcon sx={{ fontSize: 17, color: "text.disabled", flexShrink: 0 }} />
        }
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontSize: "0.8125rem", fontWeight: 500, textDecoration: isCompleted ? "line-through" : "none", color: isCompleted ? "text.secondary" : "text.primary" }}>
            {task.name}
          </Typography>
          {task.description && (
            <Typography noWrap sx={{ fontSize: "0.6875rem", color: "text.disabled", lineHeight: 1.2 }}>
              {task.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Status cell ── */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <StatusPill status={task.status} />
      </Box>

      {/* ── Assignee cell ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1 }}>
        {task.assignee ? (
          <Tooltip title={`${task.assignee.name} · ${task.assignee.email}`} arrow placement="top">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Avatar sx={{ width: 26, height: 26, fontSize: "0.6875rem", fontWeight: 700, bgcolor: avatarColor(task.assignee.name) }}>
                {getInitials(task.assignee.name)}
              </Avatar>
              <Typography noWrap sx={{ fontSize: "0.75rem", color: "text.primary", maxWidth: 100 }}>
                {task.assignee.name}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Avatar sx={{ width: 26, height: 26, bgcolor: "transparent", border: "1.5px dashed", borderColor: "rgba(255,255,255,0.15)" }}>
              <PersonIcon sx={{ fontSize: 14, color: "text.disabled" }} />
            </Avatar>
            <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", fontStyle: "italic" }}>
              Unassigned
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Due Date cell ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1 }}>
        {dueInfo.urgent && <WarningIcon sx={{ fontSize: 13, color: dueInfo.color }} />}
        <Typography sx={{
          fontSize: "0.75rem", color: dueInfo.color,
          fontWeight: dueInfo.urgent ? 600 : 400,
        }}>
          {dueInfo.text}
        </Typography>
      </Box>

      {/* ── Hours cell ── */}
      <Box sx={{ px: 1 }}>
        {task.estimated_hours ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ClockIcon sx={{ fontSize: 13, color: "text.disabled" }} />
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              {task.actual_hours ? `${task.actual_hours}/${task.estimated_hours}h` : `${task.estimated_hours}h`}
            </Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>—</Typography>
        )}
      </Box>

      {/* ── Source / Project cell ── */}
      <Box sx={{ px: 1 }}>
        <Tooltip title={task.context_label} arrow>
          <Chip
            icon={task.source === "project"
              ? <ProjectIcon sx={{ fontSize: "13px !important" }} />
              : <TaskIcon sx={{ fontSize: "13px !important" }} />
            }
            label={task.context_label}
            size="small" variant="outlined"
            sx={{
              height: 22, maxWidth: 150, fontSize: "0.6875rem",
              borderColor: task.source === "project" ? "rgba(87,155,252,0.25)" : "rgba(0,200,117,0.25)",
              color: task.source === "project" ? "#579BFC" : "#00C875",
              "& .MuiChip-icon": { color: task.source === "project" ? "#579BFC" : "#00C875" },
              "& .MuiChip-label": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
            }}
          />
        </Tooltip>
      </Box>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// TaskGroup — collapsible group with header, column labels, rows, and footer
// ══════════════════════════════════════════════════════════════
function TaskGroup({
  title, color, tasks, defaultExpanded, icon, badge,
}: {
  title: string; color: string; tasks: ActiveTask[];
  defaultExpanded: boolean; icon?: React.ReactNode; badge?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const totalHours = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const completedCount = tasks.filter(t => t.status === "Completed").length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <Box sx={{ mb: 0.25, "&:last-child": { mb: 0 } }}>
      {/* ── Group Header ── */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex", alignItems: "center", gap: 1, px: 2, py: 1,
          cursor: "pointer", userSelect: "none",
          "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
          borderLeft: `4px solid ${color}`,
        }}
      >
        <ExpandMoreIcon
          sx={{
            fontSize: 20, color: "text.secondary",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s",
          }}
        />
        {icon}
        <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color }}>
          {title}
        </Typography>
        <Chip
          label={tasks.length}
          size="small"
          sx={{
            height: 20, minWidth: 28, fontSize: "0.6875rem", fontWeight: 700,
            bgcolor: `${color}18`, color, border: `1px solid ${color}30`,
          }}
        />
        {badge && (
          <Chip label={badge} size="small" sx={{
            height: 18, fontSize: "0.625rem", bgcolor: "rgba(255,255,255,0.05)", color: "text.secondary",
          }} />
        )}

        {/* Progress bar */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              flex: 1, maxWidth: 120, height: 4, borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.06)",
              "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 2 },
            }}
          />
          <Typography sx={{ fontSize: "0.6875rem", color: "text.secondary", whiteSpace: "nowrap" }}>
            {completedCount}/{tasks.length}
          </Typography>
        </Box>

        {totalHours > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
            <ClockIcon sx={{ fontSize: 13, color: "text.disabled" }} />
            <Typography sx={{ fontSize: "0.6875rem", color: "text.secondary" }}>
              {totalHours.toFixed(1)}h
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Column Headers ── */}
      <Collapse in={expanded}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 2fr) 90px 150px 130px 90px 160px",
          px: 0, py: 0.5, borderBottom: "1px solid", borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.015)",
        }}>
          {["Task", "Status", "Person", "Due Date", "Hours", "Source"].map(h => (
            <Typography key={h} sx={{
              fontSize: "0.625rem", fontWeight: 700, color: "text.disabled",
              textTransform: "uppercase", letterSpacing: "0.1em", px: 1.5,
            }}>
              {h}
            </Typography>
          ))}
        </Box>

        {/* ── Rows ── */}
        {tasks.map(task => (
          <TaskRow key={`${task.source}-${task.id}`} task={task} groupColor={color} />
        ))}

        {/* ── Group Summary Footer ── */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 2,
          px: 2, py: 0.75, bgcolor: "rgba(255,255,255,0.01)",
          borderTop: "1px solid", borderColor: "rgba(255,255,255,0.04)",
        }}>
          <Typography sx={{ fontSize: "0.6875rem", color: "text.disabled" }}>
            {tasks.length} item{tasks.length !== 1 ? "s" : ""}
          </Typography>
          {totalHours > 0 && (
            <Typography sx={{ fontSize: "0.6875rem", color: "text.disabled" }}>
              · {totalHours.toFixed(1)} total hours
            </Typography>
          )}
          {/* Assignee faces */}
          {(() => {
            const assignees = [...new Map(
              tasks.filter(t => t.assignee).map(t => [t.assignee!.id, t.assignee!])
            ).values()];
            if (assignees.length === 0) return null;
            return (
              <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}>
                <AvatarGroup max={5} sx={{ "& .MuiAvatar-root": { width: 22, height: 22, fontSize: "0.6rem", fontWeight: 700, border: "1.5px solid", borderColor: "background.paper" } }}>
                  {assignees.map(a => (
                    <Tooltip key={a.id} title={a.name} arrow>
                      <Avatar sx={{ bgcolor: avatarColor(a.name) }}>{getInitials(a.name)}</Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            );
          })()}
        </Box>
      </Collapse>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// SummaryStrip — compact top summary bar
// ══════════════════════════════════════════════════════════════
function SummaryStrip({ tasks }: { tasks: ActiveTask[] }) {
  const total = tasks.length;
  const todo = tasks.filter(t => t.status === "To_Do").length;
  const ready = tasks.filter(t => t.status === "Ready_to_Start").length;
  const inProgress = tasks.filter(t => t.status === "In_Progress").length;
  const completed = tasks.filter(t => t.status === "Completed").length;
  const overdue = tasks.filter(t => {
    if (!t.due_date || t.status === "Completed") return false;
    return new Date(t.due_date) < new Date();
  }).length;
  const totalHours = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const unassigned = tasks.filter(t => !t.assignee && t.status !== "Completed").length;

  const items = [
    { label: "Total", value: total, color: "#579BFC" },
    { label: "To Do", value: todo, color: STATUS_CONFIG.To_Do.bg },
    { label: "Ready", value: ready, color: STATUS_CONFIG.Ready_to_Start.bg },
    { label: "Working", value: inProgress, color: STATUS_CONFIG.In_Progress.bg },
    { label: "Done", value: completed, color: STATUS_CONFIG.Completed.bg },
    ...(overdue > 0 ? [{ label: "Overdue", value: overdue, color: "#D83A52" }] : []),
    ...(unassigned > 0 ? [{ label: "Unassigned", value: unassigned, color: "#FDAB3D" }] : []),
    { label: "Hours", value: totalHours.toFixed(1), color: "#A25DDC" },
  ];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mb: 2.5 }}>
      {items.map((item) => (
        <Box key={item.label} sx={{
          display: "flex", alignItems: "center", gap: 0.75,
          px: 1.5, py: 0.75, borderRadius: 1.5,
          border: "1px solid", borderColor: "rgba(255,255,255,0.06)",
          bgcolor: "rgba(255,255,255,0.02)",
        }}>
          <CircleIcon sx={{ fontSize: 8, color: item.color }} />
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 500 }}>
            {item.label}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "text.primary" }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// Grouping logic
// ══════════════════════════════════════════════════════════════
function groupTasks(
  tasks: ActiveTask[],
  mode: GroupMode,
): { key: string; title: string; color: string; tasks: ActiveTask[]; icon?: React.ReactNode; badge?: string }[] {
  switch (mode) {
    case "project": {
      const map = new Map<string, ActiveTask[]>();
      tasks.forEach(t => {
        const key = t.source === "project"
          ? `project-${t.project_id}`
          : `inquiry-${t.inquiry_id}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      });
      return [...map.entries()].map(([key, items]) => {
        const first = items[0];
        const isProject = first.source === "project";
        return {
          key,
          title: first.context_label,
          color: isProject ? "#579BFC" : "#00C875",
          tasks: items,
          icon: isProject
            ? <ProjectIcon sx={{ fontSize: 18, color: "#579BFC" }} />
            : <TaskIcon sx={{ fontSize: 18, color: "#00C875" }} />,
          badge: first.event_date
            ? new Date(first.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : undefined,
        };
      });
    }

    case "status": {
      return STATUS_ORDER
        .map(status => ({
          key: status,
          title: STATUS_CONFIG[status]?.label || status,
          color: STATUS_CONFIG[status]?.bg || "#676879",
          tasks: tasks.filter(t => t.status === status),
          icon: <CircleIcon sx={{ fontSize: 12, color: STATUS_CONFIG[status]?.bg }} />,
        }))
        .filter(g => g.tasks.length > 0);
    }

    case "person": {
      const map = new Map<string, ActiveTask[]>();
      tasks.forEach(t => {
        const key = t.assignee ? `person-${t.assignee.id}` : "unassigned";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      });
      // Unassigned first, then sorted by person name
      const entries = [...map.entries()].sort((a, b) => {
        if (a[0] === "unassigned") return -1;
        if (b[0] === "unassigned") return 1;
        return a[1][0].assignee!.name.localeCompare(b[1][0].assignee!.name);
      });
      return entries.map(([key, items]) => {
        const assignee = items[0].assignee;
        return {
          key,
          title: assignee ? assignee.name : "Unassigned",
          color: assignee ? avatarColor(assignee.name) : "#676879",
          tasks: items,
          icon: assignee
            ? <Avatar sx={{ width: 22, height: 22, fontSize: "0.625rem", fontWeight: 700, bgcolor: avatarColor(assignee.name) }}>
                {getInitials(assignee.name)}
              </Avatar>
            : <Avatar sx={{ width: 22, height: 22, bgcolor: "transparent", border: "1.5px dashed", borderColor: "rgba(255,255,255,0.2)" }}>
                <PersonIcon sx={{ fontSize: 13, color: "text.disabled" }} />
              </Avatar>,
          badge: assignee?.email,
        };
      });
    }

    case "date": {
      return DATE_GROUP_ORDER
        .map(group => ({
          key: group,
          title: group,
          color: DATE_GROUP_COLORS[group] || "#676879",
          tasks: tasks.filter(t => getDateGroup(t.due_date) === group),
          icon: group === "Overdue"
            ? <WarningIcon sx={{ fontSize: 16, color: "#D83A52" }} />
            : <CalendarIcon sx={{ fontSize: 16, color: DATE_GROUP_COLORS[group] }} />,
        }))
        .filter(g => g.tasks.length > 0);
    }

    case "phase":
    default: {
      return PHASE_ORDER
        .map(phase => ({
          key: phase,
          title: PHASE_LABELS[phase] || phase.replace(/_/g, " "),
          color: PHASE_COLORS[phase] || "#579BFC",
          tasks: tasks.filter(t => t.phase === phase),
        }))
        .filter(g => g.tasks.length > 0);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// Main Page Component
// ══════════════════════════════════════════════════════════════
export default function ActiveTasksPage() {
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("project");

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.activeTasks.getAll();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ── Filtering ──
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Status filter
      if (statusFilter === "active" && (t.status === "Completed" || t.status === "Archived")) return false;
      if (statusFilter !== "active" && statusFilter !== "all" && t.status !== statusFilter) return false;
      // Source filter
      if (sourceFilter !== "all" && t.source !== sourceFilter) return false;
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.context_label.toLowerCase().includes(q) ||
          t.assignee?.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.phase.toLowerCase().replace(/_/g, " ").includes(q)
        );
      }
      return true;
    });
  }, [tasks, statusFilter, sourceFilter, searchQuery]);

  // ── Grouping ──
  const groups = useMemo(() => groupTasks(filteredTasks, groupMode), [filteredTasks, groupMode]);

  return (
    <Box sx={{ p: 3, maxWidth: 1400 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: "1.5rem", display: "flex", alignItems: "center", gap: 1 }}>
            <TaskIcon sx={{ fontSize: 28, color: "primary.main" }} />
            Active Tasks
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem", mt: 0.25 }}>
            All active tasks across inquiries and projects
          </Typography>
        </Box>
        <Tooltip title="Refresh" arrow>
          <IconButton onClick={loadTasks} size="small" sx={{ color: "text.secondary" }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Summary Strip ── */}
      {!loading && tasks.length > 0 && <SummaryStrip tasks={filteredTasks} />}

      {/* ── Toolbar: Group + Filter + Search ── */}
      <Paper elevation={0} sx={{
        display: "flex", alignItems: "center", gap: 1.5, p: 1, px: 1.5, mb: 2,
        border: "1px solid", borderColor: "divider", borderRadius: 2,
        flexWrap: "wrap",
      }}>
        {/* Group By Toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600, whiteSpace: "nowrap" }}>
            Group by
          </Typography>
          <ToggleButtonGroup
            value={groupMode}
            exclusive
            onChange={(_, val) => val && setGroupMode(val)}
            size="small"
            sx={{
              height: 32,
              "& .MuiToggleButton-root": {
                fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
                px: 1.25, py: 0, border: "1px solid", borderColor: "divider",
                color: "text.secondary",
                "&.Mui-selected": { bgcolor: "rgba(87,155,252,0.12)", color: "#579BFC", borderColor: "rgba(87,155,252,0.3)" },
              },
            }}
          >
            <ToggleButton value="project">
              <ProjectIcon sx={{ fontSize: 15, mr: 0.5 }} /> Project
            </ToggleButton>
            <ToggleButton value="status">
              <CircleIcon sx={{ fontSize: 10, mr: 0.5 }} /> Status
            </ToggleButton>
            <ToggleButton value="person">
              <PersonViewIcon sx={{ fontSize: 15, mr: 0.5 }} /> Person
            </ToggleButton>
            <ToggleButton value="date">
              <DateViewIcon sx={{ fontSize: 15, mr: 0.5 }} /> Date
            </ToggleButton>
            <ToggleButton value="phase">
              <PhaseViewIcon sx={{ fontSize: 15, mr: 0.5 }} /> Phase
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Filters */}
        <FilterIcon sx={{ color: "text.disabled", fontSize: 18 }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            sx={{ borderRadius: 1.5, fontSize: "0.75rem", height: 32 }}
          >
            <MenuItem value="active">Active Only</MenuItem>
            <MenuItem value="all">All Statuses</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <MenuItem key={key} value={key}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircleIcon sx={{ fontSize: 8, color: val.bg }} />
                  {val.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 110 }}>
          <Select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            sx={{ borderRadius: 1.5, fontSize: "0.75rem", height: 32 }}
          >
            <MenuItem value="all">All Sources</MenuItem>
            <MenuItem value="project">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ProjectIcon sx={{ fontSize: 14 }} /> Projects
              </Box>
            </MenuItem>
            <MenuItem value="inquiry">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TaskIcon sx={{ fontSize: 14 }} /> Inquiries
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search tasks, people, projects..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            ml: "auto", minWidth: 240,
            "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.75rem", height: 32 },
          }}
        />

        <Typography sx={{ fontSize: "0.6875rem", color: "text.disabled", whiteSpace: "nowrap" }}>
          {filteredTasks.length} of {tasks.length}
        </Typography>
      </Paper>

      {/* ── Task Board ── */}
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ mb: 3 }}>
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1, mb: 0.5 }} />
                {[1, 2, 3, 4].map(j => (
                  <Skeleton key={j} variant="rectangular" height={42} sx={{ mb: 0.25 }} />
                ))}
              </Box>
            ))}
          </Box>
        ) : error ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>
            <Typography
              component="button" onClick={loadTasks}
              sx={{ color: "primary.main", cursor: "pointer", textDecoration: "underline", border: "none", bgcolor: "transparent", fontSize: "0.875rem" }}
            >
              Try again
            </Typography>
          </Box>
        ) : groups.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <TaskIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography sx={{ color: "text.secondary" }}>
              {searchQuery || statusFilter !== "active" || sourceFilter !== "all"
                ? "No tasks match your filters"
                : "No active tasks found"
              }
            </Typography>
            <Typography sx={{ color: "text.disabled", fontSize: "0.8125rem", mt: 0.5 }}>
              Tasks appear here when created from inquiries or projects
            </Typography>
          </Box>
        ) : (
          <Box>
            {groups.map((group, idx) => (
              <TaskGroup
                key={group.key}
                title={group.title}
                color={group.color}
                tasks={group.tasks}
                defaultExpanded={idx < 5}
                icon={group.icon}
                badge={group.badge}
              />
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
