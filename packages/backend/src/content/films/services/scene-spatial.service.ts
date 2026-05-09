import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
    UpsertCameraPositionDto,
    UpsertSubjectPositionDto,
    AddSceneSpaceDto,
    UpsertMomentCameraPositionDto,
    UpsertMomentSubjectPositionDto,
} from '../dto/scene-spatial.dto';

@Injectable()
export class SceneSpatialService {
    constructor(private prisma: PrismaService) {}

    // ── Scene Spaces ──────────────────────────────────────────

    async getSceneSpaces(sceneId: number) {
        return this.prisma.filmSceneSpace.findMany({
            where: { scene_id: sceneId },
            include: {
                space: {
                    include: {
                        type_tags: true,
                        location: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { order_index: 'asc' },
        });
    }

    async addSceneSpace(sceneId: number, dto: AddSceneSpaceDto) {
        return this.prisma.filmSceneSpace.create({
            data: {
                scene_id: sceneId,
                space_id: dto.space_id,
                order_index: dto.order_index ?? 0,
            },
            include: { space: true },
        });
    }

    async removeSceneSpace(sceneId: number, spaceId: number) {
        return this.prisma.filmSceneSpace.delete({
            where: { scene_id_space_id: { scene_id: sceneId, space_id: spaceId } },
        });
    }

    // ── Camera Positions ──────────────────────────────────────

    async getCameraPositions(sceneId: number) {
        return this.prisma.sceneCameraPosition.findMany({
            where: { scene_id: sceneId },
            include: {
                track: { select: { id: true, name: true, type: true, is_unmanned: true } },
                space: { select: { id: true, name: true } },
            },
        });
    }

    async upsertCameraPosition(sceneId: number, dto: UpsertCameraPositionDto) {
        const data = {
            scene_id: sceneId,
            track_id: dto.track_id,
            space_id: dto.space_id,
            x: dto.x,
            y: dto.y,
            rotation: dto.rotation ?? 0,
            focal_length_mm: dto.focal_length_mm ?? null,
            is_unmanned: dto.is_unmanned ?? false,
            label: dto.label ?? null,
        };

        return this.prisma.sceneCameraPosition.upsert({
            where: {
                scene_id_track_id: {
                    scene_id: sceneId,
                    track_id: dto.track_id,
                },
            },
            create: data,
            update: data,
            include: {
                track: { select: { id: true, name: true, type: true } },
                space: { select: { id: true, name: true } },
            },
        });
    }

    async removeCameraPosition(sceneId: number, trackId: number) {
        return this.prisma.sceneCameraPosition.delete({
            where: {
                scene_id_track_id: {
                    scene_id: sceneId,
                    track_id: trackId,
                },
            },
        });
    }

    // ── Subject Positions ─────────────────────────────────────

    async getSubjectPositions(sceneId: number) {
        return this.prisma.sceneSubjectPosition.findMany({
            where: { scene_id: sceneId },
            include: {
                subject: {
                    select: { id: true, name: true, role_template: { select: { role_name: true } } },
                },
                space: { select: { id: true, name: true } },
            },
        });
    }

    async upsertSubjectPosition(sceneId: number, dto: UpsertSubjectPositionDto) {
        const data = {
            scene_id: sceneId,
            subject_id: dto.subject_id,
            space_id: dto.space_id,
            x: dto.x,
            y: dto.y,
            label: dto.label ?? null,
        };

        return this.prisma.sceneSubjectPosition.upsert({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: dto.subject_id,
                },
            },
            create: data,
            update: data,
            include: {
                subject: {
                    select: { id: true, name: true, role_template: { select: { role_name: true } } },
                },
                space: { select: { id: true, name: true } },
            },
        });
    }

    async removeSubjectPosition(sceneId: number, subjectId: number) {
        return this.prisma.sceneSubjectPosition.delete({
            where: {
                scene_id_subject_id: {
                    scene_id: sceneId,
                    subject_id: subjectId,
                },
            },
        });
    }

    // ── Full Spatial Layout (read-only aggregate) ─────────────

    async getSceneSpatialLayout(sceneId: number) {
        const [spaces, cameras, subjects] = await Promise.all([
            this.getSceneSpaces(sceneId),
            this.getCameraPositions(sceneId),
            this.getSubjectPositions(sceneId),
        ]);

        return { spaces, cameras, subjects };
    }

    // ── Moment-Level Position Overrides (Keyframes) ───────────

    private readonly momentCameraInclude = {
        track: { select: { id: true, name: true, type: true, is_unmanned: true } },
        space: { select: { id: true, name: true } },
        source: { select: { id: true, x: true, y: true, rotation: true } },
    } as const;

    private readonly momentSubjectInclude = {
        subject: {
            select: { id: true, name: true, role_template: { select: { role_name: true } } },
        },
        space: { select: { id: true, name: true } },
        source: { select: { id: true, x: true, y: true } },
    } as const;

    async getMomentCameraPositions(momentId: number) {
        return this.prisma.momentCameraPosition.findMany({
            where: { moment_id: momentId },
            include: this.momentCameraInclude,
        });
    }

    async getMomentSubjectPositions(momentId: number) {
        return this.prisma.momentSubjectPosition.findMany({
            where: { moment_id: momentId },
            include: this.momentSubjectInclude,
        });
    }

    async getMomentSpatialLayout(momentId: number) {
        const [cameras, subjects] = await Promise.all([
            this.getMomentCameraPositions(momentId),
            this.getMomentSubjectPositions(momentId),
        ]);

        return { cameras, subjects };
    }

    async upsertMomentCameraPosition(momentId: number, dto: UpsertMomentCameraPositionDto) {
        const data = {
            moment_id: momentId,
            track_id: dto.track_id,
            space_id: dto.space_id,
            x: dto.x,
            y: dto.y,
            rotation: dto.rotation ?? 0,
            focal_length_mm: dto.focal_length_mm ?? null,
            is_unmanned: dto.is_unmanned ?? false,
            label: dto.label ?? null,
            source_scene_position_id: dto.source_scene_position_id ?? null,
        };

        return this.prisma.momentCameraPosition.upsert({
            where: {
                moment_id_track_id: {
                    moment_id: momentId,
                    track_id: dto.track_id,
                },
            },
            create: data,
            update: data,
            include: this.momentCameraInclude,
        });
    }

    async removeMomentCameraPosition(momentId: number, trackId: number) {
        return this.prisma.momentCameraPosition.delete({
            where: {
                moment_id_track_id: {
                    moment_id: momentId,
                    track_id: trackId,
                },
            },
        });
    }

    async upsertMomentSubjectPosition(momentId: number, dto: UpsertMomentSubjectPositionDto) {
        const data = {
            moment_id: momentId,
            subject_id: dto.subject_id,
            space_id: dto.space_id,
            x: dto.x,
            y: dto.y,
            label: dto.label ?? null,
            source_scene_position_id: dto.source_scene_position_id ?? null,
        };

        return this.prisma.momentSubjectPosition.upsert({
            where: {
                moment_id_subject_id: {
                    moment_id: momentId,
                    subject_id: dto.subject_id,
                },
            },
            create: data,
            update: data,
            include: this.momentSubjectInclude,
        });
    }

    async removeMomentSubjectPosition(momentId: number, subjectId: number) {
        return this.prisma.momentSubjectPosition.delete({
            where: {
                moment_id_subject_id: {
                    moment_id: momentId,
                    subject_id: subjectId,
                },
            },
        });
    }
}
