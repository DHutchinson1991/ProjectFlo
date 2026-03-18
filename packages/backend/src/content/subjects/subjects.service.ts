import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { AssignSubjectToSceneDto } from './dto/assign-subject-to-scene.dto';
import { UpdateSceneSubjectDto } from './dto/update-scene-subject.dto';
import { SceneSubjectResponseDto } from './dto/scene-subject-response.dto';
import { SubjectPriority } from '@prisma/client';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    private mapToResponseDto(subject: any): SubjectResponseDto {
        return {
            id: subject.id,
            film_id: subject.film_id,
            name: subject.name,
            category: subject.category,
            role_template_id: subject.role_template_id,
            role: subject.role_template
                ? {
                    id: subject.role_template.id,
                    role_name: subject.role_template.role_name,
                    description: subject.role_template.description,
                    is_core: subject.role_template.is_core,
                    is_group: subject.role_template.is_group,
                }
                : undefined,
            is_custom: subject.is_custom,
            created_at: subject.created_at,
            updated_at: subject.updated_at,
        };
    }

    private mapSceneSubjectResponseDto(sceneSubject: any): SceneSubjectResponseDto {
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
                category: sceneSubject.subject.category,
                role_template_id: sceneSubject.subject.role_template_id,
                role: sceneSubject.subject.role_template
                    ? {
                        id: sceneSubject.subject.role_template.id,
                        role_name: sceneSubject.subject.role_template.role_name,
                        description: sceneSubject.subject.role_template.description,
                        is_core: sceneSubject.subject.role_template.is_core,
                        is_group: sceneSubject.subject.role_template.is_group,
                    }
                    : undefined,
                is_custom: sceneSubject.subject.is_custom,
                created_at: sceneSubject.subject.created_at,
                updated_at: sceneSubject.subject.updated_at,
            },
        };
    }

    async create(createSubjectDto: CreateSubjectDto) {
        // Verify film exists (film_id is guaranteed to be set by controller)
        const filmId = createSubjectDto.film_id!;
        
        const film = await this.prisma.film.findUnique({
            where: { id: filmId },
        });

        if (!film) {
            throw new NotFoundException(
                `Film with ID ${filmId} not found`,
            );
        }

        // Check for duplicate subject name within same film
        const existingSubject = await this.prisma.filmSubject.findUnique({
            where: {
                film_id_name: {
                    film_id: filmId,
                    name: createSubjectDto.name,
                },
            },
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
                category: createSubjectDto.category,
                role_template_id: createSubjectDto.role_template_id,
                is_custom: createSubjectDto.is_custom || false,
            },
            include: {
                role_template: true,
            },
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

        return this.mapToResponseDto(subject);
    }

    async findAll(filmId: number) {
        // Verify film exists
        const film = await this.prisma.film.findUnique({
            where: { id: filmId },
        });

        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        const subjects = await this.prisma.filmSubject.findMany({
            where: { film_id: filmId },
            include: {
                role_template: true,
            },
            orderBy: { created_at: 'desc' },
        });

        return subjects.map(s => this.mapToResponseDto(s));
    }

    async findOne(id: number) {
        const subject = await this.prisma.filmSubject.findUnique({
            where: { id },
            include: {
                film: true,
                role_template: true,
            },
        });

        if (!subject) {
            throw new NotFoundException(`Subject with ID ${id} not found`);
        }

        return this.mapToResponseDto(subject);
    }

    async update(id: number, updateSubjectDto: UpdateSubjectDto) {
        // Verify subject exists
        const subject = await this.prisma.filmSubject.findUnique({
            where: { id },
        });

        if (!subject) {
            throw new NotFoundException(`Subject with ID ${id} not found`);
        }

        // Check for duplicate if name is being changed
        if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
            const existingSubject = await this.prisma.filmSubject.findUnique({
                where: {
                    film_id_name: {
                        film_id: subject.film_id,
                        name: updateSubjectDto.name,
                    },
                },
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
            include: {
                role_template: true,
            },
        });

        return this.mapToResponseDto(updated);
    }

    async remove(id: number) {
        // Verify subject exists
        const subject = await this.prisma.filmSubject.findUnique({
            where: { id },
        });

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
        ].filter((update): update is ReturnType<typeof this.prisma.sceneCameraAssignment.update> => !!update);

        if (updates.length) {
            await this.prisma.$transaction(updates);
        }

        // Delete will cascade automatically due to onDelete: Cascade in schema
        await this.prisma.filmSubject.delete({
            where: { id },
        });

        return { message: `Subject with ID ${id} deleted successfully` };
    }

    // Utility method for getting subject templates library
    async getSubjectTemplates() {
        return this.prisma.subjectTemplate.findMany({
            where: { is_system: true },
            orderBy: { name: 'asc' },
        });
    }

    async getSubjectsByCategory(filmId: number, category: any) {
        const film = await this.prisma.film.findUnique({
            where: { id: filmId },
        });

        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        return this.prisma.filmSubject.findMany({
            where: {
                film_id: filmId,
                category,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async getSceneSubjects(sceneId: number) {
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const subjects = await this.prisma.filmSceneSubject.findMany({
            where: { scene_id: sceneId },
            include: {
                subject: {
                    include: {
                        role_template: true,
                    },
                },
            },
            orderBy: { created_at: 'asc' },
        });

        return subjects.map((subject) => this.mapSceneSubjectResponseDto(subject));
    }

    async assignSubjectToScene(sceneId: number, dto: AssignSubjectToSceneDto) {
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const subject = await this.prisma.filmSubject.findUnique({
            where: { id: dto.subject_id },
        });

        if (!subject) {
            throw new NotFoundException(`Subject with ID ${dto.subject_id} not found`);
        }

        if (subject.film_id !== scene.film_id) {
            throw new BadRequestException('Subject does not belong to the same film as this scene');
        }

        const sceneSubject = await this.prisma.filmSceneSubject.upsert({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: dto.subject_id,
                },
            },
            update: {
                priority: dto.priority ?? undefined,
                notes: dto.notes ?? undefined,
            },
            create: {
                scene_id: sceneId,
                subject_id: dto.subject_id,
                priority: dto.priority ?? SubjectPriority.BACKGROUND,
                notes: dto.notes,
            },
            include: { subject: true },
        });

        return this.mapSceneSubjectResponseDto(sceneSubject);
    }

    async updateSceneSubject(sceneId: number, subjectId: number, dto: UpdateSceneSubjectDto) {
        const sceneSubject = await this.prisma.filmSceneSubject.findUnique({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: subjectId,
                },
            },
        });

        if (!sceneSubject) {
            throw new NotFoundException('Scene subject assignment not found');
        }

        const updated = await this.prisma.filmSceneSubject.update({
            where: { id: sceneSubject.id },
            data: {
                priority: dto.priority ?? sceneSubject.priority,
                notes: dto.notes ?? sceneSubject.notes,
            },
            include: { subject: true },
        });

        return this.mapSceneSubjectResponseDto(updated);
    }

    async removeSubjectFromScene(sceneId: number, subjectId: number) {
        const sceneSubject = await this.prisma.filmSceneSubject.findUnique({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: subjectId,
                },
            },
            include: {
                scene: true,
            },
        });

        if (!sceneSubject) {
            throw new NotFoundException('Scene subject assignment not found');
        }

        await this.prisma.filmSceneSubject.delete({
            where: { id: sceneSubject.id },
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

    async getMomentSubjects(momentId: number) {
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id: momentId },
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${momentId} not found`);
        }

        const subjects = await this.prisma.filmSceneMomentSubject.findMany({
            where: { moment_id: momentId },
            include: {
                subject: {
                    include: {
                        role_template: true,
                    },
                },
            },
            orderBy: { created_at: 'asc' },
        });

        return subjects.map((subject) => this.mapSceneSubjectResponseDto(subject));
    }

    async assignSubjectToMoment(momentId: number, dto: AssignSubjectToSceneDto) {
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id: momentId },
            include: { film_scene: true },
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${momentId} not found`);
        }

        const subject = await this.prisma.filmSubject.findUnique({
            where: { id: dto.subject_id },
        });

        if (!subject) {
            throw new NotFoundException(`Subject with ID ${dto.subject_id} not found`);
        }

        if (subject.film_id !== moment.film_scene.film_id) {
            throw new BadRequestException('Subject does not belong to the same film as this moment');
        }

        const momentSubject = await this.prisma.filmSceneMomentSubject.upsert({
            where: {
                moment_id_subject_id: {
                    moment_id: momentId,
                    subject_id: dto.subject_id,
                },
            },
            update: {
                priority: dto.priority ?? undefined,
                notes: dto.notes ?? undefined,
            },
            create: {
                moment_id: momentId,
                subject_id: dto.subject_id,
                priority: dto.priority ?? SubjectPriority.BACKGROUND,
                notes: dto.notes,
            },
            include: { subject: true },
        });

        return this.mapSceneSubjectResponseDto(momentSubject);
    }

    async updateMomentSubject(momentId: number, subjectId: number, dto: UpdateSceneSubjectDto) {
        const momentSubject = await this.prisma.filmSceneMomentSubject.findUnique({
            where: {
                moment_id_subject_id: {
                    moment_id: momentId,
                    subject_id: subjectId,
                },
            },
        });

        if (!momentSubject) {
            throw new NotFoundException('Moment subject assignment not found');
        }

        const updated = await this.prisma.filmSceneMomentSubject.update({
            where: { id: momentSubject.id },
            data: {
                priority: dto.priority ?? momentSubject.priority,
                notes: dto.notes ?? momentSubject.notes,
            },
            include: { subject: true },
        });

        return this.mapSceneSubjectResponseDto(updated);
    }

    async removeSubjectFromMoment(momentId: number, subjectId: number) {
        const momentSubject = await this.prisma.filmSceneMomentSubject.findUnique({
            where: {
                moment_id_subject_id: {
                    moment_id: momentId,
                    subject_id: subjectId,
                },
            },
        });

        if (!momentSubject) {
            throw new NotFoundException('Moment subject assignment not found');
        }

        await this.prisma.filmSceneMomentSubject.delete({
            where: { id: momentSubject.id },
        });

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

    // ===== Subject Type Template Management (Brand-specific) =====

    async getSubjectTypeTemplates(brandId: number) {
        const templates = await this.prisma.subjectTypeTemplate.findMany({
            where: { brand_id: brandId, is_active: true },
            include: {
                roles: {
                    orderBy: { order_index: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });

        return templates.map((template) => ({
            id: template.id,
            brand_id: template.brand_id,
            name: template.name,
            description: template.description,
            category: template.category,
            is_active: template.is_active,
            created_at: template.created_at,
            updated_at: template.updated_at,
            roles: template.roles,
        }));
    }

    async createSubjectTypeTemplate(brandId: number, dto: any) {
        // Verify brand exists
        const brand = await this.prisma.brands.findUnique({
            where: { id: brandId },
        });

        if (!brand) {
            throw new NotFoundException(`Brand with ID ${brandId} not found`);
        }

        // Check if template with same name already exists for this brand
        const existing = await this.prisma.subjectTypeTemplate.findFirst({
            where: {
                brand_id: brandId,
                name: dto.name,
            },
        });

        if (existing) {
            throw new BadRequestException(
                `Subject type template "${dto.name}" already exists for this brand`
            );
        }

        // Create template with roles in a transaction
        const template = await this.prisma.subjectTypeTemplate.create({
            data: {
                brand_id: brandId,
                name: dto.name,
                description: dto.description,
                category: dto.category,
                roles: {
                    create: dto.roles.map((role: any, index: number) => ({
                        role_name: role.role_name,
                        description: role.description,
                        is_core: role.is_core ?? false,
                        is_group: role.is_group ?? false,
                        order_index: role.order_index ?? index,
                    })),
                },
            },
            include: {
                roles: {
                    orderBy: { order_index: 'asc' },
                },
            },
        });

        return template;
    }

    async updateSubjectTypeTemplate(templateId: number, dto: any) {
        const template = await this.prisma.subjectTypeTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new NotFoundException(`Template with ID ${templateId} not found`);
        }

        const updated = await this.prisma.subjectTypeTemplate.update({
            where: { id: templateId },
            data: {
                name: dto.name ?? template.name,
                description: dto.description ?? template.description,
                is_active: dto.is_active ?? template.is_active,
            },
            include: {
                roles: {
                    orderBy: { order_index: 'asc' },
                },
            },
        });

        return updated;
    }

    async deleteSubjectTypeTemplate(templateId: number) {
        const template = await this.prisma.subjectTypeTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new NotFoundException(`Template with ID ${templateId} not found`);
        }

        await this.prisma.subjectTypeTemplate.delete({
            where: { id: templateId },
        });

        return { message: 'Template deleted successfully' };
    }

    async addRoleToTemplate(templateId: number, roleDto: any) {
        const template = await this.prisma.subjectTypeTemplate.findUnique({
            where: { id: templateId },
            include: { roles: true },
        });

        if (!template) {
            throw new NotFoundException(`Template with ID ${templateId} not found`);
        }

        // Check if role already exists
        const existingRole = template.roles.find(
            (r) => r.role_name.toLowerCase() === roleDto.role_name.toLowerCase()
        );

        if (existingRole) {
            throw new BadRequestException(
                `Role "${roleDto.role_name}" already exists in this template`
            );
        }

        const newRole = await this.prisma.subjectRoleTemplate.create({
            data: {
                subject_type_id: templateId,
                role_name: roleDto.role_name,
                description: roleDto.description,
                is_core: roleDto.is_core ?? false,
                is_group: roleDto.is_group ?? false,
                order_index: roleDto.order_index ?? template.roles.length,
            },
        });

        return newRole;
    }

    async removeRoleFromTemplate(roleId: number) {
        const role = await this.prisma.subjectRoleTemplate.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        await this.prisma.subjectRoleTemplate.delete({
            where: { id: roleId },
        });

        return { message: 'Role removed from template' };
    }
}

