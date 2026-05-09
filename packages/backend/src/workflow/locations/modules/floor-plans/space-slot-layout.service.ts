import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';

@Injectable()
export class SpaceSlotLayoutService {
    private readonly logger = new Logger(SpaceSlotLayoutService.name);

    constructor(private readonly prisma: PrismaService) {}

    async applyPresetToSpaceSlot(spaceSlotId: number, presetId: number): Promise<void> {
        const slot = await this.prisma.packageSpaceSlot.findUnique({
            where: { id: spaceSlotId },
            include: { objects: { select: { id: true } } },
        });
        if (!slot) {
            throw new NotFoundException(`Space slot ${spaceSlotId} not found`);
        }

        if (slot.objects.length > 0) {
            return;
        }

        const preset = await this.prisma.floorPlanPreset.findUnique({
            where: { id: presetId },
            include: { objects: { orderBy: { order_index: 'asc' } } },
        });
        if (!preset) {
            throw new NotFoundException(`Preset ${presetId} not found`);
        }

        await this.prisma.packageSpaceSlot.update({
            where: { id: spaceSlotId },
            data: { preset_id: presetId },
        });

        if (preset.space_type) {
            await this.prisma.packageSpaceSlotTypeTag.create({
                data: { package_space_slot_id: spaceSlotId, space_type: preset.space_type },
            }).catch(() => {
                return undefined;
            });
        }

        for (const object of preset.objects) {
            await this.prisma.spaceSlotObject.create({
                data: {
                    package_space_slot_id: spaceSlotId,
                    object_type: object.object_type,
                    label: object.label,
                    x: object.x,
                    y: object.y,
                    width: object.width,
                    height: object.height,
                    rotation: object.rotation,
                    metadata: object.metadata ?? undefined,
                    order_index: object.order_index,
                },
            });
        }
    }

