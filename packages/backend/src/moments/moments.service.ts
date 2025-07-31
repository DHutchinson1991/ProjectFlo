import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateMomentTemplateDto,
    UpdateMomentTemplateDto,
    CreateSceneMomentDto,
    UpdateSceneMomentDto,
    ReorderMomentsDto,
    CreateSceneMomentMusicDto,
    UpdateSceneMomentMusicDto,
} from './dto/moments.dto';

@Injectable()
export class MomentsService {
    constructor(private prisma: PrismaService) { }

    // ==================== MOMENT TEMPLATES ====================

    async getAllMomentTemplates() {
        return this.prisma.momentTemplates.findMany({
            where: { is_active: true },
            orderBy: [{ scene_type: 'asc' }, { order_index: 'asc' }],
        });
    }

    async getMomentTemplatesBySceneType(sceneType: string) {
        return this.prisma.momentTemplates.findMany({
            where: {
                scene_type: sceneType,
                is_active: true,
            },
            orderBy: { order_index: 'asc' },
        });
    }

    async createMomentTemplate(data: CreateMomentTemplateDto) {
        return this.prisma.momentTemplates.create({
            data: {
                ...data,
                default_duration: data.default_duration || 60,
                is_active: data.is_active !== false,
            },
        });
    }

    async updateMomentTemplate(id: number, data: UpdateMomentTemplateDto) {
        const template = await this.prisma.momentTemplates.findUnique({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException(`Moment template with ID ${id} not found`);
        }

        return this.prisma.momentTemplates.update({
            where: { id },
            data,
        });
    }

    async deleteMomentTemplate(id: number) {
        const template = await this.prisma.momentTemplates.findUnique({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException(`Moment template with ID ${id} not found`);
        }

        // Soft delete by setting is_active to false
        return this.prisma.momentTemplates.update({
            where: { id },
            data: { is_active: false },
        });
    }

    // ==================== SCENE MOMENTS ====================

    async getSceneMoments(sceneId: number, projectId?: number) {
        const whereClause = {
            scene_id: sceneId,
            is_active: true,
            ...(projectId && { project_id: projectId }),
        };

        // Get all moments for the scene
        const moments = await this.prisma.sceneMoments.findMany({
            where: whereClause,
            include: {
                template: true,
                music: true, // Include music relationship
            },
            orderBy: { order_index: 'asc' },
        });

        // Get ALL coverage for this scene (both scene-level and moment-specific)
        // This makes all coverage available to all moments
        const allSceneCoverage = await this.prisma.sceneCoverage.findMany({
            where: {
                scene_id: sceneId,
                // No moment_id filter - get ALL coverage for the scene
            },
            include: {
                coverage: true,
            },
            orderBy: { coverage_id: 'asc' },
        });

        // Generate assignment labels if they don't exist
        const coverageWithAssignments = allSceneCoverage.map((item, index) => {
            if (!item.assignment) {
                // Auto-generate assignment if missing
                const typeCounters: { [key: string]: number } = { VIDEO: 0, AUDIO: 0 };
                const coverageByType = allSceneCoverage.slice(0, index + 1);

                for (const c of coverageByType) {
                    const type = c.coverage.coverage_type;
                    if (type) {
                        typeCounters[type] = (typeCounters[type] || 0) + 1;
                    }
                }

                const type = item.coverage.coverage_type;
                if (type) {
                    const prefix = type === 'VIDEO' ? 'V' : type === 'AUDIO' ? 'A' : 'M';
                    item.assignment = `${prefix}${typeCounters[type]}`;
                }
            }
            return item;
        });

        // Add all scene coverage to each moment
        const momentsWithCoverage = moments.map(moment => ({
            ...moment,
            coverage_items: coverageWithAssignments, // All moments get ALL scene coverage with assignments
            coverage_assignments: coverageWithAssignments.map(c => c.assignment).join(', '), // Quick summary string
        }));

        return momentsWithCoverage;
    }

    async createSceneMoment(data: CreateSceneMomentDto) {
        // Check if scene exists
        const scene = await this.prisma.scenesLibrary.findUnique({
            where: { id: data.scene_id },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${data.scene_id} not found`);
        }

        // Check for order_index conflicts and auto-adjust if needed
        const existingMoment = await this.prisma.sceneMoments.findFirst({
            where: {
                scene_id: data.scene_id,
                order_index: data.order_index,
                is_active: true,
            },
        });

        if (existingMoment) {
            // Auto-adjust order indices
            await this.prisma.sceneMoments.updateMany({
                where: {
                    scene_id: data.scene_id,
                    order_index: { gte: data.order_index },
                    is_active: true,
                },
                data: {
                    order_index: { increment: 1 },
                },
            });
        }

        const createdMoment = await this.prisma.sceneMoments.create({
            data: {
                ...data,
                duration: data.duration || 60,
                is_active: data.is_active !== false,
            },
            include: {
                template: true,
            },
        });

        // Get all scene coverage and add it to the created moment
        const sceneCoverage = await this.prisma.sceneCoverage.findMany({
            where: {
                scene_id: data.scene_id,
                moment_id: null, // Scene-level coverage
            },
            include: {
                coverage: true,
            },
            orderBy: { coverage_id: 'asc' },
        });

        return {
            ...createdMoment,
            coverage_items: sceneCoverage, // Add all scene coverage
            coverage_assignments: sceneCoverage.map(c => c.assignment).filter(Boolean).join(', '), // Quick summary string
        };
    }

    async createMomentsFromTemplate(sceneId: number, sceneType: string, projectId?: number) {
        // Check if scene exists first
        const scene = await this.prisma.scenesLibrary.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        // Get templates for the scene type
        const templates = await this.getMomentTemplatesBySceneType(sceneType);

        if (templates.length === 0) {
            throw new BadRequestException(`No moment templates found for scene type: ${sceneType}`);
        }

        // Get existing coverage items for this scene
        const existingCoverage = await this.prisma.sceneCoverage.findMany({
            where: { scene_id: sceneId },
            include: { coverage: true },
        });

        // Create moments from templates
        const createdMoments = await Promise.all(
            templates.map((template) =>
                this.prisma.sceneMoments.create({
                    data: {
                        scene_id: sceneId,
                        project_id: projectId,
                        template_id: template.id,
                        name: template.name,
                        description: template.description,
                        order_index: template.order_index,
                        duration: template.default_duration,
                        is_active: true,
                    },
                    include: {
                        template: true,
                    },
                })
            )
        );

        // Auto-assign coverage to moments if coverage exists
        if (existingCoverage.length > 0 && createdMoments.length > 0) {
            await this.autoAssignCoverageToMoments(sceneId, existingCoverage, createdMoments);
        }

        // Return updated moments with coverage assignments
        return this.getSceneMoments(sceneId, projectId);
    }

    async updateSceneMoment(id: number, data: UpdateSceneMomentDto) {
        const moment = await this.prisma.sceneMoments.findUnique({
            where: { id },
        });

        if (!moment) {
            throw new NotFoundException(`Scene moment with ID ${id} not found`);
        }

        // Handle order_index updates
        if (data.order_index !== undefined && data.order_index !== moment.order_index) {
            // Check for conflicts and adjust other moments
            const existingMoment = await this.prisma.sceneMoments.findFirst({
                where: {
                    scene_id: moment.scene_id,
                    order_index: data.order_index,
                    is_active: true,
                    id: { not: id },
                },
            });

            if (existingMoment) {
                // Move existing moment to the old position
                await this.prisma.sceneMoments.update({
                    where: { id: existingMoment.id },
                    data: { order_index: moment.order_index },
                });
            }
        }

        const updatedMoment = await this.prisma.sceneMoments.update({
            where: { id },
            data,
            include: {
                template: true,
            },
        });

        // Get all scene coverage and add it to the updated moment
        const sceneCoverage = await this.prisma.sceneCoverage.findMany({
            where: {
                scene_id: updatedMoment.scene_id,
                moment_id: null, // Scene-level coverage
            },
            include: {
                coverage: true,
            },
            orderBy: { coverage_id: 'asc' },
        });

        return {
            ...updatedMoment,
            coverage_items: sceneCoverage, // Add all scene coverage
            coverage_assignments: sceneCoverage.map(c => c.assignment).filter(Boolean).join(', '), // Quick summary string
        };
    }

    async reorderSceneMoments(sceneId: number, data: ReorderMomentsDto) {
        console.log('🔄 Service reorderSceneMoments called:', { sceneId, moment_ids: data.moment_ids });

        // Verify all moments belong to the scene
        const moments = await this.prisma.sceneMoments.findMany({
            where: {
                id: { in: data.moment_ids },
                scene_id: sceneId,
                is_active: true,
            },
        });

        console.log('🔍 Found moments:', moments.length, 'expected:', data.moment_ids.length);

        if (moments.length !== data.moment_ids.length) {
            console.error('❌ Moment count mismatch:', { found: moments.length, expected: data.moment_ids.length });
            throw new BadRequestException('Some moment IDs are invalid or do not belong to this scene');
        }

        // Use a transaction to avoid unique constraint violations
        // First, set all order_index values to negative numbers to free up the slots
        console.log('🔄 Starting reorder transaction...');

        await this.prisma.$transaction(async (tx) => {
            // Step 1: Set all moments to negative order indices to avoid conflicts
            console.log('� Step 1: Setting temporary negative order indices...');
            for (let i = 0; i < data.moment_ids.length; i++) {
                const momentId = data.moment_ids[i];
                await tx.sceneMoments.update({
                    where: { id: momentId },
                    data: { order_index: -(i + 1) },
                });
            }

            // Step 2: Set the correct positive order indices
            console.log('📝 Step 2: Setting final order indices...');
            for (let i = 0; i < data.moment_ids.length; i++) {
                const momentId = data.moment_ids[i];
                const newOrder = i + 1;
                await tx.sceneMoments.update({
                    where: { id: momentId },
                    data: { order_index: newOrder },
                });
            }
        });

        console.log('✅ Order indices updated successfully');

        // Return the reordered moments
        const result = await this.getSceneMoments(sceneId);
        console.log('📤 Returning reordered moments:', result.length);
        return result;
    }

    async deleteSceneMoment(id: number) {
        const moment = await this.prisma.sceneMoments.findUnique({
            where: { id },
        });

        if (!moment) {
            throw new NotFoundException(`Scene moment with ID ${id} not found`);
        }

        // Soft delete by setting is_active to false
        return this.prisma.sceneMoments.update({
            where: { id },
            data: { is_active: false },
        });
    }

    // ==================== COVERAGE ASSIGNMENTS ====================

    /**
     * Generate assignment labels for scene coverage (V1, V2, A1, A2, etc.)
     */
    private generateCoverageAssignments(sceneCoverage: Array<{ coverage: { coverage_type: string | null } }>) {
        const typeCounters: { [key: string]: number } = { VIDEO: 0, AUDIO: 0 };

        return sceneCoverage.map(item => {
            const type = item.coverage.coverage_type;
            if (!type) return 'M1'; // Fallback for missing type

            const prefix = type === 'VIDEO' ? 'V' : type === 'AUDIO' ? 'A' : 'M';
            typeCounters[type] = (typeCounters[type] || 0) + 1;
            return `${prefix}${typeCounters[type]}`;
        });
    }

    /**
     * Update assignment labels for all coverage in a scene
     */
    async updateSceneCoverageAssignments(sceneId: number) {
        // Get all coverage for the scene ordered by creation/id
        const sceneCoverage = await this.prisma.sceneCoverage.findMany({
            where: { scene_id: sceneId },
            include: { coverage: true },
            orderBy: { coverage_id: 'asc' },
        });

        if (sceneCoverage.length === 0) {
            return { updated: 0 };
        }

        // Generate assignments
        const assignments = this.generateCoverageAssignments(sceneCoverage);

        // Update each coverage item with its assignment
        const updatePromises = sceneCoverage.map((item, index) =>
            this.prisma.sceneCoverage.update({
                where: {
                    scene_id_coverage_id: {
                        scene_id: item.scene_id,
                        coverage_id: item.coverage_id,
                    },
                },
                data: {
                    assignment: assignments[index],
                },
            })
        );

        await Promise.all(updatePromises);
        return { updated: sceneCoverage.length };
    }

    /**
     * Automatically assign existing coverage to moments in a scene
     * Keep coverage at scene level (moment_id = null) so all moments have access to all coverage
     */
    private async autoAssignCoverageToMoments(
        sceneId: number,
        existingCoverage: Array<{ coverage_id: number; scene_id: number; moment_id?: number | null }>,
        createdMoments: Array<{ id: number; name: string; order_index: number }>
    ) {
        console.log('🎯 Setting up coverage for all moments (scene-level assignment):', {
            sceneId,
            coverageCount: existingCoverage.length,
            momentCount: createdMoments.length
        });

        if (existingCoverage.length === 0) {
            console.log('⚠️ No coverage to assign');
            return;
        }

        // Set all coverage to scene level (moment_id = null) so all moments can access it
        for (const coverageItem of existingCoverage) {
            console.log(`📌 Setting coverage ${coverageItem.coverage_id} to scene level (available to all moments)`);

            await this.prisma.sceneCoverage.updateMany({
                where: {
                    scene_id: sceneId,
                    coverage_id: coverageItem.coverage_id,
                },
                data: {
                    moment_id: null, // Scene-level assignment makes it available to all moments
                },
            });
        }

        console.log('✅ Coverage setup complete - all coverage available to all moments');
    }

    /**
     * Normalize all coverage in a scene to be scene-level (moment_id = null)
     * This makes all coverage available to all moments
     */
    async normalizeSceneCoverage(sceneId: number) {
        console.log(`🔄 Normalizing coverage for scene ${sceneId} to scene-level...`);

        const result = await this.prisma.sceneCoverage.updateMany({
            where: {
                scene_id: sceneId,
            },
            data: {
                moment_id: null, // Convert all to scene-level coverage
            },
        });

        console.log(`✅ Normalized ${result.count} coverage items to scene-level for scene ${sceneId}`);
        return result;
    }

    async assignCoverageToMoment(momentId: number, coverageId: number) {
        // Verify moment exists
        const moment = await this.prisma.sceneMoments.findUnique({
            where: { id: momentId },
        });

        if (!moment) {
            throw new NotFoundException(`Scene moment with ID ${momentId} not found`);
        }

        // Update the scene coverage to link to this moment
        return this.prisma.sceneCoverage.updateMany({
            where: {
                scene_id: moment.scene_id,
                coverage_id: coverageId,
            },
            data: {
                moment_id: momentId,
            },
        });
    }

    async removeCoverageFromMoment(momentId: number, coverageId: number) {
        // Verify moment exists
        const moment = await this.prisma.sceneMoments.findUnique({
            where: { id: momentId },
        });

        if (!moment) {
            throw new NotFoundException(`Scene moment with ID ${momentId} not found`);
        }

        // Remove the moment link from scene coverage
        return this.prisma.sceneCoverage.updateMany({
            where: {
                scene_id: moment.scene_id,
                coverage_id: coverageId,
                moment_id: momentId,
            },
            data: {
                moment_id: null,
            },
        });
    }

    // Music management methods
    async createSceneMomentMusic(data: CreateSceneMomentMusicDto) {
        // Check if moment exists
        const moment = await this.prisma.sceneMoments.findUnique({
            where: { id: data.moment_id },
        });

        if (!moment) {
            throw new NotFoundException(`Scene moment with ID ${data.moment_id} not found`);
        }

        // Check if music already exists for this moment
        const existingMusic = await this.prisma.sceneMomentMusic.findUnique({
            where: { moment_id: data.moment_id },
        });

        if (existingMusic) {
            throw new BadRequestException(`Music already exists for moment ${data.moment_id}. Use update instead.`);
        }

        return this.prisma.sceneMomentMusic.create({
            data,
        });
    }

    async updateSceneMomentMusic(momentId: number, data: UpdateSceneMomentMusicDto) {
        const music = await this.prisma.sceneMomentMusic.findUnique({
            where: { moment_id: momentId },
        });

        if (!music) {
            throw new NotFoundException(`Music not found for moment ${momentId}`);
        }

        return this.prisma.sceneMomentMusic.update({
            where: { moment_id: momentId },
            data,
        });
    }

    async deleteSceneMomentMusic(momentId: number) {
        const music = await this.prisma.sceneMomentMusic.findUnique({
            where: { moment_id: momentId },
        });

        if (!music) {
            throw new NotFoundException(`Music not found for moment ${momentId}`);
        }

        return this.prisma.sceneMomentMusic.delete({
            where: { moment_id: momentId },
        });
    }

    async getSceneMomentMusic(momentId: number) {
        return this.prisma.sceneMomentMusic.findUnique({
            where: { moment_id: momentId },
        });
    }
}
