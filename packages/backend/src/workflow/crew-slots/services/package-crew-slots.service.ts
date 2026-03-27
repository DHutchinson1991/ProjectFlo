import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const SLOT_INCLUDE = {
    crew_member: {
        include: {
            contact: { select: { id: true, first_name: true, last_name: true, email: true } },
            job_role_assignments: {
                include: {
                    job_role: { select: { id: true, name: true, display_name: true } },
                    payment_bracket: { select: { id: true, name: true, display_name: true, level: true, hourly_rate: true, day_rate: true } },
                },
            },
        },
    },
    job_role: { select: { id: true, name: true, display_name: true, category: true } },
    equipment: { include: { equipment: true } },
    event_day: true as const,
    activity_assignments: { include: { package_activity: true } },
} as const;

@Injectable()
export class PackageCrewSlotsService {
    constructor(private readonly prisma: PrismaService) {}

    async getPackageDayOperators(packageId: number, eventDayId?: number) {
        const where: Record<string, unknown> = { package_id: packageId };
        if (eventDayId) where.event_day_template_id = eventDayId;
        return this.prisma.packageCrewSlot.findMany({
            where,
            include: { ...SLOT_INCLUDE, package_activity: true },
            orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
        });
    }

    async addCrewSlotToPackageDay(
        packageId: number,
        dto: {
            event_day_template_id: number;
            job_role_id: number;
            crew_member_id?: number | null;
            hours?: number;
            label?: string | null;
            package_activity_id?: number | null;
        },
    ) {
        if (dto.crew_member_id) {
            const contributor = await this.prisma.crewMember.findUnique({ where: { id: dto.crew_member_id } });
            if (!contributor) throw new NotFoundException('Crew member not found');
        }
        const maxOrder = await this.prisma.packageCrewSlot.aggregate({
            where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
            _max: { order_index: true },
        });
        try {
            const slot = await this.prisma.packageCrewSlot.create({
                data: {
                    package_id: packageId,
                    event_day_template_id: dto.event_day_template_id,
                    crew_member_id: dto.crew_member_id ?? null,
                    job_role_id: dto.job_role_id,
                    hours: dto.hours ?? 8,
                    label: dto.label ?? null,
                    order_index: (maxOrder._max.order_index ?? -1) + 1,
                    package_activity_id: dto.package_activity_id ?? null,
                },
            });
            return this.getCrewSlotById(slot.id);
        } catch {
            throw new ConflictException('A crew slot with this role and order already exists for this package day');
        }
    }

    async assignCrewToSlot(slotId: number, dto: { crew_member_id?: number | null }) {
        const existing = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId } });
        if (!existing) throw new NotFoundException('Crew slot not found');
        if (dto.crew_member_id) {
            const contributor = await this.prisma.crewMember.findUnique({ where: { id: dto.crew_member_id } });
            if (!contributor) throw new NotFoundException('Crew member not found');
        }
        await this.prisma.packageCrewSlot.update({ where: { id: slotId }, data: { crew_member_id: dto.crew_member_id } });
        return this.getCrewSlotById(slotId);
    }

    async updateCrewSlot(
        slotId: number,
        dto: {
            crew_member_id?: number | null;
            job_role_id?: number;
            hours?: number;
            label?: string | null;
            order_index?: number;
            package_activity_id?: number | null;
        },
    ) {
        const existing = await this.prisma.packageCrewSlot.findUnique({ where: { id: slotId } });
        if (!existing) throw new NotFoundException('Crew slot not found');
        await this.prisma.packageCrewSlot.update({
            where: { id: slotId },
            data: {
                crew_member_id: dto.crew_member_id !== undefined ? dto.crew_member_id : undefined,
                job_role_id: dto.job_role_id ?? undefined,
                hours: dto.hours ?? undefined,
                label: dto.label !== undefined ? dto.label : undefined,
                order_index: dto.order_index ?? undefined,
                package_activity_id: dto.package_activity_id !== undefined ? dto.package_activity_id : undefined,
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
        return this.prisma.packageCrewSlot.findUnique({ where: { id: slotId }, include: SLOT_INCLUDE });
    }
}
