"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { activeTasksApi } from "@/features/workflow/tasks/api";
import { ActiveTask } from "@/features/catalog/task-library/types";
import { useBrand } from "@/features/platform/brand";
import { isDateOverdue, isDateToday } from "@/shared/utils/taskDates";

// ── Page context parsing ──────────────────────────────────────
export type PageCtx =
  | { type: "hidden" }
  | { type: "inquiry"; id: number }
  | { type: "project"; id: number }
  | { type: "global" };

export function parseContext(pathname: string): PageCtx {
  if (/\/manager\/active-tasks/.test(pathname)) return { type: "hidden" };
  const inq = pathname.match(/\/sales\/inquiries\/(\d+)/);
  if (inq) return { type: "inquiry", id: Number(inq[1]) };
  const proj = pathname.match(/\/projects\/(\d+)/);
  if (proj) return { type: "project", id: Number(proj[1]) };
  return { type: "global" };
}

// ── Navigation URL (mirrors active-tasks page logic) ─────────
export function getNavUrl(task: ActiveTask): string | null {
  if (task.source === "inquiry" && task.inquiry_id) {
    const base = `/inquiries/${task.inquiry_id}`;
    const subtaskSectionMap: Record<string, string> = {
      verify_contact_details: "needs-assessment-section",
      verify_event_date: "needs-assessment-section",
      confirm_package_selection: "needs-assessment-section",
      check_crew_availability: "availability-section",
      check_equipment_availability: "availability-section",
      resolve_availability_conflicts: "availability-section",
      send_crew_availability_requests: "availability-section",
      reserve_equipment: "availability-section",
      mark_inquiry_qualified: "qualify-section",
      send_welcome_response: "qualify-section",
    };

    if (task.task_kind === "subtask" && task.subtask_key && subtaskSectionMap[task.subtask_key]) {
      return `${base}#${subtaskSectionMap[task.subtask_key]}`;
    }

    const n = (task.name + " " + (task.description ?? "")).toLowerCase();
    if (n.includes("review needs assessment")) return `${base}?open=needs-assessment`;
    if (n.includes("needs assessment") || n.includes("assessment form")) return `${base}/needs-assessment`;
    if (n.includes("package") && (n.includes("select") || n.includes("review") || n.includes("scope") || n.includes("present"))) return `${base}/package`;
    if (n.includes("contract") || n.includes("sign agreement")) return `${base}#contracts-section`;
    if (n.includes("proposal review") || n.includes("review proposal")) return `${base}#proposal-review-section`;
    if (n.includes("proposal")) return `${base}#proposals-section`;
    if (n.includes("availability") || n.includes("crew") || n.includes("equipment")) return `${base}#availability-section`;
    if (n.includes("qualify")) return `${base}#qualify-section`;
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

/** Timezone-aware overdue check. Pass brand timezone from useBrandTimezone(). */
export function isOverdue(task: ActiveTask, timezone = 'UTC') {
  return isDateOverdue(task.due_date, task.status, timezone);
}

export interface GlobalTaskDrawerState {
  // Data
  tasks: ActiveTask[];
  loading: boolean;
  ctx: PageCtx;
  contextLabel: string;
  // Derived slices
  contextTasks: ActiveTask[];
  visibleTasks: ActiveTask[];
  subtasksByParent: Map<number, ActiveTask[]>;
  // Stats (leaf tasks only — excludes subtasks)
  total: number;
  active: number;
  done: number;
  overdueCount: number;
  dueTodayCount: number;
  progress: number;
  autoHiddenCount: number;
  // Filter/view controls
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  groupByStage: boolean;
  setGroupByStage: React.Dispatch<React.SetStateAction<boolean>>;
  showAuto: boolean;
  setShowAuto: (v: boolean) => void;
  // Actions
  handleNavigate: (task: ActiveTask) => void;
  fetchTasks: () => Promise<void>;
}

export function useGlobalTaskDrawer(): GlobalTaskDrawerState {
  const pathname = usePathname();
  const router = useRouter();
  const { currentBrand } = useBrand();
  const timezone = currentBrand?.timezone ?? 'UTC';

  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [groupByStage, setGroupByStage] = useState(true);
  const [showAuto, setShowAutoState] = useState(() => {
    if (typeof window === "undefined") return true;
    const s = localStorage.getItem("pfo_drawer_show_auto");
    return s === null ? true : s === "true";
  });

  const setShowAuto = (v: boolean) => {
    setShowAutoState(v);
    localStorage.setItem("pfo_drawer_show_auto", String(v));
  };

  const ctx = useMemo(() => parseContext(pathname), [pathname]);

  // Collapse trigger — component listens to this via pathname directly
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activeTasksApi.getAll();
      setTasks(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ctx.type !== "hidden") fetchTasks();
  }, [ctx.type, fetchTasks]);

  const contextTasks = useMemo(() => {
    if (ctx.type === "hidden") return [];
    if (ctx.type === "inquiry") return tasks.filter((t) => t.source === "inquiry" && t.inquiry_id === ctx.id);
    if (ctx.type === "project") return tasks.filter((t) => t.source === "project" && t.project_id === ctx.id);
    return tasks;
  }, [tasks, ctx]);

  const autoHiddenCount = useMemo(() => {
    if (showAuto) return 0;
    let base = contextTasks;
    if (statusFilter === "active") base = base.filter((t) => t.status !== "Completed" && t.status !== "Archived");
    else if (statusFilter !== "all") base = base.filter((t) => t.status === statusFilter);
    return base.filter((t) => t.is_auto_only).length;
  }, [contextTasks, statusFilter, showAuto]);

  const visibleTasks = useMemo(() => {
    return contextTasks.filter((t) => {
      if (t.task_kind === "subtask") return true;
      if (statusFilter === "active" && (t.status === "Completed" || t.status === "Archived")) return false;
      if (statusFilter !== "active" && statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!showAuto && t.is_auto_only) return false;
      return true;
    });
  }, [contextTasks, statusFilter, showAuto]);

  const subtasksByParent = useMemo(() => {
    const map = new Map<number, ActiveTask[]>();
    visibleTasks.forEach((task) => {
      if (!task.subtask_parent_id) return;
      const list = map.get(task.subtask_parent_id) ?? [];
      list.push(task);
      map.set(task.subtask_parent_id, list);
    });
    return map;
  }, [visibleTasks]);

  // Stats (exclude subtasks from counts)
  const leafContext = contextTasks.filter((t) => t.task_kind !== "subtask");
  const total = leafContext.length;
  const active = leafContext.filter((t) => t.status !== "Completed" && t.status !== "Archived").length;
  const done = leafContext.filter((t) => t.status === "Completed").length;
  const overdueCount = leafContext.filter((t) => isOverdue(t, timezone)).length;
  const dueTodayCount = leafContext.filter((t) => isDateToday(t.due_date, timezone) && t.status !== 'Completed').length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  const contextLabel =
    ctx.type === "inquiry" || ctx.type === "project"
      ? contextTasks[0]?.context_label ?? (ctx.type === "inquiry" ? `Inquiry #${ctx.id}` : `Project #${ctx.id}`)
      : "All Active Tasks";

  const handleNavigate = (task: ActiveTask) => {
    const url = getNavUrl(task);
    if (url) router.push(url);
  };

  return {
    tasks,
    loading,
    ctx,
    contextLabel,
    contextTasks,
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
    fetchTasks,
  };
}
