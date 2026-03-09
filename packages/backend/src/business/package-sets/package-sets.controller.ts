import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PackageSetsService } from './package-sets.service';
import { CreatePackageSetDto } from './dto/create-package-set.dto';
import { UpdatePackageSetDto } from './dto/update-package-set.dto';

@Controller('package-sets')
export class PackageSetsController {
  constructor(private readonly service: PackageSetsService) {}

  // ─── Set CRUD ──────────────────────────────────────────────────────

  @Post(':brandId')
  create(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: CreatePackageSetDto,
  ) {
    return this.service.create(brandId, dto);
  }

  @Get(':brandId')
  findAll(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.service.findAll(brandId);
  }

  @Get(':brandId/:id')
  findOne(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(id, brandId);
  }

  @Patch(':brandId/:id')
  update(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePackageSetDto,
  ) {
    return this.service.update(id, brandId, dto);
  }

  @Delete(':brandId/:id')
  remove(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(id, brandId);
  }

  // ─── Slot Operations ──────────────────────────────────────────────

  @Post(':brandId/:setId/slots')
  addSlot(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('setId', ParseIntPipe) setId: number,
    @Body() body: { slot_label?: string },
  ) {
    return this.service.addSlot(setId, brandId, body.slot_label);
  }

  @Patch(':brandId/slots/:slotId')
  updateSlot(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() body: { slot_label?: string; service_package_id?: number | null; order_index?: number },
  ) {
    return this.service.updateSlot(slotId, brandId, body);
  }

  @Patch(':brandId/slots/:slotId/assign')
  assignPackage(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() body: { service_package_id: number },
  ) {
    return this.service.assignPackageToSlot(slotId, brandId, body.service_package_id);
  }

  @Patch(':brandId/slots/:slotId/clear')
  clearSlot(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.service.clearSlot(slotId, brandId);
  }

  @Delete(':brandId/slots/:slotId')
  removeSlot(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.service.removeSlot(slotId, brandId);
  }

  @Patch(':brandId/:setId/reorder-slots')
  reorderSlots(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('setId', ParseIntPipe) setId: number,
    @Body() body: { slot_ids: number[] },
  ) {
    return this.service.reorderSlots(setId, brandId, body.slot_ids);
  }

  // ─── Migrate assigned package categories ──────────────────────────

  @Patch(':brandId/:setId/migrate-categories')
  migratePackagesCategory(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('setId', ParseIntPipe) setId: number,
    @Body() body: { category_id: number },
  ) {
    return this.service.migratePackagesCategory(setId, brandId, body.category_id);
  }

  // ─── Clear all slot assignments ────────────────────────────────────

  @Patch(':brandId/:setId/clear-assignments')
  clearAllSlotAssignments(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('setId', ParseIntPipe) setId: number,
  ) {
    return this.service.clearAllSlotAssignments(setId, brandId);
  }
}
