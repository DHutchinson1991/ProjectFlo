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
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FilmsService } from "./films.service";
import { FilmTimelineLayersService } from "./services/film-timeline-layers.service";
import { FilmTimelineTracksService } from "./services/film-timeline-tracks.service";
import { FilmEquipmentAssignmentsService } from "./services/film-equipment-assignments.service";
import { CreateFilmDto, UpdateEquipmentDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";
import {
  AssignEquipmentDto,
  UpdateEquipmentAssignmentDto,
} from "./dto/film-equipment-assignment.dto";
import { FilmsQueryDto } from './dto/films-query.dto';

@Controller("api/films")
@UseGuards(AuthGuard("jwt"))
export class FilmsController {
  constructor(
    private readonly filmsService: FilmsService,
    private readonly layersService: FilmTimelineLayersService,
    private readonly tracksService: FilmTimelineTracksService,
    private readonly equipAssignService: FilmEquipmentAssignmentsService,
  ) {}

  @Post()
  create(@Body(new ValidationPipe({ transform: true })) createFilmDto: CreateFilmDto) {
    return this.filmsService.create(createFilmDto);
  }

  @Post("timeline-layers")
  createTimelineLayer(@Body(new ValidationPipe({ transform: true })) createDto: { name: string; order_index: number; color_hex: string; description?: string }) {
    return this.layersService.create(createDto);
  }

  @Get("timeline-layers")
  getTimelineLayers() {
    return this.layersService.findAll();
  }

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: FilmsQueryDto) {
    return this.filmsService.findAll(query.brandId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateFilmDto: UpdateFilmDto,
  ) {
    return this.filmsService.update(id, updateFilmDto);
  }

  @Patch("timeline-layers/:id")
  updateTimelineLayer(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateDto: { name?: string; order_index?: number; color_hex?: string; description?: string; is_active?: boolean }
  ) {
    return this.layersService.update(id, updateDto);
  }

  @Patch(":id/equipment")
  updateEquipment(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) equipmentDto: UpdateEquipmentDto,
  ) {
    return this.filmsService.updateEquipment(id, equipmentDto);
  }

  @Get(":id/equipment-assignments")
  getFilmEquipment(@Param("id", ParseIntPipe) id: number) {
    return this.equipAssignService.getFilmEquipment(id);
  }

  @Get(":id/equipment-summary")
  getEquipmentSummary(@Param("id", ParseIntPipe) id: number) {
    return this.equipAssignService.getEquipmentSummary(id);
  }

  @Post(":id/equipment-assignments")
  assignEquipment(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: AssignEquipmentDto,
  ) {
    return this.equipAssignService.assignEquipment(id, dto);
  }

  @Patch(":id/equipment-assignments/:equipmentId")
  updateEquipmentAssignment(
    @Param("id", ParseIntPipe) id: number,
    @Param("equipmentId", ParseIntPipe) equipmentId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateEquipmentAssignmentDto,
  ) {
    return this.equipAssignService.updateEquipmentAssignment(id, equipmentId, dto);
  }

  @Delete(":id/equipment-assignments/:equipmentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEquipmentAssignment(
    @Param("id", ParseIntPipe) id: number,
    @Param("equipmentId", ParseIntPipe) equipmentId: number,
  ) {
    return this.equipAssignService.removeEquipmentAssignment(id, equipmentId);
  }

  @Delete("timeline-layers/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTimelineLayer(@Param("id", ParseIntPipe) id: number) {
    return this.layersService.remove(id);
  }

  @Get(":id/tracks")
  getTracks(
    @Param("id", ParseIntPipe) id: number,
    @Query(new ValidationPipe({ transform: true })) query: FilmsQueryDto,
  ) {
    return this.tracksService.getTracks(id, query.activeOnly === 'true');
  }

  @Post(":id/tracks/generate")
  generateTracks(@Param("id", ParseIntPipe) id: number, @Body(new ValidationPipe({ transform: true })) body?: { overwrite?: boolean }) {
    return this.filmsService.generateTracks(id);
  }

  @Patch(":id/tracks/:trackId")
  updateTrack(
    @Param("id", ParseIntPipe) id: number,
    @Param("trackId", ParseIntPipe) trackId: number,
    @Body(new ValidationPipe({ transform: true })) body: { name?: string; is_active?: boolean; crew_member_id?: number | null; is_unmanned?: boolean },
  ) {
    return this.tracksService.updateTrack(id, trackId, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.delete(id);
  }
}
