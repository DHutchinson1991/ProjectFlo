'use client';

import { TaskDetailScreen } from '@/features/catalog/task-library';

export default function TaskEditPage({ params }: { params: { id: string } }) {
    return <TaskDetailScreen taskId={params.id} />;
}
