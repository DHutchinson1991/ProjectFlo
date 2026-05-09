import { SubjectResponseDto } from './dto/subject-response.dto';
import { SceneSubjectResponseDto } from './dto/scene-subject-response.dto';
import { SubjectPriority } from '@prisma/client';

interface RoleTemplate {
    id: number;
    role_name: string;
    description: string | null;
    is_group: boolean;
}

interface SubjectWithRole {
    id: number;
    package_id: number;
    event_day_template_id: number;
    name: string;
    count: number | null;
    role_template_id: number | null;
    role_template: RoleTemplate | null;
    created_at: Date;
    updated_at: Date;
}

interface MomentSubjectWithSubject {
    id: number;
    moment_id: number;
    subject_id: number;
    priority: SubjectPriority;
    notes: string | null;
    action_description?: string | null;
    created_at: Date;
    updated_at: Date;
    subject: SubjectWithRole;
}

function mapRole(role: RoleTemplate) {
    return {
        id: role.id,
        role_name: role.role_name,
        description: role.description ?? undefined,
        is_group: role.is_group,
    };
}

export function mapToSubjectResponse(subject: SubjectWithRole): SubjectResponseDto {
    return {
        id: subject.id,
        package_id: subject.package_id,
        event_day_template_id: subject.event_day_template_id,
        name: subject.name,
        count: subject.count ?? null,
        role_template_id: subject.role_template_id ?? undefined,
        role: subject.role_template ? mapRole(subject.role_template) : undefined,
        created_at: subject.created_at,
        updated_at: subject.updated_at,
    };
}

export function mapToSceneSubjectResponse(ms: MomentSubjectWithSubject): SceneSubjectResponseDto {
    return {
        id: ms.id,
        scene_id: null,
        moment_id: ms.moment_id,
        subject_id: ms.subject_id,
        priority: ms.priority,
        notes: ms.notes ?? null,
        action_description: ms.action_description ?? null,
        created_at: ms.created_at,
        updated_at: ms.updated_at,
        subject: {
            id: ms.subject.id,
            package_id: ms.subject.package_id,
            name: ms.subject.name,
            role_template_id: ms.subject.role_template_id ?? null,
            role: ms.subject.role_template ? mapRole(ms.subject.role_template) : undefined,
            created_at: ms.subject.created_at,
            updated_at: ms.subject.updated_at,
        },
    };
}
