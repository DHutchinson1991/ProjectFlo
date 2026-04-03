"use client";

import React, { useState, useEffect } from "react";
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
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { ActiveTask } from "@/features/catalog/task-library/types";
import { inquiriesApi } from "@/features/workflow/inquiries/api";
import { InquiryTaskEvent } from "@/features/workflow/inquiries/types";
import { useGlobalTaskDrawer, getNavUrl, isOverdue } from "../hooks/useGlobalTaskDrawer";
import { useBrandTimezone } from "@/features/platform/brand";

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
import { getInitials, avatarColor } from '@/shared/utils/avatar';
function formatDateShort(dateStr: string | null, isCompleted: boolean, timezone = 'UTC'): { text: string; color: string } {
  if (!dateStr) return { text: "\u2014", color: "rgba(255,255,255,0.2)" };
  const due = new Date(dateStr);
  const fmt = due.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: timezone });
  if (isCompleted) return { text: fmt, color: "rgba(255,255,255,0.3)" };
  const dueUTC = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const diff = (dueUTC - Date.UTC(ty, tm - 1, td)) / 86400000;
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
  tasks.forEach((task) => {
    if (task.parent_task_id && task.task_kind !== 'subtask') {
      const arr = childrenByParent.get(task.parent_task_id) ?? [];
      arr.push(task);
      childrenByParent.set(task.parent_task_id, arr);
    }
  });

  const items: DrawerTreeItem[] = [];
  tasks.forEach((task) => {
    if (task.parent_task_id || task.subtask_parent_id || task.task_kind === 'subtask') {
      return;
    }
    if (task.is_task_group) {
      items.push({ type: "stage", stage: task, children: childrenByParent.get(task.id) ?? [] });
    } else {
      items.push({ type: "task", task });
    }
  });
  return items;
}

// ── Task-to-card glow mapping ────────────────────────────────
// Maps task names → section DOM IDs in the inquiry overview
const TASK_SECTION_MAP: Record<string, string> = {
  // ── Inquiry stage ──
  'Review Inquiry': 'needs-assessment-section',
  'Verify Contact Details': 'contact-info-section',
  'Verify Event Date': 'needs-assessment-section',
  'Confirm Package Selection': 'package-scope-section',
  'Check Crew Availability': 'availability-section',
  'Check Equipment Availability': 'availability-section',
  'Resolve Availability Conflicts': 'availability-section',
  'Send Availability Requests': 'availability-section',
  'Reserve Equipment': 'availability-section',
  // ── Qualify & Respond stage ──
  'Qualify & Respond': 'qualify-respond-section',
  'Review Estimate': 'estimates-section',
  'Schedule Discovery Call': 'calls-section',
  'Qualify Inquiry': 'qualify-respond-section',
  'Send Welcome Response': 'qualify-respond-section',
  'Qualify': 'qualify-respond-section',
  'Send Welcome': 'qualify-respond-section',
  // ── Discovery stage ──
  'Discovery Call': 'discovery-questionnaire-section',
  // ── Estimates ──
  'Estimate Preparation': 'estimates-section',
  // ── Proposal stage ──
  'Generate Quote': 'quotes-section',
  'Prepare Contract': 'contracts-section',
  'Create & Review Proposal': 'proposals-section',
  'Send Proposal': 'proposals-section',
  'Contract Sent': 'contracts-section',
  // ── Booking stage ──
  'Contract Signed': 'contracts-section',
  'Raise Deposit Invoice': 'contracts-section',
  'Block Wedding Date': 'qualify-respond-section',
  'Confirm Booking': 'qualify-respond-section',
  'Send Welcome Pack': 'qualify-respond-section',
};

// Maps stage (task group) names → section DOM IDs
const STAGE_SECTION_MAP: Record<string, string> = {
  'Inquiry': 'needs-assessment-section',
  'Review Inquiry': 'needs-assessment-section',
  'Qualify & Respond': 'qualify-respond-section',
  'Discovery': 'calls-section',
  'Discovery Call': 'calls-section',
  'Proposal': 'proposals-section',
  'Proposals': 'proposals-section',
  'Proposal Review': 'proposals-section',
  'Client Approval': 'proposals-section',
  'Contracts': 'contracts-section',
  'Booking': 'qualify-respond-section',
};

function getSectionIdForTask(taskName: string, stageName?: string): string | null {
  // Direct task name lookup first
  if (TASK_SECTION_MAP[taskName]) return TASK_SECTION_MAP[taskName];
  // Derive from parent stage name
  if (stageName && STAGE_SECTION_MAP[stageName]) return STAGE_SECTION_MAP[stageName];
  return null;
}

