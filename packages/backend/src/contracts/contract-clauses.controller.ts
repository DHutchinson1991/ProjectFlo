import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import { ContractClausesService } from './contract-clauses.service';
import {
  CreateContractClauseCategoryDto,
  UpdateContractClauseCategoryDto,
} from './dto/create-contract-clause-category.dto';
import {
  CreateContractClauseDto,
  UpdateContractClauseDto,
} from './dto/create-contract-clause.dto';
import { ReorderDto } from './dto/contract-template.dto';

@Controller('api/contract-clauses')
export class ContractClausesController {
  constructor(private readonly service: ContractClausesService) {}

  private getBrandId(header?: string, query?: string): number {
    const raw = query || header;
    return raw ? parseInt(raw, 10) : 1;
  }

  // ── Categories ──────────────────────────────────────────────────────

  @Get('categories')
  findAllCategories(
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.findAllCategories(this.getBrandId(brandHeader, brandQuery));
  }

  @Get('categories/:id')
  findOneCategory(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.findOneCategory(this.getBrandId(brandHeader, brandQuery), id);
  }

  @Post('categories')
  createCategory(
    @Body() dto: CreateContractClauseCategoryDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.createCategory(this.getBrandId(brandHeader, brandQuery), dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractClauseCategoryDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.updateCategory(this.getBrandId(brandHeader, brandQuery), id, dto);
  }

  @Delete('categories/:id')
  removeCategory(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.removeCategory(this.getBrandId(brandHeader, brandQuery), id);
  }

  // ── Clauses ─────────────────────────────────────────────────────────

  @Get()
  findAllClauses(
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.findAllClauses(
      this.getBrandId(brandHeader, brandQuery),
      categoryId ? parseInt(categoryId, 10) : undefined,
    );
  }

  @Get(':id')
  findOneClause(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.findOneClause(this.getBrandId(brandHeader, brandQuery), id);
  }

  @Post()
  createClause(
    @Body() dto: CreateContractClauseDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.createClause(this.getBrandId(brandHeader, brandQuery), dto);
  }

  @Patch(':id')
  updateClause(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractClauseDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.updateClause(this.getBrandId(brandHeader, brandQuery), id, dto);
  }

  @Delete(':id')
  removeClause(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.removeClause(this.getBrandId(brandHeader, brandQuery), id);
  }

  // ── Seed defaults ───────────────────────────────────────────────────

  @Post('seed-defaults')
  seedDefaults(
    @Body('countryCode') countryCode: string,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.seedDefaults(
      this.getBrandId(brandHeader, brandQuery),
      countryCode || 'GB',
    );
  }

  // ── Reorder ─────────────────────────────────────────────────────────

  @Patch('categories/reorder')
  reorderCategories(
    @Body() dto: ReorderDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.reorderCategories(
      this.getBrandId(brandHeader, brandQuery),
      dto.ids,
    );
  }

  @Patch('categories/:id/reorder-clauses')
  reorderClauses(
    @Param('id', ParseIntPipe) categoryId: number,
    @Body() dto: ReorderDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.reorderClauses(
      this.getBrandId(brandHeader, brandQuery),
      categoryId,
      dto.ids,
    );
  }
}
