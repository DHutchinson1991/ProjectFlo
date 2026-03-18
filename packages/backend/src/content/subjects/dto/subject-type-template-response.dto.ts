export class SubjectTypeTemplateResponseDto {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    category: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    roles: Array<{
        id: number;
        role_name: string;
        description?: string;
        is_core: boolean;
        is_group: boolean;
        order_index: number;
    }>;
}
