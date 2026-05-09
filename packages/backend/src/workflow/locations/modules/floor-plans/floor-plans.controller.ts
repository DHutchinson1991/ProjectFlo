import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    ValidationPipe,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FloorPlansService } from './floor-plans.service';
import {
    CreateFloorPlanDto,
    UpdateFloorPlanDto,
    SaveFloorPlanDto,
    CreateFloorPlanObjectDto,
    UpdateFloorPlanObjectDto,
    UpdateSpaceBoundaryDto,
} from './dto/floor-plan.dto';

@Controller('api/locations/:locationId/floor-plans')
@UseGuards(AuthGuard('jwt'))
export class FloorPlansController {
    constructor(private readonly floorPlansService: FloorPlansService) {}

    @Get()
    findByLocation(@Param('locationId', ParseIntPipe) locationId: number) {
        return this.floorPlansService.findByLocation(locationId);
    }

    @Post()
    create(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Body(ValidationPipe) dto: CreateFloorPlanDto,
    ) {
        return this.floorPlansService.create({ ...dto, location_id: locationId });
    }

    @Get(':id')
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.floorPlansService.findById(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) dto: UpdateFloorPlanDto,
    ) {
        return this.floorPlansService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.floorPlansService.remove(id);
    }

    @Patch(':id/canvas')
    saveCanvas(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) dto: SaveFloorPlanDto,
    ) {
        return this.floorPlansService.saveCanvas(id, dto);
    }

    // ── Object endpoints ──────────────────────────────────────

    @Post(':id/objects')
    createObject(
        @Param('id', ParseIntPipe) floorPlanId: number,
        @Body(ValidationPipe) dto: CreateFloorPlanObjectDto,
    ) {
        return this.floorPlansService.createObject(floorPlanId, dto);
    }

    @Patch('objects/:objectId')
    updateObject(
        @Param('objectId', ParseIntPipe) objectId: number,
        @Body(ValidationPipe) dto: UpdateFloorPlanObjectDto,
    ) {
        return this.floorPlansService.updateObject(objectId, dto);
    }

    @Delete('objects/:objectId')
    removeObject(@Param('objectId', ParseIntPipe) objectId: number) {
        return this.floorPlansService.removeObject(objectId);
    }

    // ── Space boundary ────────────────────────────────────────

    @Patch(':id/spaces/:spaceId/boundary')
    updateSpaceBoundary(
        @Param('id', ParseIntPipe) floorPlanId: number,
        @Param('spaceId', ParseIntPipe) spaceId: number,
        @Body(ValidationPipe) dto: UpdateSpaceBoundaryDto,
    ) {
        return this.floorPlansService.updateSpaceBoundary(
            spaceId,
            floorPlanId,
            dto,
        );
    }
}
