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
import { VenuesService } from './venues.service';
import { CreateLocationDto, UpdateLocationDto, UpdateVenueFloorPlanDto } from '../../dto';

/**
 * Controller for managing venues/locations and their venue-specific floor plan data
 */
@Controller('locations')
export class VenuesController {
    constructor(private readonly venuesService: VenuesService) { }

    // ==================== VENUE/LOCATION MANAGEMENT ====================

    @Post()
    createVenue(@Body(ValidationPipe) createLocationDto: CreateLocationDto) {
        return this.venuesService.createVenue(createLocationDto);
    }

    @Get()
    findAllVenues(@Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number) {
        return this.venuesService.findAllVenues(brandId);
    }

    @Get(':id')
    findVenueById(@Param('id', ParseIntPipe) id: number) {
        return this.venuesService.findVenueById(id);
    }

    @Patch(':id')
    updateVenue(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateLocationDto: UpdateLocationDto,
    ) {
        return this.venuesService.updateVenue(id, updateLocationDto);
    }

    @Delete(':id')
    removeVenue(@Param('id', ParseIntPipe) id: number) {
        return this.venuesService.removeVenue(id);
    }

    // ==================== VENUE FLOOR PLAN DATA ====================

    @Get(':id/venue-floor-plan')
    getVenueFloorPlan(@Param('id', ParseIntPipe) id: number) {
        return this.venuesService.getVenueFloorPlan(id);
    }

    @Patch(':id/venue-floor-plan')
    updateVenueFloorPlan(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateVenueFloorPlanDto: UpdateVenueFloorPlanDto,
    ) {
        return this.venuesService.updateVenueFloorPlan(id, updateVenueFloorPlanDto);
    }

    @Delete(':id/venue-floor-plan')
    resetVenueFloorPlan(@Param('id', ParseIntPipe) id: number) {
        return this.venuesService.resetVenueFloorPlan(id);
    }
}
