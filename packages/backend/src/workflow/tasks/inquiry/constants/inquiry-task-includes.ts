// Shared Prisma include object for inquiry tasks queries.
// Extracted to avoid duplication across lifecycle + generator services.

export const TASK_INCLUDE = {
    task_library: {
        select: {
            id: true,
            name: true,
            effort_hours: true,
            trigger_type: true,
            is_task_group: true,
            parent_task_id: true,
            is_auto_only: true,
        },
    },
    completed_by: {
        select: {
            id: true,
            contact: { select: { first_name: true, last_name: true } },
        },
    },
    assigned_to: {
        select: {
            id: true,
            contact: { select: { first_name: true, last_name: true, email: true } },
        },
    },
    job_role: {
        select: { id: true, name: true, display_name: true },
    },
    subtasks: {
        orderBy: [{ order_index: 'asc' as const }],
        include: {
            completed_by: {
                select: {
                    id: true,
                    contact: { select: { first_name: true, last_name: true, email: true } },
                },
            },
            job_role: {
                select: { id: true, name: true, display_name: true },
            },
        },
    },
    children: {
        where: { is_active: true },
        orderBy: [{ order_index: 'asc' as const }],
        include: {
            task_library: {
                select: { id: true, name: true, effort_hours: true, trigger_type: true, is_auto_only: true },
            },
            completed_by: {
                select: {
                    id: true,
                    contact: { select: { first_name: true, last_name: true } },
                },
            },
            assigned_to: {
                select: {
                    id: true,
                    contact: { select: { first_name: true, last_name: true, email: true } },
                },
            },
            job_role: {
                select: { id: true, name: true, display_name: true },
            },
            subtasks: {
                orderBy: [{ order_index: 'asc' as const }],
                include: {
                    completed_by: {
                        select: {
                            id: true,
                            contact: { select: { first_name: true, last_name: true, email: true } },
                        },
                    },
                    job_role: {
                        select: { id: true, name: true, display_name: true },
                    },
                },
            },
        },
    },
};
