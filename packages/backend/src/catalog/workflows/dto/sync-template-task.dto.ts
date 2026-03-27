export class SyncTemplateTaskDto {
    task_library_id: number;
    phase?: string;
    override_hours?: number;
    override_assignee_role?: string;
    order_index?: number;
    is_required?: boolean;
}
