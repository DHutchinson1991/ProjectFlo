import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto, AssignSubjectToSceneDto, UpdateSceneSubjectDto, SubjectPriority } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    // Subjects Library Management
    async create(createSubjectDto: CreateSubjectDto) {
        return this.prisma.subjectsLibrary.create({
            data: createSubjectDto,
        });
    }

    async findAll(brandId?: number) {
        const where = brandId ? { brand_id: brandId } : {};
        return this.prisma.subjectsLibrary.findMany({
            where,
            orderBy: [
                { first_name: 'asc' },
                { last_name: 'asc' }
            ],
        });
    }

    async findOne(id: number) {
        const subject = await this.prisma.subjectsLibrary.findUnique({
            where: { id },
        });

        if (!subject) {
            throw new NotFoundException(`Subject with ID ${id} not found`);
        }

        return subject;
    }

    async update(id: number, updateSubjectDto: UpdateSubjectDto) {
        await this.findOne(id); // This will throw if not found

        return this.prisma.subjectsLibrary.update({
            where: { id },
            data: updateSubjectDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id); // This will throw if not found

        // Check if subject is assigned to any scenes
        const sceneAssignments = await this.prisma.sceneSubjects.count({
            where: { subject_id: id },
        });

        if (sceneAssignments > 0) {
            throw new BadRequestException(
                `Cannot delete subject. It is assigned to ${sceneAssignments} scene(s). Please remove scene assignments first.`
            );
        }

        return this.prisma.subjectsLibrary.delete({
            where: { id },
        });
    }

    // Scene-Subject Assignment Management
    async assignToScene(sceneId: number, assignDto: AssignSubjectToSceneDto) {
        // Verify scene exists
        const scene = await this.prisma.scenesLibrary.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        // Verify subject exists
        await this.findOne(assignDto.subject_id);

        // Check if assignment already exists
        const existingAssignment = await this.prisma.sceneSubjects.findUnique({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: assignDto.subject_id,
                },
            },
        });

        if (existingAssignment) {
            throw new BadRequestException(
                `Subject is already assigned to this scene with ${existingAssignment.priority} priority`
            );
        }

        return this.prisma.sceneSubjects.create({
            data: {
                scene_id: sceneId,
                subject_id: assignDto.subject_id,
                priority: assignDto.priority,
            },
            include: {
                subject: true,
            },
        });
    }

    async getSceneSubjects(sceneId: number) {
        // Verify scene exists
        const scene = await this.prisma.scenesLibrary.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        return this.prisma.sceneSubjects.findMany({
            where: { scene_id: sceneId },
            include: {
                subject: true,
            },
            orderBy: [
                { priority: 'asc' }, // PRIMARY first, then SECONDARY, then BACKGROUND
                { subject: { first_name: 'asc' } },
                { subject: { last_name: 'asc' } },
            ],
        });
    }

    async updateSceneSubject(sceneId: number, subjectId: number, updateDto: UpdateSceneSubjectDto) {
        // Verify assignment exists
        const assignment = await this.prisma.sceneSubjects.findUnique({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: subjectId,
                },
            },
        });

        if (!assignment) {
            throw new NotFoundException(
                `Subject assignment not found for scene ${sceneId} and subject ${subjectId}`
            );
        }

        return this.prisma.sceneSubjects.update({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: subjectId,
                },
            },
            data: updateDto,
            include: {
                subject: true,
            },
        });
    }

    async removeFromScene(sceneId: number, subjectId: number) {
        // Verify assignment exists
        const assignment = await this.prisma.sceneSubjects.findUnique({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: subjectId,
                },
            },
        });

        if (!assignment) {
            throw new NotFoundException(
                `Subject assignment not found for scene ${sceneId} and subject ${subjectId}`
            );
        }

        return this.prisma.sceneSubjects.delete({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: subjectId,
                },
            },
        });
    }

    async getSubjectScenes(subjectId: number) {
        // Verify subject exists
        await this.findOne(subjectId);

        return this.prisma.sceneSubjects.findMany({
            where: { subject_id: subjectId },
            include: {
                scene: true,
            },
            orderBy: [
                { priority: 'asc' },
                { scene: { name: 'asc' } },
            ],
        });
    }

    // Utility methods
    async getSubjectStats(subjectId: number) {
        const subject = await this.findOne(subjectId);

        const sceneCount = await this.prisma.sceneSubjects.count({
            where: { subject_id: subjectId },
        });

        const priorityBreakdown = await this.prisma.sceneSubjects.groupBy({
            where: { subject_id: subjectId },
            by: ['priority'],
            _count: true,
        });

        return {
            subject,
            scene_count: sceneCount,
            priority_breakdown: priorityBreakdown.reduce((acc, item) => {
                acc[item.priority] = item._count;
                return acc;
            }, {} as Record<SubjectPriority, number>),
        };
    }
}
