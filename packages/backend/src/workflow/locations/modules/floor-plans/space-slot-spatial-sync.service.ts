import { Injectable, Logger } from '@nestjs/common';
import { EquipmentCategory, TrackType } from '@prisma/client';
import {
    buildCeremonyBlueprintSubjectRoleInstances,
    computeCeremonyGuestSeatCapacity,
    CeremonySeatLayoutMode,
    floorPlanSubjectLabel,
} from '@projectflo/shared';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { spaceSlotSpatialInclude } from './space-slot-spatial.service';

type SlotSeedObject = {
    object_type: string;
    label: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    metadata: unknown;
};

type CameraSeedPosition = {
    x: number;
    y: number;
    rotation: number;
    fovAngle: number;
};

type CeremonyCameraGeometry = {
    aisleLeft: number;
    aisleRight: number;
    seatingTop: number;
    seatingBottom: number;
};

@Injectable()
export class SpaceSlotSpatialSyncService {
    private readonly logger = new Logger(SpaceSlotSpatialSyncService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getByActivity(activityId: number) {
        const assignments = await this.prisma.spaceActivityAssignment.findMany({
            where: { package_activity_id: activityId },
            include: {
                package_space_slot: {
                    include: spaceSlotSpatialInclude,
                },
            },
            orderBy: { created_at: 'asc' },
        });

        let slots = assignments.map((assignment) => assignment.package_space_slot);

        if (slots.length === 0) {
            const activity = await this.prisma.packageActivity.findUnique({
                where: { id: activityId },
                include: { package_event_day: true },
            });
            if (!activity) {
                return [];
            }

            const label = `${activity.name} Space`;
            const slot = await this.prisma.packageSpaceSlot.upsert({
                where: {
                    package_id_event_day_template_id_label: {
                        package_id: activity.package_id,
                        event_day_template_id: activity.package_event_day.event_day_template_id,
                        label,
                    },
                },
                create: {
                    package_id: activity.package_id,
                    event_day_template_id: activity.package_event_day.event_day_template_id,
                    label,
                },
                update: {},
                include: spaceSlotSpatialInclude,
            });

            await this.prisma.spaceActivityAssignment.upsert({
                where: {
                    package_space_slot_id_package_activity_id: {
                        package_space_slot_id: slot.id,
                        package_activity_id: activityId,
                    },
                },
                create: {
                    package_space_slot_id: slot.id,
                    package_activity_id: activityId,
                },
                update: {},
            });

            slots = [slot];
        }

        for (const slot of slots) {
            const changed = await this.syncCamerasAndSubjects(slot.id, activityId);
            if (changed) {
                const refreshed = await this.prisma.packageSpaceSlot.findUnique({
                    where: { id: slot.id },
                    include: spaceSlotSpatialInclude,
                });
                if (refreshed) {
                    Object.assign(slot, refreshed);
                }
            }
        }

        return slots;
    }

    async getByPackage(packageId: number, options: { sync?: boolean } = {}) {
        const slots = await this.prisma.packageSpaceSlot.findMany({
            where: { package_id: packageId },
            include: {
                activity_assignments: {
                    select: { package_activity_id: true },
                },
                ...spaceSlotSpatialInclude,
            },
            orderBy: { created_at: 'asc' },
        });

        if (options.sync === false) {
            return slots;
        }

        let anyChanged = false;
        for (const slot of slots) {
            for (const assignment of slot.activity_assignments) {
                const changed = await this.syncCamerasAndSubjects(slot.id, assignment.package_activity_id);
                if (changed) {
                    anyChanged = true;
                }
            }
        }

        if (!anyChanged) {
            return slots;
        }

        return this.prisma.packageSpaceSlot.findMany({
            where: { package_id: packageId },
            include: {
                activity_assignments: {
                    select: { package_activity_id: true },
                },
                ...spaceSlotSpatialInclude,
            },
            orderBy: { created_at: 'asc' },
        });
    }

    async syncCamerasAndSubjects(slotId: number, activityId: number): Promise<boolean> {
        let changed = false;

        const objects = await this.prisma.spaceSlotObject.findMany({
            where: { package_space_slot_id: slotId },
            select: { object_type: true, label: true, x: true, y: true, width: true, height: true, metadata: true },
        });
        const focalPoint = this.findFocalPoint(objects);
        this.logger.log(
            `[syncCamerasAndSubjects] slot=${slotId} activity=${activityId} objects=${objects.length} ` +
            `focal=(${Math.round(focalPoint.x)},${Math.round(focalPoint.y)})`,
        );

        const crewAssignments = await this.prisma.packageCrewSlotActivity.findMany({
            where: { package_activity_id: activityId },
            include: {
                package_crew_slot: {
                    select: {
                        id: true,
                        crew_id: true,
                        label: true,
                        order_index: true,
                        job_role: { select: { name: true, display_name: true } },
                    },
                },
            },
        });

        const existingCameras = await this.prisma.spaceSlotCameraPosition.findMany({
            where: { package_space_slot_id: slotId },
            select: {
                id: true,
                crew_slot_id: true,
                label: true,
                x: true,
                y: true,
                rotation: true,
                fov_angle: true,
                is_unmanned: true,
                order_index: true,
            },
            orderBy: { order_index: 'asc' },
        });

        const desiredCameras = await this.buildDesiredCameraPositions(activityId, focalPoint, crewAssignments, objects);
        const staleCameraIds = existingCameras.slice(desiredCameras.length).map((camera) => camera.id);
        this.logger.log(
            `[syncCamerasAndSubjects] slot=${slotId} activity=${activityId} ` +
            `crewAssignments=${crewAssignments.length} existingCameras=${existingCameras.length} desiredCameras=${desiredCameras.length}`,
        );
        if (crewAssignments.length === 0) {
            this.logger.warn(
                `[syncCamerasAndSubjects] slot=${slotId} activity=${activityId} has no crew-slot assignments. ` +
                `No camera positions will be seeded.`,
            );
        }

        if (staleCameraIds.length > 0) {
            await this.prisma.spaceSlotCameraPosition.deleteMany({
                where: {
                    package_space_slot_id: slotId,
                    id: { in: staleCameraIds },
                },
            });
            changed = true;
        }

        for (const desired of desiredCameras) {
            const existing = existingCameras.find((camera) => camera.order_index === desired.orderIndex);

            if (!existing) {
                await this.prisma.spaceSlotCameraPosition.create({
                    data: {
                        package_space_slot_id: slotId,
                        crew_slot_id: desired.crewSlotId,
                        is_unmanned: desired.isUnmanned,
                        label: desired.label,
                        x: desired.x,
                        y: desired.y,
                        rotation: desired.rotation,
                        fov_angle: desired.fovAngle,
                        order_index: desired.orderIndex,
                    },
                });
                changed = true;
                continue;
            }

            const legacyGeometry = this.matchesLegacyAutoSeed(existing, focalPoint, desired.orderIndex, desiredCameras.length);
            if (
                legacyGeometry ||
                existing.label !== desired.label ||
                existing.crew_slot_id !== desired.crewSlotId ||
                existing.is_unmanned !== desired.isUnmanned ||
                existing.order_index !== desired.orderIndex
            ) {
                await this.prisma.spaceSlotCameraPosition.update({
                    where: { id: existing.id },
                    data: {
                        crew_slot_id: desired.crewSlotId,
                        is_unmanned: desired.isUnmanned,
                        label: desired.label,
                        ...(legacyGeometry
                            ? {
                                x: desired.x,
                                y: desired.y,
                                rotation: desired.rotation,
                                fov_angle: desired.fovAngle,
                            }
                            : {}),
                        order_index: desired.orderIndex,
                    },
                });
                changed = true;
            }
        }

        const subjectAssignments = await this.prisma.packageDaySubjectActivity.findMany({
            where: { package_activity_id: activityId },
            include: {
                package_day_subject: {
                    select: { id: true, name: true, order_index: true, count: true },
                },
            },
        });

        const existingSubjects = await this.prisma.spaceSlotSubjectPosition.findMany({
            where: { package_space_slot_id: slotId },
            select: { id: true, day_subject_id: true, order_index: true },
            orderBy: { order_index: 'asc' },
        });
        const existingByDaySubjectId = new Map<number, typeof existingSubjects>();
        for (const subject of existingSubjects) {
            if (subject.day_subject_id == null) continue;
            const entries = existingByDaySubjectId.get(subject.day_subject_id) ?? [];
            entries.push(subject);
            existingByDaySubjectId.set(subject.day_subject_id, entries);
        }
        this.logger.log(
            `[syncCamerasAndSubjects] slot=${slotId} activity=${activityId} ` +
            `subjectAssignments=${subjectAssignments.length} existingSubjects=${existingSubjects.length}`,
        );
        if (subjectAssignments.length === 0) {
            this.logger.warn(
                `[syncCamerasAndSubjects] slot=${slotId} activity=${activityId} has no subject assignments. ` +
                `Floor plan will render with no people until ActivityPlanner assigns PackageDaySubjectActivity rows.`,
            );
        }

        const chairObjects = objects
            .filter((object) => object.object_type === 'CHAIR_ROW')
            .map((object) => ({
                object_type: object.object_type,
                x: object.x,
                y: object.y,
                width: object.width,
                height: object.height,
                metadata: (object.metadata as Record<string, unknown> | null) ?? null,
            }));
        const guestSeatCapacity = chairObjects.length > 0
            ? computeCeremonyGuestSeatCapacity(chairObjects, CeremonySeatLayoutMode.FLUID)
            : 0;

        const subjectInstances = buildCeremonyBlueprintSubjectRoleInstances(
            subjectAssignments.map((assignment) => ({
                roleId: assignment.package_day_subject_id,
                roleLabel: assignment.package_day_subject.name,
                typicalCount: assignment.package_day_subject.count,
                orderIndex: assignment.package_day_subject.order_index,
                assignment,
            })),
            guestSeatCapacity > 0 ? { guestSeatCapacity } : undefined,
        );

        const desiredCopyCountByDaySubjectId = new Map<number, number>();
        for (const instance of subjectInstances) {
            desiredCopyCountByDaySubjectId.set(
                instance.role.assignment.package_day_subject.id,
                instance.copyCount,
            );
        }

        for (const assignment of subjectAssignments) {
            const daySubject = assignment.package_day_subject;
            const desiredCount = desiredCopyCountByDaySubjectId.get(daySubject.id)
                ?? Math.max(Math.floor(Number(daySubject.count ?? 1)), 1);
            const baseOrder = daySubject.order_index * 1000;
            const existingForSubject = existingByDaySubjectId.get(daySubject.id) ?? [];
            const staleSubjectIds = existingForSubject
                .filter((position) => position.order_index - baseOrder >= desiredCount)
                .map((position) => position.id);
            if (staleSubjectIds.length > 0) {
                await this.prisma.spaceSlotSubjectPosition.deleteMany({
                    where: {
                        package_space_slot_id: slotId,
                        id: { in: staleSubjectIds },
                    },
                });
                this.logger.log(
                    `[syncCamerasAndSubjects] pruned ${staleSubjectIds.length} excess subject position(s) ` +
                    `slot=${slotId} daySubject=${daySubject.id} label="${daySubject.name}" cap=${desiredCount}`,
                );
                changed = true;
            }
        }

        const refreshedSubjects = await this.prisma.spaceSlotSubjectPosition.findMany({
            where: { package_space_slot_id: slotId },
            select: { id: true, day_subject_id: true, order_index: true },
            orderBy: { order_index: 'asc' },
        });
        const refreshedByDaySubjectId = new Map<number, typeof refreshedSubjects>();
        for (const subject of refreshedSubjects) {
            if (subject.day_subject_id == null) continue;
            const entries = refreshedByDaySubjectId.get(subject.day_subject_id) ?? [];
            entries.push(subject);
            refreshedByDaySubjectId.set(subject.day_subject_id, entries);
        }

        for (const instance of subjectInstances) {
            const daySubject = instance.role.assignment.package_day_subject;
            const existingForSubject = refreshedByDaySubjectId.get(daySubject.id) ?? [];
            if (existingForSubject[instance.copyIndex]) continue;

            const isGroup = instance.copyCount > 1;
            const frontRowPos = instance.copyIndex === 0
                ? this.computeFrontRowSeatPosition(daySubject.name, objects)
                : null;
            const subjectPosition = frontRowPos
                ?? this.computeSubjectPosition(focalPoint, instance.instanceOrdinal, subjectInstances.length);
            const isSeated = isGroup || frontRowPos !== null;
            await this.prisma.spaceSlotSubjectPosition.create({
                data: {
                    package_space_slot_id: slotId,
                    day_subject_id: daySubject.id,
                    label: floorPlanSubjectLabel(daySubject.name, instance.copyIndex, instance.copyCount) || daySubject.name,
                    x: subjectPosition.x,
                    y: subjectPosition.y,
                    rotation: subjectPosition.rotation,
                    order_index: daySubject.order_index * 1000 + instance.copyIndex,
                    seated: isSeated,
                },
            });
            this.logger.log(
                `[syncCamerasAndSubjects] seeded subject slot=${slotId} daySubject=${daySubject.id} copy=${instance.copyIndex + 1}/${instance.copyCount} ` +
                `label="${daySubject.name}" pos=(${Math.round(subjectPosition.x)},${Math.round(subjectPosition.y)}) rot=${Math.round(subjectPosition.rotation)}`,
            );
            changed = true;
        }

        this.logger.log(`[syncCamerasAndSubjects] COMPLETE slot=${slotId} activity=${activityId} changed=${changed}`);

        return changed;
    }

    private async buildDesiredCameraPositions(
        activityId: number,
        focalPoint: { x: number; y: number },
        crewAssignments: Array<{
            package_crew_slot_id: number;
            package_crew_slot: {
                id: number;
                crew_id: number | null;
                label: string | null;
                order_index: number;
                job_role: { name: string | null; display_name: string | null } | null;
            };
        }>,
        objects: SlotSeedObject[],
    ): Promise<Array<{
        label: string;
        x: number;
        y: number;
        rotation: number;
        fovAngle: number;
        orderIndex: number;
        crewSlotId: number | null;
        isUnmanned: boolean;
    }>> {
        const linkedFilmTracks = await this.getLinkedFilmCameraTracks(activityId);
        const videographerSlots = crewAssignments.filter(
            (assignment) => assignment.package_crew_slot.job_role?.name === 'videographer',
        );
        const ceremonyGeometry = this.buildCeremonyCameraGeometry(objects, focalPoint);

        if (linkedFilmTracks.length > 0) {
            return linkedFilmTracks.map((track, index) => {
                const matchedCrewSlot = videographerSlots.find(
                    (assignment) =>
                        assignment.package_crew_slot.crew_id != null &&
                        track.crewId != null &&
                        assignment.package_crew_slot.crew_id === track.crewId,
                ) ?? videographerSlots[index] ?? null;

                const cameraPosition = this.computeCameraPosition(focalPoint, index, linkedFilmTracks.length, ceremonyGeometry);
                return {
                    label: track.label,
                    x: cameraPosition.x,
                    y: cameraPosition.y,
                    rotation: cameraPosition.rotation,
                    fovAngle: cameraPosition.fovAngle,
                    orderIndex: index,
                    crewSlotId: matchedCrewSlot?.package_crew_slot_id ?? null,
                    isUnmanned: track.isUnmanned,
                };
            });
        }

        const desired = videographerSlots.map((assignment, index) => {
            const cameraPosition = this.computeCameraPosition(focalPoint, index, videographerSlots.length, ceremonyGeometry);
            return {
                label: `Camera ${index + 1}`,
                x: cameraPosition.x,
                y: cameraPosition.y,
                rotation: cameraPosition.rotation,
                fovAngle: cameraPosition.fovAngle,
                orderIndex: index,
                crewSlotId: assignment.package_crew_slot_id,
                isUnmanned: false,
            };
        });

        for (const assignment of videographerSlots) {
            const unmannedEquipment = await this.prisma.packageCrewSlotEquipment.findMany({
                where: {
                    package_crew_slot_id: assignment.package_crew_slot_id,
                    equipment: { is_unmanned: true, category: EquipmentCategory.CAMERA },
                },
                select: { id: true },
            });

            for (let index = 0; index < unmannedEquipment.length; index++) {
                const orderIndex = desired.length;
                const cameraPosition = this.computeCameraPosition(
                    focalPoint,
                    orderIndex,
                    videographerSlots.length + unmannedEquipment.length,
                    ceremonyGeometry,
                );
                desired.push({
                    label: `Camera ${orderIndex + 1}`,
                    x: cameraPosition.x,
                    y: cameraPosition.y,
                    rotation: cameraPosition.rotation,
                    fovAngle: cameraPosition.fovAngle,
                    orderIndex,
                    crewSlotId: assignment.package_crew_slot_id,
                    isUnmanned: true,
                });
            }
        }

        return desired;
    }

    private async getLinkedFilmCameraTracks(activityId: number): Promise<Array<{
        label: string;
        crewId: number | null;
        isUnmanned: boolean;
    }>> {
        const sceneSchedules = await this.prisma.packageFilmSceneSchedule.findMany({
            where: { package_activity_id: activityId },
            select: {
                package_film: {
                    select: { film_id: true },
                },
            },
            orderBy: { id: 'asc' },
        });

        const filmId = sceneSchedules[0]?.package_film.film_id;
        if (!filmId) {
            return [];
        }

        const videoTracks = await this.prisma.filmTimelineTrack.findMany({
            where: {
                film_id: filmId,
                is_active: true,
                type: TrackType.VIDEO,
            },
            orderBy: { order_index: 'asc' },
            select: {
                name: true,
                crew_id: true,
                is_unmanned: true,
            },
        });

        return videoTracks.map((track, index) => ({
            label: track.name || `Camera ${index + 1}`,
            crewId: track.crew_id ?? null,
            isUnmanned: track.is_unmanned,
        }));
    }

    /**
     * Maps subject role names to their designated front-row seat.
     * `side` is 'L' (bride side) or 'R' (groom side).
     * `colFromAisle` is 0 = aisle seat, 1 = next seat in, etc.
     */
    private static readonly FRONT_ROW_SEATS: Record<string, { side: 'L' | 'R'; colFromAisle: number }> = {
        'mother of bride': { side: 'L', colFromAisle: 0 },
        'father of bride': { side: 'L', colFromAisle: 1 },
        'mother of groom': { side: 'R', colFromAisle: 0 },
        'father of groom': { side: 'R', colFromAisle: 1 },
    };

    /**
     * Returns the canvas coordinate for a named role's designated front-row seat,
     * derived from the actual CHAIR_ROW objects in the slot.
     * Returns null if the subject is not in FRONT_ROW_SEATS or no matching row exists.
     */
    private computeFrontRowSeatPosition(
        subjectName: string,
        objects: Array<{ object_type: string; x: number; y: number; width: number; height: number; metadata: unknown }>,
    ): { x: number; y: number; rotation: number } | null {
        const key = subjectName.toLowerCase().trim();
        const seat = SpaceSlotSpatialSyncService.FRONT_ROW_SEATS[key];
        if (!seat) return null;

        const frontRow = objects.find((o) => {
            if (o.object_type !== 'CHAIR_ROW') return false;
            const meta = (o.metadata as Record<string, unknown> | null) ?? {};
            return String(meta.side) === seat.side && Number(meta.row_index) === 0;
        });
        if (!frontRow) return null;

        const meta = (frontRow.metadata as Record<string, unknown> | null) ?? {};
        const cols = Math.max(1, Number(meta.seat_cols ?? meta.capacity ?? 5));
        const colStep = frontRow.width / cols;

        // Aisle is at the high-x edge of the L side and the low-x edge of the R side.
        const col = seat.side === 'L'
            ? cols - 1 - seat.colFromAisle   // L: rightmost col = aisle
            : seat.colFromAisle;              // R: leftmost col = aisle

        return {
            x: Math.round(frontRow.x + (col + 0.5) * colStep),
            y: Math.round(frontRow.y + frontRow.height / 2),
            rotation: 0, // facing the altar
        };
    }

    private static readonly FOCAL_TYPES = [
        'ALTAR', 'ARCH', 'STAGE', 'MANDAP', 'TABLE_HEAD', 'DANCE_FLOOR', 'DJ_BOOTH',
    ];

    private findFocalPoint(
        objects: Array<{ object_type: string; x: number; y: number; width: number; height: number }>,
    ): { x: number; y: number } {
        for (const focalType of SpaceSlotSpatialSyncService.FOCAL_TYPES) {
            const object = objects.find((entry) => entry.object_type === focalType);
            if (object) {
                return {
                    x: Math.round(object.x + object.width / 2),
                    y: Math.round(object.y + object.height / 2),
                };
            }
        }

        if (objects.length > 0) {
            return {
                x: Math.round(objects.reduce((sum, object) => sum + object.x + object.width / 2, 0) / objects.length),
                y: Math.round(objects.reduce((sum, object) => sum + object.y + object.height / 2, 0) / objects.length),
            };
        }

        return { x: 500, y: 300 };
    }

    private computeCameraPosition(
        focal: { x: number; y: number },
        index: number,
        total: number,
        geometry: CeremonyCameraGeometry | null,
    ): CameraSeedPosition {
        const seeded = geometry
            ? this.computeCeremonyCameraPosition(focal, index, total, geometry)
            : this.computeGenericCameraPosition(focal, index, total);

        return {
            x: Math.max(20, Math.min(980, seeded.x)),
            y: Math.max(20, Math.min(980, seeded.y)),
            rotation: ((seeded.rotation % 360) + 360) % 360,
            fovAngle: seeded.fovAngle,
        };
    }

    private buildCeremonyCameraGeometry(
        objects: SlotSeedObject[],
        focal: { x: number; y: number },
    ): CeremonyCameraGeometry | null {
        const chairRows = objects.filter((object) => object.object_type === 'CHAIR_ROW');
        if (chairRows.length < 2) {
            return null;
        }

        const leftRows = chairRows.filter((row) => row.x + row.width / 2 < focal.x);
        const rightRows = chairRows.filter((row) => row.x + row.width / 2 > focal.x);
        if (leftRows.length === 0 || rightRows.length === 0) {
            return null;
        }

        const aisleLeft = Math.max(...leftRows.map((row) => row.x + row.width));
        const aisleRight = Math.min(...rightRows.map((row) => row.x));
        if (aisleRight - aisleLeft < 30) {
            return null;
        }

        return {
            aisleLeft,
            aisleRight,
            seatingTop: Math.min(...chairRows.map((row) => row.y)),
            seatingBottom: Math.max(...chairRows.map((row) => row.y + row.height)),
        };
    }

    private computeCeremonyCameraPosition(
        focal: { x: number; y: number },
        index: number,
        total: number,
        geometry: CeremonyCameraGeometry,
    ): CameraSeedPosition {
        const aisleWidth = geometry.aisleRight - geometry.aisleLeft;
        const aislePadding = Math.max(18, Math.min(30, Math.round(aisleWidth * 0.22)));
        const centerX = Math.round((geometry.aisleLeft + geometry.aisleRight) / 2);
        const leftEdgeX = Math.round(geometry.aisleLeft + aislePadding);
        const rightEdgeX = Math.round(geometry.aisleRight - aislePadding);
        const frontAisleY = this.clamp(Math.round(focal.y + 170), geometry.seatingTop + 80, geometry.seatingBottom - 150);
        const closeAisleY = this.clamp(frontAisleY - 30, geometry.seatingTop + 60, geometry.seatingBottom - 170);
        const entranceY = Math.round(geometry.seatingBottom + 70);
        const midAisleY = this.clamp(Math.round(focal.y + 340), frontAisleY + 90, entranceY - 140);

        const templates: Array<{ x: number; y: number; fovAngle: number }> = [
            { x: centerX, y: entranceY, fovAngle: 72 },
            { x: leftEdgeX, y: frontAisleY, fovAngle: 44 },
            { x: rightEdgeX, y: closeAisleY, fovAngle: 28 },
            { x: centerX, y: midAisleY, fovAngle: 52 },
            { x: leftEdgeX, y: entranceY - 40, fovAngle: 58 },
            { x: rightEdgeX, y: entranceY - 40, fovAngle: 58 },
        ];

        const template = templates[index] ?? this.computeGenericCameraPosition(focal, index, total);
        return {
            x: template.x,
            y: template.y,
            rotation: this.rotationToFocalPoint(template, focal),
            fovAngle: template.fovAngle,
        };
    }

    private computeGenericCameraPosition(
        focal: { x: number; y: number },
        index: number,
        total: number,
    ): CameraSeedPosition {
        const arcStart = Math.PI / 4;
        const arcEnd = (3 * Math.PI) / 4;
        const angle = total <= 1
            ? Math.PI / 2
            : arcStart + (arcEnd - arcStart) * (index / Math.max(1, total - 1));
        const radius = total <= 1
            ? 420
            : 260 + Math.abs(index - (total - 1) / 2) * 70;
        const x = Math.round(focal.x + Math.cos(angle) * radius);
        const y = Math.round(focal.y + Math.sin(angle) * radius);

        return {
            x,
            y,
            rotation: this.rotationToFocalPoint({ x, y }, focal),
            fovAngle: index === 0 ? 72 : index === 1 ? 44 : 32,
        };
    }

    private computeLegacyCameraPosition(
        focal: { x: number; y: number },
        index: number,
        total: number,
    ): { x: number; y: number; rotation: number } {
        const distance = 350;
        const arcStart = Math.PI / 2 - Math.PI / 3;
        const arcEnd = Math.PI / 2 + Math.PI / 3;
        const angle = total <= 1
            ? Math.PI / 2
            : arcStart + (arcEnd - arcStart) * (index / Math.max(1, total - 1));

        const x = Math.round(focal.x + Math.cos(angle) * distance * (index % 2 === 0 ? -1 : 1));
        const y = Math.round(focal.y + distance);

        return {
            x,
            y,
            rotation: this.rotationToFocalPoint({ x, y }, focal),
        };
    }

    private matchesLegacyAutoSeed(
        existing: { x: number; y: number; rotation: number; fov_angle: number | null },
        focal: { x: number; y: number },
        index: number,
        total: number,
    ): boolean {
        const legacy = this.computeLegacyCameraPosition(focal, index, total);
        return Math.abs(existing.x - legacy.x) <= 2
            && Math.abs(existing.y - legacy.y) <= 2
            && (existing.fov_angle == null || existing.fov_angle === 60);
    }

    private rotationToFocalPoint(position: { x: number; y: number }, focal: { x: number; y: number }): number {
        const dx = focal.x - position.x;
        const dy = focal.y - position.y;
        return Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
    }

    private clamp(value: number, min: number, max: number): number {
        if (min > max) {
            return min;
        }
        return Math.min(max, Math.max(min, value));
    }

    private computeSubjectPosition(
        focal: { x: number; y: number },
        index: number,
        total: number,
    ): { x: number; y: number; rotation: number } {
        if (total <= 1) {
            return { x: focal.x, y: focal.y, rotation: 180 };
        }

        const radius = 40 + Math.min(index, 4) * 30;
        const spreadAngle = Math.PI * 0.8;
        const startAngle = Math.PI / 2 - spreadAngle / 2;
        const angle = startAngle + spreadAngle * (index / (total - 1));

        const x = Math.round(focal.x + Math.cos(angle) * radius * (index % 2 === 0 ? 1 : -1));
        const y = Math.round(focal.y + Math.sin(angle) * (radius * 0.5));

        return {
            x: Math.max(20, Math.min(980, x)),
            y: Math.max(20, Math.min(980, y)),
            rotation: 180,
        };
    }
}