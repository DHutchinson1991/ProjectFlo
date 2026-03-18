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
} from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateLocationSpaceDto, UpdateLocationSpaceDto } from '../../dto';

/**
 * Controller for managing location spaces within venues
 */
@Controller('locations')
export class SpacesController {
    constructor(private readonly spacesService: SpacesService) { }

    // ==================== LOCATION SPACES ====================

    @Post('spaces')
    createLocationSpace(@Body(ValidationPipe) createLocationSpaceDto: CreateLocationSpaceDto) {
        return this.spacesService.createLocationSpace(createLocationSpaceDto);
    }

    @Get(':locationId/spaces')
    findLocationSpaces(@Param('locationId', ParseIntPipe) locationId: number) {
        return this.spacesService.findLocationSpaces(locationId);
    }

    @Get('spaces/:id')
    findLocationSpaceById(@Param('id', ParseIntPipe) id: number) {
        return this.spacesService.findLocationSpaceById(id);
    }

    @Patch('spaces/:id')
    updateLocationSpace(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateLocationSpaceDto: UpdateLocationSpaceDto,
    ) {
        return this.spacesService.updateLocationSpace(id, updateLocationSpaceDto);
    }

    @Delete('spaces/:id')
    removeLocationSpace(@Param('id', ParseIntPipe) id: number) {
        return this.spacesService.removeLocationSpace(id);
    }

    // ==================== UTILITY ENDPOINTS ====================

    @Get('categories/spaces')
    getLocationCategories() {
        return this.spacesService.getLocationCategories();
    }
}
