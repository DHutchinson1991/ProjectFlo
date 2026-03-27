export class SubjectResponseDto {
    id: number;
    film_id: number;
    name: string;
    role_template_id?: number;
    role?: {
        id: number;
        role_name: string;
        description?: string;
        is_core: boolean;
        is_group: boolean;
    };
    created_at: Date;
    updated_at: Date;
}
