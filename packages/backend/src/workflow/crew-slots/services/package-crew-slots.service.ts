import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const SLOT_INCLUDE = {
    crew: {
        include: {
            contact: { select: { id: true, first_name: true, last_name: true, email: true } },
            job_role_assignments: {
                include: {
                    job_role: { select: { id: true, name: true, display_name: true } },
                    payment_bracket: { select: { id: true, name: true, display_name: true, level: true, hourly_rate: true, half_day_rate: true, day_rate: true, overtime_rate: true } },
                },
            },
        },
    },
    job_role: { select: { id: true, name: true, display_name: true, category: true } },
    equipment: { include: { equipment: true } },
    package_event_day: { include: { event_day: true } } as const,
    activity_assignments: { include: { package_activity: true } },
} as const;

@Injectable()
export class PackageCrewSlotsService {
    constructor(private readonly prisma: PrismaService) {}

    private async resolvePackageEventDayId(packageId: number, dayId: number): Promise<number> {
        const byJoinId = await this.prisma.packageEventDay.findFirst({
            where: { id: dayId, package_id: packageId },
            select: { id: true },
        });
        if (byJoinId) return byJoinId.id;

        const byTemplateId = await this.prisma.packageEventDay.findUnique({
            where: {
                package_id_event_day_template_id: {
                    package_id: packageId,
                    event_day_template_id: dayId,
                },
            },
            select: { id: true },
        });
        if (byTemplateId) return byTemplateId.id;

        throw new NotFoundException('Package event day not found');
    }

    private toCompatibleSlot(slot: Record<string, any>) {
        return {
            ...slot,
            event_day_template_id: slot.package_event_day?.event_day_template_id ?? null,
            package_activity_id: slot.activity_assignments?.[0]?.package_activity_id ?? null,
        };
    }

    async getPackageDayCrewSlots(packageId: number, eventDayId?: number) {
        const where: Record<string, unknown> = { package_id: packageId };
        if (eventDayId) {
            where.OR = [
                { package_event_day_id: eventDayId },
                { package_event_day: { event_day_template_id: eventDayId } },
            ];
        }
        const rows = await this.prisma.packageCrewSlot.findMany({
            where,
            include: SLOT_INCLUDE,
            orderBy: [{ package_event_day_id: 'asc' }, { order_index: 'asc' }],
        });
        return rows.map((row) => this.toCompatibleSlot(row));
    }

    async addCrewSlotToPackageDay(
        packageId: number,
        dto: {
            package_event_day_id: number;
            job_role_id: number;
            crew_id?: number | null;
            hours?: number;
            label?: string | null;
        },
    ) {
        if (dto.crew_id) {
            const crew = await this.prisma.crew.findUnique({ where: { id: dto.crew_id } });
            if (!crew) throw new NotFoundException('Crew not found');
        }

        const packageEventDayId = await this.resolvePackageEventDayId(packageId, dto.package_event_day_id);

        const maxOrder = await this.prisma.packageCrewSlot.aggregate({
            where: { package_id: packageId, package_event_day_id: packageEventDayId },
            _max: { order_index: true },
        });
        try {
            const slot = await this.prisma.packageCrewSlot.create({
                data: {
                    package_id: packageId,
                    package_event_day_id: packageEventDayId,
                    crew_id: dto.crew_id ?? null,
                    job_role_id: dto.job_role_id,
                    hours: dto.hours ?? 8,
                    label: dto.label ?? null,
                    order_index: (maxOrder._max.order_index ?? -1) + 1,
                },
            });
            await this._autoAssignActivitiesToSlot(slot.id, packageId, packageEventDayId, dto.job_role_id);
            return this.getCrewSlotById(slot.id);
        } catch (err) {
            if ((err as { code?: string }).code === 'P2002') {
                throw new ConflictException('A crew slot with this role and order already exists for this package day');
            }
            throw err;
        }
    }

    private async _autoAssignActivitiesToSlot(slotId: number, packageId: number, packageEventDayId: number, _jobRoleId: number) {
        const activities = await this.prisma.packageActivity.findMany({
            where: { package_id: packageId, package_event_day_id: packageEventDayId },
            select: { id: true },
        });
        if (activities.length === 0) return;
        await this.prisma.packageCrewSlotActivity.createMany({
            data: activities.map((a) => ({ package_crew_slot_id: slotId, package_activity_id: a.id })),
            skipDuplicates: true,
        });
    }

