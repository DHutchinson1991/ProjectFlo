import { Injectable } from '@nestjs/common';
import type {
    SaveSpaceSlotCanvasDto,
    UpsertSpaceSlotZoneDto,
} from './dto/space-slot-spatial.dto';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { SpaceSlotSpatialService } from './space-slot-spatial.service';

@Injectable()
export class SpaceSlotSpatialEditorService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly spaceSlots: SpaceSlotSpatialService,
    ) {}

    async saveCanvas(id: number, dto: SaveSpaceSlotCanvasDto) {
        await this.spaceSlots.getById(id);

        await this.prisma.$transaction(async (tx) => {
            const updateData: Record<string, unknown> = {};
            if (dto.layout_json !== undefined) updateData.layout_json = dto.layout_json;
            if (dto.canvas_width !== undefined) updateData.canvas_width = dto.canvas_width;
            if (dto.canvas_height !== undefined) updateData.canvas_height = dto.canvas_height;

            if (Object.keys(updateData).length > 0) {
                await tx.packageSpaceSlot.update({ where: { id }, data: updateData });
            }

            if (dto.objects) {
                const keepIds = dto.objects.filter((object) => object.id).map((object) => object.id as number);
                await tx.spaceSlotObject.deleteMany({
                    where: {
                        package_space_slot_id: id,
                        ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
                    },
                });
                for (const object of dto.objects) {
                    const data = {
                        package_space_slot_id: id,
                        object_type: object.object_type,
                        label: object.label ?? null,
                        x: object.x,
                        y: object.y,
                        width: object.width ?? 50,
                        height: object.height ?? 50,
                        rotation: object.rotation ?? 0,
                        metadata: object.metadata ?? null,
                        order_index: object.order_index ?? 0,
                    };
                    if (object.id) {
                        await tx.spaceSlotObject.update({ where: { id: object.id }, data });
                    } else {
                        await tx.spaceSlotObject.create({ data });
                    }
                }
            }

            if (dto.cameras) {
                const keepIds = dto.cameras.filter((camera) => camera.id).map((camera) => camera.id as number);
                await tx.spaceSlotCameraPosition.deleteMany({
                    where: {
                        package_space_slot_id: id,
                        ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
                    },
                });
                for (const camera of dto.cameras) {
                    const data = {
                        package_space_slot_id: id,
                        crew_slot_id: camera.crew_slot_id ?? null,
                        label: camera.label ?? null,
                        x: camera.x,
                        y: camera.y,
                        rotation: camera.rotation ?? 0,
                        focal_length_mm: camera.focal_length_mm ?? null,
                        fov_angle: camera.fov_angle ?? null,
                        is_unmanned: camera.is_unmanned ?? false,
                        facing_target_type: camera.facing_target_type ?? ('ANGLE' as const),
                        facing_target_id: camera.facing_target_id ?? null,
                        order_index: camera.order_index ?? 0,
                    };
                    if (camera.id) {
                        await tx.spaceSlotCameraPosition.update({ where: { id: camera.id }, data });
                    } else {
                        await tx.spaceSlotCameraPosition.create({ data });
                    }
                }
            }

            if (dto.subjects) {
                const keepIds = dto.subjects.filter((subject) => subject.id).map((subject) => subject.id as number);
                await tx.spaceSlotSubjectPosition.deleteMany({
                    where: {
                        package_space_slot_id: id,
                        ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
                    },
                });
                for (const subject of dto.subjects) {
                    const data = {
                        package_space_slot_id: id,
                        day_subject_id: subject.day_subject_id ?? null,
                        label: subject.label ?? null,
                        x: subject.x,
                        y: subject.y,
                        rotation: subject.rotation ?? 0,
                        bound_object_id: subject.bound_object_id ?? null,
                        bound_offset_x: subject.bound_offset_x ?? 0,
                        bound_offset_y: subject.bound_offset_y ?? 0,
                        facing_target_type: subject.facing_target_type ?? ('ANGLE' as const),
                        facing_target_id: subject.facing_target_id ?? null,
                        order_index: subject.order_index ?? 0,
                    };
                    if (subject.id) {
                        await tx.spaceSlotSubjectPosition.update({ where: { id: subject.id }, data });
                    } else {
                        await tx.spaceSlotSubjectPosition.create({ data });
                    }
                }
            }
        });

        return this.spaceSlots.getById(id);
    }

    async updateCameraPosition(cameraPositionId: number, x: number, y: number, rotation?: number) {
        return this.prisma.spaceSlotCameraPosition.update({
            where: { id: cameraPositionId },
            data: { x, y, ...(rotation !== undefined ? { rotation } : {}) },
        });
    }

    async updateSubjectPosition(subjectPositionId: number, x: number, y: number, rotation?: number) {
        return this.prisma.spaceSlotSubjectPosition.update({
            where: { id: subjectPositionId },
            data: { x, y, ...(rotation !== undefined ? { rotation } : {}) },
        });
    }

    async upsertMomentCamera(cameraPositionId: number, momentId: number, x: number, y: number, rotation?: number) {
        return this.prisma.spaceSlotMomentCamera.upsert({
            where: {
                camera_position_id_moment_id: {
                    camera_position_id: cameraPositionId,
                    moment_id: momentId,
                },
            },
            create: {
                camera_position_id: cameraPositionId,
                moment_id: momentId,
                x,
                y,
                rotation: rotation ?? 0,
            },
            update: { x, y, ...(rotation !== undefined ? { rotation } : {}) },
        });
    }

    async upsertMomentSubject(subjectPositionId: number, momentId: number, x: number, y: number, rotation?: number) {
        return this.prisma.spaceSlotMomentSubject.upsert({
            where: {
                subject_position_id_moment_id: {
                    subject_position_id: subjectPositionId,
                    moment_id: momentId,
                },
            },
            create: {
                subject_position_id: subjectPositionId,
                moment_id: momentId,
                x,
                y,
                rotation: rotation ?? 0,
            },
            update: { x, y, ...(rotation !== undefined ? { rotation } : {}) },
        });
    }

    async upsertZones(slotId: number, zones: UpsertSpaceSlotZoneDto[]) {
        await this.spaceSlots.getById(slotId);
        const keepIds = zones.filter((zone) => zone.id).map((zone) => zone.id as number);
        await this.prisma.spaceSlotZone.deleteMany({
            where: { package_space_slot_id: slotId, ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}) },
        });

        const results = [];
        for (const zone of zones) {
            const data = {
                package_space_slot_id: slotId,
                name: zone.name,
                label: zone.label ?? null,
                polygon: zone.polygon as unknown as object,
                color: zone.color ?? null,
                description: zone.description ?? null,
                order_index: zone.order_index ?? 0,
            };
            if (zone.id) {
                results.push(await this.prisma.spaceSlotZone.update({ where: { id: zone.id }, data }));
            } else {
                results.push(await this.prisma.spaceSlotZone.create({ data }));
            }
        }
        return results;
    }

}