function getGlowColor(status: string): string {
  if (status === 'Completed') return 'rgba(148, 163, 184, 0.35)'; // silver
  if (status === 'To_Do' || status === 'Ready_to_Start') return 'rgba(16, 185, 129, 0.4)'; // green
  return 'rgba(220, 60, 80, 0.35)'; // reddish for In_Progress, overdue, etc.
}

function setCardGlow(sectionId: string, color: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.setAttribute('data-task-glow', color);
    el.style.setProperty('--task-glow-color', color);
  }
}

function clearCardGlow(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.removeAttribute('data-task-glow');
    el.style.removeProperty('--task-glow-color');
  }
}

// ══════════════════════════════════════════════════════════════
// DrawerTaskGroupRow
// ══════════════════════════════════════════════════════════════
function DrawerTaskGroupRow({ stage, subtasks, onNavigate, subtasksByParent }: {
  stage: ActiveTask;
  subtasks: ActiveTask[];
  onNavigate: (task: ActiveTask) => void;
  subtasksByParent: Map<number, ActiveTask[]>;
}) {
  const [open, setOpen] = useState(true);
  const color = "#579BFC";
  const done = subtasks.filter(t => t.status === "Completed").length;
  const total = subtasks.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  // Stage-level glow on hover
  const stageGlowRef = React.useRef<string | null>(null);
  const handleStageEnter = () => {
    const sid = STAGE_SECTION_MAP[stage.name];
    if (sid) {
      stageGlowRef.current = sid;
      const stageColor = done === total ? 'rgba(148, 163, 184, 0.35)' : 'rgba(87, 155, 252, 0.35)';
      setCardGlow(sid, stageColor);
    }
  };
  const handleStageLeave = () => {
    if (stageGlowRef.current) {
      clearCardGlow(stageGlowRef.current);
      stageGlowRef.current = null;
    }
  };

  return (
    <Box>
      <Box
        onClick={() => setOpen(!open)}
        onMouseEnter={handleStageEnter}
        onMouseLeave={handleStageLeave}
        sx={{
          display: "flex", alignItems: "center", gap: 1,
          height: 34, pl: 1.5, pr: 1.5,
          bgcolor: `${color}0e`,
          borderLeft: `3px solid ${color}`,
          borderBottom: "1px solid rgba(255,255,255,0.035)",
          cursor: "pointer",
          transition: "background 0.15s",
          "&:hover": { bgcolor: `${color}18` },
        }}
      >
        <CollapseIcon sx={{
          fontSize: 14, color: color, flexShrink: 0,
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.2s",
        }} />
        <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: color }}>
          {stage.name}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{
          display: "inline-flex", alignItems: "center",
          px: 0.625, height: 18, borderRadius: "4px",
          bgcolor: `${color}1a`, border: `1px solid ${color}33`,
          flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: "0.5625rem", fontWeight: 800, color: color }}>
            {done}/{total}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate" value={progress}
          sx={{
            ml: 0.75, width: 36, height: 2, borderRadius: 2, flexShrink: 0,
            bgcolor: "rgba(255,255,255,0.07)",
            "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 2 },
          }}
        />
      </Box>
      <Collapse in={open}>
        {subtasks.map(task => (
          <Box key={`${task.source}-${task.id}`} sx={{ borderLeft: `2px solid ${color}33` }}>
            <DrawerTaskRow task={task} subtasks={subtasksByParent.get(task.id) ?? []} onNavigate={onNavigate} stageName={stage.name} />
          </Box>
        ))}
      </Collapse>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════
