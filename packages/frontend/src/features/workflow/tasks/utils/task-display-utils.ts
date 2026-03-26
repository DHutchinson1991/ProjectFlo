import type { ActiveTask } from '@/lib/types';

export function formatDueDate(dateStr: string | null, isCompleted = false) {
    if (!dateStr) return { text: 'No date', color: '#676879', urgent: false };
    const due = new Date(dateStr);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays < 0) {
        if (isCompleted) return { text: formatted, color: '#676879', urgent: false };
        return { text: `Overdue · ${formatted}`, color: '#D83A52', urgent: true };
    }
    if (diffDays === 0) return { text: 'Today', color: isCompleted ? '#676879' : '#FDAB3D', urgent: !isCompleted };
    if (diffDays === 1) return { text: 'Tomorrow', color: '#FDAB3D', urgent: false };
    if (diffDays <= 7) return { text: formatted, color: '#579BFC', urgent: false };
    return { text: formatted, color: '#676879', urgent: false };
}

export function getDateGroup(dateStr: string | null): string {
    if (!dateStr) return 'No Due Date';
    const due = new Date(dateStr);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return 'This Week';
    if (diffDays <= 14) return 'Next Week';
    if (diffDays <= 30) return 'This Month';
    return 'Later';
}

export function getInitials(name: string) {
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function avatarColor(name: string) {
    const colors = ['#0086C0', '#A25DDC', '#FF158A', '#FDAB3D', '#00C875', '#579BFC', '#FF5AC4', '#CAB641', '#7F5347', '#66CCFF'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export function getNavigationUrl(task: ActiveTask): string | null {
    if (task.source === 'inquiry' && task.inquiry_id) {
        const base = `/sales/inquiries/${task.inquiry_id}`;
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

export type TreeItem =
    | { type: 'stage'; stage: ActiveTask; children: ActiveTask[] }
    | { type: 'task'; task: ActiveTask };

export function buildTaskTree(tasks: ActiveTask[]): TreeItem[] {
    const childrenByParent = new Map<number, ActiveTask[]>();
    tasks.forEach(task => {
        if (task.parent_task_id && task.task_kind !== 'subtask') {
            const arr = childrenByParent.get(task.parent_task_id) ?? [];
            arr.push(task); childrenByParent.set(task.parent_task_id, arr);
        }
    });
    const items: TreeItem[] = [];
    tasks.forEach(task => {
        if (task.parent_task_id || task.subtask_parent_id || task.task_kind === 'subtask') return;
        if (task.is_stage) items.push({ type: 'stage', stage: task, children: childrenByParent.get(task.id) ?? [] });
        else items.push({ type: 'task', task });
    });
    return items;
}
