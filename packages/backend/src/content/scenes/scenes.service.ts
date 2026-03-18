import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { FilmScene } from '@prisma/client';
import { SceneType, MontageStyle } from '@prisma/client';

export interface SceneResponseDto {
    id: number;
    film_id: number;
    name: string;
    mode: SceneType;
    scene_template_id: number | null;
    shot_count?: number | null;
    duration_seconds?: number | null;
    montage_style?: MontageStyle | null;
    montage_bpm?: number | null;
    order_index: number;
    created_at: Date;
    updated_at: Date;
    beats?: Array<{
        id: number;
        film_scene_id: number;
        name: string;
        order_index: number;
        shot_count?: number | null;
        duration_seconds: number;
        created_at: Date;
        updated_at: Date;
    }>;
}

@Injectable()
export class ScenesService {
    constructor(private prisma: PrismaService) { }

    private mapToResponseDto(scene: FilmScene): SceneResponseDto {
        return {
            id: scene.id,
            film_id: scene.film_id,
            name: scene.name,
            mode: scene.mode,
            scene_template_id: scene.scene_template_id,
            shot_count: (scene as any).shot_count ?? null,
            duration_seconds: (scene as any).duration_seconds ?? null,
            montage_style: scene.montage_style ?? null,
            montage_bpm: scene.montage_bpm ?? null,
            order_index: scene.order_index,
            created_at: scene.created_at,
            updated_at: scene.updated_at,
        };
    }

    async create(createSceneDto: CreateSceneDto) {
        // Verify film exists (film_id is guaranteed to be set by controller)
        const filmId = createSceneDto.film_id!;
        
        const film = await this.prisma.film.findUnique({
            where: { id: filmId },
        });

        if (!film) {
            throw new NotFoundException(
                `Film with ID ${filmId} not found`,
            );
        }

        // If scene_template_id provided, verify it exists and get mode
        let sceneMode: SceneType =
            createSceneDto.mode === 'MONTAGE' ? SceneType.MONTAGE : SceneType.MOMENTS;
        if (createSceneDto.scene_template_id) {
            const template = await this.prisma.sceneTemplate.findUnique({
                where: { id: createSceneDto.scene_template_id },
            });

            if (!template) {
                throw new NotFoundException(
                    `Scene template with ID ${createSceneDto.scene_template_id} not found`,
                );
            }
            if (template.type) sceneMode = template.type;
        }

        // Auto-assign order_index if not provided
        const orderIndex = createSceneDto.order_index ?? 
            (await this.prisma.filmScene.count({ where: { film_id: filmId } }));

        const scene = await this.prisma.filmScene.create({
            data: {
                film_id: filmId,
                name: createSceneDto.name,
                scene_template_id: createSceneDto.scene_template_id || null,
                mode: sceneMode,
                shot_count: createSceneDto.shot_count ?? null,
                duration_seconds: createSceneDto.duration_seconds ?? null,
                montage_style: createSceneDto.montage_style
                    ? (createSceneDto.montage_style as MontageStyle)
                    : null,
                montage_bpm: createSceneDto.montage_bpm ?? null,
                order_index: orderIndex,
            },
        });

        return this.mapToResponseDto(scene);
    }

