import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { mapToSubjectResponse } from './subject.mapper';
import { SubjectPriority } from '@prisma/client';

@Injectable()
export class SubjectsCrudService {
    constructor(private prisma: PrismaService) {}

    async create(createSubjectDto: CreateSubjectDto) {
        const filmId = createSubjectDto.film_id!;

        const film = await this.prisma.film.findUnique({
            where: { id: filmId },
        });
        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        const existingSubject = await this.prisma.filmSubject.findUnique({
            where: { film_id_name: { film_id: filmId, name: createSubjectDto.name } },
        });
        if (existingSubject) {
            throw new BadRequestException(
                `A subject with name "${createSubjectDto.name}" already exists in this film`,
            );
        }

        const subject = await this.prisma.filmSubject.create({
            data: {
                film_id: filmId,
                name: createSubjectDto.name,
                role_template_id: createSubjectDto.role_template_id,
            },
            include: { role_template: true },
        });

        const filmScenes = await this.prisma.filmScene.findMany({
            where: { film_id: filmId },
            select: { id: true },
        });
        const filmMoments = await this.prisma.sceneMoment.findMany({
            where: { film_scene: { film_id: filmId } },
            select: { id: true },
        });

        if (filmScenes.length > 0) {
            await this.prisma.filmSceneSubject.createMany({
                data: filmScenes.map((scene) => ({
                    scene_id: scene.id,
                    subject_id: subject.id,
                    priority: SubjectPriority.BACKGROUND,
                })),
                skipDuplicates: true,
            });
        }
        if (filmMoments.length > 0) {
            await this.prisma.filmSceneMomentSubject.createMany({
                data: filmMoments.map((moment) => ({
                    moment_id: moment.id,
                    subject_id: subject.id,
                    priority: SubjectPriority.BACKGROUND,
                })),
                skipDuplicates: true,
            });
        }

        return mapToSubjectResponse(subject);
    }

    async findAll(filmId: number) {
        const film = await this.prisma.film.findUnique({ where: { id: filmId } });
        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        const subjects = await this.prisma.filmSubject.findMany({
            where: { film_id: filmId },
            include: { role_template: true },
            orderBy: { created_at: 'desc' },
        });
        return subjects.map((s) => mapToSubjectResponse(s));
    }

    async findOne(id: number) {
        const subject = await this.prisma.filmSubject.findUnique({
            where: { id },
            include: { film: true, role_template: true },
        });
        if (!subject) {
            throw new NotFoundException(`Subject with ID ${id} not found`);
        }
        return mapToSubjectResponse(subject);
    }

    async update(id: number, updateSubjectDto: UpdateSubjectDto) {
        const subject = await this.prisma.filmSubject.findUnique({ where: { id } });
        if (!subject) {
            throw new NotFoundException(`Subject with ID ${id} not found`);
        }

        if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
            const existingSubject = await this.prisma.filmSubject.findUnique({
                where: { film_id_name: { film_id: subject.film_id, name: updateSubjectDto.name } },
            });
            if (existingSubject) {
                throw new BadRequestException(
                    `A subject with name "${updateSubjectDto.name}" already exists in this film`,
                );
            }
        }

        const updated = await this.prisma.filmSubject.update({
            where: { id },
            data: updateSubjectDto,
            include: { role_template: true },
        });
        return mapToSubjectResponse(updated);
    }

    async remove(id: number) {
        const subject = await this.prisma.filmSubject.findUnique({ where: { id } });
        if (!subject) {
            throw new NotFoundException(`Subject with ID ${id} not found`);
        }

        const [sceneAssignments, momentAssignments] = await this.prisma.$transaction([
            this.prisma.sceneCameraAssignment.findMany({
                where: { recording_setup: { scene: { film_id: subject.film_id } } },
                select: { id: true, subject_ids: true },
            }),
            this.prisma.cameraSubjectAssignment.findMany({
                where: { recording_setup: { moment: { film_scene: { film_id: subject.film_id } } } },
                select: { id: true, subject_ids: true },
            }),
        ]);

        const updates = [
            ...sceneAssignments.map((assignment) => {
                const next = assignment.subject_ids.filter((subjectId) => subjectId !== id);
                if (next.length === assignment.subject_ids.length) return null;
                return this.prisma.sceneCameraAssignment.update({
                    where: { id: assignment.id },
                    data: { subject_ids: next },
                });
            }),
            ...momentAssignments.map((assignment) => {
                const next = assignment.subject_ids.filter((subjectId) => subjectId !== id);
                if (next.length === assignment.subject_ids.length) return null;
                return this.prisma.cameraSubjectAssignment.update({
                    where: { id: assignment.id },
                    data: { subject_ids: next },
                });
            }),
        ].filter(
            (update): update is ReturnType<typeof this.prisma.sceneCameraAssignment.update> =>
                !!update,
        );

        if (updates.length) {
            await this.prisma.$transaction(updates);
        }

        await this.prisma.filmSubject.delete({ where: { id } });
        return { message: `Subject with ID ${id} deleted successfully` };
    }

    async getSubjectTemplates(brandId?: number) {
        if (!brandId) {
            throw new NotFoundException('Brand context is required to load subject templates');
        }
        return this.prisma.subjectTemplate.findMany({
            where: { brand_id: brandId },
            orderBy: { name: 'asc' },
        });
    }
}
