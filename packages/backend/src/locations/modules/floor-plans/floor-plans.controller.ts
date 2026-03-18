import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
    ValidationPipe,
} from '@nestjs/common';
import { FloorPlansService } from './floor-plans.service';
import { CreateFloorPlanDto, UpdateFloorPlanDto } from '../../dto';

/**
 * Controller for managing floor plans within location spaces
 */
@Controller('locations')
export class FloorPlansController {
    constructor(private readonly floorPlansService: FloorPlansService) { }

    // ==================== FLOOR PLANS ====================

    @Post('floor-plans')
    createFloorPlan(@Body(ValidationPipe) createFloorPlanDto: CreateFloorPlanDto) {
        return this.floorPlansService.createFloorPlan(createFloorPlanDto);
    }

    @Get('spaces/:spaceId/floor-plans')
    findFloorPlans(
        @Param('spaceId', ParseIntPipe) spaceId: number,
        @Query('projectId', ParseIntPipe) projectId?: number,
    ) {
        return this.floorPlansService.findFloorPlans(spaceId, projectId);
    }

    @Get('floor-plans/:id')
    findFloorPlanById(@Param('id', ParseIntPipe) id: number) {
        return this.floorPlansService.findFloorPlanById(id);
    }

    @Patch('floor-plans/:id')
    updateFloorPlan(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateFloorPlanDto: UpdateFloorPlanDto,
    ) {
        return this.floorPlansService.updateFloorPlan(id, updateFloorPlanDto);
    }

    @Delete('floor-plans/:id')
    removeFloorPlan(@Param('id', ParseIntPipe) id: number) {
        return this.floorPlansService.removeFloorPlan(id);
    }

    @Post('floor-plans/:id/duplicate')
    duplicateFloorPlan(
        @Param('id', ParseIntPipe) id: number,
        @Query('projectId', ParseIntPipe) projectId?: number,
    ) {
        return this.floorPlansService.duplicateFloorPlan(id, projectId);
    }
}
