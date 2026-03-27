import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateContractClauseCategoryDto } from './dto/create-contract-clause-category.dto';
import { UpdateContractClauseCategoryDto } from './dto/update-contract-clause-category.dto';
import { CreateContractClauseDto } from './dto/create-contract-clause.dto';
import { UpdateContractClauseDto } from './dto/update-contract-clause.dto';
import { getDefaultClauses } from './constants/default-clauses.constants';

@Injectable()
export class ContractClausesService {
  constructor(private prisma: PrismaService) {}

  // ── Categories ──────────────────────────────────────────────────────

  async findAllCategories(brandId: number) {
    return this.prisma.contract_clause_categories.findMany({
      where: { brand_id: brandId },
      include: { clauses: { orderBy: { order_index: 'asc' } } },
      orderBy: { order_index: 'asc' },
    });
  }

  async findOneCategory(brandId: number, id: number) {
    const cat = await this.prisma.contract_clause_categories.findFirst({
      where: { id, brand_id: brandId },
      include: { clauses: { orderBy: { order_index: 'asc' } } },
    });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  async createCategory(brandId: number, dto: CreateContractClauseCategoryDto) {
    return this.prisma.contract_clause_categories.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        description: dto.description ?? null,
        order_index: dto.order_index ?? 0,
        country_code: dto.country_code ?? null,
      },
      include: { clauses: true },
    });
  }

  async updateCategory(
    brandId: number,
    id: number,
    dto: UpdateContractClauseCategoryDto,
  ) {
    await this.findOneCategory(brandId, id);
    return this.prisma.contract_clause_categories.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.order_index !== undefined && { order_index: dto.order_index }),
        ...(dto.country_code !== undefined && {
          country_code: dto.country_code,
        }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
      include: { clauses: true },
    });
  }

  async removeCategory(brandId: number, id: number) {
    await this.findOneCategory(brandId, id);
    await this.prisma.contract_clause_categories.delete({ where: { id } });
  }

  // ── Clauses ─────────────────────────────────────────────────────────

  async findAllClauses(brandId: number, categoryId?: number) {
    return this.prisma.contract_clauses.findMany({
      where: {
        brand_id: brandId,
        ...(categoryId && { category_id: categoryId }),
      },
      include: { category: true },
      orderBy: [{ category_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async findOneClause(brandId: number, id: number) {
    const clause = await this.prisma.contract_clauses.findFirst({
      where: { id, brand_id: brandId },
      include: { category: true },
    });
    if (!clause) throw new NotFoundException(`Clause ${id} not found`);
    return clause;
  }

  async createClause(brandId: number, dto: CreateContractClauseDto) {
    // Verify category belongs to this brand
    await this.findOneCategory(brandId, dto.category_id);

    return this.prisma.contract_clauses.create({
      data: {
        brand_id: brandId,
        category_id: dto.category_id,
        title: dto.title,
        body: dto.body,
        clause_type: dto.clause_type ?? 'STANDARD',
        country_code: dto.country_code ?? null,
        order_index: dto.order_index ?? 0,
      },
      include: { category: true },
    });
  }

  async updateClause(brandId: number, id: number, dto: UpdateContractClauseDto) {
    await this.findOneClause(brandId, id);

    // If changing category, verify it belongs to this brand
    if (dto.category_id) {
      await this.findOneCategory(brandId, dto.category_id);
    }

    return this.prisma.contract_clauses.update({
      where: { id },
      data: {
        ...(dto.category_id !== undefined && { category_id: dto.category_id }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.clause_type !== undefined && { clause_type: dto.clause_type }),
        ...(dto.country_code !== undefined && {
          country_code: dto.country_code,
        }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.order_index !== undefined && { order_index: dto.order_index }),
      },
      include: { category: true },
    });
  }

  async removeClause(brandId: number, id: number) {
    await this.findOneClause(brandId, id);
    await this.prisma.contract_clauses.delete({ where: { id } });
  }

  // ── Reorder ─────────────────────────────────────────────────────────

  async reorderCategories(brandId: number, orderedIds: number[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.prisma.contract_clause_categories.updateMany({
          where: { id, brand_id: brandId },
          data: { order_index: index },
        }),
      ),
    );
    return this.findAllCategories(brandId);
  }

  async reorderClauses(
    brandId: number,
    categoryId: number,
    orderedIds: number[],
  ) {
    await this.findOneCategory(brandId, categoryId);
    await Promise.all(
      orderedIds.map((id, index) =>
        this.prisma.contract_clauses.updateMany({
          where: { id, brand_id: brandId, category_id: categoryId },
          data: { order_index: index },
        }),
      ),
    );
    return this.findOneCategory(brandId, categoryId);
  }

  // ── Seed defaults ───────────────────────────────────────────────────

  async seedDefaults(brandId: number, countryCode: string) {
    const defaults = getDefaultClauses(countryCode);

    for (const cat of defaults) {
      const created = await this.prisma.contract_clause_categories.create({
        data: {
          brand_id: brandId,
          name: cat.name,
          description: cat.description,
          order_index: cat.order_index,
          country_code: countryCode,
          is_default: true,
        },
      });

      for (const clause of cat.clauses) {
        await this.prisma.contract_clauses.create({
          data: {
            brand_id: brandId,
            category_id: created.id,
            title: clause.title,
            body: clause.body,
            clause_type: clause.clause_type,
            country_code: countryCode,
            is_default: true,
            order_index: clause.order_index,
          },
        });
      }
    }

    return this.findAllCategories(brandId);
  }
}

