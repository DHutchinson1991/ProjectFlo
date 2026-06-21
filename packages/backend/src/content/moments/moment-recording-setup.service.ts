import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { ShotCoupling, ShotType } from '@prisma/client';
import { capSubjectIds } from '@projectflo/shared';
import { buildRecordingSetupResponse } from './moment.mapper';
import { CameraAimService } from '../../workflow/locations/modules/floor-plans/camera-aim.service';

type RecordingSetupPayload = {
    camera_track_ids?: number[];
    camera_assignments?: Array<{
        track_id: number;
        subject_ids?: number[];
        shot_type?: ShotType | null;
        shot_type_locked?: boolean;
        shot_coupling?: ShotCoupling | null;
        enabled?: boolean;
    }>;
    audio_track_ids?: number[];
    audio_assignments?: Array<{ track_id: number; subject_ids?: number[] }>;
    graphics_enabled?: boolean;
    graphics_title?: string | null;
};

type NormalizedTrackAssignment = {
    track_id: number;
    subject_ids: number[];
    shot_type?: ShotType | null;
    shot_type_locked?: boolean;
    shot_coupling?: ShotCoupling | null;
    enabled: boolean;
};

const isInteger = (value: unknown): value is number => Number.isInteger(value);

const uniqueIntegerList = (values?: number[]) =>
    Array.from(new Set((values || []).filter(isInteger)));

const normalizeTrackAssignments = (data: RecordingSetupPayload) => {
    const cameraAssignmentsSource = (data.camera_assignments || [])
        .filter((assignment) => isInteger(assignment?.track_id));
    const audioAssignmentsSource = (data.audio_assignments || [])
        .filter((assignment) => isInteger(assignment?.track_id));

    const cameraTrackIds = uniqueIntegerList(
        cameraAssignmentsSource.length > 0
            ? cameraAssignmentsSource.map((assignment) => assignment.track_id)
            : data.camera_track_ids
    );
    const audioTrackIds = uniqueIntegerList(
        audioAssignmentsSource.length > 0
            ? audioAssignmentsSource.map((assignment) => assignment.track_id)
            : data.audio_track_ids
    );

    const assignmentsByTrack = new Map<number, NormalizedTrackAssignment>();

    const ensureAssignment = (trackId: number) => {
        const existing = assignmentsByTrack.get(trackId);
        if (existing) {
            return existing;
        }

        const created: NormalizedTrackAssignment = {
            track_id: trackId,
            subject_ids: [],
            enabled: true,
        };
        assignmentsByTrack.set(trackId, created);
        return created;
    };

    cameraTrackIds.forEach(ensureAssignment);
    audioTrackIds.forEach(ensureAssignment);

    for (const assignment of cameraAssignmentsSource) {
        const normalized = ensureAssignment(assignment.track_id);
        const uniqueIds = uniqueIntegerList(assignment.subject_ids);
        normalized.subject_ids = capSubjectIds(uniqueIds, assignment.shot_type ?? null);
        normalized.shot_type = (assignment.shot_type as ShotType | null | undefined) ?? undefined;
        if (assignment.shot_type_locked !== undefined) {
            normalized.shot_type_locked = assignment.shot_type_locked;
        }
        if (assignment.shot_coupling !== undefined) {
            normalized.shot_coupling = assignment.shot_coupling;
        }
        normalized.enabled = assignment.enabled !== undefined ? assignment.enabled : normalized.enabled;
    }

    for (const assignment of audioAssignmentsSource) {
        const normalized = ensureAssignment(assignment.track_id);
        normalized.subject_ids = uniqueIntegerList(assignment.subject_ids);
    }

    return {
        audioTrackIds,
        assignments: Array.from(assignmentsByTrack.values()),
    };
};

@Injectable()
export class MomentRecordingSetupService {
    constructor(
        private prisma: PrismaService,
        private readonly cameraAim: CameraAimService,
    ) { }

