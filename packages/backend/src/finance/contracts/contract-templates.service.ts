import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto';
import { UpdateContractTemplateDto } from './dto/update-contract-template.dto';

export const TEMPLATE_INCLUDE = {
  template_clauses: {
    include: {
      clause: {
        include: { category: true },
      },
    },
    orderBy: { order_index: 'asc' as const },
  },
  payment_schedule: {
    include: { rules: { orderBy: { order_index: 'asc' as const } } },
  },
};

@Injectable()
export class ContractTemplatesService {
  constructor(private prisma: PrismaService) {}

  // ── Templates CRUD ──────────────────────────────────────────────────

  async findAll(brandId: number) {
    return this.prisma.contract_templates.findMany({
      where: { brand_id: brandId },
      include: TEMPLATE_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(brandId: number, id: number) {
    const tmpl = await this.prisma.contract_templates.findFirst({
      where: { id, brand_id: brandId },
      include: TEMPLATE_INCLUDE,
    });
    if (!tmpl) throw new NotFoundException(`Template ${id} not found`);
    return tmpl;
  }

  async create(brandId: number, dto: CreateContractTemplateDto) {
    return this.prisma.contract_templates.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        description: dto.description ?? null,
        payment_schedule_template_id: dto.payment_schedule_template_id ?? null,
        is_default: dto.is_default ?? false,
        template_clauses: dto.clauses?.length
          ? {
              create: dto.clauses.map((c, i) => ({
                clause_id: c.clause_id,
                order_index: c.order_index ?? i,
                override_body: c.override_body ?? null,
              })),
            }
          : undefined,
      },
      include: TEMPLATE_INCLUDE,
    });
  }

  async update(brandId: number, id: number, dto: UpdateContractTemplateDto) {
    await this.findOne(brandId, id);

    if (dto.clauses !== undefined) {
      await this.prisma.contract_template_clauses.deleteMany({
        where: { template_id: id },
      });
      if (dto.clauses.length > 0) {
        await this.prisma.contract_template_clauses.createMany({
          data: dto.clauses.map((c, i) => ({
            template_id: id,
            clause_id: c.clause_id,
            order_index: c.order_index ?? i,
            override_body: c.override_body ?? null,
          })),
        });
      }
    }

    return this.prisma.contract_templates.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.payment_schedule_template_id !== undefined && {
          payment_schedule_template_id: dto.payment_schedule_template_id,
        }),
        ...(dto.is_default !== undefined && { is_default: dto.is_default }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
      include: TEMPLATE_INCLUDE,
    });
  }

  async remove(brandId: number, id: number) {
    await this.findOne(brandId, id);
    await this.prisma.contract_templates.delete({ where: { id } });
  }

  // ── Seed default templates ──────────────────────────────────────────

  async seedDefaultTemplates(brandId: number) {
    const categories = await this.prisma.contract_clause_categories.findMany({
      where: { brand_id: brandId },
      include: { clauses: { where: { is_active: true }, orderBy: { order_index: 'asc' } } },
      orderBy: { order_index: 'asc' },
    });

    if (categories.length === 0) {
      return [];
    }

    const catMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.clauses]),
    );

    const getClauseIds = (categoryNames: string[]): number[] => {
      const ids: number[] = [];
      for (const name of categoryNames) {
        const clauses = catMap.get(name.toLowerCase());
        if (clauses) {
          for (const cl of clauses) {
            if (cl.clause_type === 'STANDARD') ids.push(cl.id);
          }
        }
      }
      return ids;
    };

    const templateDefs = [
      {
        name: 'Professional Services Agreement',
        description:
          'Standard contract for videography/photography services covering scope of work, payment, liability, IP, and general terms.',
        categories: [
          'Scope of Work', 'Payment Terms', 'Cancellation & Rescheduling',
          'Liability & Insurance', 'Intellectual Property', 'Confidentiality',
          'Force Majeure', 'General Provisions',
        ],
      },
      {
        name: 'Talent Release Form',
        description: 'Release form for talent/subjects granting permission to use their likeness in productions.',
        categories: ['Talent Release Form'],
      },
      {
        name: 'Location Release Agreement',
        description: 'Agreement with property owners for filming at their locations, covering access, liability, and restoration.',
        categories: ['Location Release Agreement'],
      },
    ];

    const created: unknown[] = [];
    for (const def of templateDefs) {
      const clauseIds = getClauseIds(def.categories);
      if (clauseIds.length === 0) continue;

      const existing = await this.prisma.contract_templates.findFirst({
        where: { brand_id: brandId, name: def.name },
      });
      if (existing) continue;

      const tmpl = await this.prisma.contract_templates.create({
        data: {
          brand_id: brandId,
          name: def.name,
          description: def.description,
          is_default: true,
          template_clauses: {
            create: clauseIds.map((cId, i) => ({
              clause_id: cId,
              order_index: i,
            })),
          },
        },
        include: TEMPLATE_INCLUDE,
      });
      created.push(tmpl);
    }

    return this.findAll(brandId);
  }
}
