import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { EquipmentCategory, EquipmentAvailability } from '@prisma/client';
import { EquipmentService } from './equipment.service';

@Injectable()
export class EquipmentQueryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly equipmentService: EquipmentService,
    ) { }

    async findByCategory(category: EquipmentCategory, brandId?: number) {
        const where: Record<string, unknown> = { category };
        if (brandId) where.brand_id = brandId;

        return this.prisma.equipment.findMany({
            where,
            include: {
                brand: true,
                _count: { select: { rental_bookings: true } }
            },
            orderBy: { item_name: 'asc' }
        });
    }

    async findAvailable(startDate: Date, endDate: Date, brandId?: number) {
        const where: Record<string, unknown> = {
            availability_status: EquipmentAvailability.AVAILABLE,
            is_active: true
        };

        if (brandId) where.brand_id = brandId;

        return this.prisma.equipment.findMany({
            where: {
                ...where,
                NOT: {
                    rental_bookings: {
                        some: {
                            AND: [
                                { rental_start_date: { lte: endDate } },
                                { rental_end_date: { gte: startDate } },
                                { status: { in: ['BOOKED', 'ACTIVE'] } }
                            ]
                        }
                    }
                }
            },
            include: {
                brand: true,
                _count: { select: { rental_bookings: true } }
            },
            orderBy: { item_name: 'asc' }
        });
    }

    async findGroupedByCategory(brandId?: number) {
        const equipment = await this.equipmentService.findAll({ brandId });

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

    private getCategoryLabel(category: EquipmentCategory): string {
        const labels: Partial<Record<EquipmentCategory, string>> = {
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
            [EquipmentCategory.DECORATIVE]: 'Decorative',
            [EquipmentCategory.CABLES]: 'Cables',
            [EquipmentCategory.OTHER]: 'Other',
        };
        return labels[category] ?? category;
    }

    async findUnmannedEquipment(brandId: number) {
        return this.prisma.equipment.findMany({
            where: {
                brand_id: brandId,
                is_unmanned: true,
                is_active: true,
            },
            include: {
                brand: true,
                created_by: { include: { contact: true } },
                package_crew_slot_equipment: true,
            },
            orderBy: { item_name: 'asc' }
        });
    }
}
