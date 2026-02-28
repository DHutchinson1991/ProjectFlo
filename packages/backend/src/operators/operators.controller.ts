import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { OperatorsService } from './operators.service';

@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  // ─── Operator Templates (brand-level) ────────────────────────────────

  @Get('templates/brand/:brandId')
  getTemplatesByBrand(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.operatorsService.getTemplatesByBrand(brandId);
  }

  @Get('templates/:templateId')
  getTemplateById(@Param('templateId', ParseIntPipe) templateId: number) {
    return this.operatorsService.getTemplateById(templateId);
  }

  @Post('templates/brand/:brandId')
  createTemplate(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: { name: string; role?: string; color?: string },
  ) {
    return this.operatorsService.createTemplate(brandId, dto);
  }

  @Patch('templates/:templateId')
  updateTemplate(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() dto: { name?: string; role?: string | null; color?: string | null; is_active?: boolean; order_index?: number },
  ) {
    return this.operatorsService.updateTemplate(templateId, dto);
  }

  @Delete('templates/:templateId')
  deleteTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    return this.operatorsService.deleteTemplate(templateId);
  }

  // ─── Operator Template Equipment ──────────────────────────────────

  @Post('templates/:templateId/equipment')
  addEquipmentToTemplate(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() dto: { equipment_id: number; is_primary?: boolean },
  ) {
    return this.operatorsService.addEquipmentToTemplate(templateId, dto);
  }

  @Delete('templates/equipment/:templateEquipmentId')
  removeEquipmentFromTemplate(
    @Param('templateEquipmentId', ParseIntPipe) templateEquipmentId: number,
  ) {
    return this.operatorsService.removeEquipmentFromTemplate(templateEquipmentId);
  }

  // ─── Package Day Operators ────────────────────────────────────────

  @Get('packages/:packageId')
  getPackageDayOperators(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query('dayId') dayId?: string,
  ) {
    return this.operatorsService.getPackageDayOperators(
      packageId,
      dayId ? Number(dayId) : undefined,
    );
  }

  @Post('packages/:packageId')
  addOperatorToPackageDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: { event_day_template_id: number; operator_template_id: number; hours?: number; notes?: string; package_activity_id?: number | null },
  ) {
    return this.operatorsService.addOperatorToPackageDay(packageId, dto);
  }

  @Patch('packages/day-operators/:operatorId')
  updatePackageDayOperator(
    @Param('operatorId', ParseIntPipe) operatorId: number,
    @Body() dto: { hours?: number; notes?: string | null; order_index?: number; package_activity_id?: number | null },
  ) {
    return this.operatorsService.updatePackageDayOperator(operatorId, dto);
  }

  @Delete('packages/day-operators/:operatorId')
  removeOperatorFromPackageDay(
    @Param('operatorId', ParseIntPipe) operatorId: number,
  ) {
    return this.operatorsService.removeOperatorFromPackageDay(operatorId);
  }

  // ─── Package Day Operator Equipment (overrides) ───────────────────

  @Post('packages/day-operators/:operatorId/equipment')
  setOperatorEquipment(
    @Param('operatorId', ParseIntPipe) operatorId: number,
    @Body() dto: { equipment: { equipment_id: number; is_primary: boolean }[] },
  ) {
    return this.operatorsService.setOperatorEquipment(operatorId, dto.equipment);
  }

  // ─── Operator Activity Assignments (multi-activity) ────────────────

  @Post('packages/day-operators/:operatorId/activities/:activityId')
  assignOperatorToActivity(
    @Param('operatorId', ParseIntPipe) operatorId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.operatorsService.assignOperatorToActivity(operatorId, activityId);
  }

  @Delete('packages/day-operators/:operatorId/activities/:activityId')
  unassignOperatorFromActivity(
    @Param('operatorId', ParseIntPipe) operatorId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.operatorsService.unassignOperatorFromActivity(operatorId, activityId);
  }
}
