import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplatesByBrand(brandId: number) {
    return this.prisma.equipmentTemplate.findMany({
      where: { brand_id: brandId, is_active: true },
      include: {
        items: {
          include: {
            equipment: true,
          },
          orderBy: [{ slot_type: 'asc' }, { slot_index: 'asc' }],
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async createTemplate(brandId: number, dto: { name: string; description?: string | null; camera_count?: number; audio_count?: number }) {
    return this.prisma.equipmentTemplate.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        description: dto.description ?? null,
        camera_count: dto.camera_count ?? 1,
        audio_count: dto.audio_count ?? 1,
        is_active: true,
      },
    });
  }

  async updateTemplate(templateId: number, dto: { name?: string; description?: string | null; is_active?: boolean; camera_count?: number; audio_count?: number }) {
    const existing = await this.prisma.equipmentTemplate.findUnique({ where: { id: templateId } });
    if (!existing) throw new NotFoundException('Equipment template not found');

    return this.prisma.equipmentTemplate.update({
      where: { id: templateId },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        is_active: typeof dto.is_active === 'boolean' ? dto.is_active : undefined,
        camera_count: dto.camera_count ?? undefined,
        audio_count: dto.audio_count ?? undefined,
      },
    });
  }

  async deleteTemplate(templateId: number) {
    const existing = await this.prisma.equipmentTemplate.findUnique({ where: { id: templateId } });
    if (!existing) throw new NotFoundException('Equipment template not found');

    return this.prisma.equipmentTemplate.delete({ where: { id: templateId } });
  }

  async addItem(
    templateId: number,
    dto: { equipment_id: number; slot_type: 'CAMERA' | 'AUDIO'; slot_index: number; track_name?: string }
  ) {
    const template = await this.prisma.equipmentTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Equipment template not found');

    // Auto-generate track name if not provided
    const trackName = dto.track_name || `${dto.slot_type === 'CAMERA' ? 'Camera' : 'Audio'} ${dto.slot_index}`;

    return this.prisma.equipmentTemplateItem.create({
      data: {
        template_id: templateId,
        equipment_id: dto.equipment_id,
        slot_type: dto.slot_type,
        slot_index: dto.slot_index,
        track_name: trackName,
      },
      include: {
        equipment: true,
      },
    });
  }

  async removeItem(itemId: number) {
    const existing = await this.prisma.equipmentTemplateItem.findUnique({ where: { id: itemId } });
    if (!existing) throw new NotFoundException('Equipment template item not found');

    return this.prisma.equipmentTemplateItem.delete({ where: { id: itemId } });
  }
}
