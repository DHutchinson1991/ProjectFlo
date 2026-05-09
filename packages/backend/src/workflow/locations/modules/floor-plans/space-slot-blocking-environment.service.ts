import { Injectable } from '@nestjs/common';
import { type FacingTargetType } from '@prisma/client';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { SpaceSlotSpatialService } from './space-slot-spatial.service';

type SpaceSlotRecord = Awaited<ReturnType<SpaceSlotSpatialService['getById']>>;

type FacingEntity = {
    x: number;
    y: number;
    rotation: number;
    facing_target_type: FacingTargetType | null;
    facing_target_id: number | null;
};

@Injectable()
export class SpaceSlotBlockingEnvironmentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly spaceSlots: SpaceSlotSpatialService,
    ) {}

    async resolveAllFacing(slotId: number): Promise<{
        cameras: Record<number, number>;
        subjects: Record<number, number>;
    }> {
        const slot = await this.spaceSlots.getById(slotId);
        return this.resolveAllFacingForSlot(slot);
    }

    async buildContext(slotId: number, momentId?: number) {
        const slot = await this.spaceSlots.getById(slotId);
        const resolved = await this.resolveAllFacingForSlot(slot);

        const zones = slot.zones.map((zone) => ({
            name: zone.name,
            label: zone.label,
            description: zone.description,
            polygon: zone.polygon,
        }));

        const objects = slot.objects.map((object) => ({
            id: object.id,
            type: object.object_type,
            label: object.label,
            x: object.x,
            y: object.y,
            width: object.width,
            height: object.height,
            rotation: object.rotation,
        }));

        const cameras = slot.camera_positions.map((camera) => {
            let x = camera.x;
            let y = camera.y;
            let rotation = resolved.cameras[camera.id] ?? camera.rotation;
            let fovAngle = camera.fov_angle;

            if (momentId) {
                const override = camera.moment_overrides.find((entry) => entry.moment_id === momentId);
                if (override) {
                    x = override.x;
                    y = override.y;
                    rotation = override.rotation;
                    if (override.fov_angle != null) {
                        fovAngle = override.fov_angle;
                    }
                }
            }

            return {
                id: camera.id,
                label: camera.label,
                crew_slot: camera.crew_slot?.label ?? null,
                x,
                y,
                rotation,
                fov_angle: fovAngle,
                focal_length_mm: camera.focal_length_mm,
                facing: camera.facing_target_type,
            };
        });

        const subjects = slot.subject_positions.map((subject) => {
            let x = subject.x;
            let y = subject.y;
            let rotation = resolved.subjects[subject.id] ?? subject.rotation;

            if (momentId) {
                const override = subject.moment_overrides.find((entry) => entry.moment_id === momentId);
                if (override) {
                    x = override.x;
                    y = override.y;
                    rotation = override.rotation;
                }
            }

            return {
                id: subject.id,
                label: subject.label,
                day_subject: subject.day_subject?.name ?? null,
                x,
                y,
                rotation,
                bound_to: subject.bound_object
                    ? {
                        object_id: subject.bound_object.id,
                        label: subject.bound_object.label,
                        type: subject.bound_object.object_type,
                    }
                    : null,
                facing: subject.facing_target_type,
            };
        });

        return {
            slot_id: slot.id,
            label: slot.label,
            canvas: { width: slot.canvas_width, height: slot.canvas_height },
            zones,
            objects,
            cameras,
            subjects,
        };
    }

    private async resolveAllFacingForSlot(slot: SpaceSlotRecord): Promise<{
        cameras: Record<number, number>;
        subjects: Record<number, number>;
    }> {
        const cameras: Record<number, number> = {};
        const subjects: Record<number, number> = {};

        for (const camera of slot.camera_positions) {
            cameras[camera.id] = await this.resolveFacing(camera);
        }

        for (const subject of slot.subject_positions) {
            subjects[subject.id] = await this.resolveFacing(subject);
        }

        return { cameras, subjects };
    }

    private async resolveFacing(entity: FacingEntity): Promise<number> {
        const type = entity.facing_target_type ?? 'ANGLE';
        if (type === 'ANGLE' || !entity.facing_target_id) {
            return entity.rotation;
        }

        let targetX: number;
        let targetY: number;

        switch (type) {
            case 'SUBJECT': {
                const subject = await this.prisma.spaceSlotSubjectPosition.findUnique({
                    where: { id: entity.facing_target_id },
                });
                if (!subject) {
                    return entity.rotation;
                }
                targetX = subject.x;
                targetY = subject.y;
                break;
            }
            case 'OBJECT': {
                const object = await this.prisma.spaceSlotObject.findUnique({
                    where: { id: entity.facing_target_id },
                });
                if (!object) {
                    return entity.rotation;
                }
                targetX = object.x + object.width / 2;
                targetY = object.y + object.height / 2;
                break;
            }
            default:
                return entity.rotation;
        }

        const dx = targetX - entity.x;
        const dy = targetY - entity.y;
        const radians = Math.atan2(dx, -dy);
        const degrees = ((radians * 180) / Math.PI + 360) % 360;
        return Math.round(degrees * 10) / 10;
    }
}