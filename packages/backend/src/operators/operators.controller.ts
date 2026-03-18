import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { OperatorsService } from './operators.service';

@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  // ─── Package Crew Slots ───────────────────────────────────────────

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
  addCrewSlotToPackageDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: {
      event_day_template_id: number;
      position_name: string;
      position_color?: string | null;
      contributor_id?: number | null;
      job_role_id?: number | null;
      hours?: number;
      notes?: string;
      package_activity_id?: number | null;
    },
  ) {
    return this.operatorsService.addCrewSlotToPackageDay(packageId, dto);
  }

  @Patch('packages/day-operators/:slotId')
  updateCrewSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: {
      position_name?: string;
      position_color?: string | null;
      contributor_id?: number | null;
      job_role_id?: number | null;
      hours?: number;
      notes?: string | null;
      order_index?: number;
      package_activity_id?: number | null;
    },
  ) {
    return this.operatorsService.updateCrewSlot(slotId, dto);
  }

  @Patch('packages/day-operators/:slotId/assign')
  assignCrewToSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: { contributor_id: number | null },
  ) {
    return this.operatorsService.assignCrewToSlot(slotId, dto);
  }

  @Delete('packages/day-operators/:slotId')
  removeCrewSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.operatorsService.removeCrewSlot(slotId);
  }

  // ─── Crew Slot Equipment ──────────────────────────────────────────

  @Post('packages/day-operators/:slotId/equipment')
  setSlotEquipment(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: { equipment: { equipment_id: number; is_primary: boolean }[] },
  ) {
    return this.operatorsService.setSlotEquipment(slotId, dto.equipment);
  }

  // ─── Activity Assignments ─────────────────────────────────────────

  @Post('packages/day-operators/:slotId/activities/:activityId')
  assignSlotToActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.operatorsService.assignSlotToActivity(slotId, activityId);
  }

  @Delete('packages/day-operators/:slotId/activities/:activityId')
  unassignSlotFromActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.operatorsService.unassignSlotFromActivity(slotId, activityId);
  }
}