    async applyCeremonyLayoutToSpaceSlot(
        spaceSlotId: number,
        options?: { capacity?: number; seatsPerSide?: number },
    ): Promise<void> {
        const slot = await this.prisma.packageSpaceSlot.findUnique({
            where: { id: spaceSlotId },
            include: {
                objects: { select: { id: true, object_type: true, label: true } },
                zones: { select: { id: true, name: true } },
            },
        });
        if (!slot) {
            throw new NotFoundException(`Space slot ${spaceSlotId} not found`);
        }

        const layoutTag = '__layout_ceremony_v1';
        const alreadyLaidOut = slot.objects.some(
            (object) => object.object_type === 'CHAIR_ROW' && (object.label ?? '').startsWith(layoutTag),
        );
        if (alreadyLaidOut) {
            this.logger.debug(`Space slot ${spaceSlotId}: ceremony layout already applied (marker present) - skipping.`);
            return;
        }

        if (slot.objects.length > 0 || slot.zones.length > 0) {
            this.logger.warn(
                `Space slot ${spaceSlotId}: has ${slot.objects.length} objects and ${slot.zones.length} zones but no ceremony layout marker - not applying ceremony layout over existing content. Clear the slot first to reseed.`,
            );
            return;
        }

        const capacity = options?.capacity ?? 100;
        const seatsPerSide = options?.seatsPerSide ?? 5;
        const rowCount = Math.max(4, Math.ceil(capacity / (seatsPerSide * 2)));

        const canvasWidth = 1000;
        const canvasHeight = 800;
        const altarTop = 10;
        const altarBottom = 130;
        const entranceTop = Math.max(altarBottom + 200, canvasHeight - 150);
        const seatingTop = altarBottom + 10;
        const seatingBottom = entranceTop - 10;
        const seatingHeight = seatingBottom - seatingTop;
        const rowGap = seatingHeight / rowCount;
        const rowHeight = Math.min(30, rowGap - 20);

        const aisleHalfWidth = 40;
        const sideMargin = 80;
        const sideWidth = canvasWidth / 2 - aisleHalfWidth - sideMargin;

        await this.prisma.packageSpaceSlot.update({
            where: { id: spaceSlotId },
            data: { canvas_width: canvasWidth, canvas_height: canvasHeight },
        });

        const zoneDefs = [
            {
                name: 'altar_area',
                label: 'Altar Area',
                description: 'Raised platform where officiant and couple stand during the ceremony',
                color: '#E8E0D4',
                polygon: [
                    { x: 300, y: altarTop },
                    { x: 700, y: altarTop },
                    { x: 700, y: altarBottom },
                    { x: 300, y: altarBottom },
                ],
                order_index: 0,
            },
            {
                name: 'aisle',
                label: 'Aisle',
                description: 'Central walkway between seating rows',
                color: '#E8E4DE',
                polygon: [
                    { x: canvasWidth / 2 - aisleHalfWidth, y: altarBottom },
                    { x: canvasWidth / 2 + aisleHalfWidth, y: altarBottom },
                    { x: canvasWidth / 2 + aisleHalfWidth, y: entranceTop },
                    { x: canvasWidth / 2 - aisleHalfWidth, y: entranceTop },
                ],
                order_index: 1,
            },
            {
                name: 'left_seating',
                label: 'Left Seating (Bride)',
                description: 'Guest seating on the left (bride side)',
                color: '#E3EDE8',
                polygon: [
                    { x: sideMargin - 20, y: seatingTop },
                    { x: canvasWidth / 2 - aisleHalfWidth, y: seatingTop },
                    { x: canvasWidth / 2 - aisleHalfWidth, y: seatingBottom },
                    { x: sideMargin - 20, y: seatingBottom },
                ],
                order_index: 2,
            },
            {
                name: 'right_seating',
                label: 'Right Seating (Groom)',
                description: 'Guest seating on the right (groom side)',
                color: '#E3EDE8',
                polygon: [
                    { x: canvasWidth / 2 + aisleHalfWidth, y: seatingTop },
                    { x: canvasWidth - sideMargin + 20, y: seatingTop },
                    { x: canvasWidth - sideMargin + 20, y: seatingBottom },
                    { x: canvasWidth / 2 + aisleHalfWidth, y: seatingBottom },
                ],
                order_index: 3,
            },
            {
                name: 'entrance',
                label: 'Entrance',
                description: 'Entry area at the back of the venue',
                color: '#EDE8E3',
                polygon: [
                    { x: sideMargin - 20, y: entranceTop },
                    { x: canvasWidth - sideMargin + 20, y: entranceTop },
                    { x: canvasWidth - sideMargin + 20, y: canvasHeight },
                    { x: sideMargin - 20, y: canvasHeight },
                ],
                order_index: 4,
            },
        ];

        for (const zone of zoneDefs) {
            await this.prisma.spaceSlotZone.create({
                data: { package_space_slot_id: spaceSlotId, ...zone, polygon: zone.polygon },
            });
        }

        await this.prisma.spaceSlotObject.create({
            data: {
                package_space_slot_id: spaceSlotId,
                object_type: 'STAGE',
                label: 'Altar Platform',
                x: canvasWidth / 2 - 120,
                y: altarTop + 20,
                width: 240,
                height: 90,
                order_index: 0,
            },
        });
        await this.prisma.spaceSlotObject.create({
            data: {
                package_space_slot_id: spaceSlotId,
                object_type: 'ALTAR',
                label: 'Altar',
                x: canvasWidth / 2 - 40,
                y: altarTop + 40,
                width: 80,
                height: 40,
                order_index: 1,
            },
        });
        await this.prisma.spaceSlotObject.create({
            data: {
                package_space_slot_id: spaceSlotId,
                object_type: 'ARCH',
                label: 'Archway',
                x: canvasWidth / 2 - 50,
                y: altarTop + 5,
                width: 100,
                height: 30,
                order_index: 2,
            },
        });
        await this.prisma.spaceSlotObject.create({
            data: {
                package_space_slot_id: spaceSlotId,
                object_type: 'AISLE',
                label: 'Aisle',
                x: canvasWidth / 2 - aisleHalfWidth,
                y: altarBottom,
                width: aisleHalfWidth * 2,
                height: entranceTop - altarBottom,
                order_index: 3,
            },
        });

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const rowY = seatingTop + rowIndex * rowGap + (rowGap - rowHeight) / 2;
            await this.prisma.spaceSlotObject.create({
                data: {
                    package_space_slot_id: spaceSlotId,
                    object_type: 'CHAIR_ROW',
                    label: `Row ${rowIndex + 1}L`,
                    x: sideMargin,
                    y: rowY,
                    width: sideWidth,
                    height: rowHeight,
                    metadata: {
                        layout_tag: layoutTag,
                        seat_cols: seatsPerSide,
                        capacity: seatsPerSide,
                        row_index: rowIndex,
                        side: 'L',
                    },
                    order_index: 10 + rowIndex,
                },
            });
            await this.prisma.spaceSlotObject.create({
                data: {
                    package_space_slot_id: spaceSlotId,
                    object_type: 'CHAIR_ROW',
                    label: `Row ${rowIndex + 1}R`,
                    x: canvasWidth - sideMargin - sideWidth,
                    y: rowY,
                    width: sideWidth,
                    height: rowHeight,
                    metadata: {
                        layout_tag: layoutTag,
                        seat_cols: seatsPerSide,
                        capacity: seatsPerSide,
                        row_index: rowIndex,
                        side: 'R',
                    },
                    order_index: 50 + rowIndex,
                },
            });
        }
    }
}