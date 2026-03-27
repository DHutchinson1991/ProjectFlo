import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicePackageCategoriesService } from './service-package-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/service-package-categories')
@UseGuards(AuthGuard('jwt'))
export class ServicePackageCategoriesController {
  constructor(private readonly service: ServicePackageCategoriesService) {}

  @Post()
  create(
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) createDto: CreateCategoryDto,
  ) {
    return this.service.create(brandId, createDto);
  }

  @Get()
  findAll(@BrandId() brandId: number) {
    return this.service.findAll(brandId);
  }

  @Patch(':id')
  update(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateDto: UpdateCategoryDto,
  ) {
    return this.service.update(id, brandId, updateDto);
  }

  @Delete(':id')
  remove(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(id, brandId);
  }
}
