export class SubjectResponseDto {
    id: number;
    package_id: number;
    event_day_template_id: number;
    name: string;
    count: number | null;
    role_template_id?: number;
    role?: {
        id: number;
        role_name: string;
        description?: string;
        is_group: boolean;
    };
    created_at: Date;
    updated_at: Date;
}
