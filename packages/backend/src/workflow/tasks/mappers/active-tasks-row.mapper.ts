// Pure row-mapping functions for active-tasks queries.
// No DI — safely importable by the service.

export interface InquiryTaskRow {
    id: number;
    source: 'inquiry';
    task_kind: 'task' | 'subtask';
    subtask_key: string | null;
    inquiry_id: number | null;
    project_id: null;
    name: string;
    description: string | null;
    phase: string;
    status: string;
    due_date: Date | null;
    estimated_hours: number | null;
    actual_hours: null;
    completed_at: Date | null;
    context_label: string;
    project_name: null;
    event_date: Date | null;
    assignee: { id: number; name: string; email: string } | null;
    is_task_group: boolean;
    parent_task_id: number | null;
    is_auto_only: boolean;
    children_count: number;
    children_completed: number;
    priority: 'overdue' | null;
    subtask_parent_id: number | null;
    job_role: { id: number; name: string; display_name: string | null } | null;
}

export interface ProjectTaskRow {
    id: number;
    source: 'project';
    task_kind: 'task';
    subtask_key: null;
    inquiry_id: null;
    project_id: number | null;
    name: string;
    description: string | null;
    phase: string;
    status: string;
    due_date: Date | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    completed_at: null;
    context_label: string;
    project_name: string | null;
    event_date: Date | null;
    assignee: { id: number; name: string; email: string } | null;
    is_task_group: boolean;
    parent_task_id: null;
    is_auto_only: boolean;
    children_count: number;
    children_completed: number;
    priority: 'overdue' | null;
    subtask_parent_id: null;
    job_role: null;
}

export type ActiveTaskRow = InquiryTaskRow | ProjectTaskRow;

/** Map raw Prisma inquiry_tasks (with subtasks included) into unified rows. */
export function buildInquiryTaskRows(
    inquiryTasks: Parameters<typeof mapSingleInquiryTask>[0][],
    today: Date,
): InquiryTaskRow[] {
    return inquiryTasks.flatMap((task) => mapSingleInquiryTask(task, today));
}

type InquiryTaskWithRelations = {
    id: number;
    inquiry_id: number | null;
    name: string;
    description: string | null;
    phase: string;
    status: string;
    due_date: Date | null;
    estimated_hours: unknown;
    completed_at: Date | null;
    is_task_group: boolean;
    parent_inquiry_task_id: number | null;
    inquiry?: {
        id: number;
        wedding_date?: Date | null;
        status?: string;
        contact?: { first_name: string | null; last_name: string | null; email: string } | null;
    } | null;
    completed_by?: {
        id: number;
        contact?: { first_name: string | null; last_name: string | null; email: string } | null;
    } | null;
    assigned_to?: {
        id: number;
        contact?: { first_name: string | null; last_name: string | null; email: string } | null;
    } | null;
    task_library?: { is_auto_only: boolean } | null;
    children: { id: number; status: string }[];
    subtasks: {
        id: number;
        subtask_key: string | null;
        name: string;
        status: string;
        completed_at: Date | null;
        is_auto_only: boolean;
        completed_by?: {
            id: number;
            contact?: { first_name: string | null; last_name: string | null; email: string } | null;
        } | null;
        job_role?: { id: number; name: string; display_name: string | null } | null;
    }[];
};

