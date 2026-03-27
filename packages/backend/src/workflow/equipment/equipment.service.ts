import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentType, EquipmentCondition, EquipmentAvailability, EquipmentCategory } from '@prisma/client';

@Injectable()
export class EquipmentService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateEquipmentDto, brandId?: number) {
        return this.prisma.equipment.create({
            data: {
                item_name: createDto.item_name,
                item_code: createDto.item_code,
                category: createDto.category,
                type: createDto.type,
                brand_name: createDto.brand_name,
                model: createDto.model,
                description: createDto.description,
                quantity: createDto.quantity ?? 1,
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
                brand_id: brandId || createDto.brand_id,
                is_active: createDto.is_active !== false,
                created_by_id: createDto.created_by_id,
            },
            include: {
                brand: true,
                created_by: {
                    include: { contact: true }
                }
            }
        });
    }

    async findAll(filters?: {
        brandId?: number;
        category?: EquipmentCategory;
        type?: EquipmentType;
        availability?: EquipmentAvailability;
        condition?: EquipmentCondition;
        search?: string;
    }) {
        const where: Record<string, unknown> = {};

        if (filters?.brandId) where.brand_id = filters.brandId;
        if (filters?.category) where.category = filters.category;
        if (filters?.type) where.type = filters.type;
        if (filters?.availability) where.availability_status = filters.availability;
        if (filters?.condition) where.condition = filters.condition;

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
                created_by: { include: { contact: true } },
                owner: { include: { contact: true } },
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

    async findOne(id: number, brandId?: number) {
        const equipment = await this.prisma.equipment.findFirst({
            where: { id, brand_id: brandId },
            include: {
                brand: true,
                created_by: { include: { contact: true } },
                owner: { include: { contact: true } },
                rental_bookings: {
                    include: {
                        project: true,
                        rented_by: { include: { contact: true } },
                        client: { include: { contact: true } }
                    },
                    orderBy: { created_at: 'desc' }
                },
                maintenance_logs: {
                    include: {
                        created_by: { include: { contact: true } }
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

    async update(id: number, updateDto: UpdateEquipmentDto, brandId?: number) {
        await this.findOne(id, brandId);

        const updateData: Record<string, unknown> = { ...updateDto };

        if (updateDto.purchase_date) updateData.purchase_date = new Date(updateDto.purchase_date);
        if (updateDto.warranty_expiry) updateData.warranty_expiry = new Date(updateDto.warranty_expiry);
        if (updateDto.last_maintenance) updateData.last_maintenance = new Date(updateDto.last_maintenance);
        if (updateDto.next_maintenance_due) updateData.next_maintenance_due = new Date(updateDto.next_maintenance_due);

        return this.prisma.equipment.update({
            where: { id },
            data: updateData,
            include: {
                brand: true,
                created_by: { include: { contact: true } },
                owner: { include: { contact: true } }
            }
        });
    }

    async updateAvailability(id: number, status: EquipmentAvailability, brandId?: number) {
        await this.findOne(id, brandId);
        return this.prisma.equipment.update({
            where: { id },
            data: { availability_status: status }
        });
    }

    async setUnmannedStatus(id: number, isUnmanned: boolean, brandId?: number) {
        await this.findOne(id, brandId);
        return this.prisma.equipment.update({
            where: { id },
            data: { is_unmanned: isUnmanned }
        });
    }

    async remove(id: number, brandId?: number) {
        await this.findOne(id, brandId);

        const activeRentals = await this.prisma.equipment_rentals.count({
            where: {
                equipment_id: id,
                status: { in: ['BOOKED', 'ACTIVE'] }
            }
        });

        if (activeRentals > 0) {
            throw new BadRequestException('Cannot delete equipment with active rentals');
        }

        return this.prisma.equipment.delete({ where: { id } });
    }
}
