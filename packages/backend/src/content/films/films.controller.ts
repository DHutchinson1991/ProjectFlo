import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { FilmsService } from "./films.service";
import { CreateFilmDto, UpdateEquipmentDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";
import {
  AssignEquipmentDto,
  UpdateEquipmentAssignmentDto,
} from "./dto/film-equipment-assignment.dto";

/**
 * Films Controller (refactor v2)
 * Handles HTTP endpoints for film CRUD and equipment management
 */
@Controller("films")
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  /**
   * Create a new film with optional equipment configuration
   * POST /films
   */
  @Post()
  create(@Body() createFilmDto: CreateFilmDto) {
    return this.filmsService.create(createFilmDto);
  }

  /**
   * Create a new timeline layer
   * POST /films/timeline-layers
   */
  @Post("timeline-layers")
  createTimelineLayer(@Body() createDto: { name: string; order_index: number; color_hex: string; description?: string }) {
    return this.filmsService.createTimelineLayer(createDto);
  }

  /**
   * Get all timeline layers (for track organization)
   * GET /films/timeline-layers
   */
  @Get("timeline-layers")
  getTimelineLayers() {
    return this.filmsService.getTimelineLayers();
  }

  /**
   * Get all films, optionally filtered by brand
   * GET /films?brandId=1
   */
  @Get()
  findAll(@Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number) {
    return this.filmsService.findAll(brandId);
  }

  /**
   * Get a single film with all nested data
   * GET /films/:id
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.findOne(id);
  }

  /**
   * Update film basic information
   * PATCH /films/:id
   */
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateFilmDto: UpdateFilmDto,
  ) {
    return this.filmsService.update(id, updateFilmDto);
  }

  /**
   * Update a timeline layer
   * PATCH /films/timeline-layers/:id
   */
  @Patch("timeline-layers/:id")
  updateTimelineLayer(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: { name?: string; order_index?: number; color_hex?: string; description?: string; is_active?: boolean }
  ) {
    return this.filmsService.updateTimelineLayer(id, updateDto);
  }

  /**
   * Update film equipment (add/remove cameras and audio tracks)
   * PATCH /films/:id/equipment
   */
  @Patch(":id/equipment")
  updateEquipment(
    @Param("id", ParseIntPipe) id: number,
    @Body() equipmentDto: UpdateEquipmentDto,
  ) {
    return this.filmsService.updateEquipment(id, equipmentDto);
  }

  // ============================================================================
  // Equipment Assignment Endpoints (Film <-> Equipment Library)
  // ============================================================================

  /**
   * Get all equipment assigned to a film
   * GET /films/:id/equipment-assignments
   */
  @Get(":id/equipment-assignments")
  getFilmEquipment(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.getFilmEquipment(id);
  }

  /**
   * Get equipment summary for a film (counts by type)
   * GET /films/:id/equipment-summary
   */
  @Get(":id/equipment-summary")
  getEquipmentSummary(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.getEquipmentSummary(id);
  }

  /**
   * Assign equipment to a film
   * POST /films/:id/equipment-assignments
   */
  @Post(":id/equipment-assignments")
  assignEquipment(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AssignEquipmentDto,
  ) {
    return this.filmsService.assignEquipment(id, dto);
  }

  /**
   * Update equipment assignment
   * PATCH /films/:id/equipment-assignments/:equipmentId
   */
  @Patch(":id/equipment-assignments/:equipmentId")
  updateEquipmentAssignment(
    @Param("id", ParseIntPipe) id: number,
    @Param("equipmentId", ParseIntPipe) equipmentId: number,
    @Body() dto: UpdateEquipmentAssignmentDto,
  ) {
    return this.filmsService.updateEquipmentAssignment(id, equipmentId, dto);
  }

  /**
   * Remove equipment assignment
   * DELETE /films/:id/equipment-assignments/:equipmentId
   */
  @Delete(":id/equipment-assignments/:equipmentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEquipmentAssignment(
    @Param("id", ParseIntPipe) id: number,
    @Param("equipmentId", ParseIntPipe) equipmentId: number,
  ) {
    return this.filmsService.removeEquipmentAssignment(id, equipmentId);
  }


  /**
   * Delete a timeline layer
   * DELETE /films/timeline-layers/:id
   */
  @Delete("timeline-layers/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTimelineLayer(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.deleteTimelineLayer(id);
  }

  /**
   * Get all timeline tracks for a film
   * GET /films/:id/tracks
   */
  @Get(":id/tracks")
  getTracks(
    @Param("id", ParseIntPipe) id: number,
    @Query('activeOnly') activeOnly?: string
  ) {
    const activeOnlyBool = activeOnly === 'true';
    return this.filmsService.getTracks(id, activeOnlyBool);
  }

  /**
   * Regenerate tracks based on current equipment configuration
   * POST /films/:id/tracks/generate
   */
  @Post(":id/tracks/generate")
  generateTracks(@Param("id", ParseIntPipe) id: number, @Body() body?: { overwrite?: boolean }) {
    return this.filmsService.generateTracks(id);
  }

  /**
   * Update a specific track (name, active status, operator assignment)
   * PATCH /films/:id/tracks/:trackId
   */
  @Patch(":id/tracks/:trackId")
  updateTrack(
    @Param("id", ParseIntPipe) id: number,
    @Param("trackId", ParseIntPipe) trackId: number,
    @Body() body: { name?: string; is_active?: boolean; operator_template_id?: number | null },
  ) {
    return this.filmsService.updateTrack(id, trackId, body);
  }

  /**
   * Delete a film
   * DELETE /films/:id
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.delete(id);
  }
}
