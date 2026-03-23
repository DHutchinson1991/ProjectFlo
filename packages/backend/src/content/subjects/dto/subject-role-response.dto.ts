export class SubjectRoleResponseDto {
    id: number;
    brand_id: number;
    role_name: string;
    description?: string;
    is_core: boolean;
    is_group: boolean;
    never_group: boolean;
    order_index: number;
    created_at: Date;
    updated_at: Date;
}
