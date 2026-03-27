import { Controller, Get, Post, Body, Param, HttpCode, UseGuards, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventSubtypesService } from './event-subtypes.service';
import { EventSubtypesPackageBuilderService } from './services/event-subtypes-package-builder.service';
import { CreatePackageFromEventSubtypeDto } from './dto/create-package-from-event-subtype.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/event-subtypes')
@UseGuards(AuthGuard('jwt'))
export class EventSubtypesController {
  constructor(
    private readonly eventSubtypesService: EventSubtypesService,
    private readonly packageBuilderService: EventSubtypesPackageBuilderService,
  ) {}

  /**
   * GET /event-subtypes
   * Get all available event subtypes for the brand (system-seeded + brand-specific)
   */
  @Get()
  async findAll(@BrandId() brandId: number) {
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
  async findBrandSpecific(@BrandId() brandId: number) {
    return this.eventSubtypesService.findBrandSpecific(brandId);
  }

  /**
   * GET /event-subtypes/:id
   * Get a specific event subtype with all activities and moments (for preview)
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
  ) {
    return this.eventSubtypesService.findOne(id, brandId);
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
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) createPackageDto: CreatePackageFromEventSubtypeDto,
  ) {
    return this.packageBuilderService.createPackageFromTemplate(
      brandId,
      id,
      createPackageDto.packageName,
      createPackageDto.packageDescription,
    );
  }
}
