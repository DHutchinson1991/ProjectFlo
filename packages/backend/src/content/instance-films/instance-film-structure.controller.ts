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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InstanceStructureService } from './services/instance-structure.service';
import { InstanceFilmCloneService } from './services/instance-film-clone.service';
import {
  CreateInstanceTrackDto,
  UpdateInstanceTrackDto,
  CreateInstanceSubjectDto,
  UpdateInstanceSubjectDto,
} from './dto';
import { InstanceFilmStructureQueryDto } from './dto/instance-film-structure-query.dto';

/**
 * Handles film-level instance structure: clone, tracks, subjects, locations.
 */
@Controller('api/instance-films')
@UseGuards(AuthGuard('jwt'))
export class InstanceFilmStructureController {
  constructor(
    private readonly structureService: InstanceStructureService,
    private readonly cloneService: InstanceFilmCloneService,
  ) {}

  // ── Clone ─────────────────────────────────────────────────────────

  @Post(':projectFilmId/clone-from-library')
  cloneFromLibrary(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
  ) {
    return this.cloneService.cloneFromLibrary(projectFilmId);
  }

  // ── Tracks ────────────────────────────────────────────────────────

  @Get(':projectFilmId/tracks')
  findAllTracks(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Query(new ValidationPipe({ transform: true })) query: InstanceFilmStructureQueryDto,
  ) {
    return this.structureService.findAllTracks(projectFilmId, query.activeOnly === 'true');
  }

  @Post(':projectFilmId/tracks')
  createTrack(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body(ValidationPipe) dto: CreateInstanceTrackDto,
  ) {
    return this.structureService.createTrack(projectFilmId, dto);
  }

  @Patch('tracks/:trackId')
  updateTrack(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Body(ValidationPipe) dto: UpdateInstanceTrackDto,
  ) {
    return this.structureService.updateTrack(trackId, dto);
  }

  @Delete('tracks/:trackId')
  removeTrack(@Param('trackId', ParseIntPipe) trackId: number) {
    return this.structureService.removeTrack(trackId);
  }

  // ── Subjects ──────────────────────────────────────────────────────

  @Get(':projectFilmId/subjects')
  findAllSubjects(@Param('projectFilmId', ParseIntPipe) projectFilmId: number) {
    return this.structureService.findAllSubjects(projectFilmId);
  }

  @Post(':projectFilmId/subjects')
  createSubject(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateInstanceSubjectDto,
  ) {
    return this.structureService.createSubject(projectFilmId, dto);
  }

  @Patch('subjects/:subjectId')
  updateSubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateInstanceSubjectDto,
  ) {
    return this.structureService.updateSubject(subjectId, dto);
  }

  @Delete('subjects/:subjectId')
  removeSubject(@Param('subjectId', ParseIntPipe) subjectId: number) {
    return this.structureService.removeSubject(subjectId);
  }

  // ── Locations ─────────────────────────────────────────────────────

  @Get(':projectFilmId/locations')
  findAllLocations(@Param('projectFilmId', ParseIntPipe) projectFilmId: number) {
    return this.structureService.findAllLocations(projectFilmId);
  }

  @Post(':projectFilmId/locations')
  createLocation(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body(new ValidationPipe({ transform: true })) data: { location_id: number; notes?: string },
  ) {
    return this.structureService.createLocation(projectFilmId, data);
  }

  @Delete('locations/:locationId')
  removeLocation(@Param('locationId', ParseIntPipe) locationId: number) {
    return this.structureService.removeLocation(locationId);
  }

  // ── Scene Subjects ────────────────────────────────────────────────

  @Get('scenes/:sceneId/subjects')
  findSceneSubjects(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.structureService.findSceneSubjects(sceneId);
  }

  @Post('scenes/:sceneId/subjects')
  addSceneSubject(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body(new ValidationPipe({ transform: true })) data: { project_film_subject_id: number; priority?: number; notes?: string },
  ) {
    return this.structureService.addSceneSubject(sceneId, data);
  }

  @Delete('scene-subjects/:id')
  removeSceneSubject(@Param('id', ParseIntPipe) id: number) {
    return this.structureService.removeSceneSubject(id);
  }

  // ── Scene Location ────────────────────────────────────────────────

  @Get('scenes/:sceneId/location')
  getSceneLocation(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.structureService.getSceneLocation(sceneId);
  }

  @Post('scenes/:sceneId/location')
  setSceneLocation(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body(new ValidationPipe({ transform: true })) data: { location_id: number },
  ) {
    return this.structureService.setSceneLocation(sceneId, data);
  }

  @Delete('scenes/:sceneId/location')
  removeSceneLocation(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.structureService.removeSceneLocation(sceneId);
  }
}
