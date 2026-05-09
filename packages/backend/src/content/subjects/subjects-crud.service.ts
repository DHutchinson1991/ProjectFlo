import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { mapToSubjectResponse } from './subject.mapper';
import { SubjectPriority } from '@prisma/client';

@Injectable()
export class SubjectsCrudService {
    constructor(private prisma: PrismaService) {}

    /** Resolve the package_id for a film (via PackageFilm). */
    private async getPackageIdForFilm(filmId: number): Promise<number> {
        const pf = await this.prisma.packageFilm.findFirst({
            where: { film_id: filmId },
            select: { package_id: true },
        });
        if (!pf) throw new NotFoundException(`Film ${filmId} is not assigned to any package`);
        return pf.package_id;
    }

    async create(createSubjectDto: CreateSubjectDto) {
        const filmId = createSubjectDto.film_id!;
        const packageId = await this.getPackageIdForFilm(filmId);

        // Determine event_day_template_id — explicit, or infer from film's first activity
        let eventDayId = createSubjectDto.event_day_template_id;
        if (!eventDayId) {
            const activity = await this.prisma.sceneMoment.findFirst({
                where: { film_scene: { film_id: filmId }, source_activity_id: { not: null } },
                select: { source_activity_id: true },
            });
            if (activity?.source_activity_id) {
                const act = await this.prisma.packageActivity.findUnique({
                    where: { id: activity.source_activity_id },
                    select: { package_event_day_id: true },
                });
                eventDayId = act?.package_event_day_id;
            }
            // Fallback: first event day in package
            if (!eventDayId) {
                const firstDay = await this.prisma.packageEventDay.findFirst({
                    where: { package_id: packageId },
                    orderBy: { order_index: 'asc' },
                    select: { id: true },
                });
                if (!firstDay) throw new BadRequestException('Package has no event days');
                eventDayId = firstDay.id;
            }
        }

        // Uniqueness check
        const existing = await this.prisma.packageDaySubject.findUnique({
            where: {
                package_id_event_day_template_id_name: {
                    package_id: packageId,
                    event_day_template_id: eventDayId,
                    name: createSubjectDto.name,
                },
            },
        });
        if (existing) {
            throw new BadRequestException(
                `A subject with name "${createSubjectDto.name}" already exists`,
            );
        }

        if (createSubjectDto.role_template_id != null) {
            const roleTemplate = await this.prisma.subjectRole.findUnique({
                where: { id: createSubjectDto.role_template_id },
            });
            if (!roleTemplate) {
                throw new BadRequestException(
                    `Role template with ID ${createSubjectDto.role_template_id} not found`,
                );
            }
        }

        const subject = await this.prisma.packageDaySubject.create({
            data: {
                package_id: packageId,
                event_day_template_id: eventDayId,
                name: createSubjectDto.name,
                role_template_id: createSubjectDto.role_template_id,
            },
            include: { role_template: true },
        });

        // Auto-assign as BACKGROUND to all existing moments in this film
        const filmMoments = await this.prisma.sceneMoment.findMany({
            where: { film_scene: { film_id: filmId } },
            select: { id: true, name: true, source_activity_id: true },
        });

        if (filmMoments.length > 0) {
            const roleName = subject.role_template?.role_name || subject.name;
            const momentsWithActivity = filmMoments.filter(m => m.source_activity_id);
            const activityIds = [...new Set(momentsWithActivity.map(m => m.source_activity_id!))];
            const templateMoments = activityIds.length > 0
                ? await this.prisma.packageActivityMoment.findMany({
                    where: { package_activity_id: { in: activityIds } },
                    select: { package_activity_id: true, name: true, subject_actions: true },
                })
                : [];
            const templateMap = new Map(templateMoments.map(t => [`${t.package_activity_id}:${t.name}`, t.subject_actions]));

            await this.prisma.filmSceneMomentSubject.createMany({
                data: filmMoments.map((moment) => {
                    let actionDesc: string | undefined;
                    if (moment.source_activity_id) {
                        const actions = templateMap.get(`${moment.source_activity_id}:${moment.name}`);
                        if (actions && typeof actions === 'object' && !Array.isArray(actions)) {
                            actionDesc = (actions as Record<string, string>)[roleName] ?? undefined;
                        }
                    }
                    return {
                        moment_id: moment.id,
                        subject_id: subject.id,
                        priority: SubjectPriority.BACKGROUND,
                        action_description: actionDesc ?? undefined,
                    };
                }),
                skipDuplicates: true,
            });
        }

        return mapToSubjectResponse(subject);
    }

    async findAll(filmId: number) {
        const film = await this.prisma.film.findUnique({ where: { id: filmId } });
        if (!film) throw new NotFoundException(`Film with ID ${filmId} not found`);

        const packageId = await this.getPackageIdForFilm(filmId);
        const subjects = await this.prisma.packageDaySubject.findMany({
            where: { package_id: packageId },
            include: { role_template: true },
            orderBy: { created_at: 'desc' },
        });
        return subjects.map((s) => mapToSubjectResponse(s));
    }

    async findOne(id: number) {
        const subject = await this.prisma.packageDaySubject.findUnique({
            where: { id },
            include: { role_template: true },
        });
        if (!subject) throw new NotFoundException(`Subject with ID ${id} not found`);
        return mapToSubjectResponse(subject);
    }

    async update(id: number, updateSubjectDto: UpdateSubjectDto) {
        const subject = await this.prisma.packageDaySubject.findUnique({ where: { id } });
        if (!subject) throw new NotFoundException(`Subject with ID ${id} not found`);

        if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
            const existing = await this.prisma.packageDaySubject.findUnique({
                where: {
                    package_id_event_day_template_id_name: {
                        package_id: subject.package_id,
                        event_day_template_id: subject.event_day_template_id,
                        name: updateSubjectDto.name,
                    },
                },
            });
            if (existing) {
                throw new BadRequestException(
                    `A subject with name "${updateSubjectDto.name}" already exists`,
                );
            }
        }

        const updated = await this.prisma.packageDaySubject.update({
            where: { id },
            data: {
                name: updateSubjectDto.name,
                role_template_id: updateSubjectDto.role_template_id,
            },
            include: { role_template: true },
        });
        return mapToSubjectResponse(updated);
    }

    async remove(id: number) {
        const subject = await this.prisma.packageDaySubject.findUnique({ where: { id } });
        if (!subject) throw new NotFoundException(`Subject with ID ${id} not found`);

        // Clean subject_ids arrays in camera assignments that reference this subject
        const [sceneAssignments, momentAssignments] = await this.prisma.$transaction([
            this.prisma.sceneCameraAssignment.findMany({
                where: { subject_ids: { has: id } },
                select: { id: true, subject_ids: true },
            }),
            this.prisma.cameraSubjectAssignment.findMany({
                where: { subject_ids: { has: id } },
                select: { id: true, subject_ids: true },
            }),
        ]);

        const updates = [
            ...sceneAssignments.map((a) => {
                const next = a.subject_ids.filter((sid) => sid !== id);
                return this.prisma.sceneCameraAssignment.update({
                    where: { id: a.id }, data: { subject_ids: next },
                });
            }),
            ...momentAssignments.map((a) => {
                const next = a.subject_ids.filter((sid) => sid !== id);
                return this.prisma.cameraSubjectAssignment.update({
                    where: { id: a.id }, data: { subject_ids: next },
                });
            }),
        ];

        if (updates.length) await this.prisma.$transaction(updates);

        await this.prisma.packageDaySubject.delete({ where: { id } });
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
