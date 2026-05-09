import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateCrewPresetDto, UpdateCrewPresetDto } from './dto/crew-preset.dto';

@Injectable()
export class CrewPresetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(brandId: number) {
    return this.prisma.crewPreset.findMany({
      where: { brand_id: brandId },
      orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
      include: {
        slots: {
          orderBy: { order_index: 'asc' },
          include: { job_role: true, crew: true },
        },
      },
    });
  }

  async findOne(id: number, brandId: number) {
    const preset = await this.prisma.crewPreset.findFirst({
      where: { id, brand_id: brandId },
      include: {
        slots: {
          orderBy: { order_index: 'asc' },
          include: { job_role: true, crew: true },
        },
      },
    });
    if (!preset) throw new NotFoundException(`Crew preset ${id} not found`);
    return preset;
  }

  async create(brandId: number, dto: CreateCrewPresetDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.is_default) {
          await tx.crewPreset.updateMany({
            where: { brand_id: brandId, is_default: true },
            data: { is_default: false },
          });
        }
        return tx.crewPreset.create({
          data: {
            brand_id: brandId,
            name: dto.name,
            is_default: dto.is_default ?? false,
            slots: {
              create: dto.slots.map((s) => ({
                job_role_id: s.job_role_id,
                crew_id: s.crew_id ?? null,
                order_index: s.order_index,
              })),
            },
          },
          include: {
            slots: {
              orderBy: { order_index: 'asc' },
              include: { job_role: true, crew: true },
            },
          },
        });
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(`A crew preset named "${dto.name}" already exists.`);
      }
      throw err;
    }
  }

  async update(id: number, brandId: number, dto: UpdateCrewPresetDto) {
    await this.findOne(id, brandId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.is_default) {
          await tx.crewPreset.updateMany({
            where: { brand_id: brandId, is_default: true, NOT: { id } },
            data: { is_default: false },
          });
        }
        if (dto.slots) {
          await tx.crewPresetSlot.deleteMany({ where: { preset_id: id } });
          await tx.crewPresetSlot.createMany({
            data: dto.slots.map((s) => ({
              preset_id: id,
              job_role_id: s.job_role_id,
              crew_id: s.crew_id ?? null,
              order_index: s.order_index,
            })),
          });
        }
        return tx.crewPreset.update({
          where: { id },
          data: {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.is_default !== undefined ? { is_default: dto.is_default } : {}),
          },
          include: {
            slots: {
              orderBy: { order_index: 'asc' },
              include: { job_role: true, crew: true },
            },
          },
        });
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(`A crew preset named "${dto.name}" already exists.`);
      }
      throw err;
    }
  }

  async remove(id: number, brandId: number) {
    await this.findOne(id, brandId);
    await this.prisma.crewPreset.delete({ where: { id } });
  }
}
