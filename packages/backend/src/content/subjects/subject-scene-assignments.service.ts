import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSceneSubjectDto } from './dto/create-scene-subject.dto';
import { UpdateSceneSubjectDto } from './dto/update-scene-subject.dto';
import { mapToSceneSubjectResponse } from './subject.mapper';
import { SubjectPriority } from '@prisma/client';

@Injectable()
export class SubjectSceneAssignmentsService {
    constructor(private prisma: PrismaService) { }

    async getSceneSubjects(sceneId: number) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) throw new NotFoundException(`Scene with ID ${sceneId} not found`);

        const subjects = await this.prisma.filmSceneSubject.findMany({
            where: { scene_id: sceneId },
            include: { subject: { include: { role_template: true } } },
            orderBy: { created_at: 'asc' },
        });

        return subjects.map((s) => mapToSceneSubjectResponse(s));
    }

    async assignSubjectToScene(sceneId: number, dto: CreateSceneSubjectDto) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) throw new NotFoundException(`Scene with ID ${sceneId} not found`);

        const subject = await this.prisma.filmSubject.findUnique({ where: { id: dto.subject_id } });
        if (!subject) throw new NotFoundException(`Subject with ID ${dto.subject_id} not found`);

        if (subject.film_id !== scene.film_id) {
            throw new BadRequestException('Subject does not belong to the same film as this scene');
        }

        const sceneSubject = await this.prisma.filmSceneSubject.upsert({
            where: { scene_id_subject_id: { scene_id: sceneId, subject_id: dto.subject_id } },
            update: { priority: dto.priority ?? undefined, notes: dto.notes ?? undefined },
            create: {
                scene_id: sceneId,
                subject_id: dto.subject_id,
                priority: dto.priority ?? SubjectPriority.BACKGROUND,
                notes: dto.notes,
            },
            include: { subject: { include: { role_template: true } } },
        });

        return mapToSceneSubjectResponse(sceneSubject);
    }

    async updateSceneSubject(sceneId: number, subjectId: number, dto: UpdateSceneSubjectDto) {
        const sceneSubject = await this.prisma.filmSceneSubject.findUnique({
            where: { scene_id_subject_id: { scene_id: sceneId, subject_id: subjectId } },
        });
        if (!sceneSubject) throw new NotFoundException('Scene subject assignment not found');

        const updated = await this.prisma.filmSceneSubject.update({
            where: { id: sceneSubject.id },
            data: { priority: dto.priority ?? sceneSubject.priority, notes: dto.notes ?? sceneSubject.notes },
            include: { subject: { include: { role_template: true } } },
        });

        return mapToSceneSubjectResponse(updated);
    }

    async removeSubjectFromScene(sceneId: number, subjectId: number) {
        const sceneSubject = await this.prisma.filmSceneSubject.findUnique({
            where: { scene_id_subject_id: { scene_id: sceneId, subject_id: subjectId } },
            include: { scene: true },
        });
        if (!sceneSubject) throw new NotFoundException('Scene subject assignment not found');

        await this.prisma.filmSceneSubject.delete({ where: { id: sceneSubject.id } });

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
            ...sceneAssignments.map((assignment) => {
                const next = assignment.subject_ids.filter((id) => id !== subjectId);
                if (next.length === assignment.subject_ids.length) return null;
                return this.prisma.sceneCameraAssignment.update({
                    where: { id: assignment.id },
                    data: { subject_ids: next },
                });
            }),
            ...momentAssignments.map((assignment) => {
                const next = assignment.subject_ids.filter((id) => id !== subjectId);
                if (next.length === assignment.subject_ids.length) return null;
                return this.prisma.cameraSubjectAssignment.update({
                    where: { id: assignment.id },
                    data: { subject_ids: next },
                });
            }),
        ].filter((update): update is ReturnType<typeof this.prisma.sceneCameraAssignment.update> => !!update);

        if (updates.length) {
            await this.prisma.$transaction(updates);
        }

        return { message: 'Subject removed from scene' };
    }
}