    async findAll(filmId: number) {
        // Verify film exists
        const film = await this.prisma.film.findUnique({
            where: { id: filmId },
        });

        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        const scenes = await this.prisma.filmScene.findMany({
            where: { film_id: filmId },
            include: {
                template: true,
                location_assignment: {
                    include: { location: true },
                },
                moments: {
                    include: {
                        recording_setup: {
                            include: {
                                camera_assignments: {
                                    include: { track: true },
                                },
                            },
                        },
                        moment_music: true,
                        subjects: {
                            include: {
                                subject: {
                                    include: {
                                        role_template: true,
                                    },
                                },
                            },
                        },
                    },
                },
                beats: {
                    orderBy: { order_index: 'asc' },
                    include: { recording_setup: true },
                },
                recording_setup: {
                    include: {
                        camera_assignments: {
                            include: {
                                track: true,
                            },
                        },
                    },
                },
                scene_music: true,
            },
            orderBy: { order_index: 'asc' },
        });

        return scenes.map(s => ({
            ...this.mapToResponseDto(s),
            template: s.template ? {
                id: s.template.id,
                name: s.template.name,
                type: s.template.type,
            } : null,
            location_assignment: (s as any).location_assignment ? {
                id: (s as any).location_assignment.id,
                location_id: (s as any).location_assignment.location_id,
                location: (s as any).location_assignment.location ? {
                    id: (s as any).location_assignment.location.id,
                    name: (s as any).location_assignment.location.name,
                } : null,
            } : null,
            moments: s.moments.map(m => ({
                ...m,
                has_recording_setup: !!(m as any).recording_setup,
                recording_setup: (m as any).recording_setup ? {
                    id: (m as any).recording_setup.id,
                    audio_track_ids: (m as any).recording_setup.audio_track_ids,
                    graphics_enabled: (m as any).recording_setup.graphics_enabled,
                    graphics_title: (m as any).recording_setup.graphics_title ?? null,
                    camera_assignments: ((m as any).recording_setup.camera_assignments || []).map((a: any) => ({
                        track_id: a.track_id,
                        track_name: a.track?.name || String(a.track_id),
                        track_type: a.track?.type ? String(a.track.type) : undefined,
                        subject_ids: a.subject_ids,
                        shot_type: a.shot_type ?? null,
                    })),
                } : null,
                subjects: m.subjects.map(ms => ({
                    ...ms,
                    subject: ms.subject ? {
                        ...ms.subject,
                        role: ms.subject.role_template ? {
                            id: ms.subject.role_template.id,
                            role_name: ms.subject.role_template.role_name,
                            description: ms.subject.role_template.description,
                            is_core: ms.subject.role_template.is_core,
                        } : null,
                    } : null,
                })),
            })),
            moments_count: s.moments.length,
            beats: s.beats.map((b) => ({
                id: b.id,
                film_scene_id: b.film_scene_id,
                name: b.name,
                order_index: b.order_index,
                shot_count: b.shot_count ?? null,
                duration_seconds: b.duration_seconds,
                recording_setup: b.recording_setup
                    ? {
                        id: b.recording_setup.id,
                        camera_track_ids: b.recording_setup.camera_track_ids,
                        audio_track_ids: b.recording_setup.audio_track_ids,
                        graphics_enabled: b.recording_setup.graphics_enabled,
                        created_at: b.recording_setup.created_at,
                        updated_at: b.recording_setup.updated_at,
                    }
                    : null,
                created_at: b.created_at,
                updated_at: b.updated_at,
            })),
            recording_setup: s.recording_setup ? {
                id: s.recording_setup.id,
                audio_track_ids: s.recording_setup.audio_track_ids,
                graphics_enabled: s.recording_setup.graphics_enabled,
                camera_assignments: s.recording_setup.camera_assignments.map(a => ({
                    track_id: a.track_id,
                    track_name: a.track?.name || String(a.track_id),
                    track_type: a.track?.type ? String(a.track.type) : undefined,
                    subject_ids: a.subject_ids,
                })),
            } : null,
            scene_music: (s as any).scene_music
                ? {
                    id: (s as any).scene_music.id,
                    film_scene_id: (s as any).scene_music.film_scene_id,
                    music_name: (s as any).scene_music.music_name,
                    artist: (s as any).scene_music.artist,
                    duration: (s as any).scene_music.duration,
                    music_type: (s as any).scene_music.music_type,
                    created_at: (s as any).scene_music.created_at,
                    updated_at: (s as any).scene_music.updated_at,
                }
                : null,
        }));
    }

