import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { EquipmentTemplatesService } from './equipment-templates.service';

@Controller('equipment/templates')
export class EquipmentTemplatesController {
  constructor(private readonly equipmentTemplatesService: EquipmentTemplatesService) {}

  @Get('brand/:brandId')
  getTemplatesByBrand(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.equipmentTemplatesService.getTemplatesByBrand(brandId);
  }

  @Post('brand/:brandId')
  createTemplate(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: { name: string; description?: string | null }
  ) {
    return this.equipmentTemplatesService.createTemplate(brandId, dto);
  }

  @Patch(':templateId')
  updateTemplate(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() dto: { name?: string; description?: string | null; is_active?: boolean }
  ) {
    return this.equipmentTemplatesService.updateTemplate(templateId, dto);
  }

  @Delete(':templateId')
  deleteTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    return this.equipmentTemplatesService.deleteTemplate(templateId);
  }

  @Post(':templateId/items')
  addItem(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() dto: { equipment_id: number; slot_type: 'CAMERA' | 'AUDIO'; slot_index: number }
  ) {
    return this.equipmentTemplatesService.addItem(templateId, dto);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.equipmentTemplatesService.removeItem(itemId);
  }
}
