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
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlanObjectsService } from './plan-objects.service';
import { CreateFloorPlanObjectDto, UpdateFloorPlanObjectDto } from '../../dto';
import { PlanObjectsQueryDto } from '../../dto/queries/plan-objects-query.dto';
import { BrandId } from '../../../../platform/auth/decorators/brand-id.decorator';

/**
 * Controller for managing floor plan objects (furniture, equipment, etc.)
 */
@Controller('api/locations')
@UseGuards(AuthGuard('jwt'))
export class PlanObjectsController {
    constructor(private readonly planObjectsService: PlanObjectsService) { }

    // ==================== FLOOR PLAN OBJECTS ====================

    @Post('floor-plan-objects')
    createFloorPlanObject(@Body(ValidationPipe) createFloorPlanObjectDto: CreateFloorPlanObjectDto) {
        return this.planObjectsService.createFloorPlanObject(createFloorPlanObjectDto);
    }

    @Get('floor-plan-objects')
    findFloorPlanObjects(
        @Query(new ValidationPipe({ transform: true })) query: PlanObjectsQueryDto,
        @BrandId() brandId: number,
    ) {
        return this.planObjectsService.findFloorPlanObjects(query.category, brandId);
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
