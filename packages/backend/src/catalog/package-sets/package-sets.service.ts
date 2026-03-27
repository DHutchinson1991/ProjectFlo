import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreatePackageSetDto } from './dto/create-package-set.dto';
import { UpdatePackageSetDto } from './dto/update-package-set.dto';

const MAX_SLOTS_PER_SET = 5;
const TIER_LABELS = ['Budget', 'Basic', 'Standard', 'Premium', 'Ultimate'] as const;

@Injectable()
export class PackageSetsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Sets CRUD ─────────────────────────────────────────────────────

  async create(brandId: number, dto: CreatePackageSetDto) {
    // Count existing sets for ordering
    const count = await this.prisma.package_sets.count({ where: { brand_id: brandId } });

    let set;
    try {
      set = await this.prisma.package_sets.create({
        data: {
          brand_id: brandId,
          name: dto.name,
          description: dto.description,
          emoji: dto.emoji ?? '📦',
          event_type_id: dto.event_type_id,
          order_index: dto.order_index ?? count,
        },
        include: { slots: { include: { service_package: true }, orderBy: { order_index: 'asc' } }, event_type: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`A package set named "${dto.name}" already exists for this brand`);
      }
      throw e;
    }

    // Create tier slots — use the tiers the caller selected, or all 5 by default
    const DEFAULT_TIERS = ['Budget', 'Basic', 'Standard', 'Premium'] as const;
    const selectedTiers: string[] =
      Array.isArray(dto.tier_labels) && dto.tier_labels.length > 0
        ? TIER_LABELS.filter(t => dto.tier_labels!.includes(t))
        : [...DEFAULT_TIERS];

    await this.prisma.$transaction(
      selectedTiers.map((label, index) =>
        this.prisma.package_set_slots.create({
          data: { package_set_id: set.id, slot_label: label, order_index: index },
        }),
      ),
    );

    // Re-fetch to include the newly created slots
    return this.findOne(set.id, brandId);
  }

  async findAll(brandId: number) {
    return this.prisma.package_sets.findMany({
      where: { brand_id: brandId, is_active: true },
      include: {
        slots: {
          include: { service_package: true },
          orderBy: { order_index: 'asc' },
        },
        event_type: true,
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async findOne(id: number, brandId: number) {
    const set = await this.prisma.package_sets.findFirst({
      where: { id, brand_id: brandId },
      include: {
        slots: {
          include: { service_package: true },
          orderBy: { order_index: 'asc' },
        },
        event_type: true,
      },
    });
    if (!set) throw new NotFoundException(`Package set #${id} not found`);
    return set;
  }

  async update(id: number, brandId: number, dto: UpdatePackageSetDto) {
    await this.findOne(id, brandId); // ensure exists
    return this.prisma.package_sets.update({
      where: { id },
      data: dto,
      include: { slots: { include: { service_package: true }, orderBy: { order_index: 'asc' } }, event_type: true },
    });
  }

  async remove(id: number, brandId: number) {
    await this.findOne(id, brandId);
    return this.prisma.package_sets.delete({ where: { id } });
  }

  // ─── Slot Operations ──────────────────────────────────────────────

  async addSlot(setId: number, brandId: number, label?: string) {
    const set = await this.findOne(setId, brandId);
    if (set.slots.length >= MAX_SLOTS_PER_SET) {
      throw new ConflictException(`Maximum ${MAX_SLOTS_PER_SET} slots per set`);
    }

    // Determine the next missing tier label
    const existingLabels = set.slots.map(s => s.slot_label);
    const resolvedLabel =
      label && (TIER_LABELS as readonly string[]).includes(label)
        ? label
        : TIER_LABELS.find(t => !existingLabels.includes(t)) ?? TIER_LABELS[set.slots.length] ?? 'Ultimate';

    return this.prisma.package_set_slots.create({
      data: {
        package_set_id: setId,
        slot_label: resolvedLabel,
        order_index: set.slots.length,
      },
      include: { service_package: true },
    });
  }

  async updateSlot(slotId: number, brandId: number, data: { slot_label?: string; service_package_id?: number | null; order_index?: number }) {
    // Verify slot belongs to a set in this brand
    const slot = await this.prisma.package_set_slots.findFirst({
      where: { id: slotId, package_set: { brand_id: brandId } },
    });
    if (!slot) throw new NotFoundException(`Slot #${slotId} not found`);

    return this.prisma.package_set_slots.update({
      where: { id: slotId },
      data,
      include: { service_package: true },
    });
  }

  async assignPackageToSlot(slotId: number, brandId: number, servicePackageId: number) {
    return this.updateSlot(slotId, brandId, { service_package_id: servicePackageId });
  }

  async clearSlot(slotId: number, brandId: number) {
    return this.updateSlot(slotId, brandId, { service_package_id: null });
  }

  async removeSlot(slotId: number, brandId: number) {
    const slot = await this.prisma.package_set_slots.findFirst({
      where: { id: slotId, package_set: { brand_id: brandId } },
    });
    if (!slot) throw new NotFoundException(`Slot #${slotId} not found`);
    return this.prisma.package_set_slots.delete({ where: { id: slotId } });
  }

  // ─── Reorder slots within a set ───────────────────────────────────

  async reorderSlots(setId: number, brandId: number, slotIds: number[]) {
    await this.findOne(setId, brandId);
    const updates = slotIds.map((id, index) =>
      this.prisma.package_set_slots.update({ where: { id }, data: { order_index: index } })
    );
    await this.prisma.$transaction(updates);
    return this.findOne(setId, brandId);
  }

  // ─── Clear all slot assignments in a set (without deleting packages) ──

  async clearAllSlotAssignments(setId: number, brandId: number) {
    const set = await this.findOne(setId, brandId);
    const assignedSlotIds = set.slots
      .filter(s => s.service_package_id !== null)
      .map(s => s.id);

    if (assignedSlotIds.length === 0) return { cleared: 0 };

    const result = await this.prisma.package_set_slots.updateMany({
      where: { id: { in: assignedSlotIds } },
      data: { service_package_id: null },
    });

    return { cleared: result.count };
  }
}
