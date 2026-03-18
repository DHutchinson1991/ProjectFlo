import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import {
    CreateEquipmentAvailabilityDto,
    UpdateEquipmentAvailabilityDto,
    EquipmentAvailabilityQueryDto
} from './dto/equipment-availability.dto';
import { EquipmentCategory, EquipmentType, EquipmentCondition, EquipmentAvailability, Prisma } from '@prisma/client';

@Injectable()
export class EquipmentService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create new equipment
     */
    async create(createDto: CreateEquipmentDto) {
        const equipment = await this.prisma.equipment.create({
            data: {
                item_name: createDto.item_name,
                item_code: createDto.item_code,
                category: createDto.category,
                type: createDto.type,
                brand_name: createDto.brand_name,
                model: createDto.model,
                description: createDto.description,
                quantity: createDto.quantity || 1,
                condition: createDto.condition || EquipmentCondition.GOOD,
                availability_status: createDto.availability_status || EquipmentAvailability.AVAILABLE,
                vendor: createDto.vendor,
                rental_price_per_day: createDto.rental_price_per_day,
                purchase_price: createDto.purchase_price,
                purchase_date: createDto.purchase_date ? new Date(createDto.purchase_date) : null,
                weight_kg: createDto.weight_kg,
                power_usage_watts: createDto.power_usage_watts,
                dimensions: createDto.dimensions,
                specifications: createDto.specifications ? JSON.parse(JSON.stringify(createDto.specifications)) : undefined,
                attachment_type: createDto.attachment_type,
                compatibility: createDto.compatibility,
                serial_number: createDto.serial_number,
                warranty_expiry: createDto.warranty_expiry ? new Date(createDto.warranty_expiry) : null,
                last_maintenance: createDto.last_maintenance ? new Date(createDto.last_maintenance) : null,
                next_maintenance_due: createDto.next_maintenance_due ? new Date(createDto.next_maintenance_due) : null,
                location: createDto.location,
                brand_id: createDto.brand_id,
                is_active: createDto.is_active !== false,
                created_by_id: createDto.created_by_id,
            },
            include: {
                brand: true,
                created_by: {
                    include: {
                        contact: true
                    }
                }
            }
        });

        return equipment;
    }

    /**
     * Find all equipment with optional filtering
     */
    async findAll(filters?: {
        brandId?: number;
        category?: EquipmentCategory;
        type?: EquipmentType;
        availability?: EquipmentAvailability;
        condition?: EquipmentCondition;
        search?: string;
    }) {
        const where: Record<string, unknown> = {};

        if (filters?.brandId) {
            where.brand_id = filters.brandId;
        }

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.availability) {
            where.availability_status = filters.availability;
        }

        if (filters?.condition) {
            where.condition = filters.condition;
        }

        if (filters?.search) {
            where.OR = [
                { item_name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { brand_name: { contains: filters.search, mode: 'insensitive' } },
                { model: { contains: filters.search, mode: 'insensitive' } },
                { item_code: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        return this.prisma.equipment.findMany({
            where,
            include: {
                brand: true,
                created_by: {
                    include: {
                        contact: true
                    }
                },
                _count: {
                    select: {
                        rental_bookings: true,
                        maintenance_logs: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    /**
     * Find equipment by ID
     */
    async findOne(id: number) {
        const equipment = await this.prisma.equipment.findUnique({
            where: { id },
            include: {
                brand: true,
                created_by: {
                    include: {
                        contact: true
                    }
                },
                rental_bookings: {
                    include: {
                        project: true,
                        rented_by: {
                            include: {
                                contact: true
                            }
                        },
                        client: {
                            include: {
                                contact: true
                            }
                        }
                    },
                    orderBy: { created_at: 'desc' }
                },
                maintenance_logs: {
                    include: {
                        created_by: {
                            include: {
                                contact: true
                            }
                        }
                    },
                    orderBy: { performed_date: 'desc' }
                }
            }
        });

        if (!equipment) {
            throw new NotFoundException(`Equipment with ID ${id} not found`);
        }

        return equipment;
    }

    /**
     * Update equipment
     */
    async update(id: number, updateDto: UpdateEquipmentDto) {
        // First check if equipment exists
        await this.findOne(id);

        const updateData: Record<string, unknown> = { ...updateDto };

        // Convert date strings to Date objects
        if (updateDto.purchase_date) {
            updateData.purchase_date = new Date(updateDto.purchase_date);
        }
        if (updateDto.warranty_expiry) {
            updateData.warranty_expiry = new Date(updateDto.warranty_expiry);
        }
        if (updateDto.last_maintenance) {
            updateData.last_maintenance = new Date(updateDto.last_maintenance);
        }
        if (updateDto.next_maintenance_due) {
            updateData.next_maintenance_due = new Date(updateDto.next_maintenance_due);
        }

        const equipment = await this.prisma.equipment.update({
            where: { id },
            data: updateData,
            include: {
                brand: true,
                created_by: {
                    include: {
                        contact: true
                    }
                }
            }
        });

        return equipment;
    }

    /**
     * Delete equipment
     */
    async remove(id: number) {
        // First check if equipment exists
        await this.findOne(id);

        // Check if equipment has active rentals
        const activeRentals = await this.prisma.equipment_rentals.count({
            where: {
                equipment_id: id,
                status: {
                    in: ['BOOKED', 'ACTIVE']
                }
            }
        });

        if (activeRentals > 0) {
            throw new BadRequestException('Cannot delete equipment with active rentals');
        }

        await this.prisma.equipment.delete({
            where: { id }
        });
    }

    /**
     * Get equipment by category
     */
    async findByCategory(category: EquipmentCategory, brandId?: number) {
        const where: Record<string, unknown> = { category };
        if (brandId) {
            where.brand_id = brandId;
        }

        return this.prisma.equipment.findMany({
            where,
            include: {
                brand: true,
                _count: {
                    select: {
                        rental_bookings: true
                    }
                }
            },
            orderBy: { item_name: 'asc' }
        });
    }

    /**
     * Get available equipment for rental
     */
    async findAvailable(startDate: Date, endDate: Date, brandId?: number) {
        const where: Record<string, unknown> = {
            availability_status: EquipmentAvailability.AVAILABLE,
            is_active: true
        };

        if (brandId) {
            where.brand_id = brandId;
        }

        // Find equipment that doesn't have conflicting rentals
        return this.prisma.equipment.findMany({
            where: {
                ...where,
                NOT: {
                    rental_bookings: {
                        some: {
                            AND: [
                                {
                                    rental_start_date: { lte: endDate }
                                },
                                {
                                    rental_end_date: { gte: startDate }
                                },
                                {
                                    status: {
                                        in: ['BOOKED', 'ACTIVE']
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            include: {
                brand: true,
                _count: {
                    select: {
                        rental_bookings: true
                    }
                }
            },
            orderBy: { item_name: 'asc' }
        });
    }

    /**
     * Update equipment availability status
     */
    async updateAvailability(id: number, status: EquipmentAvailability) {
        await this.findOne(id);

        return this.prisma.equipment.update({
            where: { id },
            data: { availability_status: status },
            include: {
                brand: true
            }
        });
    }

    /**
     * Find equipment grouped by category
     */
    async findGroupedByCategory(brandId?: number) {
        const equipment = await this.findAll({ brandId });

        // Group by category
        type CategoryGroup = {
            category: EquipmentCategory;
            label: string;
            count: number;
            equipment: typeof equipment;
            expanded: boolean;
        };

        const grouped = equipment.reduce((acc, item) => {
            const category = item.category;
            if (!acc[category]) {
                acc[category] = {
                    category,
                    label: this.getCategoryLabel(category),
                    count: 0,
                    equipment: [],
                    expanded: true
                };
            }
            acc[category].equipment.push(item);
            acc[category].count++;
            return acc;
        }, {} as Record<string, CategoryGroup>);

        return { groupedByType: grouped };
    }

    /**
     * Get category label for display
     */
    private getCategoryLabel(category: EquipmentCategory): string {
        const labels = {
            [EquipmentCategory.CAMERA]: 'Cameras',
            [EquipmentCategory.LENS]: 'Lenses',
            [EquipmentCategory.AUDIO]: 'Audio Equipment',
            [EquipmentCategory.LIGHTING]: 'Lighting',
            [EquipmentCategory.GRIP]: 'Grip & Support',
            [EquipmentCategory.POWER]: 'Power & Batteries',
            [EquipmentCategory.STORAGE]: 'Storage & Media',
            [EquipmentCategory.STREAMING]: 'Streaming & Sync',
            [EquipmentCategory.BACKGROUNDS]: 'Backgrounds & Effects',
            [EquipmentCategory.ACCESSORIES]: 'Accessories',
        };
        return labels[category] || category;
    }

    // Equipment Availability Calendar Methods

    /**
     * Get equipment availability for a specific equipment item
     */
    async getEquipmentAvailability(equipmentId: number, queryDto: EquipmentAvailabilityQueryDto) {
        const whereClause: any = {
            equipment_id: equipmentId,
        };

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

        if (queryDto.status) {
            whereClause.status = queryDto.status;
        }

        if (queryDto.project_id) {
            whereClause.project_id = queryDto.project_id;
        }

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
            orderBy: {
                start_date: 'asc',
            }
        });
    }

    /**
     * Create availability slot/booking
     */
    async createAvailabilitySlot(equipmentId: number, createDto: CreateEquipmentAvailabilityDto) {
        // Validate equipment exists
        const equipment = await this.prisma.equipment.findUnique({
            where: { id: equipmentId }
        });

        if (!equipment) {
            throw new NotFoundException(`Equipment with ID ${equipmentId} not found`);
        }

        // Check for overlapping availability slots
        const startDate = new Date(createDto.start_date);
        const endDate = new Date(createDto.end_date);

        const overlapping = await this.prisma.equipment_availability.findFirst({
            where: {
                equipment_id: equipmentId,
                OR: [
                    {
                        start_date: {
                            lte: endDate,
                        },
                        end_date: {
                            gte: startDate,
                        }
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
                created_by_id: createDto.booked_by_id, // For now, assume the person booking is the creator
            },
            include: {
                equipment: true,
                project: true,
                booked_by: {
                    include: {
                        contact: true
                    }
                },
                client: {
                    include: {
                        contact: true
                    }
                },
                created_by: {
                    include: {
                        contact: true
                    }
                }
            }
        });
    }

    /**
     * Update availability slot
     */
    async updateAvailabilitySlot(availabilityId: number, updateDto: UpdateEquipmentAvailabilityDto) {
        const availability = await this.prisma.equipment_availability.findUnique({
            where: { id: availabilityId }
        });

        if (!availability) {
            throw new NotFoundException(`Availability slot with ID ${availabilityId} not found`);
        }

        const updateData: any = {};

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
                booked_by: {
                    include: {
                        contact: true
                    }
                },
                client: {
                    include: {
                        contact: true
                    }
                },
                created_by: {
                    include: {
                        contact: true
                    }
                }
            }
        });
    }

    /**
     * Remove availability slot
     */
    async removeAvailabilitySlot(availabilityId: number) {
        const availability = await this.prisma.equipment_availability.findUnique({
            where: { id: availabilityId }
        });

        if (!availability) {
            throw new NotFoundException(`Availability slot with ID ${availabilityId} not found`);
        }

        await this.prisma.equipment_availability.delete({
            where: { id: availabilityId }
        });
    }

    /**
     * Get availability calendar view for multiple equipment items
     */
    async getAvailabilityCalendar(queryDto: EquipmentAvailabilityQueryDto) {
        const whereClause: any = {};

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

        if (queryDto.status) {
            whereClause.status = queryDto.status;
        }

        if (queryDto.project_id) {
            whereClause.project_id = queryDto.project_id;
        }

        if (queryDto.equipment_id) {
            whereClause.equipment_id = queryDto.equipment_id;
        }

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
    /**
     * Find all equipment marked as unmanned for a brand
     */
    async findUnmannedEquipment(brandId: number) {
        return await this.prisma.equipment.findMany({
            where: {
                brand_id: brandId,
                is_unmanned: true,
                is_active: true,
            },
            include: {
                brand: true,
                created_by: {
                    include: {
                        contact: true
                    }
                },
                package_day_operator_equipment: true,
            },
            orderBy: { item_name: 'asc' }
        });
    }

    /**
     * Set equipment as unmanned or manned
     */
    async setUnmannedStatus(equipmentId: number, isUnmanned: boolean) {
        const equipment = await this.prisma.equipment.findUnique({
            where: { id: equipmentId }
        });

        if (!equipment) {
            throw new NotFoundException(`Equipment with ID ${equipmentId} not found`);
        }

        return await this.prisma.equipment.update({
            where: { id: equipmentId },
            data: {
                is_unmanned: isUnmanned
            },
            include: {
                brand: true,
                created_by: {
                    include: {
                        contact: true
                    }
                }
            }
        });
    }}