    async findOne(id: number) {
        const scene = await this.prisma.filmScene.findUnique({
            where: { id },
            include: {
                film: true,
                template: true,
                moments: {
                    orderBy: { order_index: 'asc' },
                    include: {
                        recording_setup: {
                            include: {
                                camera_assignments: {
                                    include: { track: true },
                                },
                            },
                        },
                        moment_music: true,
                        subjects: {
                            include: {
                                subject: {
                                    include: {
                                        role_template: true,
                                    },
                                },
                            },
                        },
                    },
                },
                beats: {
                    orderBy: { order_index: 'asc' },
                    include: { recording_setup: true },
                },
                recording_setup: {
                    include: {
                        camera_assignments: {
                            include: {
                                track: true,
                            },
                        },
                    },
                },
                scene_music: true,
            },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${id} not found`);
        }

        return {
            ...this.mapToResponseDto(scene),
            film_name: scene.film.name,
            template: scene.template ? {
                id: scene.template.id,
                name: scene.template.name,
                type: scene.template.type,
            } : null,
            moments: scene.moments.map(m => ({
                id: m.id,
                name: m.name,
                order_index: m.order_index,
                duration: m.duration,
                created_at: m.created_at,
                has_recording_setup: !!(m as any).recording_setup,
                recording_setup: (m as any).recording_setup ? {
                    id: (m as any).recording_setup.id,
                    audio_track_ids: (m as any).recording_setup.audio_track_ids,
                    graphics_enabled: (m as any).recording_setup.graphics_enabled,
                    graphics_title: (m as any).recording_setup.graphics_title ?? null,
                    camera_assignments: ((m as any).recording_setup.camera_assignments || []).map((a: any) => ({
                        track_id: a.track_id,
                        track_name: a.track?.name || String(a.track_id),
                        track_type: a.track?.type ? String(a.track.type) : undefined,
                        subject_ids: a.subject_ids,
                        shot_type: a.shot_type ?? null,
                    })),
                } : null,
                moment_music: (m as any).moment_music
                    ? {
                        id: (m as any).moment_music.id,
                        moment_id: (m as any).moment_music.moment_id,
                        music_name: (m as any).moment_music.music_name,
                        artist: (m as any).moment_music.artist,
                        duration: (m as any).moment_music.duration,
                        music_type: (m as any).moment_music.music_type,
                        overrides_scene_music: (m as any).moment_music.overrides_scene_music,
                        created_at: (m as any).moment_music.created_at,
                        updated_at: (m as any).moment_music.updated_at,
                    }
                    : null,
                subjects: m.subjects.map(ms => ({
                    ...ms,
                    subject: ms.subject ? {
                        ...ms.subject,
                        role: ms.subject.role_template ? {
                            id: ms.subject.role_template.id,
                            role_name: ms.subject.role_template.role_name,
                            description: ms.subject.role_template.description,
                            is_core: ms.subject.role_template.is_core,
                        } : null,
                    } : null,
                })),
            })),
            beats: scene.beats.map((b) => ({
                id: b.id,
                film_scene_id: b.film_scene_id,
                name: b.name,
                order_index: b.order_index,
                shot_count: b.shot_count ?? null,
                duration_seconds: b.duration_seconds,
                recording_setup: b.recording_setup
                    ? {
                        id: b.recording_setup.id,
                        camera_track_ids: b.recording_setup.camera_track_ids,
                        audio_track_ids: b.recording_setup.audio_track_ids,
                        graphics_enabled: b.recording_setup.graphics_enabled,
                        created_at: b.recording_setup.created_at,
                        updated_at: b.recording_setup.updated_at,
                    }
                    : null,
                created_at: b.created_at,
                updated_at: b.updated_at,
            })),
            recording_setup: scene.recording_setup ? {
                id: scene.recording_setup.id,
                audio_track_ids: scene.recording_setup.audio_track_ids,
                graphics_enabled: scene.recording_setup.graphics_enabled,
                camera_assignments: scene.recording_setup.camera_assignments.map(a => ({
                    track_id: a.track_id,
                    track_name: a.track?.name || String(a.track_id),
                    track_type: a.track?.type ? String(a.track.type) : undefined,
                    subject_ids: a.subject_ids,
                })),
            } : null,
            scene_music: scene.scene_music ? {
                id: scene.scene_music.id,
                music_type: scene.scene_music.music_type,
            } : null,
        };
    }

    async getRecordingSetup(sceneId: number) {
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
            include: {
                recording_setup: {
                    include: {
                        camera_assignments: {
                            include: {
                                track: true,
                            },
                        },
                    },
                },
            },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        return scene.recording_setup ? {
            id: scene.recording_setup.id,
            audio_track_ids: scene.recording_setup.audio_track_ids,
            graphics_enabled: scene.recording_setup.graphics_enabled,
            camera_assignments: scene.recording_setup.camera_assignments.map(a => ({
                track_id: a.track_id,
                track_name: a.track?.name || String(a.track_id),
                track_type: a.track?.type ? String(a.track.type) : undefined,
                subject_ids: a.subject_ids,
            })),
        } : null;
    }

    async upsertRecordingSetup(sceneId: number, data: {
        camera_track_ids?: number[];
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
    }) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const cameraTrackIds = Array.from(
            new Set((data.camera_track_ids || []).filter((id) => Number.isInteger(id)))
        );
        const audioTrackIds = Array.from(
            new Set((data.audio_track_ids || []).filter((id) => Number.isInteger(id)))
        );

        const existing = await this.prisma.sceneRecordingSetup.findUnique({
            where: { scene_id: sceneId },
        });

        if (existing) {
            await this.prisma.sceneCameraAssignment.deleteMany({
                where: { recording_setup_id: existing.id },
            });

            return this.prisma.sceneRecordingSetup.update({
                where: { scene_id: sceneId },
                data: {
                    audio_track_ids: audioTrackIds,
                    graphics_enabled: !!data.graphics_enabled,
                    ...(cameraTrackIds.length > 0
                        ? {
                              camera_assignments: {
                                  createMany: {
                                      data: cameraTrackIds.map(trackId => ({
                                          track_id: trackId,
                                          subject_ids: [],
                                      })),
                                  },
                              },
                          }
                        : {}),
                },
            });
        }

        return this.prisma.sceneRecordingSetup.create({
            data: {
                scene_id: sceneId,
                audio_track_ids: audioTrackIds,
                graphics_enabled: !!data.graphics_enabled,
                ...(cameraTrackIds.length > 0
                    ? {
                          camera_assignments: {
                              createMany: {
                                  data: cameraTrackIds.map(trackId => ({
                                      track_id: trackId,
                                      subject_ids: [],
                                  })),
                              },
                          },
                      }
                    : {}),
            },
        });
    }

    async deleteRecordingSetup(sceneId: number) {
        const existing = await this.prisma.sceneRecordingSetup.findUnique({
            where: { scene_id: sceneId },
        });

        if (!existing) {
            return { message: `Scene recording setup not found` };
        }

        await this.prisma.sceneRecordingSetup.delete({
            where: { scene_id: sceneId },
        });

        return { message: `Scene recording setup deleted successfully` };
    }

    async update(id: number, updateSceneDto: UpdateSceneDto) {
        // Verify scene exists
        const scene = await this.prisma.filmScene.findUnique({
            where: { id },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${id} not found`);
        }

        // If scene_template_id provided and changed, verify it exists
        if (updateSceneDto.scene_template_id !== undefined && updateSceneDto.scene_template_id !== null) {
            const template = await this.prisma.sceneTemplate.findUnique({
                where: { id: updateSceneDto.scene_template_id },
            });

            if (!template) {
                throw new NotFoundException(
                    `Scene template with ID ${updateSceneDto.scene_template_id} not found`,
                );
            }
        }

        const updated = await this.prisma.filmScene.update({
            where: { id },
            data: {
                ...updateSceneDto,
                shot_count: updateSceneDto.shot_count ?? null,
                duration_seconds: updateSceneDto.duration_seconds ?? null,
                montage_style: updateSceneDto.montage_style !== undefined
                    ? (updateSceneDto.montage_style as unknown as MontageStyle | null)
                    : undefined,
                montage_bpm: updateSceneDto.montage_bpm !== undefined
                    ? updateSceneDto.montage_bpm
                    : undefined,
            },
        });

        return this.mapToResponseDto(updated);
    }

