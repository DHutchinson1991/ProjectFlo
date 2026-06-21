import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateEquipmentPresetDto, UpdateEquipmentPresetDto } from './dto/equipment-preset.dto';

@Injectable()
export class EquipmentPresetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(brandId: number) {
    return this.prisma.equipmentPreset.findMany({
      where: { brand_id: brandId },
      orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
      include: {
        slots: {
          orderBy: [{ slot_type: 'asc' }, { order_index: 'asc' }],
          include: { equipment: true, crew: true, job_role: true },
        },
      },
    });
  }

  async findOne(id: number, brandId: number) {
    const preset = await this.prisma.equipmentPreset.findFirst({
      where: { id, brand_id: brandId },
      include: {
        slots: {
          orderBy: [{ slot_type: 'asc' }, { order_index: 'asc' }],
          include: { equipment: true, crew: true, job_role: true },
        },
      },
    });
    if (!preset) throw new NotFoundException(`Equipment preset ${id} not found`);
    return preset;
  }

  async create(brandId: number, dto: CreateEquipmentPresetDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.is_default) {
          await tx.equipmentPreset.updateMany({
            where: { brand_id: brandId, is_default: true },
            data: { is_default: false },
          });
        }

        return tx.equipmentPreset.create({
          data: {
            brand_id: brandId,
            name: dto.name,
            is_default: dto.is_default ?? false,
            slots: {
              create: dto.slots.map((slot) => ({
                slot_type: slot.slot_type,
                equipment_id: slot.equipment_id ?? null,
                crew_id: slot.crew_id ?? null,
                job_role_id: slot.job_role_id ?? null,
                order_index: slot.order_index,
              })),
            },
          },
          include: {
            slots: {
              orderBy: [{ slot_type: 'asc' }, { order_index: 'asc' }],
              include: { equipment: true, crew: true, job_role: true },
            },
          },
        });
      });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002') {
        throw new ConflictException(`An equipment preset named "${dto.name}" already exists.`);
      }
      throw err;
    }
  }

  async update(id: number, brandId: number, dto: UpdateEquipmentPresetDto) {
    await this.findOne(id, brandId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.is_default) {
          await tx.equipmentPreset.updateMany({
            where: { brand_id: brandId, is_default: true, NOT: { id } },
            data: { is_default: false },
          });
        }

        if (dto.slots) {
          await tx.equipmentPresetSlot.deleteMany({ where: { preset_id: id } });
          await tx.equipmentPresetSlot.createMany({
            data: dto.slots.map((slot) => ({
              preset_id: id,
              slot_type: slot.slot_type,
              equipment_id: slot.equipment_id ?? null,
              crew_id: slot.crew_id ?? null,
              job_role_id: slot.job_role_id ?? null,
              order_index: slot.order_index,
            })),
          });
        }

        return tx.equipmentPreset.update({
          where: { id },
          data: {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.is_default !== undefined ? { is_default: dto.is_default } : {}),
          },
          include: {
            slots: {
              orderBy: [{ slot_type: 'asc' }, { order_index: 'asc' }],
              include: { equipment: true, crew: true, job_role: true },
            },
          },
        });
      });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002') {
        throw new ConflictException(`An equipment preset named "${dto.name}" already exists.`);
      }
      throw err;
    }
  }

  async remove(id: number, brandId: number) {
    await this.findOne(id, brandId);
    await this.prisma.equipmentPreset.delete({ where: { id } });
  }
}
