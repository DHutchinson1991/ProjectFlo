import { SubjectPriority } from "@prisma/client";

export class SceneSubjectResponseDto {
    id: number;
    scene_id?: number | null;
    moment_id?: number | null;
    subject_id: number;
    priority: SubjectPriority;
    notes?: string | null;
    action_description?: string | null;
    created_at: Date;
    updated_at: Date;
    subject: {
        id: number;
        package_id: number;
        name: string;
        role_template_id?: number | null;
        role?: {
            id: number;
            role_name: string;
            description?: string;
            is_group: boolean;
        };
        created_at: Date;
        updated_at: Date;
    };
}
