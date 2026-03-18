"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  CircularProgress,
  LinearProgress,
  Collapse,
} from "@mui/material";
import {
  KeyboardArrowUp as ExpandIcon,
  KeyboardArrowDown as CollapseIcon,
  Assignment as TaskIcon,
  FolderOpen as ProjectIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  OpenInNew as OpenFullIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ArrowForwardIos as NavArrowIcon,
  Person as PersonIcon,
  AccountTree as GroupIcon,
  ViewList as FlatListIcon,
  Bolt,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { ActiveTask, InquiryTaskEvent } from "@/lib/types";

// ── Page context parsing ──────────────────────────────────────
type PageCtx =
  | { type: "hidden" }
  | { type: "inquiry"; id: number }
  | { type: "project"; id: number }
  | { type: "global" };

function parseContext(pathname: string): PageCtx {
  if (/\/manager\/active-tasks/.test(pathname)) return { type: "hidden" };
  const inq = pathname.match(/\/sales\/inquiries\/(\d+)/);
  if (inq) return { type: "inquiry", id: Number(inq[1]) };
  const proj = pathname.match(/\/projects\/(\d+)/);
  if (proj) return { type: "project", id: Number(proj[1]) };
  return { type: "global" };
}

// ── Navigation URL (mirrors active-tasks page logic) ─────────
function getNavUrl(task: ActiveTask): string | null {
  if (task.source === "inquiry" && task.inquiry_id) {
    const base = `/sales/inquiries/${task.inquiry_id}`;
    const n = (task.name + " " + (task.description ?? "")).toLowerCase();
    if (n.includes("needs assessment") || n.includes("assessment form")) return `${base}/needs-assessment`;
    if (n.includes("package") && (n.includes("select") || n.includes("review") || n.includes("scope") || n.includes("present"))) return `${base}/package`;
    if (n.includes("contract") || n.includes("sign agreement")) return `${base}#contracts-section`;
    if (n.includes("proposal review") || n.includes("review proposal")) return `${base}#proposal-review-section`;
    if (n.includes("proposal")) return `${base}#proposals-section`;
    if (n.includes("quote")) return `${base}#quotes-section`;
    if (n.includes("estimate") || n.includes("budget")) return `${base}#estimates-section`;
    if (n.includes("discovery") || n.includes("questionnaire")) return `${base}#discovery-questionnaire-section`;
    if (n.includes("call") || n.includes("meeting") || n.includes("consultation")) return `${base}#calls-section`;
    if (n.includes("approval") || n.includes("client review")) return `${base}#approval-section`;
    return base;
  }
  if (task.source === "project" && task.project_id) return `/projects/${task.project_id}`;
  return null;
}

// ── Status config ─────────────────────────────────────────────
const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  To_Do:          { bg: "#C4C4C4", color: "#323338", label: "To Do" },
  Ready_to_Start: { bg: "#FDAB3D", color: "#fff",    label: "Ready" },
  In_Progress:    { bg: "#579BFC", color: "#fff",    label: "Working" },
  Completed:      { bg: "#00C875", color: "#fff",    label: "Done" },
  Archived:       { bg: "#888",    color: "#fff",    label: "Archived" },
};

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "To_Do", label: "To Do" },
  { key: "In_Progress", label: "Working" },
  { key: "Completed", label: "Done" },
  { key: "all", label: "All" },
];

// ── Helpers ───────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function avatarColor(name: string) {
  const colors = ["#0086C0", "#A25DDC", "#FF158A", "#FDAB3D", "#00C875", "#579BFC", "#FF5AC4", "#CAB641", "#7F5347", "#66CCFF"];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
function isOverdue(task: ActiveTask) {
  if (!task.due_date || task.status === "Completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
}
function formatDateShort(dateStr: string | null, isCompleted: boolean): { text: string; color: string } {
  if (!dateStr) return { text: "—", color: "rgba(255,255,255,0.2)" };
  if (isCompleted) return { text: new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: "rgba(255,255,255,0.3)" };
  const due = new Date(dateStr);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  const fmt = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diff < 0) return { text: `Overdue · ${fmt}`, color: "#D83A52" };
  if (diff === 0) return { text: "Today", color: "#FDAB3D" };
  if (diff === 1) return { text: "Tomorrow", color: "#FDAB3D" };
  return { text: fmt, color: "rgba(255,255,255,0.4)" };
}

