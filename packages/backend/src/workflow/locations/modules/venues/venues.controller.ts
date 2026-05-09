import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Query,
    ValidationPipe,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VenuesService } from './venues.service';
import { CreateLocationDto, UpdateLocationDto, VenuesQueryDto } from '../../dto';
import { BrandId } from '../../../../platform/auth/decorators/brand-id.decorator';

/**
 * Controller for managing venues/locations
 */
@Controller('api/locations')
@UseGuards(AuthGuard('jwt'))
export class VenuesController {
    constructor(private readonly venuesService: VenuesService) { }

    // ==================== VENUE/LOCATION MANAGEMENT ====================

    @Post()
    createVenue(@Body(ValidationPipe) createLocationDto: CreateLocationDto) {
        return this.venuesService.createVenue(createLocationDto);
    }

    @Get()
    findAllVenues(
        @BrandId() brandId: number,
        @Query(new ValidationPipe({ transform: true })) query: VenuesQueryDto,
    ) {
        return this.venuesService.findAllVenues(brandId, query);
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

    // ==================== SPACE MANAGEMENT ====================

    @Get(':locationId/spaces')
    getSpaces(@Param('locationId', ParseIntPipe) locationId: number) {
        return this.venuesService.getSpaces(locationId);
    }

    @Post(':locationId/spaces')
    createSpace(
        @Param('locationId', ParseIntPipe) locationId: number,
        @Body() body: { name: string; space_type?: string; capacity?: number; dimensions_length?: number; dimensions_width?: number; dimensions_height?: number; notes?: string },
    ) {
        return this.venuesService.createSpace(locationId, body);
    }

    @Patch('spaces/:spaceId')
    updateSpace(
        @Param('spaceId', ParseIntPipe) spaceId: number,
        @Body() body: { name?: string; space_type?: string; capacity?: number; notes?: string },
    ) {
        return this.venuesService.updateSpace(spaceId, body);
    }

    @Delete('spaces/:spaceId')
    removeSpace(@Param('spaceId', ParseIntPipe) spaceId: number) {
        return this.venuesService.removeSpace(spaceId);
    }
}
