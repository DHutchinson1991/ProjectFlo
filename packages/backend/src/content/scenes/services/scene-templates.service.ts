import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { SceneType } from '@prisma/client';
import { Prisma } from '@prisma/client';

type SceneWithMomentsBeatsSetupSubjects = Prisma.FilmSceneGetPayload<{
    include: {
        moments: true;
        beats: true;
        recording_setup: { include: { camera_assignments: true } };
        subjects: { include: { subject: true } };
    };
}>;

type SceneTemplateWithIncludes = Prisma.SceneTemplateGetPayload<{
    include: {
        moments: true;
        suggested_subjects: { include: { subject_template: true } };
    };
}>;

type RecordingSetupWithAssignments = NonNullable<SceneWithMomentsBeatsSetupSubjects['recording_setup']>;

@Injectable()
export class SceneTemplatesService {
    constructor(private prisma: PrismaService) {}

    async getSceneTemplates(brandId?: number) {
        if (!brandId) {
            throw new NotFoundException('Brand context is required to load scene templates');
        }
        const templates = await this.prisma.sceneTemplate.findMany({
            where: { brand_id: brandId },
            include: {
                moments: { orderBy: { order_index: 'asc' } },
                suggested_subjects: { include: { subject_template: true } },
            },
            orderBy: { name: 'asc' },
        });
        return templates.map(t => ({
            id: t.id,
            name: t.name,
            type: t.type,
            moments: t.moments.map(m => ({
                id: m.id,
                name: m.name,
                estimated_duration: m.estimated_duration,
                order_index: m.order_index,
            })),
            suggested_subjects: t.suggested_subjects.map(s => ({
                id: s.subject_template.id,
                name: s.subject_template.name,
            })),
            recording_setup: t.recording_setup ?? null,
            moments_count: t.moments.length,
        }));
    }

    async getScenesByTemplate(templateId: number) {
        const template = await this.prisma.sceneTemplate.findUnique({
            where: { id: templateId },
        });
        if (!template) {
            throw new NotFoundException(`Scene template with ID ${templateId} not found`);
        }
        const scenes = await this.prisma.filmScene.findMany({
            where: { scene_template_id: templateId },
            include: {
                moments: {
                    include: {
                        subjects: {
                            include: { subject: { include: { role_template: true } } },
                        },
                    },
                },
            },
            orderBy: { order_index: 'asc' },
        });
        return scenes.map(s => ({
            id: s.id,
            film_id: s.film_id,
            name: s.name,
            mode: s.mode,
            scene_template_id: s.scene_template_id,
            order_index: s.order_index,
            created_at: s.created_at,
            updated_at: s.updated_at,
            moments_count: s.moments.length,
        }));
    }