// ── Drawer tree builder ──────────────────────────────────────────
type DrawerTreeItem =
  | { type: "stage"; stage: ActiveTask; children: ActiveTask[] }
  | { type: "task"; task: ActiveTask };

function buildDrawerTree(tasks: ActiveTask[]): DrawerTreeItem[] {
  const childrenByParent = new Map<number, ActiveTask[]>();
  tasks.forEach(t => {
    if (t.parent_task_id) {
      const arr = childrenByParent.get(t.parent_task_id) ?? [];
      arr.push(t);
      childrenByParent.set(t.parent_task_id, arr);
    }
  });
  const items: DrawerTreeItem[] = [];
  tasks.forEach(t => {
    if (t.parent_task_id) return;
    if (t.is_stage) {
      items.push({ type: "stage", stage: t, children: childrenByParent.get(t.id) ?? [] });
    } else {
      items.push({ type: "task", task: t });
    }
  });
  return items;
}

// ══════════════════════════════════════════════════════════════
// DrawerStageRow
// ══════════════════════════════════════════════════════════════
function DrawerStageRow({ stage, subtasks, onNavigate }: {
  stage: ActiveTask;
  subtasks: ActiveTask[];
  onNavigate: (task: ActiveTask) => void;
}) {
  const [open, setOpen] = useState(true);
  const stageColor = stage.stage_color || "#579BFC";
  const done = subtasks.filter(t => t.status === "Completed").length;
  const total = subtasks.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  return (
    <Box>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: "flex", alignItems: "center", gap: 1,
          height: 34, pl: 1.5, pr: 1.5,
          bgcolor: `${stageColor}0e`,
          borderLeft: `3px solid ${stageColor}`,
          borderBottom: "1px solid rgba(255,255,255,0.035)",
          cursor: "pointer",
          transition: "background 0.15s",
          "&:hover": { bgcolor: `${stageColor}18` },
        }}
      >
        <CollapseIcon sx={{
          fontSize: 14, color: stageColor, flexShrink: 0,
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.2s",
        }} />
        <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: stageColor }}>
          {stage.name}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{
          display: "inline-flex", alignItems: "center",
          px: 0.625, height: 18, borderRadius: "4px",
          bgcolor: `${stageColor}1a`, border: `1px solid ${stageColor}33`,
          flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: "0.5625rem", fontWeight: 800, color: stageColor }}>
            {done}/{total}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate" value={progress}
          sx={{
            ml: 0.75, width: 36, height: 2, borderRadius: 2, flexShrink: 0,
            bgcolor: "rgba(255,255,255,0.07)",
            "& .MuiLinearProgress-bar": { bgcolor: stageColor, borderRadius: 2 },
          }}
        />
      </Box>
      <Collapse in={open}>
        {subtasks.map(task => (
          <Box key={`${task.source}-${task.id}`} sx={{ pl: 1.5, borderLeft: `2px solid ${stageColor}33` }}>
            <DrawerTaskRow task={task} onNavigate={onNavigate} />
          </Box>
        ))}
      </Collapse>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// DrawerTaskRow
