import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

/**
 * Scene-level subject assignments are now computed from moment assignments.
 * FilmSceneSubject table has been removed.
 * This service provides read-only helpers for scene-level subject queries.
 */
@Injectable()
export class SubjectSceneAssignmentsService {
    constructor(private prisma: PrismaService) { }

    /** Get distinct subjects assigned to any moment in this scene. */
    async getSceneSubjects(sceneId: number) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) throw new NotFoundException(`Scene with ID ${sceneId} not found`);

        const momentSubjects = await this.prisma.filmSceneMomentSubject.findMany({
            where: { moment: { film_scene_id: sceneId } },
            include: { subject: { include: { role_template: true } } },
            distinct: ['subject_id'],
            orderBy: { created_at: 'asc' },
        });

        return momentSubjects.map((ms) => ({
            id: ms.id,
            scene_id: sceneId,
            subject_id: ms.subject_id,
            priority: ms.priority,
            notes: ms.notes,
            subject: {
                id: ms.subject.id,
                package_id: ms.subject.package_id,
                name: ms.subject.name,
                role_template_id: ms.subject.role_template_id ?? null,
                role: ms.subject.role_template ? {
                    id: ms.subject.role_template.id,
                    role_name: ms.subject.role_template.role_name,
                    description: ms.subject.role_template.description ?? undefined,
                    is_group: ms.subject.role_template.is_group,
                } : undefined,
            },
        }));
    }

    /** Remove a subject from all moments in a scene + clean camera assignments. */
    async removeSubjectFromScene(sceneId: number, subjectId: number) {
        await this.prisma.filmSceneMomentSubject.deleteMany({
            where: { moment: { film_scene_id: sceneId }, subject_id: subjectId },
        });

        const [sceneAssignments, momentAssignments] = await this.prisma.$transaction([
            this.prisma.sceneCameraAssignment.findMany({
                where: { recording_setup: { scene_id: sceneId } },
                select: { id: true, subject_ids: true },
            }),
            this.prisma.cameraSubjectAssignment.findMany({
                where: { recording_setup: { moment: { film_scene_id: sceneId } } },
                select: { id: true, subject_ids: true },
            }),
        ]);

        const updates = [
            ...sceneAssignments.map((a) => {
                const next = a.subject_ids.filter((id) => id !== subjectId);
                if (next.length === a.subject_ids.length) return null;
                return this.prisma.sceneCameraAssignment.update({
                    where: { id: a.id }, data: { subject_ids: next },
                });
            }),
            ...momentAssignments.map((a) => {
                const next = a.subject_ids.filter((id) => id !== subjectId);
                if (next.length === a.subject_ids.length) return null;
                return this.prisma.cameraSubjectAssignment.update({
                    where: { id: a.id }, data: { subject_ids: next },
                });
            }),
        ].filter((u): u is ReturnType<typeof this.prisma.sceneCameraAssignment.update> => !!u);

        if (updates.length) await this.prisma.$transaction(updates);
        return { message: 'Subject removed from scene' };
    }
}
