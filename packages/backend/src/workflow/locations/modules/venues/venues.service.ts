import { Injectable, NotFoundException } from '@nestjs/common';
import { IndoorOutdoor, NaturalLight } from '@prisma/client';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto, VenuesQueryDto } from '../../dto';

interface CreateSpaceDto {
    name: string;
    space_type?: string;
    capacity?: number;
    dimensions_length?: number;
    dimensions_width?: number;
    dimensions_height?: number;
    description?: string;
    indoor_outdoor?: IndoorOutdoor;
    natural_light?: NaturalLight;
    flooring?: string;
    ceiling_style?: string;
    key_features?: string;
    accessibility_notes?: string;
    notes?: string;
}

interface UpdateSpaceDto extends Partial<CreateSpaceDto> {}

/**
 * Service for managing venues/locations.
 */
@Injectable()
export class VenuesService {
    constructor(private prisma: PrismaService) { }

    private readonly venueInclude = {
        brand: true,
        spaces: {
            where: { is_active: true },
            include: { type_tags: true },
            orderBy: { name: 'asc' as const },
        },
    };

    // ==================== VENUE/LOCATION MANAGEMENT ====================

    async createVenue(createLocationDto: CreateLocationDto) {
        return this.prisma.locationsLibrary.create({
            data: createLocationDto,
            include: this.venueInclude,
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
            include: this.venueInclude,
            orderBy: [{ name: 'asc' }],
        });
    }

    async findVenueById(id: number) {
        const venue = await this.prisma.locationsLibrary.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: this.venueInclude,
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
            include: this.venueInclude,
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

    // ==================== SPACE MANAGEMENT ====================

    async getSpaces(locationId: number) {
        await this.findVenueById(locationId); // ensures venue exists
        return this.prisma.locationSpace.findMany({
            where: { location_id: locationId, is_active: true },
            include: { type_tags: true },
            orderBy: { name: 'asc' },
        });
    }

    async createSpace(locationId: number, dto: CreateSpaceDto) {
        await this.findVenueById(locationId);
        return this.prisma.locationSpace.create({
            data: { location_id: locationId, ...dto },
        });
    }

    async updateSpace(spaceId: number, dto: UpdateSpaceDto) {
        const space = await this.prisma.locationSpace.findFirst({
            where: { id: spaceId, is_active: true },
        });
        if (!space) throw new NotFoundException(`Space with ID ${spaceId} not found`);
        return this.prisma.locationSpace.update({
            where: { id: spaceId },
            data: { ...dto, updated_at: new Date() },
        });
    }

    async removeSpace(spaceId: number) {
        const space = await this.prisma.locationSpace.findFirst({
            where: { id: spaceId, is_active: true },
        });
        if (!space) throw new NotFoundException(`Space with ID ${spaceId} not found`);
        return this.prisma.locationSpace.update({
            where: { id: spaceId },
            data: { is_active: false, updated_at: new Date() },
        });
    }
}
