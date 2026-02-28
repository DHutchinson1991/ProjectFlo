import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ServicePackageCategoriesService } from './service-package-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('brands/:brandId/package-categories')
export class ServicePackageCategoriesController {
  constructor(private readonly service: ServicePackageCategoriesService) {}

  @Post()
  create(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() createDto: CreateCategoryDto,
  ) {
    return this.service.create(brandId, createDto);
  }

  @Get()
  findAll(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.service.findAll(brandId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCategoryDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
