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
import { ContractTemplatesService } from './contract-templates.service';
import {
  CreateContractTemplateDto,
  UpdateContractTemplateDto,
} from './dto/contract-template.dto';

@Controller('api/contract-templates')
export class ContractTemplatesController {
  constructor(private readonly service: ContractTemplatesService) {}

  private getBrandId(header?: string, query?: string): number {
    const raw = query || header;
    return raw ? parseInt(raw, 10) : 1;
  }

  @Get()
  findAll(
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.findAll(this.getBrandId(brandHeader, brandQuery));
  }

  @Get('variables')
  getVariables() {
    return this.service.getAvailableVariables();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.findOne(this.getBrandId(brandHeader, brandQuery), id);
  }

  @Post()
  create(
    @Body() dto: CreateContractTemplateDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.create(this.getBrandId(brandHeader, brandQuery), dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractTemplateDto,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.update(
      this.getBrandId(brandHeader, brandQuery),
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.remove(this.getBrandId(brandHeader, brandQuery), id);
  }

  @Post(':id/preview')
  preview(
    @Param('id', ParseIntPipe) id: number,
    @Body('inquiryId') inquiryId?: number,
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.preview(
      this.getBrandId(brandHeader, brandQuery),
      id,
      inquiryId,
    );
  }

  @Post('seed-defaults')
  seedDefaults(
    @Headers('x-brand-context') brandHeader?: string,
    @Query('brandId') brandQuery?: string,
  ) {
    return this.service.seedDefaultTemplates(
      this.getBrandId(brandHeader, brandQuery),
    );
  }
}
