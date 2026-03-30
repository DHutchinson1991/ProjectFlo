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
}