    async remove(id: number) {
        // Verify scene exists
        const scene = await this.prisma.filmScene.findUnique({
            where: { id },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${id} not found`);
        }

        // Delete will cascade automatically due to onDelete: Cascade in schema
        await this.prisma.filmScene.delete({
            where: { id },
        });

        return { message: `Scene with ID ${id} deleted successfully` };
    }

    async getScenesByTemplate(templateId: number) {
        // Verify template exists
        const template = await this.prisma.sceneTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new NotFoundException(
                `Scene template with ID ${templateId} not found`,
            );
        }

        const scenes = await this.prisma.filmScene.findMany({
            where: { scene_template_id: templateId },
            include: {
                moments: {
                    include: {
                        subjects: {
                            include: {
                                subject: {
                                    include: {
                                        role_template: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { order_index: 'asc' },
        });

        return scenes.map(s => ({
            ...this.mapToResponseDto(s),
            moments_count: s.moments.length,
        }));
    }

    async reorderScenes(filmId: number, sceneOrderings: Array<{ id: number; order_index: number }>) {
        // Verify film exists
        const film = await this.prisma.film.findUnique({
            where: { id: filmId },
        });

        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        const updates = sceneOrderings.map(ordering =>
            this.prisma.filmScene.update({
                where: { id: ordering.id },
                data: { order_index: ordering.order_index },
            })
        );

        await Promise.all(updates);

        return {
            message: `Reordered ${sceneOrderings.length} scenes`,
            film_id: filmId,
        };
    }

    // Get all global scene templates with moments and suggested subjects
    async getSceneTemplates() {
        const templates = await this.prisma.sceneTemplate.findMany({
            include: {
                moments: {
                    orderBy: { order_index: 'asc' },
                },
                suggested_subjects: {
                    include: {
                        subject_template: true,
                    },
                },
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
                category: s.subject_template.category,
            })),
            recording_setup: t.recording_setup ?? null,
            moments_count: t.moments.length,
        }));
    }

    async createTemplateFromScene(sceneId: number, name?: string) {
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
            include: {
                moments: { orderBy: { order_index: 'asc' } },
                beats: { orderBy: { order_index: 'asc' } },
                recording_setup: {
                    include: {
                        camera_assignments: true,
                    },
                },
                subjects: {
                    include: {
                        subject: true,
                    },
                },
            },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const baseName = (name || scene.name || 'Scene').trim();
        let uniqueName = baseName;
        let suffix = 1;

        while (await this.prisma.sceneTemplate.findUnique({ where: { name: uniqueName } })) {
            suffix += 1;
            uniqueName = `${baseName} (${suffix})`;
        }

        const hasMoments = scene.moments.length > 0;
        const hasBeats = scene.beats.length > 0;
        const templateType: SceneType = hasBeats && !hasMoments ? SceneType.MONTAGE : SceneType.MOMENTS;

        const templateMoments = hasMoments
            ? scene.moments.map((moment) => ({
                name: moment.name,
                order_index: moment.order_index,
                estimated_duration: moment.duration ?? 60,
            }))
            : scene.beats.map((beat) => ({
                name: beat.name,
                order_index: beat.order_index,
                estimated_duration: beat.duration_seconds ?? 10,
            }));

        const recordingSetup = scene.recording_setup
            ? {
                camera_count: scene.recording_setup.camera_assignments.length,
                audio_count: scene.recording_setup.audio_track_ids.length,
                graphics_enabled: scene.recording_setup.graphics_enabled,
            }
            : null;

        const suggestedSubjectsData = await (async () => {
            if (!scene.subjects || scene.subjects.length === 0) return [] as Array<{ subject_template_id: number; is_required: boolean }>;

            const subjectTemplates = await Promise.all(
                scene.subjects
                    .filter((sceneSubject) => sceneSubject.subject)
                    .map(async (sceneSubject) => {
                        const subject = sceneSubject.subject!;
                        const subjectTemplate = await this.prisma.subjectTemplate.upsert({
                            where: { name: subject.name },
                            update: {
                                category: subject.category,
                            },
                            create: {
                                name: subject.name,
                                category: subject.category,
                                is_system: false,
                            },
                        });

                        return {
                            subject_template_id: subjectTemplate.id,
                            is_required: sceneSubject.priority === 'PRIMARY',
                        };
                    })
            );

            const unique = new Map<number, { subject_template_id: number; is_required: boolean }>();
            subjectTemplates.forEach((entry) => {
                if (!entry) return;
                if (!unique.has(entry.subject_template_id)) {
                    unique.set(entry.subject_template_id, entry);
                }
            });

            return Array.from(unique.values());
        })();

        const template = await this.prisma.sceneTemplate.create({
            data: {
                name: uniqueName,
                type: templateType,
                recording_setup: recordingSetup ?? undefined,
                moments: templateMoments.length
                    ? {
                        create: templateMoments,
                    }
                    : undefined,
                suggested_subjects: suggestedSubjectsData.length
                    ? {
                        createMany: {
                            data: suggestedSubjectsData,
                        },
                    }
                    : undefined,
            },
            include: {
                moments: { orderBy: { order_index: 'asc' } },
                suggested_subjects: {
                    include: {
                        subject_template: true,
                    },
                },
            },
        });

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
                category: s.subject_template.category,
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
}
