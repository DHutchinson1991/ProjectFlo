import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Operator Templates (brand-level) ────────────────────────────────

  async getTemplatesByBrand(brandId: number) {
    return this.prisma.operatorTemplate.findMany({
      where: { brand_id: brandId, is_active: true },
      include: {
        default_equipment: {
          include: { equipment: true },
          orderBy: { is_primary: 'desc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async getTemplateById(templateId: number) {
    const template = await this.prisma.operatorTemplate.findUnique({
      where: { id: templateId },
      include: {
        default_equipment: {
          include: { equipment: true },
          orderBy: { is_primary: 'desc' },
        },
      },
    });
    if (!template) throw new NotFoundException('Operator template not found');
    return template;
  }

  async createTemplate(
    brandId: number,
    dto: { name: string; role?: string; color?: string },
  ) {
    const maxOrder = await this.prisma.operatorTemplate.aggregate({
      where: { brand_id: brandId },
      _max: { order_index: true },
    });
    return this.prisma.operatorTemplate.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        role: dto.role ?? null,
        color: dto.color ?? null,
        order_index: (maxOrder._max.order_index ?? -1) + 1,
        is_active: true,
      },
      include: {
        default_equipment: { include: { equipment: true } },
      },
    });
  }

  async updateTemplate(
    templateId: number,
    dto: { name?: string; role?: string | null; color?: string | null; is_active?: boolean; order_index?: number },
  ) {
    const existing = await this.prisma.operatorTemplate.findUnique({ where: { id: templateId } });
    if (!existing) throw new NotFoundException('Operator template not found');

    return this.prisma.operatorTemplate.update({
      where: { id: templateId },
      data: {
        name: dto.name ?? undefined,
        role: dto.role !== undefined ? dto.role : undefined,
        color: dto.color !== undefined ? dto.color : undefined,
        is_active: typeof dto.is_active === 'boolean' ? dto.is_active : undefined,
        order_index: dto.order_index ?? undefined,
      },
      include: {
        default_equipment: { include: { equipment: true } },
      },
    });
  }

  async deleteTemplate(templateId: number) {
    const existing = await this.prisma.operatorTemplate.findUnique({ where: { id: templateId } });
    if (!existing) throw new NotFoundException('Operator template not found');
    return this.prisma.operatorTemplate.delete({ where: { id: templateId } });
  }

  // ─── Operator Template Equipment ──────────────────────────────────

  async addEquipmentToTemplate(
    templateId: number,
    dto: { equipment_id: number; is_primary?: boolean },
  ) {
    const template = await this.prisma.operatorTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Operator template not found');

    try {
      return await this.prisma.operatorTemplateEquipment.create({
        data: {
          operator_template_id: templateId,
          equipment_id: dto.equipment_id,
          is_primary: dto.is_primary ?? false,
        },
        include: { equipment: true },
      });
    } catch {
      throw new ConflictException('This equipment is already assigned to this operator template');
    }
  }

  async removeEquipmentFromTemplate(templateEquipmentId: number) {
    const existing = await this.prisma.operatorTemplateEquipment.findUnique({
      where: { id: templateEquipmentId },
    });
    if (!existing) throw new NotFoundException('Template equipment assignment not found');
    return this.prisma.operatorTemplateEquipment.delete({ where: { id: templateEquipmentId } });
  }

  // ─── Package Day Operators ────────────────────────────────────────

  async getPackageDayOperators(packageId: number, eventDayTemplateId?: number) {
    const where: Record<string, unknown> = { package_id: packageId };
    if (eventDayTemplateId) where.event_day_template_id = eventDayTemplateId;

    return this.prisma.packageDayOperator.findMany({
      where,
      include: {
        operator_template: {
          include: {
            default_equipment: { include: { equipment: true } },
          },
        },
        equipment: {
          include: { equipment: true },
        },
        event_day: true,
        package_activity: true,
        activity_assignments: { include: { package_activity: true } },
      },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async addOperatorToPackageDay(
    packageId: number,
    dto: { event_day_template_id: number; operator_template_id: number; hours?: number; notes?: string; package_activity_id?: number | null },
  ) {
    // Get the operator template for default equipment
    const template = await this.prisma.operatorTemplate.findUnique({
      where: { id: dto.operator_template_id },
      include: { default_equipment: true },
    });
    if (!template) throw new NotFoundException('Operator template not found');

    const maxOrder = await this.prisma.packageDayOperator.aggregate({
      where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
      _max: { order_index: true },
    });

    try {
      const operator = await this.prisma.packageDayOperator.create({
        data: {
          package_id: packageId,
          event_day_template_id: dto.event_day_template_id,
          operator_template_id: dto.operator_template_id,
          hours: dto.hours ?? 8,
          notes: dto.notes ?? null,
          order_index: (maxOrder._max.order_index ?? -1) + 1,
          package_activity_id: dto.package_activity_id ?? null,
        },
      });

      // Auto-populate equipment from template defaults
      if (template.default_equipment.length > 0) {
        await this.prisma.packageDayOperatorEquipment.createMany({
          data: template.default_equipment.map(eq => ({
            package_day_operator_id: operator.id,
            equipment_id: eq.equipment_id,
            is_primary: eq.is_primary,
          })),
          skipDuplicates: true,
        });

      }

      // Re-fetch with all includes
      return this.prisma.packageDayOperator.findUnique({
        where: { id: operator.id },
        include: {
          operator_template: {
            include: { default_equipment: { include: { equipment: true } } },
          },
          equipment: { include: { equipment: true } },
          event_day: true,
          activity_assignments: { include: { package_activity: true } },
        },
      });
    } catch {
      throw new ConflictException('This operator is already assigned to this package day');
    }
  }

  async updatePackageDayOperator(
    operatorId: number,
    dto: { hours?: number; notes?: string | null; order_index?: number; package_activity_id?: number | null },
  ) {
    const existing = await this.prisma.packageDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Package day operator not found');

    return this.prisma.packageDayOperator.update({
      where: { id: operatorId },
      data: {
        hours: dto.hours ?? undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        order_index: dto.order_index ?? undefined,
        package_activity_id: dto.package_activity_id !== undefined ? dto.package_activity_id : undefined,
      },
      include: {
        operator_template: {
          include: { default_equipment: { include: { equipment: true } } },
        },
        equipment: { include: { equipment: true } },
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }

  async removeOperatorFromPackageDay(operatorId: number) {
    const existing = await this.prisma.packageDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Package day operator not found');
    // Cascade will handle equipment deletions
    return this.prisma.packageDayOperator.delete({ where: { id: operatorId } });
  }

  // ─── Package Day Operator Equipment (overrides) ───────────────────

  async setOperatorEquipment(
    operatorId: number,
    equipmentIds: { equipment_id: number; is_primary: boolean }[],
  ) {
    const existing = await this.prisma.packageDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Package day operator not found');

    // Delete all current equipment and re-create
    await this.prisma.packageDayOperatorEquipment.deleteMany({
      where: { package_day_operator_id: operatorId },
    });

    if (equipmentIds.length > 0) {
      await this.prisma.packageDayOperatorEquipment.createMany({
        data: equipmentIds.map(eq => ({
          package_day_operator_id: operatorId,
          equipment_id: eq.equipment_id,
          is_primary: eq.is_primary,
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.packageDayOperator.findUnique({
      where: { id: operatorId },
      include: {
        operator_template: {
          include: { default_equipment: { include: { equipment: true } } },
        },
        equipment: { include: { equipment: true } },
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }

  // ─── Operator Activity Assignments (multi-activity) ────────────────

  async assignOperatorToActivity(operatorId: number, activityId: number) {
    const existing = await this.prisma.packageDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Package day operator not found');

    try {
      await this.prisma.operatorActivityAssignment.create({
        data: {
          package_day_operator_id: operatorId,
          package_activity_id: activityId,
        },
      });
    } catch {
      // Already assigned — ignore
    }

    return this.prisma.packageDayOperator.findUnique({
      where: { id: operatorId },
      include: {
        operator_template: {
          include: { default_equipment: { include: { equipment: true } } },
        },
        equipment: { include: { equipment: true } },
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }

  async unassignOperatorFromActivity(operatorId: number, activityId: number) {
    const existing = await this.prisma.packageDayOperator.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Package day operator not found');

    await this.prisma.operatorActivityAssignment.deleteMany({
      where: {
        package_day_operator_id: operatorId,
        package_activity_id: activityId,
      },
    });

    return this.prisma.packageDayOperator.findUnique({
      where: { id: operatorId },
      include: {
        operator_template: {
          include: { default_equipment: { include: { equipment: true } } },
        },
        equipment: { include: { equipment: true } },
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }
}