// DrawerTaskRow
// ══════════════════════════════════════════════════════════════
function DrawerTaskRow({ task, onNavigate, subtasks = [], nested = false, stageName }: { task: ActiveTask; onNavigate: (task: ActiveTask) => void; subtasks?: ActiveTask[]; nested?: boolean; stageName?: string }) {
  const [hovered, setHovered] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [events, setEvents] = useState<InquiryTaskEvent[] | null>(null);
  const timezone = useBrandTimezone();
  const [eventsLoading, setEventsLoading] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const isCompleted = task.status === "Completed";
  const isAuto = task.is_auto_only ?? false;

  // Card glow on hover
  const glowSectionRef = React.useRef<string | null>(null);
  const handleRowEnter = () => {
    setHovered(true);
    const sid = getSectionIdForTask(task.name, stageName);
    if (sid) {
      glowSectionRef.current = sid;
      setCardGlow(sid, getGlowColor(task.status));
    }
  };
  const handleRowLeave = () => {
    setHovered(false);
    if (glowSectionRef.current) {
      clearCardGlow(glowSectionRef.current);
      glowSectionRef.current = null;
    }
  };
  const overdue = isOverdue(task, timezone);
  const navUrl = getNavUrl(task);
  const cfg = STATUS_CFG[task.status] ?? STATUS_CFG.To_Do;
  const dateInfo = formatDateShort(task.due_date, isCompleted, timezone);
  const isProject = task.source === "project";
  const contextColor = isProject ? "#579BFC" : "#00C875";
  const canShowHistory = task.source === "inquiry" && task.inquiry_id != null && task.task_kind !== 'subtask';
  const completedSubtasks = subtasks.filter((subtask) => subtask.status === 'Completed').length;
  // Same 8-column grid for both nested and non-nested — prevents overflow bug
  const GRID = "20px 28px 22px minmax(0,1fr) 72px 100px 28px 34px";

  const handleToggleHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !eventsOpen;
    setEventsOpen(next);
    if (next && events === null) {
      try {
        setEventsLoading(true);
        const data = await inquiriesApi.inquiryTasks.getEvents(task.inquiry_id!, task.id);
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
        onMouseEnter={handleRowEnter}
        onMouseLeave={handleRowLeave}
        sx={{
          display: "grid",
          gridTemplateColumns: GRID,
          alignItems: "center",
          minHeight: nested ? 40 : 46,
          pl: nested ? 2.5 : 1,
          pr: 1.5,
          gap: 0.75,
          cursor: navUrl ? "pointer" : "default",
          transition: "background 0.12s",
          bgcolor: hovered && navUrl ? "rgba(87,155,252,0.04)" : "transparent",
          opacity: isAuto ? (isCompleted ? 0.55 : 0.45) : isCompleted ? 0.55 : 1,
        }}
      >
        {/* Col 1: Chevron (non-nested with subtasks) / L-bracket (nested) / empty */}
        {nested ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box sx={{ width: 10, height: 10, borderLeft: '1.5px solid rgba(255,255,255,0.15)', borderBottom: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '0 0 0 2px' }} />
          </Box>
        ) : (
          <Box
            onClick={subtasks.length > 0 ? (e) => { e.stopPropagation(); setSubtasksOpen(o => !o); } : undefined}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: subtasks.length > 0 ? 'pointer' : 'default',
              height: '100%', borderRadius: '3px', transition: 'background 0.12s',
              '&:hover': subtasks.length > 0 ? { bgcolor: 'rgba(255,255,255,0.07)' } : {},
            }}
          >
            {subtasks.length > 0 && (
              <ExpandMoreIcon sx={{ fontSize: 15, color: '#94a3b8', transform: subtasksOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
            )}
          </Box>
        )}

        {/* Col 2: Context badge */}
        <Tooltip title={task.context_label} arrow placement="top">
          <Box sx={{
            width: 26, height: 26, borderRadius: isProject ? "6px" : "50%",
            bgcolor: `${contextColor}18`,
            border: `1.5px solid ${contextColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Typography sx={{ fontSize: "0.5rem", fontWeight: 800, color: contextColor, lineHeight: 1, letterSpacing: "0.02em" }}>
              {getInitials(task.context_label)}
            </Typography>
          </Box>
        </Tooltip>

        {/* Col 3: Check / bolt / warning icon */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isAuto
            ? <Bolt sx={{ fontSize: 14, color: isCompleted ? "#00C875" : "#FDAB3D", opacity: isCompleted ? 0.85 : 0.65 }} />
            : isCompleted
            ? <CheckCircleIcon sx={{ fontSize: 14, color: "#00C875" }} />
            : overdue
            ? <WarningIcon sx={{ fontSize: 14, color: "#D83A52" }} />
            : <UncheckedIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }} />}
        </Box>

        {/* Col 4: Task name + description + subtask count */}
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{
            fontSize: "0.8125rem", fontWeight: 500, lineHeight: 1.2,
            color: isAuto ? "rgba(255,255,255,0.35)" : isCompleted ? "text.secondary" : "text.primary",
            textDecoration: isCompleted ? "line-through" : "none",
            fontStyle: isAuto ? "italic" : "normal",
          }}>
            {task.name}
          </Typography>
          {task.description && !nested && (
            <Typography noWrap sx={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.28)", lineHeight: 1.25, mt: 0.15 }}>
              {task.description}
            </Typography>
          )}
          {!nested && subtasks.length > 0 && (
            <Typography sx={{ fontSize: '0.6rem', color: subtasksOpen ? '#579BFC' : '#64748b', fontWeight: 600, lineHeight: 1, mt: 0.2, transition: 'color 0.15s' }}>
              {completedSubtasks}/{subtasks.length} subtasks
            </Typography>
          )}
        </Box>

        {/* Col 5: Status pill */}
        <Box sx={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          bgcolor: isAuto ? (isCompleted ? "rgba(0,200,117,0.12)" : "rgba(253,171,61,0.12)") : cfg.bg,
          color: isAuto ? (isCompleted ? "#00C875" : "#FDAB3D") : cfg.color,
          fontWeight: 700, fontSize: "0.6rem",
          height: 20, px: 0.875, borderRadius: "5px", whiteSpace: "nowrap",
          border: isAuto ? (isCompleted ? "1px solid rgba(0,200,117,0.25)" : "1px solid rgba(253,171,61,0.25)") : "none",
        }}>
          {isAuto ? "Auto" : cfg.label}
        </Box>

        {/* Col 6: Due date */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden" }}>
          {!isCompleted && overdue
            ? <WarningIcon sx={{ fontSize: 11, color: "#D83A52", flexShrink: 0 }} />
            : <CalendarIcon sx={{ fontSize: 11, color: "rgba(255,255,255,0.18)", flexShrink: 0 }} />}
          <Typography noWrap sx={{ fontSize: "0.6875rem", color: dateInfo.color, fontWeight: overdue && !isCompleted ? 700 : 400 }}>
            {dateInfo.text}
          </Typography>
        </Box>

        {/* Col 7: Avatar */}
        {isAuto ? (
          <Box sx={{ width: 26, height: 26 }} />
        ) : task.assignee ? (
          <Tooltip title={task.assignee.name} arrow placement="top">
            <Avatar sx={{ width: 26, height: 26, fontSize: "0.5625rem", fontWeight: 800, bgcolor: avatarColor(task.assignee.name) }}>
              {getInitials(task.assignee.name)}
            </Avatar>
          </Tooltip>
        ) : (
          <Avatar sx={{ width: 26, height: 26, bgcolor: "transparent", border: "1.5px dashed rgba(255,255,255,0.12)" }}>
            <PersonIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }} />
          </Avatar>
        )}

        {/* Col 8: History + nav */}
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
          <NavArrowIcon sx={{ fontSize: 9, flexShrink: 0, color: hovered && navUrl ? "rgba(87,155,252,0.7)" : "transparent", transition: "color 0.15s" }} />
        </Box>
      </Box>

      <Collapse in={subtasksOpen}>
        {subtasks.map((subtask) => (
          <DrawerTaskRow key={`${subtask.source}-${subtask.id}`} task={subtask} onNavigate={onNavigate} nested stageName={stageName} />
        ))}
      </Collapse>

      <Collapse in={eventsOpen}>
        <Box sx={{ pl: 9.5, pr: 1.5, pb: 0.75, pt: 0.375, bgcolor: "rgba(0,0,0,0.18)" }}>
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
  const [hoverGroup, setHoverGroup] = useState(false);

  const {
    loading,
    ctx,
    contextLabel,
    visibleTasks,
    subtasksByParent,
    total,
    active,
    done,
    overdueCount,
    dueTodayCount,
    progress,
    autoHiddenCount,
    statusFilter,
    setStatusFilter,
    groupByStage,
    setGroupByStage,
    showAuto,
    setShowAuto,
    handleNavigate,
  } = useGlobalTaskDrawer();

  // Collapse when page changes
  useEffect(() => { setExpanded(false); }, [pathname]);

  if (ctx.type === "hidden") return null;

  const PANEL_WIDTH = 920;
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
      {/* Global style for task-to-card glow */}
      <style>{`
        [data-task-glow] > .MuiCard-root,
        [data-task-glow] > .MuiBox-root {
          box-shadow: 0 0 24px var(--task-glow-color, transparent),
                      0 0 48px var(--task-glow-color, transparent),
                      0 2px 12px rgba(0,0,0,0.15) !important;
          border-color: var(--task-glow-color, rgba(52,58,68,0.2)) !important;
          transition: box-shadow 0.3s ease, border-color 0.3s ease !important;
        }
        #contact-info-section[data-task-glow] {
          background: color-mix(in srgb, var(--task-glow-color, transparent) 8%, transparent);
          border-radius: 12px;
          transition: background 0.3s ease !important;
        }
      `}</style>
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
            height: "clamp(360px, 52vh, 620px)",
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
                onClick={() => setShowAuto(!showAuto)}
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
                onClick={() => router.push("/tasks")}
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
                    <DrawerTaskGroupRow
                      key={`stage-${item.stage.source}-${item.stage.id}`}
                      stage={item.stage}
                      subtasks={item.children}
                      subtasksByParent={subtasksByParent}
                      onNavigate={handleNavigate}
                    />
                  ) : (
                    <DrawerTaskRow
                      key={`${item.task.source}-${item.task.id}`}
                      task={item.task}
                      subtasks={subtasksByParent.get(item.task.id) ?? []}
                      onNavigate={handleNavigate}
                    />
                  )
                )
              ) : (
                visibleTasks
                  .filter(t => !t.is_task_group && !t.subtask_parent_id && t.task_kind !== 'subtask')
                  .map(task => (
                    <DrawerTaskRow
                      key={`${task.source}-${task.id}`}
                      task={task}
                      subtasks={subtasksByParent.get(task.id) ?? []}
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
