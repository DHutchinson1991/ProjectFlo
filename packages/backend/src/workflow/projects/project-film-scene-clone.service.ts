import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Owner target for film cloning — exactly one of projectId or inquiryId must be set.
 */
export interface FilmCloneTarget {
  projectId?: number;
  inquiryId?: number;
  projectFilmId: number;
}

export type FilmOwnerFields = { project_id: number } | { inquiry_id: number | undefined };

type SceneWithIncludes = Prisma.FilmSceneGetPayload<{
    include: {
        moments: { include: { recording_setup: { include: { camera_assignments: true } }; subjects: true }; orderBy: { order_index: 'asc' } };
        beats: { include: { recording_setup: true }; orderBy: { order_index: 'asc' } };
        subjects: true;
        location_assignment: true;
        recording_setup: { include: { camera_assignments: true } };
    };
}>;

/**
 * ProjectFilmSceneCloneService
 *
 * Clones scene-level content (scenes, moments, beats, subjects, locations,
 * recording setups) from a library Film into instance tables.
 *
 * Called by ProjectFilmCloneService after tracks/subjects/locations/equipment
 * have been copied and their ID maps are available.
 */
@Injectable()
export class ProjectFilmSceneCloneService {
    private readonly logger = new Logger(ProjectFilmSceneCloneService.name);

    constructor(private readonly prisma: PrismaService) {}

    async cloneScenes(
        prisma: Prisma.TransactionClient | PrismaService,
        ownerFields: FilmOwnerFields,
        projectFilmId: number,
        filmId: number,
        trackMap: Map<number, number>,
        subjectMap: Map<number, number>,
    ) {
        const scenes = await prisma.filmScene.findMany({
            where: { film_id: filmId },
            orderBy: { order_index: 'asc' },
            include: {
                moments: {
                    orderBy: { order_index: 'asc' },
                    include: { recording_setup: { include: { camera_assignments: true } }, subjects: true },
                },
                beats: { orderBy: { order_index: 'asc' }, include: { recording_setup: true } },
                subjects: true,
                location_assignment: true,
                recording_setup: { include: { camera_assignments: true } },
            },
        });

        const sceneMap = new Map<number, number>();
        for (const scene of scenes) {
            const instanceScene = await prisma.projectFilmScene.create({
                data: {
                    ...ownerFields,
                    project_film_id: projectFilmId,
                    source_scene_id: scene.id,
                    scene_template_id: scene.scene_template_id,
                    name: scene.name,
                    mode: scene.mode,
                    shot_count: scene.shot_count,
                    duration_seconds: scene.duration_seconds,
                    order_index: scene.order_index,
                },
            });
            sceneMap.set(scene.id, instanceScene.id);

            await this._cloneMoments(prisma, ownerFields, instanceScene.id, scene.moments, trackMap, subjectMap);
            await this._cloneBeats(prisma, ownerFields, instanceScene.id, scene.beats, trackMap);
            await this._cloneSceneSubjectsAndLocation(prisma, instanceScene.id, scene.subjects, scene.location_assignment, subjectMap);
            await this._cloneSceneRecordingSetup(prisma, instanceScene.id, scene.recording_setup, trackMap, subjectMap);
        }

        this.logger.debug(`  Scenes cloned: ${sceneMap.size}`);
        return sceneMap;
    }

