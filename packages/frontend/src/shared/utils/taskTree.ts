/**
 * Generic stage/task tree builder — groups stages with their children,
 * then appends flat (non-stage, non-child) tasks.
 */

/** Minimal shape a task must satisfy */
export interface TreeableTask {
    id: number;
    is_task_group?: boolean;
    parent_task_id?: number | null;
    children?: TreeableTask[];
    /** If present and === 'subtask', the task is excluded from the tree */
    task_kind?: string;
    subtask_parent_id?: number | null;
}

export type TreeStageItem<T> = { type: 'stage'; stage: T; children: T[] };
export type TreeTaskItem<T> = { type: 'task'; task: T; isChild: boolean };
export type TreeItem<T> = TreeStageItem<T> | TreeTaskItem<T>;

export interface BuildTreeOptions {
    /** Exclude subtasks from the tree (default: false) */
    excludeSubtasks?: boolean;
}

/**
 * Build an ordered render list: stages with their children, then flat tasks.
 * Works with both ActiveTask and TaskLibrary types.
 */
export function buildRenderItems<T extends TreeableTask>(
    tasks: T[],
    options: BuildTreeOptions = {},
): TreeItem<T>[] {
    const { excludeSubtasks = false } = options;

    const stageParents = tasks.filter(t => t.is_task_group);
    const childTaskIds = new Set<number>();

    // Collect children IDs from pre-populated children arrays
    for (const stage of stageParents) {
        if (stage.children) {
            for (const child of stage.children) childTaskIds.add(child.id);
        }
    }
    // Collect children IDs from parent_task_id references
    for (const t of tasks) {
        if (t.parent_task_id) childTaskIds.add(t.id);
    }

    const items: TreeItem<T>[] = [];

    // Stages with their children
    for (const stage of stageParents) {
        const children = (stage.children as T[] | undefined) ?? tasks.filter(t => t.parent_task_id === stage.id);
        items.push({ type: 'stage', stage, children });
        for (const child of children) {
            items.push({ type: 'task', task: child, isChild: true });
        }
    }

    // Flat tasks (not a stage, not a child, optionally not a subtask)
    for (const t of tasks) {
        if (t.is_task_group) continue;
        if (childTaskIds.has(t.id)) continue;
        if (excludeSubtasks && (t.task_kind === 'subtask' || t.subtask_parent_id)) continue;
        items.push({ type: 'task', task: t, isChild: false });
    }

    return items;
}
