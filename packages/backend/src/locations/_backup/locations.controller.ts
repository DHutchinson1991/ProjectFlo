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
import { LocationsService } from './locations.service';
import {
    CreateLocationDto,
    UpdateLocationDto,
    CreateLocationSpaceDto,
    UpdateLocationSpaceDto,
    CreateFloorPlanDto,
    UpdateFloorPlanDto,
    CreateFloorPlanObjectDto,
    UpdateFloorPlanObjectDto,
    UpdateVenueFloorPlanDto
} from './dto';

@Controller('locations')
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    // ==================== LOCATIONS ====================

    @Post()
    createLocation(@Body(ValidationPipe) createLocationDto: CreateLocationDto) {
        return this.locationsService.createLocation(createLocationDto);
    }

    @Get()
    findAllLocations(@Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number) {
        return this.locationsService.findAllLocations(brandId);
    }

    @Get(':id')
    findLocationById(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.findLocationById(id);
    }

    @Patch(':id')
    updateLocation(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateLocationDto: UpdateLocationDto,
    ) {
        return this.locationsService.updateLocation(id, updateLocationDto);
    }

    @Delete(':id')
    removeLocation(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.removeLocation(id);
    }

    // ==================== VENUE FLOOR PLANS ====================

    @Get(':id/venue-floor-plan')
    getVenueFloorPlan(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.getVenueFloorPlan(id);
    }

    @Patch(':id/venue-floor-plan')
    updateVenueFloorPlan(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateVenueFloorPlanDto: UpdateVenueFloorPlanDto,
    ) {
        return this.locationsService.updateVenueFloorPlan(id, updateVenueFloorPlanDto);
    }

    @Delete(':id/venue-floor-plan')
    resetVenueFloorPlan(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.resetVenueFloorPlan(id);
    }

    // ==================== LOCATION SPACES ====================

    @Post('spaces')
    createLocationSpace(@Body(ValidationPipe) createLocationSpaceDto: CreateLocationSpaceDto) {
        return this.locationsService.createLocationSpace(createLocationSpaceDto);
    }

    @Get(':locationId/spaces')
    findLocationSpaces(@Param('locationId', ParseIntPipe) locationId: number) {
        return this.locationsService.findLocationSpaces(locationId);
    }

    @Get('spaces/:id')
    findLocationSpaceById(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.findLocationSpaceById(id);
    }

    @Patch('spaces/:id')
    updateLocationSpace(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateLocationSpaceDto: UpdateLocationSpaceDto,
    ) {
        return this.locationsService.updateLocationSpace(id, updateLocationSpaceDto);
    }

    @Delete('spaces/:id')
    removeLocationSpace(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.removeLocationSpace(id);
    }

    // ==================== FLOOR PLANS ====================

    @Post('floor-plans')
    createFloorPlan(@Body(ValidationPipe) createFloorPlanDto: CreateFloorPlanDto) {
        return this.locationsService.createFloorPlan(createFloorPlanDto);
    }

    @Get('spaces/:spaceId/floor-plans')
    findFloorPlans(
        @Param('spaceId', ParseIntPipe) spaceId: number,
        @Query('projectId', ParseIntPipe) projectId?: number,
    ) {
        return this.locationsService.findFloorPlans(spaceId, projectId);
    }

    @Get('floor-plans/:id')
    findFloorPlanById(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.findFloorPlanById(id);
    }

    @Patch('floor-plans/:id')
    updateFloorPlan(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateFloorPlanDto: UpdateFloorPlanDto,
    ) {
        return this.locationsService.updateFloorPlan(id, updateFloorPlanDto);
    }

    @Delete('floor-plans/:id')
    removeFloorPlan(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.removeFloorPlan(id);
    }

    @Post('floor-plans/:id/duplicate')
    duplicateFloorPlan(
        @Param('id', ParseIntPipe) id: number,
        @Query('projectId', ParseIntPipe) projectId?: number,
    ) {
        return this.locationsService.duplicateFloorPlan(id, projectId);
    }

    // ==================== FLOOR PLAN OBJECTS ====================

    @Post('floor-plan-objects')
    createFloorPlanObject(@Body(ValidationPipe) createFloorPlanObjectDto: CreateFloorPlanObjectDto) {
        return this.locationsService.createFloorPlanObject(createFloorPlanObjectDto);
    }

    @Get('floor-plan-objects')
    findFloorPlanObjects(
        @Query('category') category?: string,
        @Query('brandId', ParseIntPipe) brandId?: number,
    ) {
        return this.locationsService.findFloorPlanObjects(category, brandId);
    }

    @Get('floor-plan-objects/:id')
    findFloorPlanObjectById(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.findFloorPlanObjectById(id);
    }

    @Patch('floor-plan-objects/:id')
    updateFloorPlanObject(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateFloorPlanObjectDto: UpdateFloorPlanObjectDto,
    ) {
        return this.locationsService.updateFloorPlanObject(id, updateFloorPlanObjectDto);
    }

    @Delete('floor-plan-objects/:id')
    removeFloorPlanObject(@Param('id', ParseIntPipe) id: number) {
        return this.locationsService.removeFloorPlanObject(id);
    }

    // ==================== UTILITY ENDPOINTS ====================

    @Get('categories/spaces')
    getLocationCategories() {
        return this.locationsService.getLocationCategories();
    }

    @Get('categories/objects')
    getObjectCategories() {
        return this.locationsService.getObjectCategories();
    }
}