function mapSingleInquiryTask(task: InquiryTaskWithRelations, today: Date): InquiryTaskRow[] {
    const contextLabel = task.inquiry?.contact
        ? `${task.inquiry.contact.first_name} ${task.inquiry.contact.last_name}`
        : `Inquiry #${task.inquiry_id}`;

    const baseAssignee = task.assigned_to?.contact
        ? {
            id: task.assigned_to.id,
            name: `${task.assigned_to.contact.first_name} ${task.assigned_to.contact.last_name}`.trim(),
            email: task.assigned_to.contact.email,
        }
        : task.completed_by?.contact
        ? {
            id: task.completed_by.id,
            name: `${task.completed_by.contact.first_name} ${task.completed_by.contact.last_name}`.trim(),
            email: task.completed_by.contact.email,
        }
        : null;

    const isOverdue = task.due_date && new Date(task.due_date) < today && task.status !== 'Completed';

    const taskRow: InquiryTaskRow = {
        id: task.id,
        source: 'inquiry',
        task_kind: 'task',
        subtask_key: null,
        inquiry_id: task.inquiry_id,
        project_id: null,
        name: task.name,
        description: task.description,
        phase: task.phase,
        status: task.status,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours ? Number(task.estimated_hours) : null,
        actual_hours: null,
        completed_at: task.completed_at,
        context_label: contextLabel,
        project_name: null,
        event_date: task.inquiry?.wedding_date ?? null,
        assignee: baseAssignee,
        is_task_group: task.is_task_group,
        parent_task_id: task.parent_inquiry_task_id,
        is_auto_only: task.task_library?.is_auto_only ?? false,
        children_count: task.subtasks.length > 0 ? task.subtasks.length : task.children.length,
        children_completed: task.subtasks.length > 0
            ? task.subtasks.filter((s) => s.status === 'Completed').length
            : task.children.filter((c) => c.status === 'Completed').length,
        priority: isOverdue ? 'overdue' : null,
        subtask_parent_id: null,
        job_role: null,
    };

    const subtaskRows: InquiryTaskRow[] = task.subtasks.map((subtask) => ({
        id: subtask.id,
        source: 'inquiry',
        task_kind: 'subtask',
        subtask_key: subtask.subtask_key,
        inquiry_id: task.inquiry_id,
        project_id: null,
        name: subtask.name,
        description: null,
        phase: task.phase,
        status: subtask.status,
        due_date: task.due_date,
        estimated_hours: null,
        actual_hours: null,
        completed_at: subtask.completed_at,
        context_label: contextLabel,
        project_name: null,
        event_date: task.inquiry?.wedding_date ?? null,
        assignee: subtask.completed_by?.contact
            ? {
                id: subtask.completed_by.id,
                name: `${subtask.completed_by.contact.first_name} ${subtask.completed_by.contact.last_name}`.trim(),
                email: subtask.completed_by.contact.email,
            }
            : baseAssignee,
        is_task_group: false,
        parent_task_id: task.parent_inquiry_task_id,
        is_auto_only: subtask.is_auto_only,
        children_count: 0,
        children_completed: 0,
        priority: isOverdue && subtask.status !== 'Completed' ? 'overdue' : null,
        subtask_parent_id: task.id,
        job_role: subtask.job_role ?? null,
    }));

    return [taskRow, ...subtaskRows];
}

/** Map raw Prisma project_tasks into unified rows. */
export function buildProjectTaskRows(
    projectTasks: ProjectTaskWithRelations[],
    today: Date,
): ProjectTaskRow[] {
    return projectTasks.map((task) => {
        const isOverdue = task.due_date && new Date(task.due_date) < today && task.status !== 'Completed';
        return {
            id: task.id,
            source: 'project',
            task_kind: 'task',
            subtask_key: null,
            inquiry_id: null,
            project_id: task.project_id,
            name: task.name,
            description: task.description,
            phase: task.phase,
            status: task.status,
            due_date: task.due_date,
            estimated_hours: task.estimated_hours ? Number(task.estimated_hours) : null,
            actual_hours: task.actual_hours ? Number(task.actual_hours) : null,
            completed_at: null,
            context_label: task.project?.project_name ?? `Project #${task.project_id}`,
            project_name: task.project?.project_name ?? null,
            event_date: task.project?.wedding_date ?? null,
            assignee: task.assigned_to?.contact
                ? {
                    id: task.assigned_to.id,
                    name: `${task.assigned_to.contact.first_name} ${task.assigned_to.contact.last_name}`.trim(),
                    email: task.assigned_to.contact.email,
                }
                : null,
            is_task_group: false,
            parent_task_id: null,
            is_auto_only: false,
            children_count: 0,
            children_completed: 0,
            priority: isOverdue ? 'overdue' : null,
            subtask_parent_id: null,
            job_role: null,
        };
    });
}

type ProjectTaskWithRelations = {
    id: number;
    project_id: number | null;
    name: string;
    description: string | null;
    phase: string;
    status: string;
    due_date: Date | null;
    estimated_hours: unknown;
    actual_hours: unknown;
    project?: { id: number; project_name: string | null; wedding_date?: Date | null } | null;
    assigned_to?: {
        id: number;
        contact?: { first_name: string | null; last_name: string | null; email: string } | null;
    } | null;
};
