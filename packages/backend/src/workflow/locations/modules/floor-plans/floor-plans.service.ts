import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import {
    CreateFloorPlanDto,
    UpdateFloorPlanDto,
    SaveFloorPlanDto,
    CreateFloorPlanObjectDto,
    UpdateFloorPlanObjectDto,
    UpdateSpaceBoundaryDto,
} from './dto/floor-plan.dto';

@Injectable()
export class FloorPlansService {
    constructor(private prisma: PrismaService) {}

    private readonly floorPlanInclude = {
        objects: { orderBy: { order_index: 'asc' as const } },
        space_zones: {
            where: { is_active: true },
            select: {
                id: true,
                name: true,
                floor_plan_id: true,
                boundary_json: true,
                fill_color: true,
                dimensions_length: true,
                dimensions_width: true,
                capacity: true,
                indoor_outdoor: true,
                type_tags: true,
            },
            orderBy: { name: 'asc' as const },
        },
    };

    async findByLocation(locationId: number) {
        return this.prisma.floorPlan.findMany({
            where: { location_id: locationId },
            include: this.floorPlanInclude,
            orderBy: { created_at: 'asc' },
        });
    }

    async findById(id: number) {
        const plan = await this.prisma.floorPlan.findUnique({
            where: { id },
            include: this.floorPlanInclude,
        });
        if (!plan) throw new NotFoundException(`Floor plan ${id} not found`);
        return plan;
    }

    async create(dto: CreateFloorPlanDto) {
        return this.prisma.floorPlan.create({
            data: dto,
            include: this.floorPlanInclude,
        });
    }

    async update(id: number, dto: UpdateFloorPlanDto) {
        await this.findById(id);
        return this.prisma.floorPlan.update({
            where: { id },
            data: dto,
            include: this.floorPlanInclude,
        });
    }

    async remove(id: number) {
        await this.findById(id);
        return this.prisma.floorPlan.delete({ where: { id } });
    }

    /**
     * Auto-save from Fabric.js canvas — upserts layout_json and objects in one transaction.
     */
    async saveCanvas(id: number, dto: SaveFloorPlanDto) {
        await this.findById(id);

        return this.prisma.$transaction(async (tx) => {
            if (dto.layout_json !== undefined) {
                await tx.floorPlan.update({
                    where: { id },
                    data: { layout_json: dto.layout_json },
                });
            }

            if (dto.objects) {
                const existingIds = dto.objects
                    .filter((o) => o.id)
                    .map((o) => o.id as number);

                // Delete objects removed from canvas
                await tx.floorPlanObject.deleteMany({
                    where: {
                        floor_plan_id: id,
                        ...(existingIds.length > 0
                            ? { id: { notIn: existingIds } }
                            : {}),
                    },
                });

                // Upsert each object
                for (const obj of dto.objects) {
                    const data = {
                        floor_plan_id: id,
                        object_type: obj.object_type,
                        label: obj.label ?? null,
                        x: obj.x,
                        y: obj.y,
                        width: obj.width ?? 50,
                        height: obj.height ?? 50,
                        rotation: obj.rotation ?? 0,
                        metadata: obj.metadata ?? null,
                        order_index: obj.order_index ?? 0,
                    };

                    if (obj.id) {
                        await tx.floorPlanObject.update({
                            where: { id: obj.id },
                            data,
                        });
                    } else {
                        await tx.floorPlanObject.create({ data });
                    }
                }
            }

            return this.prisma.floorPlan.findUnique({
                where: { id },
                include: this.floorPlanInclude,
            });
        });
    }

    // ── Floor Plan Object CRUD ────────────────────────────────

    async createObject(floorPlanId: number, dto: CreateFloorPlanObjectDto) {
        await this.findById(floorPlanId);
        return this.prisma.floorPlanObject.create({
            data: { floor_plan_id: floorPlanId, ...dto },
        });
    }

    async updateObject(objectId: number, dto: UpdateFloorPlanObjectDto) {
        return this.prisma.floorPlanObject.update({
            where: { id: objectId },
            data: dto,
        });
    }

    async removeObject(objectId: number) {
        return this.prisma.floorPlanObject.delete({ where: { id: objectId } });
    }

    // ── Space Boundary Management ─────────────────────────────

    async updateSpaceBoundary(
        spaceId: number,
        floorPlanId: number,
        dto: UpdateSpaceBoundaryDto,
    ) {
        return this.prisma.locationSpace.update({
            where: { id: spaceId },
            data: {
                floor_plan_id: floorPlanId,
                boundary_json: dto.boundary_json,
                fill_color: dto.fill_color,
            },
        });
    }
}