// ══════════════════════════════════════════════════════════════
function DrawerTaskRow({ task, onNavigate }: { task: ActiveTask; onNavigate: (task: ActiveTask) => void }) {
  const [hovered, setHovered] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [events, setEvents] = useState<InquiryTaskEvent[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const isCompleted = task.status === "Completed";
  const isAuto = task.is_auto_only ?? false;
  const overdue = isOverdue(task);
  const navUrl = getNavUrl(task);
  const cfg = STATUS_CFG[task.status] ?? STATUS_CFG.To_Do;
  const dateInfo = formatDateShort(task.due_date, isCompleted);
  const isProject = task.source === "project";
  const contextColor = isProject ? "#579BFC" : "#00C875";
  const canShowHistory = task.source === "inquiry" && task.inquiry_id != null;

  const handleToggleHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !eventsOpen;
    setEventsOpen(next);
    if (next && events === null) {
      try {
        setEventsLoading(true);
        const data = await api.inquiryTasks.getEvents(task.inquiry_id!, task.id);
        setEvents(data);
      } catch { /* ignore */ } finally {
        setEventsLoading(false);
      }
    }
  };

  return (
    <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.035)", "&:last-child": { borderBottom: "none" } }}>
      <Box
        onClick={() => navUrl && onNavigate(task)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          display: "grid",
          gridTemplateColumns: "36px 28px minmax(0,1fr) 72px 100px 28px 44px",
          alignItems: "center",
          minHeight: 40,
          px: 1.5,
          gap: 0.75,
          cursor: navUrl ? "pointer" : "default",
          transition: "background 0.12s",
          bgcolor: hovered && navUrl ? "rgba(87,155,252,0.04)" : "transparent",
          opacity: isAuto ? 0.45 : isCompleted ? 0.55 : 1,
        }}
      >
        {/* Context badge — shaped initials */}
        <Tooltip title={task.context_label} arrow placement="top">
          <Box sx={{
            width: 28, height: 28, borderRadius: isProject ? "7px" : "50%",
            bgcolor: `${contextColor}18`,
            border: `1.5px solid ${contextColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Typography sx={{
              fontSize: "0.5625rem", fontWeight: 800, color: contextColor,
              lineHeight: 1, letterSpacing: "0.02em",
            }}>
              {getInitials(task.context_label)}
            </Typography>
          </Box>
        </Tooltip>

        {/* Check icon */}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          {isAuto
            ? <Bolt sx={{ fontSize: 14, color: "#FDAB3D", opacity: 0.65 }} />
            : isCompleted
            ? <CheckCircleIcon sx={{ fontSize: 14, color: "#00C875" }} />
            : overdue
            ? <WarningIcon sx={{ fontSize: 14, color: "#D83A52" }} />
            : <UncheckedIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.18)" }} />
          }
        </Box>

        {/* Task name */}
        <Typography noWrap sx={{
          fontSize: "0.8rem", fontWeight: 500, lineHeight: 1,
          color: isAuto ? "rgba(255,255,255,0.35)" : isCompleted ? "text.secondary" : "text.primary",
          textDecoration: isCompleted ? "line-through" : "none",
          fontStyle: isAuto ? "italic" : "normal",
        }}>
          {task.name}
        </Typography>

        {/* Status pill */}
        <Box sx={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          bgcolor: isAuto ? "rgba(253,171,61,0.12)" : cfg.bg,
          color: isAuto ? "#FDAB3D" : cfg.color,
          fontWeight: 700, fontSize: "0.6rem",
          height: 20, px: 0.875, borderRadius: "5px", whiteSpace: "nowrap",
          border: isAuto ? "1px solid rgba(253,171,61,0.25)" : "none",
        }}>
          {isAuto ? "Auto" : cfg.label}
        </Box>

        {/* Due date */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden" }}>
          {!isCompleted && overdue
            ? <WarningIcon sx={{ fontSize: 11, color: "#D83A52", flexShrink: 0 }} />
            : <CalendarIcon sx={{ fontSize: 11, color: "rgba(255,255,255,0.18)", flexShrink: 0 }} />
          }
          <Typography noWrap sx={{ fontSize: "0.6875rem", color: dateInfo.color, fontWeight: overdue && !isCompleted ? 700 : 400 }}>
            {dateInfo.text}
          </Typography>
        </Box>

        {/* Assignee avatar */}
        {isAuto ? (
          <Box sx={{ width: 22, height: 22 }} />
        ) : task.assignee ? (
          <Tooltip title={task.assignee.name} arrow placement="top">
            <Avatar sx={{ width: 22, height: 22, fontSize: "0.5625rem", fontWeight: 800, bgcolor: avatarColor(task.assignee.name) }}>
              {getInitials(task.assignee.name)}
            </Avatar>
          </Tooltip>
        ) : (
          <Avatar sx={{ width: 22, height: 22, bgcolor: "transparent", border: "1.5px dashed rgba(255,255,255,0.12)" }}>
            <PersonIcon sx={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }} />
          </Avatar>
        )}

        {/* History toggle + Nav arrow */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.375 }}>
          {canShowHistory && (
            <Bolt
              onClick={handleToggleHistory}
              sx={{
                fontSize: 11, cursor: "pointer", flexShrink: 0,
                color: eventsOpen ? "#FDAB3D" : (hovered ? "rgba(253,171,61,0.45)" : "transparent"),
                transition: "color 0.15s",
              }}
            />
          )}
          <NavArrowIcon sx={{
            fontSize: 9, flexShrink: 0,
            color: hovered && navUrl ? "rgba(87,155,252,0.7)" : "transparent",
            transition: "color 0.15s",
          }} />
        </Box>
      </Box>

      {/* Event history */}
      <Collapse in={eventsOpen}>
        <Box sx={{ pl: 10, pr: 1.5, pb: 0.75, pt: 0.375, bgcolor: "rgba(0,0,0,0.18)" }}>
          {eventsLoading ? (
            <Typography sx={{ fontSize: "0.6rem", color: "text.disabled", py: 0.25 }}>Loading…</Typography>
          ) : !events || events.length === 0 ? (
            <Typography sx={{ fontSize: "0.6rem", color: "text.disabled", py: 0.25, fontStyle: "italic" }}>
              No events recorded
            </Typography>
          ) : (
            events.map(evt => (
              <Box key={evt.id} sx={{ display: "flex", alignItems: "center", gap: 0.75, py: 0.3 }}>
                <Bolt sx={{ fontSize: 10, color: "#FDAB3D", flexShrink: 0 }} />
                <Typography sx={{ fontSize: "0.6rem", flex: 1, color: "rgba(255,255,255,0.45)", lineHeight: 1.3 }}>
                  {evt.description}
                </Typography>
                <Typography sx={{ fontSize: "0.575rem", color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
                  {new Date(evt.occurred_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// GlobalTaskDrawer
// ══════════════════════════════════════════════════════════════
export default function GlobalTaskDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [groupByStage, setGroupByStage] = useState(true);
  const [hoverGroup, setHoverGroup] = useState(false);
  const [showAuto, setShowAuto] = useState(() => {
    if (typeof window === 'undefined') return true;
    const s = localStorage.getItem('pfo_drawer_show_auto');
    return s === null ? true : s === 'true';
  });

  const ctx = useMemo(() => parseContext(pathname), [pathname]);

  // Collapse when page changes
  useEffect(() => { setExpanded(false); }, [pathname]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.activeTasks.getAll();
      setTasks(data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ctx.type !== "hidden") fetchTasks();
  }, [ctx.type, fetchTasks]);

  // Filter to page context
  const contextTasks = useMemo(() => {
    if (ctx.type === "hidden") return [];
    if (ctx.type === "inquiry") return tasks.filter(t => t.source === "inquiry" && t.inquiry_id === ctx.id);
    if (ctx.type === "project") return tasks.filter(t => t.source === "project" && t.project_id === ctx.id);
    return tasks;
  }, [tasks, ctx]);

  // Status filter in expanded view
  const autoHiddenCount = useMemo(() => {
    if (showAuto) return 0;
    let base = contextTasks;
    if (statusFilter === "active") base = base.filter(t => t.status !== "Completed" && t.status !== "Archived");
    else if (statusFilter !== "all") base = base.filter(t => t.status === statusFilter);
    return base.filter(t => t.is_auto_only).length;
  }, [contextTasks, statusFilter, showAuto]);

  const visibleTasks = useMemo(() => {
    let result = contextTasks;
    if (statusFilter === "active") result = result.filter(t => t.status !== "Completed" && t.status !== "Archived");
    else if (statusFilter !== "all") result = result.filter(t => t.status === statusFilter);
    if (!showAuto) result = result.filter(t => !t.is_auto_only);
    return result;
  }, [contextTasks, statusFilter, showAuto]);

  if (ctx.type === "hidden") return null;

  // Stats
  const total = contextTasks.length;
  const active = contextTasks.filter(t => t.status !== "Completed" && t.status !== "Archived").length;
  const done = contextTasks.filter(t => t.status === "Completed").length;
  const overdueCount = contextTasks.filter(isOverdue).length;
  const dueTodayCount = contextTasks.filter(t => {
    if (!t.due_date || t.status === "Completed") return false;
    const due = new Date(t.due_date);
    const now = new Date();
    return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
  }).length;

  const progress = total > 0 ? (done / total) * 100 : 0;

  const contextLabel =
    ctx.type === "inquiry" || ctx.type === "project"
      ? contextTasks[0]?.context_label ?? (ctx.type === "inquiry" ? `Inquiry #${ctx.id}` : `Project #${ctx.id}`)
      : "All Active Tasks";



  const handleNavigate = (task: ActiveTask) => {
    const url = getNavUrl(task);
    if (url) router.push(url);
  };

  const PANEL_WIDTH = 800;
  const CLIPBOARD_WIDTH = 220;
  const CLIPBOARD_HEIGHT = 160;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        right: 160,
        zIndex: 1300,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        width: PANEL_WIDTH,
        pb: "18px",
      }}
    >
      {/* ── Clipboard shape (decorative, sits behind the bar) ── */}
      <Box
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={() => setHoverGroup(true)}
        onMouseLeave={() => setHoverGroup(false)}
        sx={{
          position: "absolute",
          bottom: 6,
          left: 30,
          width: CLIPBOARD_WIDTH,
          height: CLIPBOARD_HEIGHT,
          zIndex: 0,
          transform: hoverGroup ? "rotate(-3deg) scale(1.015)" : expanded ? "rotate(-4deg) translateY(40px)" : "rotate(-4deg)",
          transformOrigin: "bottom center",
          cursor: "pointer",
          opacity: expanded ? 0 : 1,
          transition: "transform 0.4s ease, opacity 0.3s ease",
          pointerEvents: expanded ? "none" : "auto",
        }}
      >
        {/* Metallic clip at top */}
        <Box className="clip-metal" sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 52,
          height: 16,
          borderRadius: "7px 7px 3px 3px",
          background: "linear-gradient(180deg, #9aa5b4 0%, #6b7a8d 40%, #4f5d6e 100%)",
          boxShadow: "0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 12px rgba(87,155,252,0.08)",
          zIndex: 2,
          transition: "background 0.3s ease",
          ...(hoverGroup && { background: "linear-gradient(180deg, #a0aec0 0%, #718096 40%, #5a6577 100%)" }),
        }} />
        {/* Clip inner highlight */}
        <Box sx={{
          position: "absolute",
          top: 3,
          left: "50%",
          transform: "translateX(-50%)",
          width: 34,
          height: 4,
          borderRadius: "2px",
          bgcolor: "rgba(255,255,255,0.18)",
          zIndex: 3,
        }} />

        {/* Clipboard body */}
        <Box
          className="clipboard-body"
          sx={{
            position: "absolute",
            top: 10,
            left: 0,
            right: 0,
            bottom: -24,
            borderRadius: "16px 16px 4px 4px",
            background: "linear-gradient(170deg, rgba(32,42,62,0.95) 0%, rgba(20,26,40,0.98) 100%)",
            border: overdueCount > 0
              ? "1px solid rgba(216,58,82,0.25)"
              : "1px solid rgba(100,150,220,0.16)",
            boxShadow: hoverGroup
              ? overdueCount > 0
                ? "0 -8px 40px rgba(216,58,82,0.18), 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)"
                : "0 -8px 40px rgba(87,155,252,0.12), 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)"
              : overdueCount > 0
                ? "0 -6px 32px rgba(216,58,82,0.15), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)"
                : "0 -6px 32px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
            borderColor: hoverGroup
              ? overdueCount > 0 ? "rgba(216,58,82,0.35)" : "rgba(120,160,220,0.25)"
              : overdueCount > 0 ? "rgba(216,58,82,0.25)" : "rgba(100,150,220,0.16)",
            overflow: "hidden",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            "@keyframes clipboard-pulse": {
              "0%, 100%": { boxShadow: "0 -6px 32px rgba(216,58,82,0.15), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" },
              "50%": { boxShadow: "0 -6px 40px rgba(216,58,82,0.3), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" },
            },
            ...(overdueCount > 0 && !expanded && { animation: "clipboard-pulse 2.5s ease-in-out infinite" }),
          }}
        >
          {/* Subtle edge glow at top */}
          <Box sx={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(87,155,252,0.2), transparent)",
          }} />

          {/* Faint ruled lines */}
          {[0, 1, 2, 3].map(i => (
            <Box key={i} sx={{
              position: "absolute",
              top: 44 + i * 20,
              left: 18,
              right: 18,
              height: "1px",
              bgcolor: "rgba(255,255,255,0.035)",
            }} />
          ))}

          {/* TASKS label */}
          <Typography sx={{
            position: "absolute",
            top: 22,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: "rgba(148,175,210,0.45)",
            textTransform: "uppercase",
            textShadow: "0 0 8px rgba(87,155,252,0.1)",
          }}>
            TASKS
          </Typography>
        </Box>
      </Box>

      {/* ── Expanded panel card ── */}
      {expanded && (
        <Box
          sx={{
            width: "100%",
            height: "clamp(280px, 42vh, 500px)",
            mb: 0.75,
            bgcolor: "#111318",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 2.5,
            boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1.25,
            px: 1.75, py: 1,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}>
            <Box sx={{
              width: 24, height: 24, borderRadius: "7px",
              bgcolor: ctx.type === "project" ? "rgba(87,155,252,0.15)" : "rgba(0,200,117,0.12)",
              border: `1px solid ${ctx.type === "project" ? "rgba(87,155,252,0.3)" : "rgba(0,200,117,0.25)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {ctx.type === "project"
                ? <ProjectIcon sx={{ fontSize: 13, color: "#579BFC" }} />
                : <TaskIcon sx={{ fontSize: 13, color: "#00C875" }} />
              }
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "-0.01em", flex: 1 }} noWrap>
              {contextLabel}
            </Typography>

            {/* Status filter tabs */}
            <Box sx={{ display: "flex", gap: 0.25 }}>
              {STATUS_TABS.map(tab => (
                <Box
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  sx={{
                    px: 0.875, py: 0.25, borderRadius: 1, cursor: "pointer",
                    fontSize: "0.625rem", fontWeight: 700, lineHeight: 1,
                    transition: "all 0.15s",
                    ...(statusFilter === tab.key
                      ? { bgcolor: "rgba(87,155,252,0.15)", color: "#579BFC", border: "1px solid rgba(87,155,252,0.3)" }
                      : { color: "text.disabled", border: "1px solid transparent", "&:hover": { color: "text.secondary" } }
                    ),
                  }}
                >
                  {tab.label}
                  {tab.key === "active" && active > 0 && (
                    <Box component="span" sx={{
                      ml: 0.375, px: 0.375, borderRadius: 0.75,
                      bgcolor: "rgba(87,155,252,0.18)", color: "#579BFC",
                      fontSize: "0.5625rem", fontWeight: 800,
                    }}>
                      {active}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>

            {/* Stage grouping toggle */}
            <Tooltip title={groupByStage ? "Show flat list" : "Group by stage"} arrow>
              <IconButton
                size="small"
                onClick={() => setGroupByStage(g => !g)}
                sx={{
                  width: 24, height: 24, borderRadius: 1,
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: groupByStage ? "#579BFC" : "text.secondary",
                  bgcolor: groupByStage ? "rgba(87,155,252,0.1)" : "transparent",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "text.primary" },
                }}
              >
                {groupByStage ? <GroupIcon sx={{ fontSize: 12 }} /> : <FlatListIcon sx={{ fontSize: 12 }} />}
              </IconButton>
            </Tooltip>

            {/* Auto tasks toggle */}
            {autoHiddenCount > 0 && (
              <Box sx={{
                display: "inline-flex", alignItems: "center", gap: 0.375,
                px: 0.75, height: 18, borderRadius: "4px",
                bgcolor: "rgba(253,171,61,0.1)", border: "1px solid rgba(253,171,61,0.2)",
              }}>
                <Bolt sx={{ fontSize: 9, color: "#FDAB3D" }} />
                <Typography sx={{ fontSize: "0.5rem", fontWeight: 700, color: "#FDAB3D" }}>
                  {autoHiddenCount}
                </Typography>
              </Box>
            )}
            <Tooltip title={showAuto ? "Hide automated tasks" : "Show automated tasks"} arrow>
              <IconButton
                size="small"
                onClick={() => {
                  const next = !showAuto;
                  setShowAuto(next);
                  localStorage.setItem('pfo_drawer_show_auto', String(next));
                }}
                sx={{
                  width: 24, height: 24, borderRadius: 1,
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: showAuto ? "#FDAB3D" : "text.disabled",
                  bgcolor: showAuto ? "rgba(253,171,61,0.1)" : "transparent",
                  "&:hover": { bgcolor: "rgba(253,171,61,0.12)", color: "#FDAB3D" },
                }}
              >
                <Bolt sx={{ fontSize: 12 }} />
              </IconButton>
            </Tooltip>

            {/* Open full page */}
            <Tooltip title="Open full tasks page" arrow>
              <IconButton
                size="small"
                onClick={() => router.push("/manager/active-tasks")}
                sx={{
                  ml: 0.25, width: 24, height: 24, borderRadius: 1,
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "text.secondary",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "text.primary" },
                }}
              >
                <OpenFullIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Task list */}
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                <CircularProgress size={22} thickness={4} />
              </Box>
            ) : visibleTasks.length === 0 ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography sx={{ color: "text.disabled", fontSize: "0.8125rem" }}>
                  {statusFilter === "active" ? "No active tasks" : "No tasks match this filter"}
                </Typography>
              </Box>
            ) : (
              groupByStage ? (
                buildDrawerTree(visibleTasks).map(item =>
                  item.type === "stage" ? (
                    <DrawerStageRow
                      key={`stage-${item.stage.source}-${item.stage.id}`}
                      stage={item.stage}
                      subtasks={item.children}
                      onNavigate={handleNavigate}
                    />
                  ) : (
                    <DrawerTaskRow
                      key={`${item.task.source}-${item.task.id}`}
                      task={item.task}
                      onNavigate={handleNavigate}
                    />
                  )
                )
              ) : (
                visibleTasks
                  .filter(t => !t.is_stage)
                  .map(task => (
                    <DrawerTaskRow
                      key={`${task.source}-${task.id}`}
                      task={task}
                      onNavigate={handleNavigate}
                    />
                  ))
              )
            )}
          </Box>
        </Box>
      )}

      {/* ── Floating pill trigger (sits in front of clipboard) ── */}
      <Box
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={() => setHoverGroup(true)}
        onMouseLeave={() => setHoverGroup(false)}
        sx={{
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 1,
          height: 42,
          minWidth: 460,
          pl: 0,
          pr: 1.5,
          borderRadius: "14px",
          bgcolor: "rgba(22,23,31,0.95)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 28px rgba(0,0,0,0.65), 0 0 0 1px rgba(87,155,252,0.12)",
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.2s ease",
          ...(hoverGroup && {
            borderColor: "rgba(255,255,255,0.22)",
            boxShadow: "0 6px 32px rgba(87,155,252,0.25), 0 0 0 1px rgba(87,155,252,0.2)",
            transform: "translateY(-1px)",
          }),
        }}
      >
        {/* Colored accent bar on left */}
        <Box sx={{
          width: 4, alignSelf: "stretch", flexShrink: 0,
          borderRadius: "14px 0 0 14px",
          bgcolor: ctx.type === "project" ? "#579BFC" : "#00C875",
        }} />

        {/* Context icon */}
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 26, height: 26, borderRadius: "8px", flexShrink: 0, ml: 0.5,
          bgcolor: ctx.type === "project" ? "rgba(87,155,252,0.15)" : "rgba(0,200,117,0.12)",
        }}>
          {ctx.type === "project"
            ? <ProjectIcon sx={{ fontSize: 13, color: "#579BFC" }} />
            : <TaskIcon sx={{ fontSize: 13, color: "#00C875" }} />
          }
        </Box>

        {/* Context name */}
        <Typography sx={{
          fontSize: "0.8125rem", fontWeight: 700, color: "text.primary", lineHeight: 1,
          maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {contextLabel}
        </Typography>

        {/* Separator */}
        <Box sx={{ width: "1px", height: 18, bgcolor: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

        {/* Stats */}
        {loading ? (
          <CircularProgress size={12} thickness={5} sx={{ color: "text.disabled" }} />
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.875 }}>
            {overdueCount > 0 && (
              <Typography sx={{ fontSize: "0.6875rem", color: "#D83A52", fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>
                {overdueCount} Overdue
              </Typography>
            )}
            {dueTodayCount > 0 && (
              <Typography sx={{ fontSize: "0.6875rem", color: "#FDAB3D", fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>
                {dueTodayCount} Due Today
              </Typography>
            )}
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 700, lineHeight: 1 }}>
              {done}/{total}
            </Typography>
          </Box>
        )}

        {/* Separator */}
        <Box sx={{ width: "1px", height: 18, bgcolor: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

        {/* Progress bar — fills remaining space */}
        <Box sx={{ flex: 1, minWidth: 60 }}>
          <LinearProgress
            variant="determinate" value={progress}
            sx={{
              height: 3.5, borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.08)",
              "& .MuiLinearProgress-bar": {
                bgcolor: progress === 100 ? "#00C875" : "#579BFC",
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {/* Chevron */}
        {expanded
          ? <CollapseIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
          : <ExpandIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
        }
      </Box>
    </Box>
  );
}
