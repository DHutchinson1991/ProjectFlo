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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContractClausesService } from './contract-clauses.service';
import { CreateContractClauseCategoryDto } from './dto/create-contract-clause-category.dto';
import { UpdateContractClauseCategoryDto } from './dto/update-contract-clause-category.dto';
import { CreateContractClauseDto } from './dto/create-contract-clause.dto';
import { UpdateContractClauseDto } from './dto/update-contract-clause.dto';
import { ContractClausesQueryDto } from './dto/contract-clauses-query.dto';
import { ReorderDto } from './dto/reorder.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/contract-clauses')
export class ContractClausesController {
  constructor(private readonly service: ContractClausesService) {}

  private getBrandId(header?: string, queryBrandId?: number): number {
    const raw = queryBrandId !== undefined ? String(queryBrandId) : header;
    return raw ? parseInt(raw, 10) : 1;
  }

  // ── Categories ──────────────────────────────────────────────────────

  @Get('categories')
  findAllCategories(
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.findAllCategories(this.getBrandId(brandHeader, query?.brandId));
  }

  @Get('categories/:id')
  findOneCategory(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.findOneCategory(this.getBrandId(brandHeader, query?.brandId), id);
  }

  @Post('categories')
  createCategory(
    @Body(new ValidationPipe({ transform: true })) dto: CreateContractClauseCategoryDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.createCategory(this.getBrandId(brandHeader, query?.brandId), dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateContractClauseCategoryDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.updateCategory(this.getBrandId(brandHeader, query?.brandId), id, dto);
  }

  @Delete('categories/:id')
  removeCategory(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.removeCategory(this.getBrandId(brandHeader, query?.brandId), id);
  }

  // ── Clauses ─────────────────────────────────────────────────────────

  @Get()
  findAllClauses(
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.findAllClauses(
      this.getBrandId(brandHeader, query?.brandId),
      query?.categoryId,
    );
  }

  @Get(':id')
  findOneClause(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.findOneClause(this.getBrandId(brandHeader, query?.brandId), id);
  }

  @Post()
  createClause(
    @Body(new ValidationPipe({ transform: true })) dto: CreateContractClauseDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.createClause(this.getBrandId(brandHeader, query?.brandId), dto);
  }

  @Patch(':id')
  updateClause(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateContractClauseDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.updateClause(this.getBrandId(brandHeader, query?.brandId), id, dto);
  }

  @Delete(':id')
  removeClause(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.removeClause(this.getBrandId(brandHeader, query?.brandId), id);
  }

  // ── Seed defaults ───────────────────────────────────────────────────

  @Post('seed-defaults')
  seedDefaults(
    @Body('countryCode') countryCode: string,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.seedDefaults(
      this.getBrandId(brandHeader, query?.brandId),
      countryCode || 'GB',
    );
  }

  // ── Reorder ─────────────────────────────────────────────────────────

  @Patch('categories/reorder')
  reorderCategories(
    @Body(new ValidationPipe({ transform: true })) dto: ReorderDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.reorderCategories(
      this.getBrandId(brandHeader, query?.brandId),
      dto.ids,
    );
  }

  @Patch('categories/:id/reorder-clauses')
  reorderClauses(
    @Param('id', ParseIntPipe) categoryId: number,
    @Body(new ValidationPipe({ transform: true })) dto: ReorderDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractClausesQueryDto,
  ) {
    return this.service.reorderClauses(
      this.getBrandId(brandHeader, query?.brandId),
      categoryId,
      dto.ids,
    );
  }
}
