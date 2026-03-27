import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateEquipmentAvailabilityDto } from './dto/create-equipment-availability.dto';
import { UpdateEquipmentAvailabilityDto } from './dto/update-equipment-availability.dto';
import { EquipmentAvailabilityQueryDto } from './dto/equipment-availability-query.dto';

@Injectable()
export class EquipmentAvailabilityService {
    constructor(private readonly prisma: PrismaService) { }

    async getEquipmentAvailability(equipmentId: number, queryDto: EquipmentAvailabilityQueryDto) {
        const whereClause: Record<string, unknown> = { equipment_id: equipmentId };

        if (queryDto.start_date && queryDto.end_date) {
            whereClause.OR = [
                {
                    start_date: {
                        gte: new Date(queryDto.start_date),
                        lte: new Date(queryDto.end_date),
                    }
                },
                {
                    end_date: {
                        gte: new Date(queryDto.start_date),
                        lte: new Date(queryDto.end_date),
                    }
                },
                {
                    AND: [
                        { start_date: { lte: new Date(queryDto.start_date) } },
                        { end_date: { gte: new Date(queryDto.end_date) } }
                    ]
                }
            ];
        }

        if (queryDto.status) whereClause.status = queryDto.status;
        if (queryDto.project_id) whereClause.project_id = queryDto.project_id;

        return this.prisma.equipment_availability.findMany({
            where: whereClause,
            include: {
                equipment: {
                    select: {
                        id: true,
                        item_name: true,
                        item_code: true,
                        category: true,
                        type: true,
                    }
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                        wedding_date: true,
                    }
                },
                booked_by: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            }
                        }
                    }
                },
                client: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                company_name: true,
                            }
                        }
                    }
                },
                created_by: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            }
                        }
                    }
                }
            },
            orderBy: { start_date: 'asc' }
        });
    }

    async createAvailabilitySlot(equipmentId: number, createDto: CreateEquipmentAvailabilityDto) {
        const equipment = await this.prisma.equipment.findUnique({
            where: { id: equipmentId }
        });

        if (!equipment) {
            throw new NotFoundException(`Equipment with ID ${equipmentId} not found`);
        }

        const startDate = new Date(createDto.start_date);
        const endDate = new Date(createDto.end_date);

        const overlapping = await this.prisma.equipment_availability.findFirst({
            where: {
                equipment_id: equipmentId,
                OR: [
                    {
                        start_date: { lte: endDate },
                        end_date: { gte: startDate }
                    }
                ]
            }
        });

        if (overlapping) {
            throw new BadRequestException('Equipment already has an availability slot during this time period');
        }

        return this.prisma.equipment_availability.create({
            data: {
                equipment_id: equipmentId,
                start_date: startDate,
                end_date: endDate,
                all_day: createDto.all_day ?? true,
                status: createDto.status ?? 'AVAILABLE',
                title: createDto.title,
                description: createDto.description,
                project_id: createDto.project_id,
                booked_by_id: createDto.booked_by_id,
                client_id: createDto.client_id,
                booking_notes: createDto.booking_notes,
                internal_notes: createDto.internal_notes,
                recurring_rule: createDto.recurring_rule,
                recurring_until: createDto.recurring_until ? new Date(createDto.recurring_until) : null,
                created_by_id: createDto.booked_by_id,
            },
            include: {
                equipment: true,
                project: true,
                booked_by: { include: { contact: true } },
                client: { include: { contact: true } },
                created_by: { include: { contact: true } }
            }
        });
    }

    async updateAvailabilitySlot(availabilityId: number, updateDto: UpdateEquipmentAvailabilityDto) {
        const availability = await this.prisma.equipment_availability.findUnique({
            where: { id: availabilityId }
        });

        if (!availability) {
            throw new NotFoundException(`Availability slot with ID ${availabilityId} not found`);
        }

        const updateData: Record<string, unknown> = {};

        if (updateDto.start_date) updateData.start_date = new Date(updateDto.start_date);
        if (updateDto.end_date) updateData.end_date = new Date(updateDto.end_date);
        if (updateDto.all_day !== undefined) updateData.all_day = updateDto.all_day;
        if (updateDto.status) updateData.status = updateDto.status;
        if (updateDto.title !== undefined) updateData.title = updateDto.title;
        if (updateDto.description !== undefined) updateData.description = updateDto.description;
        if (updateDto.project_id !== undefined) updateData.project_id = updateDto.project_id;
        if (updateDto.booked_by_id !== undefined) updateData.booked_by_id = updateDto.booked_by_id;
        if (updateDto.client_id !== undefined) updateData.client_id = updateDto.client_id;
        if (updateDto.booking_notes !== undefined) updateData.booking_notes = updateDto.booking_notes;
        if (updateDto.internal_notes !== undefined) updateData.internal_notes = updateDto.internal_notes;
        if (updateDto.recurring_rule !== undefined) updateData.recurring_rule = updateDto.recurring_rule;
        if (updateDto.recurring_until) updateData.recurring_until = new Date(updateDto.recurring_until);

        return this.prisma.equipment_availability.update({
            where: { id: availabilityId },
            data: updateData,
            include: {
                equipment: true,
                project: true,
                booked_by: { include: { contact: true } },
                client: { include: { contact: true } },
                created_by: { include: { contact: true } }
            }
        });
    }

    async removeAvailabilitySlot(availabilityId: number) {
        const availability = await this.prisma.equipment_availability.findUnique({
            where: { id: availabilityId }
        });

        if (!availability) {
            throw new NotFoundException(`Availability slot with ID ${availabilityId} not found`);
        }

        await this.prisma.equipment_availability.delete({ where: { id: availabilityId } });
    }

    async getAvailabilityCalendar(queryDto: EquipmentAvailabilityQueryDto) {
        const whereClause: Record<string, unknown> = {};

        if (queryDto.start_date && queryDto.end_date) {
            whereClause.OR = [
                {
                    start_date: {
                        gte: new Date(queryDto.start_date),
                        lte: new Date(queryDto.end_date),
                    }
                },
                {
                    end_date: {
                        gte: new Date(queryDto.start_date),
                        lte: new Date(queryDto.end_date),
                    }
                },
                {
                    AND: [
                        { start_date: { lte: new Date(queryDto.start_date) } },
                        { end_date: { gte: new Date(queryDto.end_date) } }
                    ]
                }
            ];
        }

        if (queryDto.status) whereClause.status = queryDto.status;
        if (queryDto.project_id) whereClause.project_id = queryDto.project_id;
        if (queryDto.equipment_id) whereClause.equipment_id = queryDto.equipment_id;

        return this.prisma.equipment_availability.findMany({
            where: whereClause,
            include: {
                equipment: {
                    select: {
                        id: true,
                        item_name: true,
                        item_code: true,
                        category: true,
                        type: true,
                        availability_status: true,
                    }
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                        wedding_date: true,
                    }
                },
                booked_by: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            }
                        }
                    }
                },
                client: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                company_name: true,
                            }
                        }
                    }
                }
            },
            orderBy: [
                { equipment_id: 'asc' },
                { start_date: 'asc' }
            ]
        });
    }
}
