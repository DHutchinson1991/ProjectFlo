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
import { ContractTemplatesService } from './contract-templates.service';
import { ContractTemplateVariablesService } from './services/contract-template-variables.service';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto';
import { UpdateContractTemplateDto } from './dto/update-contract-template.dto';
import { ContractTemplatesBrandQueryDto } from './dto/contract-templates-brand-query.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/contract-templates')
export class ContractTemplatesController {
  constructor(
    private readonly service: ContractTemplatesService,
    private readonly variablesService: ContractTemplateVariablesService,
  ) {}

  private getBrandId(header?: string, queryBrandId?: number): number {
    const raw = queryBrandId !== undefined ? String(queryBrandId) : header;
    return raw ? parseInt(raw, 10) : 1;
  }

  @Get()
  findAll(
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractTemplatesBrandQueryDto,
  ) {
    return this.service.findAll(this.getBrandId(brandHeader, query?.brandId));
  }

  @Get('variables')
  getVariables() {
    return this.variablesService.getAvailableVariables();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractTemplatesBrandQueryDto,
  ) {
    return this.service.findOne(this.getBrandId(brandHeader, query?.brandId), id);
  }

  @Post()
  create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateContractTemplateDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractTemplatesBrandQueryDto,
  ) {
    return this.service.create(this.getBrandId(brandHeader, query?.brandId), dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateContractTemplateDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractTemplatesBrandQueryDto,
  ) {
    return this.service.update(
      this.getBrandId(brandHeader, query?.brandId),
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractTemplatesBrandQueryDto,
  ) {
    return this.service.remove(this.getBrandId(brandHeader, query?.brandId), id);
  }

  @Post(':id/preview')
  preview(
    @Param('id', ParseIntPipe) id: number,
    @Body('inquiryId') inquiryId?: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractTemplatesBrandQueryDto,
  ) {
    return this.variablesService.preview(
      this.getBrandId(brandHeader, query?.brandId),
      id,
      inquiryId,
    );
  }

  @Post('seed-defaults')
  seedDefaults(
    @Headers('x-brand-context') brandHeader?: string,
    @Query(new ValidationPipe({ transform: true })) query?: ContractTemplatesBrandQueryDto,
  ) {
    return this.service.seedDefaultTemplates(
      this.getBrandId(brandHeader, query?.brandId),
    );
  }
}
