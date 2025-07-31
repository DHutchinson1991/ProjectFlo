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
import { PlanObjectsService } from './plan-objects.service';
import { CreateFloorPlanObjectDto, UpdateFloorPlanObjectDto } from '../../dto';

/**
 * Controller for managing floor plan objects (furniture, equipment, etc.)
 */
@Controller('locations')
export class PlanObjectsController {
    constructor(private readonly planObjectsService: PlanObjectsService) { }

    // ==================== FLOOR PLAN OBJECTS ====================

    @Post('floor-plan-objects')
    createFloorPlanObject(@Body(ValidationPipe) createFloorPlanObjectDto: CreateFloorPlanObjectDto) {
        return this.planObjectsService.createFloorPlanObject(createFloorPlanObjectDto);
    }

    @Get('floor-plan-objects')
    findFloorPlanObjects(
        @Query('category') category?: string,
        @Query('brandId', ParseIntPipe) brandId?: number,
    ) {
        return this.planObjectsService.findFloorPlanObjects(category, brandId);
    }

    @Get('floor-plan-objects/:id')
    findFloorPlanObjectById(@Param('id', ParseIntPipe) id: number) {
        return this.planObjectsService.findFloorPlanObjectById(id);
    }

    @Patch('floor-plan-objects/:id')
    updateFloorPlanObject(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateFloorPlanObjectDto: UpdateFloorPlanObjectDto,
    ) {
        return this.planObjectsService.updateFloorPlanObject(id, updateFloorPlanObjectDto);
    }

    @Delete('floor-plan-objects/:id')
    removeFloorPlanObject(@Param('id', ParseIntPipe) id: number) {
        return this.planObjectsService.removeFloorPlanObject(id);
    }

    // ==================== UTILITY ENDPOINTS ====================

    @Get('categories/objects')
    getObjectCategories() {
        return this.planObjectsService.getObjectCategories();
    }
}
