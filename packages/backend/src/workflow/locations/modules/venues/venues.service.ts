import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto, VenuesQueryDto } from '../../dto';

/**
 * Service for managing venues/locations.
 */
@Injectable()
export class VenuesService {
    constructor(private prisma: PrismaService) { }

    // ==================== VENUE/LOCATION MANAGEMENT ====================

    async createVenue(createLocationDto: CreateLocationDto) {
        return this.prisma.locationsLibrary.create({
            data: createLocationDto,
            include: {
                brand: true,
            },
        });
    }

    async findAllVenues(brandId: number, query?: VenuesQueryDto) {
        const filters: object[] = [];

        if (query?.search) {
            filters.push({
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { city: { contains: query.search, mode: 'insensitive' } },
                    { state: { contains: query.search, mode: 'insensitive' } },
                    { contact_name: { contains: query.search, mode: 'insensitive' } },
                    { address_line1: { contains: query.search, mode: 'insensitive' } },
                    { postal_code: { contains: query.search, mode: 'insensitive' } },
                ],
            });
        }

        if (query?.city) {
            filters.push({ city: { equals: query.city, mode: 'insensitive' } });
        }

        if (query?.capacity) {
            if (query.capacity === 'small') {
                filters.push({ capacity: { lt: 100 } });
            } else if (query.capacity === 'medium') {
                filters.push({ capacity: { gte: 100, lte: 200 } });
            } else if (query.capacity === 'large') {
                filters.push({ capacity: { gt: 200 } });
            } else if (query.capacity === 'unknown') {
                filters.push({ capacity: null });
            }
        }

        return this.prisma.locationsLibrary.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
                ...(filters.length > 0 ? { AND: filters } : {}),
            },
            include: {
                brand: true,
            },
            orderBy: [{ name: 'asc' }],
        });
    }

    async findVenueById(id: number) {
        const venue = await this.prisma.locationsLibrary.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                brand: true,
            },
        });

        if (!venue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        return venue;
    }

    async updateVenue(id: number, updateLocationDto: UpdateLocationDto) {
        const existingVenue = await this.prisma.locationsLibrary.findFirst({
            where: { id, is_active: true },
        });

        if (!existingVenue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        return this.prisma.locationsLibrary.update({
            where: { id },
            data: {
                ...updateLocationDto,
                updated_at: new Date(),
            },
            include: {
                brand: true,
            },
        });
    }

    async removeVenue(id: number) {
        const existingVenue = await this.prisma.locationsLibrary.findFirst({
            where: { id, is_active: true },
        });

        if (!existingVenue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        return this.prisma.locationsLibrary.update({
            where: { id },
            data: {
                is_active: false,
                updated_at: new Date(),
            },
        });
    }
}
