"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Popover,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
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
  Close as CloseIcon,
  Sync as SyncIcon,
  ArrowForwardIos as NavigateIcon,
  Work as BriefcaseIcon,
  ContentPaste as ClipboardIcon,
  Bolt as BoltIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { ActiveTask } from "@/lib/types";
import type { Contributor } from "@/lib/types";

// ── Grouping modes ────────────────────────────────────────────
type GroupMode = "project" | "status" | "person" | "date" | "phase";

// ── Grid column definition ─────────────────────────────────────
const GRID_COLS = "24px minmax(130px, 1.2fr) minmax(0, 2.5fr) 96px 160px 130px 80px";

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
function formatDueDate(dateStr: string | null, isCompleted = false) {
  if (!dateStr) return { text: "No date", color: "#676879", urgent: false };
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  const formatted = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diffDays < 0) {
    if (isCompleted) return { text: formatted, color: "#676879", urgent: false };
    return { text: `Overdue · ${formatted}`, color: "#D83A52", urgent: true };
  }
  if (diffDays === 0) return { text: "Today", color: isCompleted ? "#676879" : "#FDAB3D", urgent: !isCompleted };
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
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = ["#0086C0", "#A25DDC", "#FF158A", "#FDAB3D", "#00C875", "#579BFC", "#FF5AC4", "#CAB641", "#7F5347", "#66CCFF"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Navigation URL helper ─────────────────────────────────────
// Maps each task to the right section of the app where it can be actioned.
function getNavigationUrl(task: ActiveTask): string | null {
  if (task.source === 'inquiry' && task.inquiry_id) {
    const base = `/sales/inquiries/${task.inquiry_id}`;
    const subtaskSectionMap: Record<string, string> = {
      verify_contact_details: 'needs-assessment-section',
      verify_event_date: 'needs-assessment-section',
      confirm_package_selection: 'needs-assessment-section',
      check_crew_availability: 'availability-section',
      check_equipment_availability: 'availability-section',
      resolve_availability_conflicts: 'availability-section',
      send_crew_availability_requests: 'availability-section',
      reserve_equipment: 'availability-section',
      mark_inquiry_qualified: 'qualify-section',
      send_welcome_response: 'qualify-section',
    };

    if (task.task_kind === 'subtask' && task.subtask_key && subtaskSectionMap[task.subtask_key]) {
      return `${base}#${subtaskSectionMap[task.subtask_key]}`;
    }

    const n = (task.name + ' ' + (task.description ?? '')).toLowerCase();

    // Sub-page destinations
    if (n.includes('review needs assessment')) return `${base}?open=needs-assessment`;
    if (n.includes('needs assessment') || n.includes('assessment form')) return `${base}/needs-assessment`;
    if (n.includes('package') && (n.includes('select') || n.includes('review') || n.includes('scope') || n.includes('present'))) return `${base}/package`;

    // Section fragments on the inquiry command center
    if (n.includes('contract') || n.includes('sign agreement')) return `${base}#contracts-section`;
    if (n.includes('proposal') && !n.includes('review')) return `${base}#proposals-section`;
    if (n.includes('proposal review') || n.includes('review proposal')) return `${base}#proposal-review-section`;
    if (n.includes('availability') || n.includes('crew') || n.includes('equipment')) return `${base}#availability-section`;
    if (n.includes('qualify')) return `${base}#qualify-section`;
    if (n.includes('quote')) return `${base}#quotes-section`;
    if (n.includes('estimate') || n.includes('budget')) return `${base}#estimates-section`;
    if (n.includes('discovery') || n.includes('questionnaire')) return `${base}#discovery-questionnaire-section`;
    if (n.includes('call') || n.includes('meeting') || n.includes('consultation')) return `${base}#calls-section`;
    if (n.includes('approval') || n.includes('client review') || n.includes('client sign')) return `${base}#approval-section`;

    return base;
  }

  if (task.source === 'project' && task.project_id) {
    return `/projects/${task.project_id}`;
  }

  return null;
}

// ── Stage/task tree builder ──────────────────────────────────────
type TreeItem =
  | { type: "stage"; stage: ActiveTask; children: ActiveTask[] }
  | { type: "task"; task: ActiveTask };

function buildTaskTree(tasks: ActiveTask[]): TreeItem[] {
  const childrenByParent = new Map<number, ActiveTask[]>();
  tasks.forEach((task) => {
    if (task.parent_task_id && task.task_kind !== 'subtask') {
      const arr = childrenByParent.get(task.parent_task_id) ?? [];
      arr.push(task);
      childrenByParent.set(task.parent_task_id, arr);
    }
  });
  const items: TreeItem[] = [];
  tasks.forEach((task) => {
    if (task.parent_task_id || task.subtask_parent_id || task.task_kind === 'subtask') return;
    if (task.is_stage) {
      items.push({ type: "stage", stage: task, children: childrenByParent.get(task.id) ?? [] });
    } else {
      items.push({ type: "task", task });
    }
  });
  return items;
}

// ══════════════════════════════════════════════════════════════
// StatusPill
// ══════════════════════════════════════════════════════════════
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.To_Do;
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: "0.6875rem",
      height: 24, px: 1.25, borderRadius: "6px", whiteSpace: "nowrap",
      minWidth: 64, letterSpacing: "0.02em",
    }}>
      {cfg.label}
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// AssigneeCell — clickable assignee with popover picker
// ══════════════════════════════════════════════════════════════
function AssigneeCell({ task, contributors, onAssign, onNavigate }: {
  task: ActiveTask;
  contributors: Contributor[];
  onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
  onNavigate: (task: ActiveTask) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return contributors;
    const q = search.toLowerCase();
    return contributors.filter(c => c.full_name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
  }, [contributors, search]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setSearch("");
  };

  const handleSelect = (contributorId: number | null) => {
    onAssign(task.id, task.source, contributorId, task.task_kind);
    setAnchorEl(null);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.5,
          borderRadius: 1.5, mx: 0.5,
        }}
      >
        {task.assignee ? (
          <>
            <Tooltip title="Change assignee" arrow placement="top">
              <Avatar
                onClick={handleOpen}
                sx={{
                  width: 28, height: 28, fontSize: "0.6875rem", fontWeight: 700,
                  bgcolor: avatarColor(task.assignee.name), flexShrink: 0,
                  boxShadow: "0 0 0 2px rgba(0,0,0,0.3)",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  "&:hover": { opacity: 0.75 },
                }}
              >
                {getInitials(task.assignee.name)}
              </Avatar>
            </Tooltip>
            <Typography
              noWrap
              onClick={(e) => { e.stopPropagation(); onNavigate(task); }}
              sx={{
                fontSize: "0.8125rem", color: "text.primary", fontWeight: 500, maxWidth: 110,
                cursor: "pointer",
                transition: "color 0.15s",
                "&:hover": { color: "#579BFC", textDecoration: "underline" },
              }}
            >
              {task.assignee.name}
            </Typography>
          </>
        ) : (
          <Box
            onClick={handleOpen}
            sx={{
              display: "flex", alignItems: "center", gap: 1, cursor: "pointer",
              borderRadius: 1, p: 0.375, transition: "background 0.15s",
              "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <Avatar sx={{
              width: 28, height: 28, bgcolor: "transparent",
              border: "1.5px dashed rgba(255,255,255,0.18)", flexShrink: 0,
            }}>
              <PersonIcon sx={{ fontSize: 14, color: "text.disabled" }} />
            </Avatar>
            <Typography sx={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
              Assign…
            </Typography>
          </Box>
        )}
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              width: 270, maxHeight: 340, bgcolor: "#1e1f25",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }
          }
        }}
      >
        <Box sx={{ p: 1.25, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <TextField
            size="small" placeholder="Search people…"
            value={search} onChange={e => setSearch(e.target.value)}
            autoFocus fullWidth
            slotProps={{ input: { sx: { fontSize: "0.8125rem", bgcolor: "rgba(255,255,255,0.04)", borderRadius: 1 } } }}
          />
        </Box>
        <List dense sx={{ py: 0.5, maxHeight: 260, overflowY: "auto" }}>
          {task.assignee && (
            <ListItemButton onClick={() => handleSelect(null)} sx={{ py: 0.75, px: 1.5, borderRadius: 1, mx: 0.5 }}>
              <ListItemAvatar sx={{ minWidth: 36 }}>
                <Avatar sx={{ width: 26, height: 26, bgcolor: "rgba(255,255,255,0.06)", border: "1.5px dashed rgba(255,255,255,0.18)" }}>
                  <CloseIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Remove assignee"
                primaryTypographyProps={{ fontSize: "0.8125rem", color: "text.secondary", fontStyle: "italic" }}
              />
            </ListItemButton>
          )}
          {filtered.map(c => (
            <ListItemButton
              key={c.id}
              onClick={() => handleSelect(c.id)}
              selected={task.assignee?.id === c.id}
              sx={{ py: 0.75, px: 1.5, borderRadius: 1, mx: 0.5 }}
            >
              <ListItemAvatar sx={{ minWidth: 36 }}>
                <Avatar sx={{ width: 26, height: 26, fontSize: "0.625rem", fontWeight: 700, bgcolor: avatarColor(c.full_name) }}>
                  {c.initials}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={c.full_name}
                primaryTypographyProps={{ fontSize: "0.8125rem", fontWeight: 500 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// TaskRow
// ══════════════════════════════════════════════════════════════
function TaskRow({ task, groupColor, contributors, onAssign, onNavigate, onToggle, isChild, subtasks = [], nested = false }: {
  task: ActiveTask;
  groupColor: string;
  contributors: Contributor[];
  onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
  onNavigate: (task: ActiveTask) => void;
  onToggle: (task: ActiveTask) => void;
  isChild?: boolean;
  subtasks?: ActiveTask[];
  nested?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const isCompleted = task.status === "Completed";
  const isAuto = task.is_auto_only ?? false;
  const dueInfo = formatDueDate(task.due_date, isCompleted);
  const navUrl = getNavigationUrl(task);
  const completedSubtasks = subtasks.filter((subtask) => subtask.status === 'Completed').length;

  return (
    <>
    <Box
      onClick={navUrl ? () => onNavigate(task) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: "grid",
        gridTemplateColumns: GRID_COLS,
        alignItems: "center",
        minHeight: 48,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background-color 0.12s",
        cursor: navUrl ? "pointer" : "default",
        "&:hover": { bgcolor: navUrl ? "rgba(87,155,252,0.035)" : "rgba(255,255,255,0.028)" },
        "&:last-child": { borderBottom: "none" },
        opacity: isAuto ? (isCompleted ? 0.5 : 0.45) : isCompleted ? 0.5 : 1,
      }}
    >
      {/* Subtask expand chevron */}
      <Box
        onClick={subtasks.length > 0 ? (e) => { e.stopPropagation(); setSubtasksOpen(o => !o); } : undefined}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: subtasks.length > 0 ? 'pointer' : 'default',
          height: '100%',
          borderRadius: '3px',
          transition: 'background 0.12s',
          '&:hover': subtasks.length > 0 ? { bgcolor: 'rgba(255,255,255,0.06)' } : {},
        }}
      >
        {subtasks.length > 0 && (
          subtasksOpen
            ? <ExpandMoreIcon sx={{ fontSize: 14, color: '#94a3b8', transform: 'rotate(0deg)', transition: 'transform 0.2s' }} />
            : <ExpandMoreIcon sx={{ fontSize: 14, color: '#94a3b8', transform: 'rotate(-90deg)', transition: 'transform 0.2s' }} />
        )}
      </Box>

      {/* Project / Inquiry — shaped badge + full name */}
      <Box sx={{ px: 1.5, overflow: "hidden", display: "flex", alignItems: "center", gap: 1, borderLeft: isChild ? `2px solid ${groupColor}55` : `3px solid ${groupColor}`, height: "100%", pl: nested ? 4 : isChild ? 2.5 : 1.5 }}>
        <Box
          onClick={(e) => { e.stopPropagation(); onNavigate(task); }}
          sx={{
            display: "flex", alignItems: "center", gap: 0.875,
            cursor: "pointer", borderRadius: 1, px: 0.5, py: 0.375, mx: -0.5,
            transition: "background 0.12s", overflow: "hidden",
            "&:hover": { bgcolor: task.source === "project" ? "rgba(87,155,252,0.1)" : "rgba(0,200,117,0.1)" },
          }}
        >
          <Box sx={{
            width: 30, height: 30, borderRadius: task.source === "project" ? "8px" : "50%",
            bgcolor: task.source === "project" ? "rgba(87,155,252,0.14)" : "rgba(0,200,117,0.12)",
            border: `1.5px solid ${task.source === "project" ? "rgba(87,155,252,0.35)" : "rgba(0,200,117,0.3)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Typography sx={{
              fontSize: "0.5625rem", fontWeight: 800,
              color: task.source === "project" ? "#579BFC" : "#00C875",
              lineHeight: 1, letterSpacing: "0.02em",
            }}>
              {getInitials(task.context_label)}
            </Typography>
          </Box>
          <Typography noWrap sx={{
            fontSize: "0.75rem", fontWeight: 600,
            color: "text.primary",
          }}>
            {task.context_label}
          </Typography>
        </Box>
      </Box>

      {/* Task Name */}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1.25,
        pl: 1.5, pr: 1.5, overflow: "hidden",
        height: "100%",
      }}>
        {isAuto
          ? <BoltIcon sx={{ fontSize: 16, color: isCompleted ? "#00C875" : "#FDAB3D", opacity: isCompleted ? 0.85 : 0.65, flexShrink: 0 }} />
          : <Box
              onClick={(e) => { e.stopPropagation(); onToggle(task); }}
              sx={{ flexShrink: 0, cursor: "pointer", display: "flex", "&:hover": { opacity: 0.7 } }}
            >
              {isCompleted
                ? <CheckCircleIcon sx={{ fontSize: 16, color: "#00C875" }} />
                : <UncheckedIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }} />
              }
            </Box>
        }
        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
            <Typography noWrap sx={{
              fontSize: "0.8125rem", fontWeight: 500, lineHeight: 1.3,
              textDecoration: isCompleted ? "line-through" : "none",
              color: isAuto ? "rgba(255,255,255,0.35)" : isCompleted ? "text.secondary" : "text.primary",
              fontStyle: isAuto ? "italic" : "normal",
              minWidth: 0,
            }}>
              {task.name}
            </Typography>
            {!nested && subtasks.length > 0 && (
              <Typography sx={{ fontSize: '0.65rem', color: '#475569', fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {completedSubtasks}/{subtasks.length} subtasks
              </Typography>
            )}
          </Box>
          {task.description && (
            <Typography noWrap sx={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.25, mt: 0.125 }}>
              {task.description}
            </Typography>
          )}
        </Box>
        {navUrl && (
          <NavigateIcon sx={{
            fontSize: 10, flexShrink: 0, ml: 0.5,
            color: hovered ? "rgba(87,155,252,0.8)" : "transparent",
            transition: "color 0.15s",
          }} />
        )}
      </Box>

      {/* Status */}
      <Box sx={{ display: "flex", justifyContent: "center", px: 0.5 }}>
        {isAuto ? (
          <Box sx={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            bgcolor: isCompleted ? "rgba(0,200,117,0.12)" : "rgba(253,171,61,0.12)",
            color: isCompleted ? "#00C875" : "#FDAB3D",
            fontWeight: 700, fontSize: "0.6rem",
            height: 20, px: 0.875, borderRadius: "5px", whiteSpace: "nowrap",
            border: isCompleted ? "1px solid rgba(0,200,117,0.25)" : "1px solid rgba(253,171,61,0.25)",
          }}>Auto</Box>
        ) : <StatusPill status={task.status} />}
      </Box>

      {/* Assignee */}
      {isAuto ? (
        <Box sx={{ px: 1.5, display: "flex", alignItems: "center" }}>
          <Typography sx={{ fontSize: "0.75rem", color: "rgba(253,171,61,0.4)", fontStyle: "italic" }}>System</Typography>
        </Box>
      ) : <AssigneeCell task={task} contributors={contributors} onAssign={onAssign} onNavigate={onNavigate} />}

      {/* Due Date */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.625, px: 1.5 }}>
        {dueInfo.urgent
          ? <WarningIcon sx={{ fontSize: 13, color: dueInfo.color, flexShrink: 0 }} />
          : <CalendarIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
        }
        <Typography sx={{ fontSize: "0.75rem", color: dueInfo.color, fontWeight: dueInfo.urgent ? 700 : 400, whiteSpace: "nowrap" }}>
          {dueInfo.text}
        </Typography>
      </Box>

      {/* Hours */}
      <Box sx={{ px: 1.5 }}>
        {task.estimated_hours ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ClockIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }} />
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 500 }}>
              {task.actual_hours != null ? `${task.actual_hours}/${task.estimated_hours}h` : `${task.estimated_hours}h`}
            </Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.18)" }}>—</Typography>
        )}
      </Box>

    </Box>

    <Collapse in={subtasksOpen}>
      {subtasks.map((subtask) => (
        <TaskRow
          key={`${subtask.source}-${subtask.id}`}
          task={subtask}
          groupColor={groupColor}
          contributors={contributors}
          onAssign={onAssign}
          onNavigate={onNavigate}
          onToggle={onToggle}
          isChild
          nested
        />
      ))}
    </Collapse>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// StageRow — collapsible stage header with sub-tasks nested below
// ══════════════════════════════════════════════════════════════
function StageRow({ stage, children, groupColor, contributors, onAssign, onNavigate, onToggle, subtasksByParent }: {
  stage: ActiveTask;
  children: ActiveTask[];
  groupColor: string;
  contributors: Contributor[];
  onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
  onNavigate: (task: ActiveTask) => void;
  onToggle: (task: ActiveTask) => void;
  subtasksByParent: Map<number, ActiveTask[]>;
}) {
  const [open, setOpen] = useState(true);
  const stageColor = stage.stage_color || groupColor;
  const done = children.filter(t => t.status === "Completed").length;
  const total = children.length;
  const progress = total > 0 ? (done / total) * 100 : 0;
  const allDone = total > 0 && done === total;
  const totalHours = children.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const overdueAny = children.some(t =>
    t.due_date && t.status !== "Completed" && new Date(t.due_date) < new Date()
  );
  const teamMembers = [...new Map(
    children.filter(t => t.assignee).map(t => [t.assignee!.id, t.assignee!])
  ).values()];

  return (
    <Box sx={{ "&:not(:last-child)": { borderBottom: "none" } }}>
      {/* Stage header — full-width flex row like Monday.com group headers */}
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: "flex", alignItems: "center", gap: 1.5,
          height: 38, pl: 2, pr: 2.5,
          bgcolor: `${stageColor}0e`,
          borderLeft: `3px solid ${stageColor}`,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          cursor: "pointer",
          transition: "background 0.15s",
          "&:hover": { bgcolor: `${stageColor}18` },
        }}
      >
        <ExpandMoreIcon sx={{
          fontSize: 15, color: stageColor, flexShrink: 0,
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.2s",
        }} />

        <Typography sx={{
          fontWeight: 700, fontSize: "0.875rem", color: allDone ? "#00C875" : stageColor,
          letterSpacing: "-0.01em",
          textDecoration: allDone ? "line-through" : "none",
          opacity: allDone ? 0.7 : 1,
        }}>
          {stage.name}
        </Typography>

        {allDone && <CheckCircleIcon sx={{ fontSize: 14, color: "#00C875", flexShrink: 0 }} />}

        {/* Progress fraction badge */}
        <Box sx={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: 20, px: 0.875, borderRadius: "5px", flexShrink: 0,
          bgcolor: `${stageColor}1a`, border: `1px solid ${stageColor}33`,
        }}>
          <Typography sx={{ fontSize: "0.625rem", fontWeight: 800, color: stageColor, lineHeight: 1 }}>
            {done}/{total}
          </Typography>
        </Box>

        {/* Mini progress bar */}
        <LinearProgress
          variant="determinate" value={progress}
          sx={{
            width: 56, height: 3, borderRadius: 2, flexShrink: 0,
            bgcolor: "rgba(255,255,255,0.07)",
            "& .MuiLinearProgress-bar": { bgcolor: stageColor, borderRadius: 2 },
          }}
        />

        {/* Right side stats */}
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 2 }}>
          {overdueAny && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <WarningIcon sx={{ fontSize: 12, color: "#D83A52" }} />
              <Typography sx={{ fontSize: "0.6875rem", color: "#D83A52", fontWeight: 700 }}>Overdue</Typography>
            </Box>
          )}
          {totalHours > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ClockIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }} />
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>
                {totalHours.toFixed(1)}h
              </Typography>
            </Box>
          )}
          {teamMembers.length > 0 && (
            <AvatarGroup max={4} sx={{
              "& .MuiAvatar-root": {
                width: 22, height: 22, fontSize: "0.5625rem", fontWeight: 800,
                border: "2px solid rgba(16,16,20,1)",
              }
            }}>
              {teamMembers.map(a => (
                <Tooltip key={a.id} title={a.name} arrow>
                  <Avatar sx={{ bgcolor: avatarColor(a.name) }}>{getInitials(a.name)}</Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
        </Box>
      </Box>

      {/* Sub-tasks */}
      <Collapse in={open}>
        {children.map(task => (
          <TaskRow
            key={`${task.source}-${task.id}`}
            task={task}
            groupColor={stageColor}
            contributors={contributors}
            onAssign={onAssign}
            onNavigate={onNavigate}
            onToggle={onToggle}
            isChild
            subtasks={subtasksByParent.get(task.id) ?? []}
          />
        ))}
      </Collapse>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// ColumnHeaders — shared header row for every group
// ══════════════════════════════════════════════════════════════
function ColumnHeaders() {
  const headers = ["Project / Inquiry", "Task", "Status", "Person", "Due Date", "Hours"];
  return (
    <Box sx={{
      display: "grid", gridTemplateColumns: GRID_COLS,
      bgcolor: "rgba(255,255,255,0.022)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* chevron col spacer */}
      <Box />
      {headers.map((h, i) => (
        <Typography key={h} sx={{
          fontSize: "0.625rem", fontWeight: 800, color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase", letterSpacing: "0.12em",
          px: i === 0 ? 2.5 : 1.5, py: 1,
        }}>
          {h}
        </Typography>
      ))}
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// TaskGroup — collapsible group with header + rows + footer
// ══════════════════════════════════════════════════════════════
function TaskGroup({
  title, color, tasks, defaultExpanded, icon, badge, contributors, onAssign, onNavigate, onToggle,
}: {
  title: string; color: string; tasks: ActiveTask[];
  defaultExpanded: boolean; icon?: React.ReactNode; badge?: string;
  contributors: Contributor[];
  onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
  onNavigate: (task: ActiveTask) => void;
  onToggle: (task: ActiveTask) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const subtasksByParent = useMemo(() => {
    const map = new Map<number, ActiveTask[]>();
    tasks.forEach((task) => {
      if (!task.subtask_parent_id) return;
      const list = map.get(task.subtask_parent_id) ?? [];
      list.push(task);
      map.set(task.subtask_parent_id, list);
    });
    return map;
  }, [tasks]);
  const leafTasks = tasks.filter(t => !t.is_stage && t.task_kind !== 'subtask');
  const totalHours = leafTasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const completedCount = leafTasks.filter(t => t.status === "Completed").length;
  const progress = leafTasks.length > 0 ? (completedCount / leafTasks.length) * 100 : 0;

  return (
    <Box sx={{ "&:not(:last-child)": { borderBottom: "1px solid rgba(255,255,255,0.05)" } }}>
      {/* Group Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex", alignItems: "center", gap: 1.5,
          px: 2.5, py: 1.25,
          cursor: "pointer", userSelect: "none",
          bgcolor: "rgba(255,255,255,0.015)",
          "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
          borderLeft: `4px solid ${color}`,
          transition: "background 0.15s",
        }}
      >
        <ExpandMoreIcon sx={{
          fontSize: 18, color: "text.secondary",
          transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.2s",
          flexShrink: 0,
        }} />
        {icon && <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</Box>}

        <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color, letterSpacing: "-0.01em" }}>
          {title}
        </Typography>

        {/* Task count badge */}
        <Box sx={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: 22, minWidth: 28, px: 0.75,
          borderRadius: "6px", fontWeight: 700, fontSize: "0.75rem",
          bgcolor: `${color}1a`, color, border: `1px solid ${color}33`,
        }}>
          {tasks.length}
        </Box>

        {badge && (
          <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", fontWeight: 500 }}>
            {badge}
          </Typography>
        )}

        {/* Progress */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, ml: 1 }}>
          <LinearProgress
            variant="determinate" value={progress}
            sx={{
              flex: 1, maxWidth: 100, height: 3, borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.07)",
              "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 2 },
            }}
          />
          <Typography sx={{ fontSize: "0.6875rem", color: "text.disabled", whiteSpace: "nowrap", fontWeight: 500 }}>
            {completedCount}/{tasks.length}
          </Typography>
        </Box>

        {totalHours > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 0.5 }}>
            <ClockIcon sx={{ fontSize: 13, color: "text.disabled" }} />
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>
              {totalHours.toFixed(1)}h
            </Typography>
          </Box>
        )}
      </Box>

      <Collapse in={expanded}>
        <ColumnHeaders />

        {buildTaskTree(tasks).map(item =>
          item.type === "stage" ? (
            <StageRow
              key={`stage-${item.stage.source}-${item.stage.id}`}
              stage={item.stage}
              children={item.children}
              groupColor={color}
              contributors={contributors}
              onAssign={onAssign}
              onNavigate={onNavigate}
              onToggle={onToggle}
              subtasksByParent={subtasksByParent}
            />
          ) : (
            <TaskRow
              key={`${item.task.source}-${item.task.id}`}
              task={item.task}
              groupColor={color}
              contributors={contributors}
              onAssign={onAssign}
              onNavigate={onNavigate}
              onToggle={onToggle}
              subtasks={subtasksByParent.get(item.task.id) ?? []}
            />
          )
        )}

        {/* Group Footer */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 2,
          px: 2.5, py: 0.875,
          bgcolor: "rgba(255,255,255,0.012)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          <Typography sx={{ fontSize: "0.6875rem", color: "text.disabled", fontWeight: 500 }}>
            {leafTasks.length} item{leafTasks.length !== 1 ? "s" : ""}
            {totalHours > 0 && <>  ·  {totalHours.toFixed(1)}h total</>}
          </Typography>
          {(() => {
            const assignees = [...new Map(
              tasks.filter(t => t.assignee).map(t => [t.assignee!.id, t.assignee!])
            ).values()];
            if (assignees.length === 0) return null;
            return (
              <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography sx={{ fontSize: "0.6875rem", color: "text.disabled" }}>Team:</Typography>
                <AvatarGroup max={6} sx={{
                  "& .MuiAvatar-root": {
                    width: 22, height: 22, fontSize: "0.5625rem", fontWeight: 800,
                    border: "2px solid rgba(20,20,26,1)",
                  }
                }}>
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
// SummaryStrip
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

  const items = [
    { label: "Total", value: total, color: "#579BFC" },
    { label: "To Do", value: todo, color: "#C4C4C4" },
    { label: "Ready", value: ready, color: "#FDAB3D" },
    { label: "Working", value: inProgress, color: "#579BFC" },
    { label: "Done", value: completed, color: "#00C875" },
    ...(overdue > 0 ? [{ label: "Overdue", value: overdue, color: "#D83A52" }] : []),
    { label: "Hours", value: `${totalHours.toFixed(1)}h`, color: "#A25DDC" },
  ];

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
      {items.map((item, idx) => (
        <Box key={item.label} sx={{
          display: "flex", alignItems: "center", gap: 1,
          px: 1.5, py: 0.875,
          borderRadius: 1.5,
          bgcolor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          ...(idx === 0 && {
            bgcolor: "rgba(87,155,252,0.08)",
            border: "1px solid rgba(87,155,252,0.2)",
          }),
        }}>
          <CircleIcon sx={{ fontSize: 7, color: item.color }} />
          <Typography sx={{ fontSize: "0.6875rem", color: "text.secondary", fontWeight: 600, letterSpacing: "0.03em" }}>
            {item.label}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 800, color: idx === 0 ? "#579BFC" : "text.primary", lineHeight: 1 }}>
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
        const key = t.source === "project" ? `project-${t.project_id}` : `inquiry-${t.inquiry_id}`;
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
            ? <ProjectIcon sx={{ fontSize: 17, color: "#579BFC" }} />
            : <TaskIcon sx={{ fontSize: 17, color: "#00C875" }} />,
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
          icon: <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: STATUS_CONFIG[status]?.bg, flexShrink: 0 }} />,
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
      return [...map.entries()]
        .sort((a, b) => {
          if (a[0] === "unassigned") return -1;
          if (b[0] === "unassigned") return 1;
          return a[1][0].assignee!.name.localeCompare(b[1][0].assignee!.name);
        })
        .map(([key, items]) => {
          const assignee = items[0].assignee;
          const color = assignee ? avatarColor(assignee.name) : "#676879";
          return {
            key,
            title: assignee ? assignee.name : "Unassigned",
            color,
            tasks: items,
            icon: assignee
              ? <Avatar sx={{ width: 22, height: 22, fontSize: "0.5625rem", fontWeight: 800, bgcolor: avatarColor(assignee.name) }}>
                  {getInitials(assignee.name)}
                </Avatar>
              : <Avatar sx={{ width: 22, height: 22, bgcolor: "transparent", border: "1.5px dashed rgba(255,255,255,0.2)" }}>
                  <PersonIcon sx={{ fontSize: 12, color: "text.disabled" }} />
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
            ? <WarningIcon sx={{ fontSize: 15, color: "#D83A52" }} />
            : <CalendarIcon sx={{ fontSize: 15, color: DATE_GROUP_COLORS[group] }} />,
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
// Main Page
// ══════════════════════════════════════════════════════════════
export default function ActiveTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("project");
  const [showAuto, setShowAuto] = useState(() => {
    if (typeof window === 'undefined') return true;
    const s = localStorage.getItem('pfo_tasks_show_auto');
    return s === null ? true : s === 'true';
  });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [data, contribs] = await Promise.all([
        api.activeTasks.getAll(),
        api.contributors.getAll(),
      ]);
      setTasks(data);
      setContributors(contribs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ── Sync contributors from task library defaults ──
  const handleSyncFromLibrary = useCallback(async () => {
    try {
      setSyncing(true);
      await api.taskLibrary.syncContributors();
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [loadTasks]);

  // ── Assign handler (optimistic update) ──
  const handleAssign = useCallback(async (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind: 'task' | 'subtask' = 'task') => {
    if (taskKind === 'subtask') {
      return;
    }
    const contributor = assigneeId ? contributors.find(c => c.id === assigneeId) : null;
    const newAssignee = contributor
      ? { id: contributor.id, name: contributor.full_name, email: contributor.email }
      : null;
    setTasks(prev => prev.map(t =>
      t.id === taskId && t.source === source ? { ...t, assignee: newAssignee } : t
    ));
    try {
      await api.activeTasks.assign(taskId, source, assigneeId, taskKind);
    } catch {
      loadTasks();
    }
  }, [contributors, loadTasks]);

  // ── Navigate to the task's source in the app ──
  const handleNavigateToTask = useCallback((task: ActiveTask) => {
    const url = getNavigationUrl(task);
    if (url) router.push(url);
  }, [router]);

  // ── Toggle task status (optimistic update) ──
  const handleToggle = useCallback(async (task: ActiveTask) => {
    if (task.is_auto_only || task.is_stage) return;
    const newStatus = task.status === "Completed" ? "To_Do" : "Completed";
    setTasks(prev => {
      let updated = prev.map(t =>
        t.id === task.id && t.source === task.source
          ? { ...t, status: newStatus, completed_at: newStatus === "Completed" ? new Date().toISOString() : null }
          : t
      );

      if (task.task_kind === 'subtask' && task.subtask_parent_id) {
        const siblings = updated.filter(t => t.subtask_parent_id === task.subtask_parent_id);
        const allDone = siblings.every(t => t.status === 'Completed');
        updated = updated.map(t =>
          t.id === task.subtask_parent_id && t.source === task.source
            ? { ...t, status: allDone ? 'Completed' : 'To_Do', completed_at: allDone ? new Date().toISOString() : null }
            : t
        );
      } else if (task.parent_task_id) {
        const siblings = updated.filter(t => t.parent_task_id === task.parent_task_id && !t.is_stage && t.task_kind !== 'subtask');
        const allDone = siblings.every(t => t.status === "Completed");
        updated = updated.map(t =>
          t.id === task.parent_task_id && t.source === task.source
            ? { ...t, status: allDone ? "Completed" : "To_Do", completed_at: allDone ? new Date().toISOString() : null }
            : t
        );
      }
      return updated;
    });
    try {
      await api.activeTasks.toggle(task.id, task.source, task.task_kind ?? 'task');
    } catch {
      loadTasks();
    }
  }, [loadTasks]);

  // ── Filtering ──
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Subtasks are always included — they render nested under their parent, not as top-level rows.
      // Filtering them here would break the subtask expand UI (completed subtasks would vanish).
      if (t.task_kind === 'subtask') return true;

      if (!showAuto && t.is_auto_only) return false;
      if (statusFilter === "active" && (t.status === "Completed" || t.status === "Archived")) return false;
      if (statusFilter !== "active" && statusFilter !== "all" && t.status !== statusFilter) return false;
      if (sourceFilter !== "all" && t.source !== sourceFilter) return false;
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
  }, [tasks, statusFilter, sourceFilter, searchQuery, showAuto]);

  const groups = useMemo(() => groupTasks(filteredTasks, groupMode), [filteredTasks, groupMode]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>

      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography component="div" sx={{ fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.025em", lineHeight: 1.1, display: "flex", alignItems: "center", gap: 1.25 }}>
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
                onClick={handleSyncFromLibrary}
                disabled={syncing}
                size="small"
                startIcon={<SyncIcon sx={{ fontSize: "15px !important", ...(syncing && { animation: "spin 1s linear infinite" }) }} />}
                sx={{
                  fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
                  px: 1.5, height: 34, borderRadius: 1.5,
                  color: syncing ? "primary.main" : "text.secondary",
                  border: "1px solid",
                  borderColor: syncing ? "rgba(87,155,252,0.3)" : "rgba(255,255,255,0.1)",
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
            <IconButton
              onClick={loadTasks} size="small"
              sx={{
                width: 34, height: 34, borderRadius: 1.5,
                border: "1px solid rgba(255,255,255,0.1)",
                color: "text.secondary",
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "text.primary" },
              }}
            >
              <RefreshIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Summary Strip ── */}
      {!loading && tasks.length > 0 && <SummaryStrip tasks={filteredTasks} />}

      {/* ── Toolbar ── */}
      <Paper elevation={0} sx={{
        display: "flex", alignItems: "center", gap: 1, p: 0.875, px: 1.25, mb: 2,
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.02)",
        flexWrap: "wrap",
      }}>
        {/* Group By */}
        <ToggleButtonGroup
          value={groupMode} exclusive
          onChange={(_, val) => val && setGroupMode(val)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
              px: 1.25, py: 0.375, height: 32,
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)",
              gap: 0.5,
              "&.Mui-selected": {
                bgcolor: "rgba(87,155,252,0.14)",
                color: "#579BFC",
                borderColor: "rgba(87,155,252,0.35)",
              },
              "&:hover:not(.Mui-selected)": { bgcolor: "rgba(255,255,255,0.04)", color: "text.primary" },
            },
          }}
        >
          <ToggleButton value="project"><ProjectIcon sx={{ fontSize: 14 }} />Project</ToggleButton>
          <ToggleButton value="status"><CircleIcon sx={{ fontSize: 9 }} />Status</ToggleButton>
          <ToggleButton value="person"><PersonViewIcon sx={{ fontSize: 14 }} />Person</ToggleButton>
          <ToggleButton value="date"><DateViewIcon sx={{ fontSize: 14 }} />Date</ToggleButton>
          <ToggleButton value="phase"><PhaseViewIcon sx={{ fontSize: 14 }} />Phase</ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.375, borderColor: "rgba(255,255,255,0.07)" }} />

        {/* Status filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            sx={{ borderRadius: 1.5, fontSize: "0.75rem", height: 32, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
            MenuProps={{ PaperProps: { sx: { fontSize: "0.75rem" } } }}
          >
            <MenuItem value="active" sx={{ fontSize: "0.8125rem" }}>Active Only</MenuItem>
            <MenuItem value="all" sx={{ fontSize: "0.8125rem" }}>All Statuses</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <MenuItem key={key} value={key} sx={{ fontSize: "0.8125rem" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: val.bg }} />
                  {val.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Source filter */}
        <FormControl size="small" sx={{ minWidth: 108 }}>
          <Select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            sx={{ borderRadius: 1.5, fontSize: "0.75rem", height: 32, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
          >
            <MenuItem value="all" sx={{ fontSize: "0.8125rem" }}>All Sources</MenuItem>
            <MenuItem value="project" sx={{ fontSize: "0.8125rem" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <ProjectIcon sx={{ fontSize: 14, color: "#579BFC" }} /> Projects
              </Box>
            </MenuItem>
            <MenuItem value="inquiry" sx={{ fontSize: "0.8125rem" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <TaskIcon sx={{ fontSize: 14, color: "#00C875" }} /> Inquiries
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Auto tasks toggle */}
        <Tooltip title={showAuto ? "Hide automated tasks" : "Show automated tasks"} arrow>
          <ToggleButton
            value="showAuto"
            selected={showAuto}
            onChange={() => {
              const next = !showAuto;
              setShowAuto(next);
              localStorage.setItem('pfo_tasks_show_auto', String(next));
            }}
            size="small"
            sx={{
              height: 32, px: 1, gap: 0.5, borderRadius: 1.5,
              fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
              border: "1px solid rgba(255,255,255,0.1) !important",
              color: showAuto ? "#FDAB3D" : "text.disabled",
              bgcolor: showAuto ? "rgba(253,171,61,0.08) !important" : "transparent !important",
              "&:hover": { bgcolor: "rgba(253,171,61,0.12) !important", color: "#FDAB3D" },
            }}
          >
            <BoltIcon sx={{ fontSize: 13 }} /> Auto
          </ToggleButton>
        </Tooltip>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search tasks, people, projects…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.3)" }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0.25 }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            ml: "auto", minWidth: 240,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5, fontSize: "0.8125rem", height: 32,
              "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
            },
          }}
        />

        <Typography sx={{ fontSize: "0.6875rem", color: "text.disabled", fontWeight: 600, whiteSpace: "nowrap", px: 0.5 }}>
          {filteredTasks.filter(t => t.task_kind !== 'subtask').length} / {tasks.filter(t => t.task_kind !== 'subtask').length}
        </Typography>
      </Paper>

      {/* ── Task Board ── */}
      <Paper elevation={0} sx={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: "rgba(255,255,255,0.01)",
      }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ mb: 3 }}>
                <Skeleton variant="rectangular" height={46} sx={{ borderRadius: 1.5, mb: 1 }} />
                {[1, 2, 3, 4].map(j => (
                  <Skeleton key={j} variant="rectangular" height={48} sx={{ mb: 0.375 }} />
                ))}
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
                : "No active tasks"
              }
            </Typography>
            <Typography sx={{ color: "text.disabled", fontSize: "0.8125rem" }}>
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
                contributors={contributors}
                onAssign={handleAssign}
                onNavigate={handleNavigateToTask}
                onToggle={handleToggle}
              />
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

