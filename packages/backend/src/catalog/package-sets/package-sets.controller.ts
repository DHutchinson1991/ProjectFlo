import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PackageSetsService } from './package-sets.service';
import { CreatePackageSetDto } from './dto/create-package-set.dto';
import { UpdatePackageSetDto } from './dto/update-package-set.dto';
import { AddSlotDto, UpdateSlotDto, AssignPackageToSlotDto, ReorderSlotsDto } from './dto/package-set-slots.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/package-sets')
@UseGuards(AuthGuard('jwt'))
export class PackageSetsController {
  constructor(private readonly service: PackageSetsService) {}

  // ─── Set CRUD ──────────────────────────────────────────────────────

  @Post()
  create(
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageSetDto,
  ) {
    return this.service.create(brandId, dto);
  }

  @Get()
  findAll(@BrandId() brandId: number) {
    return this.service.findAll(brandId);
  }

  @Get(':id')
  findOne(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(id, brandId);
  }

  @Patch(':id')
  update(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePackageSetDto,
  ) {
    return this.service.update(id, brandId, dto);
  }

  @Delete(':id')
  remove(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(id, brandId);
  }

  // ─── Slot Operations ──────────────────────────────────────────────

  @Post(':setId/slots')
  addSlot(
    @BrandId() brandId: number,
    @Param('setId', ParseIntPipe) setId: number,
    @Body(new ValidationPipe({ transform: true })) body: AddSlotDto,
  ) {
    return this.service.addSlot(setId, brandId, body.slot_label);
  }

  @Patch('slots/:slotId')
  updateSlot(
    @BrandId() brandId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body(new ValidationPipe({ transform: true })) body: UpdateSlotDto,
  ) {
    return this.service.updateSlot(slotId, brandId, body);
  }

  @Patch('slots/:slotId/assign')
  assignPackage(
    @BrandId() brandId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body(new ValidationPipe({ transform: true })) body: AssignPackageToSlotDto,
  ) {
    return this.service.assignPackageToSlot(slotId, brandId, body.service_package_id);
  }

  @Patch('slots/:slotId/clear')
  clearSlot(
    @BrandId() brandId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.service.clearSlot(slotId, brandId);
  }

  @Delete('slots/:slotId')
  removeSlot(
    @BrandId() brandId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.service.removeSlot(slotId, brandId);
  }

  @Patch(':setId/reorder-slots')
  reorderSlots(
    @BrandId() brandId: number,
    @Param('setId', ParseIntPipe) setId: number,
    @Body(new ValidationPipe({ transform: true })) body: ReorderSlotsDto,
  ) {
    return this.service.reorderSlots(setId, brandId, body.slot_ids);
  }

  // ─── Clear all slot assignments ────────────────────────────────────

  @Patch(':setId/clear-assignments')
  clearAllSlotAssignments(
    @BrandId() brandId: number,
    @Param('setId', ParseIntPipe) setId: number,
  ) {
    return this.service.clearAllSlotAssignments(setId, brandId);
  }
}
