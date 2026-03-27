import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, ValidationPipe, Headers, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PackageCrewSlotsService } from './services/package-crew-slots.service';
import { ProjectCrewSlotsService } from './services/project-crew-slots.service';
import { CreateCrewSlotDto, UpdateCrewSlotDto, AssignCrewSlotDto, SetSlotEquipmentDto } from './dto/crew-slots.dto';
import { CrewSlotsDayQueryDto } from './dto/crew-slots-day-query.dto';

@Controller('api/crew-slots')
@UseGuards(AuthGuard('jwt'))
export class CrewSlotsController {
  constructor(
    private readonly packageCrewSlotsService: PackageCrewSlotsService,
    private readonly projectCrewSlotsService: ProjectCrewSlotsService,
  ) {}

  // ─── Package Crew Slots ───────────────────────────────────────────

  @Get('packages/:packageId')
  getPackageDayOperators(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query(new ValidationPipe({ transform: true })) query: CrewSlotsDayQueryDto,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.packageCrewSlotsService.getPackageDayOperators(
      packageId,
      query.dayId,
    );
  }

  @Post('packages/:packageId')
  addCrewSlotToPackageDay(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateCrewSlotDto,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.packageCrewSlotsService.addCrewSlotToPackageDay(packageId, dto);
  }

  @Patch('packages/day-operators/:slotId')
  updateCrewSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateCrewSlotDto,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.packageCrewSlotsService.updateCrewSlot(slotId, dto);
  }

  @Patch('packages/day-operators/:slotId/assign')
  assignCrewToSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body(new ValidationPipe({ transform: true })) dto: AssignCrewSlotDto,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.packageCrewSlotsService.assignCrewToSlot(slotId, dto);
  }

  @Delete('packages/day-operators/:slotId')
  removeCrewSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.packageCrewSlotsService.removeCrewSlot(slotId);
  }

  // ─── Crew Slot Equipment ──────────────────────────────────────────

  @Post('packages/day-operators/:slotId/equipment')
  setSlotEquipment(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body(new ValidationPipe({ transform: true })) dto: SetSlotEquipmentDto,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.packageCrewSlotsService.setSlotEquipment(slotId, dto.equipment);
  }

  // ─── Activity Assignments ─────────────────────────────────────────

  @Post('packages/day-operators/:slotId/activities/:activityId')
  assignSlotToActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.packageCrewSlotsService.assignSlotToActivity(slotId, activityId);
  }

  @Delete('packages/day-operators/:slotId/activities/:activityId')
  unassignSlotFromActivity(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.packageCrewSlotsService.unassignSlotFromActivity(slotId, activityId);
  }

  // ─── Project Day Operators (Inquiry-level crew) ───────────────────

  @Patch('project/day-operators/:slotId/assign')
  assignProjectCrewToSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body(new ValidationPipe({ transform: true })) dto: AssignCrewSlotDto,
    @Headers('x-brand-context') brandId?: string,
  ) {
    const parsedBrandId = brandId ? parseInt(brandId) : undefined;
    return this.projectCrewSlotsService.assignProjectCrewToSlot(slotId, dto, parsedBrandId);
  }
}
