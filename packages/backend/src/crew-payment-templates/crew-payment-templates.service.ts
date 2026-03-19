import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CreateCrewPaymentTemplateDto,
  UpdateCrewPaymentTemplateDto,
} from './dto/crew-payment-template.dto';

@Injectable()
export class CrewPaymentTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(brandId: number) {
    return this.prisma.crew_payment_templates.findMany({
      where: { brand_id: brandId, is_active: true },
      include: { rules: { orderBy: { order_index: 'asc' } } },
      orderBy: [{ role_type: 'asc' }, { is_default: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(brandId: number, id: number) {
    const template = await this.prisma.crew_payment_templates.findFirst({
      where: { id, brand_id: brandId },
      include: { rules: { orderBy: { order_index: 'asc' } } },
    });
    if (!template) throw new NotFoundException(`Crew payment template ${id} not found`);
    return template;
  }

  async create(dto: CreateCrewPaymentTemplateDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.is_default) {
          await tx.crew_payment_templates.updateMany({
            where: { brand_id: dto.brand_id, role_type: dto.role_type, is_default: true },
            data: { is_default: false },
          });
        }

        return tx.crew_payment_templates.create({
          data: {
            brand_id: dto.brand_id,
            name: dto.name,
            description: dto.description,
            role_type: dto.role_type,
            payment_terms: dto.payment_terms ?? 'DUE_ON_RECEIPT',
            is_default: dto.is_default ?? false,
            rules: {
              create: (dto.rules ?? []).map((r, i) => ({
                label: r.label,
                amount_type: r.amount_type ?? 'PERCENT',
                amount_value: new Decimal(r.amount_value),
                trigger_type: r.trigger_type,
                trigger_days: r.trigger_days ?? null,
                task_library_id: r.task_library_id ?? null,
                frequency: r.frequency ?? null,
                order_index: r.order_index ?? i,
              })),
            },
          },
          include: { rules: { orderBy: { order_index: 'asc' } } },
        });
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`A crew payment template named "${dto.name}" already exists for this brand`);
      }
      throw e;
    }
  }

  async update(brandId: number, id: number, dto: UpdateCrewPaymentTemplateDto) {
    const existing = await this.findOne(brandId, id);

    return this.prisma.$transaction(async (tx) => {
      const roleType = dto.role_type ?? existing.role_type;

      if (dto.is_default) {
        await tx.crew_payment_templates.updateMany({
          where: { brand_id: brandId, role_type: roleType, is_default: true, id: { not: id } },
          data: { is_default: false },
        });
      }

      if (dto.rules !== undefined) {
        await tx.crew_payment_rules.deleteMany({ where: { template_id: id } });
        await tx.crew_payment_rules.createMany({
          data: dto.rules.map((r, i) => ({
            template_id: id,
            label: r.label,
            amount_type: r.amount_type,
            amount_value: new Decimal(r.amount_value),
            trigger_type: r.trigger_type,
            trigger_days: r.trigger_days ?? null,
            task_library_id: r.task_library_id ?? null,
            frequency: r.frequency ?? null,
            order_index: r.order_index ?? i,
          })),
        });
      }

      return tx.crew_payment_templates.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.role_type !== undefined && { role_type: dto.role_type }),
          ...(dto.payment_terms !== undefined && { payment_terms: dto.payment_terms }),
          ...(dto.is_default !== undefined && { is_default: dto.is_default }),
          ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        },
        include: { rules: { orderBy: { order_index: 'asc' } } },
      });
    });
  }

  async delete(brandId: number, id: number) {
    await this.findOne(brandId, id);
    await this.prisma.crew_payment_templates.update({
      where: { id },
      data: { is_active: false },
    });
    return { success: true };
  }
}
