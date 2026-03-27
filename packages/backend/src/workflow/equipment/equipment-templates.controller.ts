import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards, ValidationPipe, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EquipmentTemplatesService } from './equipment-templates.service';
import { CreateEquipmentTemplateDto, UpdateEquipmentTemplateDto, AddTemplateItemDto } from './dto/equipment-templates.dto';

@Controller('api/equipment/templates')
@UseGuards(AuthGuard('jwt'))
export class EquipmentTemplatesController {
  constructor(private readonly equipmentTemplatesService: EquipmentTemplatesService) {}

  @Get()
  getTemplatesByBrand(@Headers('x-brand-context') brandId?: string) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.equipmentTemplatesService.getTemplatesByBrand(parsedBrandId ?? 0);
  }

  @Post()
  createTemplate(
    @Headers('x-brand-context') brandId: string,
    @Body(new ValidationPipe({ transform: true })) dto: CreateEquipmentTemplateDto
  ) {
    return this.equipmentTemplatesService.createTemplate(parseInt(brandId), dto);
  }

  @Patch(':templateId')
  updateTemplate(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateEquipmentTemplateDto,
    @Headers('x-brand-context') brandId?: string
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.equipmentTemplatesService.updateTemplate(templateId, dto);
  }

  @Delete(':templateId')
  deleteTemplate(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Headers('x-brand-context') brandId?: string
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.equipmentTemplatesService.deleteTemplate(templateId);
  }

  @Post(':templateId/items')
  addItem(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body(new ValidationPipe({ transform: true })) dto: AddTemplateItemDto,
    @Headers('x-brand-context') brandId?: string
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.equipmentTemplatesService.addItem(templateId, dto);
  }

  @Delete('items/:itemId')
  removeItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Headers('x-brand-context') brandId?: string
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.equipmentTemplatesService.removeItem(itemId);
  }
}