    async assignCrewToSlot(slotId: number, dto: { crew_id?: number | null }) {
        const existing = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId } });
        if (!existing) throw new NotFoundException('Crew slot not found');
        if (dto.crew_id) {
            const crew = await this.prisma.crew.findUnique({ where: { id: dto.crew_id } });
            if (!crew) throw new NotFoundException('Crew not found');
        }
        await this.prisma.packageCrewSlot.update({ where: { id: slotId }, data: { crew_id: dto.crew_id } });
        return this.getCrewSlotById(slotId);
    }

    async updateCrewSlot(
        slotId: number,
        dto: {
            crew_id?: number | null;
            job_role_id?: number;
            hours?: number;
            label?: string | null;
            order_index?: number;
        },
    ) {
        const existing = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId } });
        if (!existing) throw new NotFoundException('Crew slot not found');
        await this.prisma.packageCrewSlot.update({
            where: { id: slotId },
            data: {
                crew_id: dto.crew_id !== undefined ? dto.crew_id : undefined,
                job_role_id: dto.job_role_id ?? undefined,
                hours: dto.hours ?? undefined,
                label: dto.label !== undefined ? dto.label : undefined,
                order_index: dto.order_index ?? undefined,
            },
        });
        return this.getCrewSlotById(slotId);
    }

    async removeCrewSlot(slotId: number) {
        const existing = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId } });
        if (!existing) throw new NotFoundException('Crew slot not found');
        return this.prisma.packageCrewSlot.delete({ where: { id: slotId } });
    }

    async setSlotEquipment(slotId: number, equipmentIds: { equipment_id: number; is_primary: boolean }[]) {
        const existing = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId } });
        if (!existing) throw new NotFoundException('Crew slot not found');
        await this.prisma.packageCrewSlotEquipment.deleteMany({ where: { package_crew_slot_id: slotId } });
        if (equipmentIds.length > 0) {
            await this.prisma.packageCrewSlotEquipment.createMany({
                data: equipmentIds.map((eq) => ({ package_crew_slot_id: slotId, equipment_id: eq.equipment_id, is_primary: eq.is_primary })),
                skipDuplicates: true,
            });
        }
        return this.getCrewSlotById(slotId);
    }

    async assignSlotToActivity(slotId: number, activityId: number) {
        const existing = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId } });
        if (!existing) throw new NotFoundException('Crew slot not found');
        try {
            await this.prisma.packageCrewSlotActivity.create({
                data: { package_crew_slot_id: slotId, package_activity_id: activityId },
            });
        } catch { /* Already assigned — ignore */ }
        return this.getCrewSlotById(slotId);
    }

    async unassignSlotFromActivity(slotId: number, activityId: number) {
        const existing = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId } });
        if (!existing) throw new NotFoundException('Crew slot not found');
        await this.prisma.packageCrewSlotActivity.deleteMany({
            where: { package_crew_slot_id: slotId, package_activity_id: activityId },
        });
        return this.getCrewSlotById(slotId);
    }

    async getCrewSlotById(slotId: number) {
        const row = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId }, include: SLOT_INCLUDE });
        return row ? this.toCompatibleSlot(row) : row;
    }

    /** Ensure every crew slot on a day is linked to every activity on that same day. Idempotent. */
    async syncCrewActivities(packageId: number) {
        const [slots, activities] = await Promise.all([
            this.prisma.packageCrewSlot.findMany({
                where: { package_id: packageId },
                select: { id: true, package_event_day_id: true },
            }),
            this.prisma.packageActivity.findMany({
                where: { package_id: packageId },
                select: { id: true, package_event_day_id: true },
            }),
        ]);
        const pairs: { package_crew_slot_id: number; package_activity_id: number }[] = [];
        for (const slot of slots) {
            for (const activity of activities) {
                if (slot.package_event_day_id === activity.package_event_day_id) {
                    pairs.push({ package_crew_slot_id: slot.id, package_activity_id: activity.id });
                }
            }
        }
        if (pairs.length === 0) return { synced: 0 };
        const result = await this.prisma.packageCrewSlotActivity.createMany({ data: pairs, skipDuplicates: true });
        return { synced: result.count };
    }
}