    private async _cloneMoments(
        prisma: Prisma.TransactionClient | PrismaService,
        ownerFields: FilmOwnerFields,
        instanceSceneId: number,
        moments: SceneWithIncludes['moments'],
        trackMap: Map<number, number>,
        subjectMap: Map<number, number>,
    ) {
        for (const moment of moments) {
            const instanceMoment = await prisma.projectFilmSceneMoment.create({
                data: { ...ownerFields, project_scene_id: instanceSceneId, source_moment_id: moment.id, name: moment.name, order_index: moment.order_index, duration: moment.duration },
            });
            for (const ms of moment.subjects) {
                const instanceSubjectId = subjectMap.get(ms.subject_id);
                if (instanceSubjectId) await prisma.projectFilmSceneMomentSubject.create({ data: { project_moment_id: instanceMoment.id, project_film_subject_id: instanceSubjectId, priority: ms.priority, notes: ms.notes } });
            }
            if (moment.recording_setup) {
                const mrs = moment.recording_setup;
                const instanceMRS = await prisma.projectMomentRecordingSetup.create({
                    data: { project_moment_id: instanceMoment.id, audio_track_ids: mrs.audio_track_ids.map(id => trackMap.get(id) ?? id), graphics_enabled: mrs.graphics_enabled, graphics_title: mrs.graphics_title },
                });
                for (const ca of mrs.camera_assignments) {
                    const t = trackMap.get(ca.track_id);
                    if (t) await prisma.projectCameraSubjectAssignment.create({ data: { recording_setup_id: instanceMRS.id, track_id: t, subject_ids: ca.subject_ids.map(id => subjectMap.get(id) ?? id), shot_type: ca.shot_type } });
                }
            }
        }
    }

    private async _cloneBeats(
        prisma: Prisma.TransactionClient | PrismaService,
        ownerFields: FilmOwnerFields,
        instanceSceneId: number,
        beats: SceneWithIncludes['beats'],
        trackMap: Map<number, number>,
    ) {
        for (const beat of beats) {
            const instanceBeat = await prisma.projectFilmSceneBeat.create({
                data: { ...ownerFields, project_scene_id: instanceSceneId, source_beat_id: beat.id, name: beat.name, order_index: beat.order_index, shot_count: beat.shot_count, duration_seconds: beat.duration_seconds },
            });
            if (beat.recording_setup) {
                await prisma.projectBeatRecordingSetup.create({ data: { project_beat_id: instanceBeat.id, camera_track_ids: beat.recording_setup.camera_track_ids.map(id => trackMap.get(id) ?? id), audio_track_ids: beat.recording_setup.audio_track_ids.map(id => trackMap.get(id) ?? id), graphics_enabled: beat.recording_setup.graphics_enabled } });
            }
        }
    }

    private async _cloneSceneSubjectsAndLocation(
        prisma: Prisma.TransactionClient | PrismaService,
        instanceSceneId: number,
        subjects: SceneWithIncludes['subjects'],
        locationAssignment: SceneWithIncludes['location_assignment'],
        subjectMap: Map<number, number>,
    ) {
        for (const ss of subjects) {
            const instanceSubjectId = subjectMap.get(ss.subject_id);
            if (instanceSubjectId) await prisma.projectFilmSceneSubject.create({ data: { project_scene_id: instanceSceneId, project_film_subject_id: instanceSubjectId, source_scene_subject_id: ss.id, priority: ss.priority, notes: ss.notes } });
        }
        if (locationAssignment) {
            await prisma.projectFilmSceneLocation.create({ data: { project_scene_id: instanceSceneId, location_id: locationAssignment.location_id, source_scene_location_id: locationAssignment.id } });
        }
    }

    private async _cloneSceneRecordingSetup(
        prisma: Prisma.TransactionClient | PrismaService,
        instanceSceneId: number,
        recordingSetup: SceneWithIncludes['recording_setup'],
        trackMap: Map<number, number>,
        subjectMap: Map<number, number>,
    ) {
        if (!recordingSetup) return;
        const instanceSRS = await prisma.projectSceneRecordingSetup.create({
            data: { project_scene_id: instanceSceneId, audio_track_ids: recordingSetup.audio_track_ids.map(id => trackMap.get(id) ?? id), graphics_enabled: recordingSetup.graphics_enabled },
        });
        for (const ca of recordingSetup.camera_assignments) {
            const t = trackMap.get(ca.track_id);
            if (t) await prisma.projectSceneCameraAssignment.create({ data: { recording_setup_id: instanceSRS.id, track_id: t, subject_ids: ca.subject_ids.map(id => subjectMap.get(id) ?? id), project_scene_id: instanceSceneId } });
        }
    }
}