    async getRecordingSetup(momentId: number) {
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id: momentId },
            include: {
                recording_setup: {
                    include: {
                        camera_assignments: { include: { track: true } },
                    },
                },
            },
        });

        if (!moment) throw new NotFoundException(`Moment with ID ${momentId} not found`);

        if (!moment.recording_setup) {
            return null;
        }

        return buildRecordingSetupResponse(moment.recording_setup);
    }

    async upsertRecordingSetup(momentId: number, data: RecordingSetupPayload) {
        const moment = await this.prisma.sceneMoment.findUnique({ where: { id: momentId } });
        if (!moment) throw new NotFoundException(`Moment with ID ${momentId} not found`);
        const { audioTrackIds, assignments } = normalizeTrackAssignments(data);
        const graphicsTitle = typeof data.graphics_title === 'string' ? data.graphics_title.trim() : undefined;
        const normalizedGraphicsTitle = data.graphics_enabled ? (graphicsTitle || null) : null;

        const existingAssignments = await this.prisma.cameraSubjectAssignment.findMany({
            where: { recording_setup: { moment_id: momentId } },
            select: { track_id: true, subject_ids: true },
        });

        const updated = await this.prisma.$transaction(async (tx) => {
            const recordingSetup = await tx.momentRecordingSetup.upsert({
                where: { moment_id: momentId },
                update: {
                    audio_track_ids: audioTrackIds,
                    graphics_enabled: !!data.graphics_enabled,
                    graphics_title: normalizedGraphicsTitle,
                },
                create: {
                    moment_id: momentId,
                    audio_track_ids: audioTrackIds,
                    graphics_enabled: !!data.graphics_enabled,
                    graphics_title: normalizedGraphicsTitle,
                },
                select: { id: true },
            });

            const currentAssignments = await tx.cameraSubjectAssignment.findMany({
                where: { recording_setup_id: recordingSetup.id },
                select: { id: true, track_id: true, subject_ids: true, shot_type: true, shot_type_locked: true },
            });
            const currentByTrack = new Map(currentAssignments.map((a) => [a.track_id, a]));
            const incomingTrackIds = new Set(assignments.map((assignment) => assignment.track_id));
            const assignmentIdsToDelete = currentAssignments
                .filter((assignment) => !incomingTrackIds.has(assignment.track_id))
                .map((assignment) => assignment.id);

            if (assignmentIdsToDelete.length > 0) {
                await tx.cameraSubjectAssignment.deleteMany({
                    where: { id: { in: assignmentIdsToDelete } },
                });
            }

            for (const assignment of assignments) {
                const existing = currentByTrack.get(assignment.track_id);
                const isShotTypeLocked = existing?.shot_type_locked === true;

                const assignmentData: {
                    subject_ids: number[];
                    shot_type?: ShotType | null;
                    shot_type_locked?: boolean;
                    shot_coupling?: ShotCoupling | null;
                    enabled: boolean;
                } = {
                    subject_ids: assignment.subject_ids,
                    enabled: assignment.enabled,
                };

                if (assignment.shot_type !== undefined && !isShotTypeLocked) {
                    assignmentData.shot_type = assignment.shot_type;
                }
                if (assignment.shot_type_locked !== undefined) {
                    assignmentData.shot_type_locked = assignment.shot_type_locked;
                }
                if (assignment.shot_coupling !== undefined) {
                    assignmentData.shot_coupling = assignment.shot_coupling;
                }

                await tx.cameraSubjectAssignment.upsert({
                    where: {
                        recording_setup_id_track_id: {
                            recording_setup_id: recordingSetup.id,
                            track_id: assignment.track_id,
                        },
                    },
                    update: assignmentData,
                    create: {
                        recording_setup_id: recordingSetup.id,
                        track_id: assignment.track_id,
                        subject_ids: assignment.subject_ids,
                        enabled: assignment.enabled,
                        shot_type_locked: assignment.shot_type_locked ?? false,
                        ...(assignment.shot_type !== undefined ? { shot_type: assignment.shot_type } : {}),
                        ...(assignment.shot_coupling !== undefined ? { shot_coupling: assignment.shot_coupling } : {}),
                    },
                });
            }

            return tx.momentRecordingSetup.findUnique({
                where: { moment_id: momentId },
                include: { camera_assignments: { include: { track: true } } },
            });
        });

        if (!updated) {
            throw new NotFoundException(`Moment recording setup for moment ${momentId} not found`);
        }

        const previousByTrack = new Map(
            existingAssignments.map((row) => [row.track_id, row.subject_ids ?? []]),
        );
        const subjectIdsChanged = assignments.some((assignment) => {
            const prev = previousByTrack.get(assignment.track_id) ?? [];
            const next = assignment.subject_ids;
            if (prev.length !== next.length) return true;
            const prevSorted = [...prev].sort((a, b) => a - b);
            const nextSorted = [...next].sort((a, b) => a - b);
            return prevSorted.some((id, i) => id !== nextSorted[i]);
        });

        if (subjectIdsChanged) {
            await this.cameraAim.aimCamerasForSceneMoment(momentId);
        }

        return buildRecordingSetupResponse(updated);
    }

    async deleteRecordingSetup(momentId: number) {
        const moment = await this.prisma.sceneMoment.findUnique({ where: { id: momentId } });
        if (!moment) throw new NotFoundException(`Moment with ID ${momentId} not found`);

        const existing = await this.prisma.momentRecordingSetup.findUnique({
            where: { moment_id: momentId },
        });

        if (!existing) {
            return { message: 'Moment recording setup not found' };
        }

        await this.prisma.momentRecordingSetup.delete({ where: { moment_id: momentId } });
        return { message: 'Moment recording setup deleted successfully' };
    }
}
