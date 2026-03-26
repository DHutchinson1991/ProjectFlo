// Transform backend tasks into frontend CalendarTask format
import { CalendarTask, TaskType } from '../types/calendar-types';
import type { BackendCalendarTask } from '../types/calendar-api.types';

const phaseToTaskType: Record<string, TaskType> = {
    Inquiry: 'client_work',
    Booking: 'admin',
    Production: 'production',
    Post_Production: 'post_production',
    Delivery: 'review',
};

export function transformBackendTasks(backendTasks: BackendCalendarTask[]): CalendarTask[] {
    return backendTasks
        .filter(t => t.due_date)
        .map(t => {
            const isCompleted = t.status === 'Completed';
            // Parse as local date to avoid timezone shift (UTC midnight → wrong local day)
            const [y, m, d] = t.due_date!.split('T')[0].split('-').map(Number);
            const dueDate = new Date(y, m - 1, d);
            const now = new Date();
            const isOverdue = !isCompleted && dueDate < now;

            return {
                id: `${t.source}-task-${t.id}`,
                title: t.name,
                description: t.context_label
                    ? `${t.context_label} · ${t.phase}`
                    : t.description ?? undefined,
                dueDate,
                completed: isCompleted,
                type: phaseToTaskType[t.phase] ?? 'other',
                priority: isOverdue ? 'high' : 'medium',
                assignee: t.assignee
                    ? { id: t.assignee.id.toString(), name: t.assignee.name, email: t.assignee.email, role: 'Contributor' }
                    : undefined,
                project: t.project_name
                    ? { id: (t.project_id ?? 0).toString(), name: t.project_name, color: '#6366f1', status: 'active' as const }
                    : undefined,
                estimatedHours: t.estimated_hours ?? undefined,
                tags: [t.source, t.phase],
                created_at: new Date(),
                updated_at: new Date(),
            };
        });
}
