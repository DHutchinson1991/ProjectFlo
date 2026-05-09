import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';

export const spaceSlotSpatialInclude = {
    objects: { orderBy: { order_index: 'asc' as const } },
    camera_positions: {
        orderBy: { order_index: 'asc' as const },
        include: {
            crew_slot: {
                select: {
                    id: true,
                    label: true,
                    job_role: { select: { id: true, name: true, display_name: true } },
                },
            },
            moment_overrides: {
                orderBy: { moment_id: 'asc' as const },
                select: {
                    id: true, moment_id: true, x: true, y: true, rotation: true,
                    fov_angle: true, facing_target_type: true, facing_target_id: true,
                },
            },
        },
    },
    subject_positions: {
        orderBy: { order_index: 'asc' as const },
        include: {
            day_subject: {
                select: { id: true, name: true, role_template_id: true },
            },
            bound_object: {
                select: { id: true, label: true, object_type: true, x: true, y: true },
            },
            moment_overrides: {
                orderBy: { moment_id: 'asc' as const },
                select: {
                    id: true, moment_id: true, x: true, y: true, rotation: true,
                    facing_target_type: true, facing_target_id: true,
                },
            },
        },
    },
    zones: {
        orderBy: { order_index: 'asc' as const },
    },
    type_tags: true,
};

@Injectable()
export class SpaceSlotSpatialService {
    constructor(private prisma: PrismaService) {}

    /**
     * Get a single space slot by ID with all spatial data.
     */
    async getById(id: number) {
        const slot = await this.prisma.packageSpaceSlot.findUnique({
            where: { id },
            include: spaceSlotSpatialInclude,
        });
        if (!slot) throw new NotFoundException(`Space slot ${id} not found`);
        return slot;
    }

    /**
     * Get all moment overrides for a given space slot + moment combination.
     */
    async getMomentOverrides(slotId: number, momentId: number) {
        const [cameras, subjects] = await Promise.all([
            this.prisma.spaceSlotMomentCamera.findMany({
                where: {
                    moment_id: momentId,
                    camera_position: { package_space_slot_id: slotId },
                },
                include: {
                    camera_position: { select: { id: true, crew_slot_id: true, label: true } },
                },
            }),
            this.prisma.spaceSlotMomentSubject.findMany({
                where: {
                    moment_id: momentId,
                    subject_position: { package_space_slot_id: slotId },
                },
                include: {
                    subject_position: { select: { id: true, day_subject_id: true, label: true } },
                },
            }),
        ]);
        return { cameras, subjects };
    }

    async getZones(slotId: number) {
        return this.prisma.spaceSlotZone.findMany({
            where: { package_space_slot_id: slotId },
            orderBy: { order_index: 'asc' },
        });
    }
}