    async createTemplateFromScene(sceneId: number, name?: string) {
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
            include: {
                moments: { orderBy: { order_index: 'asc' } },
                beats: { orderBy: { order_index: 'asc' } },
                recording_setup: { include: { camera_assignments: true } },
                subjects: { include: { subject: true } },
            },
        });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const film = await this.prisma.film.findUnique({
            where: { id: scene.film_id },
            select: { brand_id: true },
        });
        if (!film?.brand_id) {
            throw new NotFoundException(`Brand for scene with ID ${sceneId} not found`);
        }

        const uniqueName = await this.generateUniqueTemplateName(film.brand_id, scene.name, name);
        const { moments: templateMoments, type: templateType } = this.determineTemplateMomentsAndType(scene);
        const recordingSetup = this.mapRecordingSetup(scene.recording_setup);

        const suggestedSubjectsData = await this.buildSuggestedSubjects(
            scene.subjects,
            film.brand_id,
        );

        const template = await this.prisma.sceneTemplate.create({
            data: {
                brand_id: film.brand_id,
                name: uniqueName,
                type: templateType,
                recording_setup: recordingSetup ?? undefined,
                moments: templateMoments.length
                    ? { create: templateMoments }
                    : undefined,
                suggested_subjects: suggestedSubjectsData.length
                    ? { createMany: { data: suggestedSubjectsData } }
                    : undefined,
            },
            include: {
                moments: { orderBy: { order_index: 'asc' } },
                suggested_subjects: { include: { subject_template: true } },
            },
        });

        return this.mapTemplateToResponse(template);
    }

    private async generateUniqueTemplateName(brandId: number, sceneName: string, requestedName?: string): Promise<string> {
        const baseName = (requestedName || sceneName || 'Scene').trim();
        let uniqueName = baseName;
        let suffix = 1;
        while (
            await this.prisma.sceneTemplate.findFirst({
                where: { brand_id: brandId, name: uniqueName },
            })
        ) {
            suffix += 1;
            uniqueName = `${baseName} (${suffix})`;
        }
        return uniqueName;
    }

    private determineTemplateMomentsAndType(scene: SceneWithMomentsBeatsSetupSubjects) {
        const hasMoments = scene.moments.length > 0;
        const hasBeats = scene.beats.length > 0;
        const type = hasBeats && !hasMoments ? SceneType.MONTAGE : SceneType.MOMENTS;

        const moments = hasMoments
            ? scene.moments.map(m => ({
                  name: m.name,
                  order_index: m.order_index,
                  estimated_duration: m.duration ?? 60,
              }))
            : scene.beats.map(b => ({
                  name: b.name,
                  order_index: b.order_index,
                  estimated_duration: b.duration_seconds ?? 10,
              }));

        return { moments, type };
    }

    private mapRecordingSetup(setup: RecordingSetupWithAssignments | null) {
        if (!setup) return null;
        return {
            camera_count: setup.camera_assignments.length,
            audio_count: setup.audio_track_ids.length,
            graphics_enabled: setup.graphics_enabled,
        };
    }

    private mapTemplateToResponse(template: SceneTemplateWithIncludes) {
        return {
            id: template.id,
            name: template.name,
            type: template.type,
            moments: template.moments.map(m => ({
                id: m.id,
                name: m.name,
                estimated_duration: m.estimated_duration,
                order_index: m.order_index,
            })),
            suggested_subjects: template.suggested_subjects.map(s => ({
                id: s.subject_template.id,
                name: s.subject_template.name,
            })),
            recording_setup: template.recording_setup ?? null,
            moments_count: template.moments.length,
        };
    }

    async deleteSceneTemplate(id: number) {
        const template = await this.prisma.sceneTemplate.findUnique({ where: { id } });
        if (!template) {
            throw new NotFoundException(`Scene template with ID ${id} not found`);
        }
        await this.prisma.sceneTemplate.delete({ where: { id } });
        return { message: `Scene template with ID ${id} deleted successfully` };
    }

    private async buildSuggestedSubjects(
        sceneSubjects: Array<{ subject: { name: string } | null; priority: string }>,
        brandId: number,
    ): Promise<Array<{ subject_template_id: number; is_required: boolean }>> {
        if (!sceneSubjects || sceneSubjects.length === 0) return [];

        const entries = await Promise.all(
            sceneSubjects
                .filter(ss => ss.subject)
                .map(async ss => {
                    const subject = ss.subject;
                    if (!subject) return null;
                    const subjectTemplate = await this.prisma.subjectTemplate.upsert({
                        where: { brand_id_name: { brand_id: brandId, name: subject.name } },
                        update: { is_system: false },
                        create: { brand_id: brandId, name: subject.name, is_system: false },
                    });
                    return {
                        subject_template_id: subjectTemplate.id,
                        is_required: ss.priority === 'PRIMARY',
                    };
                }),
        );

        const unique = new Map<number, { subject_template_id: number; is_required: boolean }>();
        entries.filter((e): e is { subject_template_id: number; is_required: boolean } => !!e).forEach(e => {
            if (!unique.has(e.subject_template_id)) unique.set(e.subject_template_id, e);
        });
        return Array.from(unique.values());
    }
}
