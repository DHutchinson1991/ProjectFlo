import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSceneSubjectDto } from './dto/create-scene-subject.dto';
import { UpdateSceneSubjectDto } from './dto/update-scene-subject.dto';
import { mapToSceneSubjectResponse } from './subject.mapper';
import { SubjectPriority } from '@prisma/client';

@Injectable()
export class SubjectMomentAssignmentsService {
    constructor(private prisma: PrismaService) { }

    async getMomentSubjects(momentId: number) {
        const moment = await this.prisma.sceneMoment.findUnique({ where: { id: momentId } });
        if (!moment) throw new NotFoundException(`Moment with ID ${momentId} not found`);

        const subjects = await this.prisma.filmSceneMomentSubject.findMany({
            where: { moment_id: momentId },
            include: { subject: { include: { role_template: true } } },
            orderBy: { created_at: 'asc' },
        });

        return subjects.map((s) => mapToSceneSubjectResponse(s));
    }

    async assignSubjectToMoment(momentId: number, dto: CreateSceneSubjectDto) {
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id: momentId },
            include: { film_scene: true },
        });
        if (!moment) throw new NotFoundException(`Moment with ID ${momentId} not found`);

        const subject = await this.prisma.filmSubject.findUnique({ where: { id: dto.subject_id } });
        if (!subject) throw new NotFoundException(`Subject with ID ${dto.subject_id} not found`);

        if (subject.film_id !== moment.film_scene.film_id) {
            throw new BadRequestException('Subject does not belong to the same film as this moment');
        }

        const momentSubject = await this.prisma.filmSceneMomentSubject.upsert({
            where: { moment_id_subject_id: { moment_id: momentId, subject_id: dto.subject_id } },
            update: { priority: dto.priority ?? undefined, notes: dto.notes ?? undefined },
            create: {
                moment_id: momentId,
                subject_id: dto.subject_id,
                priority: dto.priority ?? SubjectPriority.BACKGROUND,
                notes: dto.notes,
            },
            include: { subject: { include: { role_template: true } } },
        });

        return mapToSceneSubjectResponse(momentSubject);
    }

    async updateMomentSubject(momentId: number, subjectId: number, dto: UpdateSceneSubjectDto) {
        const momentSubject = await this.prisma.filmSceneMomentSubject.findUnique({
            where: { moment_id_subject_id: { moment_id: momentId, subject_id: subjectId } },
        });
        if (!momentSubject) throw new NotFoundException('Moment subject assignment not found');

        const updated = await this.prisma.filmSceneMomentSubject.update({
            where: { id: momentSubject.id },
            data: {
                priority: dto.priority ?? momentSubject.priority,
                notes: dto.notes ?? momentSubject.notes,
            },
            include: { subject: { include: { role_template: true } } },
        });

        return mapToSceneSubjectResponse(updated);
    }

    async removeSubjectFromMoment(momentId: number, subjectId: number) {
        const momentSubject = await this.prisma.filmSceneMomentSubject.findUnique({
            where: { moment_id_subject_id: { moment_id: momentId, subject_id: subjectId } },
        });
        if (!momentSubject) throw new NotFoundException('Moment subject assignment not found');

        await this.prisma.filmSceneMomentSubject.delete({ where: { id: momentSubject.id } });

        const assignments = await this.prisma.cameraSubjectAssignment.findMany({
            where: { recording_setup: { moment_id: momentId } },
            select: { id: true, subject_ids: true },
        });

        const updates = assignments
            .map((assignment) => {
                const next = assignment.subject_ids.filter((id) => id !== subjectId);
                if (next.length === assignment.subject_ids.length) return null;
                return this.prisma.cameraSubjectAssignment.update({
                    where: { id: assignment.id },
                    data: { subject_ids: next },
                });
            })
            .filter((update): update is ReturnType<typeof this.prisma.cameraSubjectAssignment.update> => !!update);

        if (updates.length) {
            await this.prisma.$transaction(updates);
        }

        return { message: 'Subject removed from moment' };
    }
}
