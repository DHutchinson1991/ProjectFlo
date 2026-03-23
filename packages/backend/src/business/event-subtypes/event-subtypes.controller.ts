import { Controller, Get, Post, Body, Param, Headers, HttpCode } from '@nestjs/common';
import { EventSubtypesService } from './event-subtypes.service';
import { CreatePackageFromEventSubtypeDto } from './dto/create-package-from-event-subtype.dto';

@Controller('event-subtypes')
export class EventSubtypesController {
  constructor(private readonly eventSubtypesService: EventSubtypesService) {}

  /**
   * GET /event-subtypes
   * Get all available event subtypes for the brand (system-seeded + brand-specific)
   */
  @Get()
  async findAll(@Headers('x-brand-context') brandIdHeader: string) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventSubtypesService.findAll(brandId);
  }

  /**
   * GET /event-subtypes/system-seeded
   * Get only system-seeded event subtypes available to all brands
   */
  @Get('system-seeded')
  async findSystemSeeded() {
    return this.eventSubtypesService.findSystemSeeded();
  }

  /**
   * GET /event-subtypes/brand-specific
   * Get brand-specific event subtype overrides
   */
  @Get('brand-specific')
  async findBrandSpecific(@Headers('x-brand-context') brandIdHeader: string) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventSubtypesService.findBrandSpecific(brandId);
  }

  /**
   * GET /event-subtypes/:id
   * Get a specific event subtype with all activities and moments (for preview)
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-brand-context') brandIdHeader: string,
  ) {
    const eventSubtypeId = parseInt(id, 10);
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventSubtypesService.findOne(eventSubtypeId, brandId);
  }

  /**
   * POST /event-subtypes/:id/create-package
   * Create a new service package from an event subtype template
   * Automatically populates event days, activities, and moments
   *
   * Body: {
   *   packageName: string;
   *   packageDescription?: string;
   * }
   *
   * Returns: The newly created service package with all related data
   */
  @Post(':id/create-package')
  @HttpCode(201)
  async createPackageFromTemplate(
    @Param('id') id: string,
    @Headers('x-brand-context') brandIdHeader: string,
    @Body() createPackageDto: CreatePackageFromEventSubtypeDto,
  ) {
    const eventSubtypeId = parseInt(id, 10);
    const brandId = parseInt(brandIdHeader, 10);

    return this.eventSubtypesService.createPackageFromTemplate(
      brandId,
      eventSubtypeId,
      createPackageDto.packageName,
      createPackageDto.packageDescription,
    );
  }
}
