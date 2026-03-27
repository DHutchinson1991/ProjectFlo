import type { ActiveTask } from '@/features/workflow/tasks/types';
import { buildRenderItems } from '@/shared/utils/taskTree';

export { formatDueDate, getDateGroup } from '@/shared/utils/taskDates';

export { getInitials, avatarColor } from '@/shared/utils/avatar';

export function getNavigationUrl(task: ActiveTask): string | null {
    if (task.source === 'inquiry' && task.inquiry_id) {
        const base = `/inquiries/${task.inquiry_id}`;
        const subtaskSectionMap: Record<string, string> = {
            verify_contact_details: 'inquiry-wizard-section', verify_event_date: 'inquiry-wizard-section',
            confirm_package_selection: 'inquiry-wizard-section', check_crew_availability: 'availability-section',
            check_equipment_availability: 'availability-section', resolve_availability_conflicts: 'availability-section',
            send_crew_availability_requests: 'availability-section', reserve_equipment: 'availability-section',
            mark_inquiry_qualified: 'qualify-section', send_welcome_response: 'qualify-section',
        };
        if (task.task_kind === 'subtask' && task.subtask_key && subtaskSectionMap[task.subtask_key]) {
            return `${base}#${subtaskSectionMap[task.subtask_key]}`;
        }
        const n = (task.name + ' ' + (task.description ?? '')).toLowerCase();
        if (n.includes('review needs assessment')) return `${base}?open=inquiry-wizard`;
        if (n.includes('needs assessment') || n.includes('assessment form')) return `${base}/inquiry-wizard`;
        if (n.includes('package') && (n.includes('select') || n.includes('review') || n.includes('scope') || n.includes('present'))) return `${base}/package`;
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
    if (task.source === 'project' && task.project_id) return `/projects/${task.project_id}`;
    return null;
}

export type { TreeItem } from '@/shared/utils/taskTree';

/** @deprecated Use `buildRenderItems` from `@/shared/utils/taskTree` directly */
export function buildTaskTree(tasks: ActiveTask[]) {
    return buildRenderItems(tasks, { excludeSubtasks: true });
}
