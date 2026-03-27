import { SubjectResponseDto } from './dto/subject-response.dto';
import { SceneSubjectResponseDto } from './dto/scene-subject-response.dto';
import { SubjectPriority } from '@prisma/client';

interface RoleTemplate {
    id: number;
    role_name: string;
    description: string | null;
    is_core: boolean;
    is_group: boolean;
}

interface SubjectWithRole {
    id: number;
    film_id: number;
    name: string;
    role_template_id: number | null;
    role_template: RoleTemplate | null;
    created_at: Date;
    updated_at: Date;
}

interface SceneSubjectWithSubject {
    id: number;
    scene_id?: number | null;
    moment_id?: number | null;
    subject_id: number;
    priority: SubjectPriority;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
    subject: SubjectWithRole;
}

function mapRole(role: RoleTemplate) {
    return {
        id: role.id,
        role_name: role.role_name,
        description: role.description ?? undefined,
        is_core: role.is_core,
        is_group: role.is_group,
    };
}

export function mapToSubjectResponse(subject: SubjectWithRole): SubjectResponseDto {
    return {
        id: subject.id,
        film_id: subject.film_id,
        name: subject.name,
        role_template_id: subject.role_template_id ?? undefined,
        role: subject.role_template ? mapRole(subject.role_template) : undefined,
        created_at: subject.created_at,
        updated_at: subject.updated_at,
    };
}

export function mapToSceneSubjectResponse(sceneSubject: SceneSubjectWithSubject): SceneSubjectResponseDto {
    return {
        id: sceneSubject.id,
        scene_id: sceneSubject.scene_id ?? null,
        moment_id: sceneSubject.moment_id ?? null,
        subject_id: sceneSubject.subject_id,
        priority: sceneSubject.priority,
        notes: sceneSubject.notes ?? null,
        created_at: sceneSubject.created_at,
        updated_at: sceneSubject.updated_at,
        subject: {
            id: sceneSubject.subject.id,
            film_id: sceneSubject.subject.film_id,
            name: sceneSubject.subject.name,
            role_template_id: sceneSubject.subject.role_template_id ?? null,
            role: sceneSubject.subject.role_template ? mapRole(sceneSubject.subject.role_template) : undefined,
            created_at: sceneSubject.subject.created_at,
            updated_at: sceneSubject.subject.updated_at,
        },
    };
}
