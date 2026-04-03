import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(brandId: number) {
    return this.prisma.payment_methods.findMany({
      where: { brand_id: brandId },
      orderBy: { order_index: 'asc' },
    });
  }

  async findOne(brandId: number, id: number) {
    const method = await this.prisma.payment_methods.findFirst({
      where: { id, brand_id: brandId },
    });
    if (!method) throw new NotFoundException(`Payment method ${id} not found`);
    return method;
  }

  async create(brandId: number, dto: CreatePaymentMethodDto) {
    // If this is set as default, un-default others
    if (dto.is_default) {
      await this.prisma.payment_methods.updateMany({
        where: { brand_id: brandId, is_default: true },
        data: { is_default: false },
      });
    }

    // Auto-assign order_index if not provided
    if (dto.order_index === undefined) {
      const last = await this.prisma.payment_methods.findFirst({
        where: { brand_id: brandId },
        orderBy: { order_index: 'desc' },
        select: { order_index: true },
      });
      dto.order_index = (last?.order_index ?? -1) + 1;
    }

    return this.prisma.payment_methods.create({
      data: {
        brand_id: brandId,
        type: dto.type,
        label: dto.label,
        is_default: dto.is_default ?? false,
        is_active: dto.is_active ?? true,
        instructions: dto.instructions,
        config: (dto.config ?? undefined) as Prisma.InputJsonValue | undefined,
        order_index: dto.order_index,
      },
    });
  }

  async update(brandId: number, id: number, dto: UpdatePaymentMethodDto) {
    const existing = await this.prisma.payment_methods.findFirst({
      where: { id, brand_id: brandId },
    });
    if (!existing) throw new NotFoundException(`Payment method ${id} not found`);

    // If setting as default, un-default others
    if (dto.is_default) {
      await this.prisma.payment_methods.updateMany({
        where: { brand_id: brandId, is_default: true, id: { not: id } },
        data: { is_default: false },
      });
    }

    return this.prisma.payment_methods.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.is_default !== undefined && { is_default: dto.is_default }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.instructions !== undefined && { instructions: dto.instructions }),
        ...(dto.config !== undefined && { config: dto.config as Prisma.InputJsonValue }),
        ...(dto.order_index !== undefined && { order_index: dto.order_index }),
      },
    });
  }

  async remove(brandId: number, id: number) {
    const existing = await this.prisma.payment_methods.findFirst({
      where: { id, brand_id: brandId },
    });
    if (!existing) throw new NotFoundException(`Payment method ${id} not found`);

    await this.prisma.payment_methods.delete({ where: { id } });
    return { success: true };
  }

  async reorder(brandId: number, ids: number[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.payment_methods.updateMany({
          where: { id, brand_id: brandId },
          data: { order_index: index },
        }),
      ),
    );
    return this.findAll(brandId);
  }

  /** Find all active methods for a brand (used by client portal) */
  async findActive(brandId: number) {
    return this.prisma.payment_methods.findMany({
      where: { brand_id: brandId, is_active: true },
      orderBy: [{ is_default: 'desc' }, { order_index: 'asc' }],
    });
  }
}
