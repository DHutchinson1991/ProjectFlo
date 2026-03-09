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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShotType } from '@prisma/client';
import { InstanceFilmsService } from './instance-films.service';
import { ProjectFilmCloneService } from '../../projects/project-film-clone.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInstanceSceneDto,
  UpdateInstanceSceneDto,
  CreateInstanceMomentDto,
  UpdateInstanceMomentDto,
  CreateInstanceBeatDto,
  UpdateInstanceBeatDto,
  CreateInstanceTrackDto,
  UpdateInstanceTrackDto,
  CreateInstanceSubjectDto,
  UpdateInstanceSubjectDto,
} from './dto/instance-film.dto';

/**
 * InstanceFilmsController
 *
 * Mirrors the library film content endpoints (scenes, moments, beats, tracks,
 * subjects, locations, recording setups) but for project/inquiry instance tables.
 *
 * Prefix: /instance-films
 *
 * Route structure:
 * ──────────────────────────────────────────────
 * SCENES:    /instance-films/:projectFilmId/scenes
 * SCENE:     /instance-films/scenes/:sceneId
 * MOMENTS:   /instance-films/scenes/:sceneId/moments
 * MOMENT:    /instance-films/moments/:momentId
 * BEATS:     /instance-films/scenes/:sceneId/beats
 * BEAT:      /instance-films/beats/:beatId
 * TRACKS:    /instance-films/:projectFilmId/tracks
 * TRACK:     /instance-films/tracks/:trackId
 * SUBJECTS:  /instance-films/:projectFilmId/subjects
 * SUBJECT:   /instance-films/subjects/:subjectId
 * LOCATIONS: /instance-films/:projectFilmId/locations
 * LOCATION:  /instance-films/locations/:locationId
 */
@Controller('instance-films')
export class InstanceFilmsController {
  constructor(
    private readonly service: InstanceFilmsService,
    private readonly filmCloneService: ProjectFilmCloneService,
    private readonly prisma: PrismaService,
  ) {}

  // ════════════════════════════════════════════════════════════════════
  // CLONE FROM LIBRARY
  // ════════════════════════════════════════════════════════════════════

  /**
   * POST /instance-films/:projectFilmId/clone-from-library
   *
   * Triggers a deep-clone of the linked library film's content (scenes,
   * tracks, moments, beats, subjects, locations, etc.) into the instance
   * tables. Idempotent — skips if instance scenes already exist.
   */
  @Post(':projectFilmId/clone-from-library')
  async cloneFromLibrary(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
  ) {
    // 1. Load the ProjectFilm to find the linked library film
    const projectFilm = await this.prisma.projectFilm.findUnique({
      where: { id: projectFilmId },
    });
    if (!projectFilm) {
      throw new Error(`ProjectFilm ${projectFilmId} not found`);
    }
    if (!projectFilm.film_id) {
      return { cloned: false, reason: 'No library film linked' };
    }

    // 2. Check if instance content already exists (idempotent)
    const existingScenes = await this.prisma.projectFilmScene.count({
      where: { project_film_id: projectFilmId },
    });
    if (existingScenes > 0) {
      return { cloned: false, reason: 'Instance already has scenes', existingScenes };
    }

    // 3. Run the deep clone
    const result = await this.filmCloneService.cloneFilmContent(
      {
        projectId: projectFilm.project_id ?? undefined,
        inquiryId: projectFilm.inquiry_id ?? undefined,
        projectFilmId,
      },
      projectFilm.film_id,
    );

    return { cloned: true, ...result.summary };
  }

  // ════════════════════════════════════════════════════════════════════
  // SCENES
  // ════════════════════════════════════════════════════════════════════

  @Post(':projectFilmId/scenes')
  createScene(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body() dto: CreateInstanceSceneDto,
  ) {
    return this.service.createScene(projectFilmId, dto);
  }

  @Get(':projectFilmId/scenes')
  findAllScenes(@Param('projectFilmId', ParseIntPipe) projectFilmId: number) {
    return this.service.findAllScenes(projectFilmId);
  }

  @Get('scenes/:sceneId')
  findOneScene(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.findOneScene(sceneId);
  }

  @Patch('scenes/:sceneId')
  updateScene(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body() dto: UpdateInstanceSceneDto,
  ) {
    return this.service.updateScene(sceneId, dto);
  }

  @Delete('scenes/:sceneId')
  @HttpCode(HttpStatus.OK)
  removeScene(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.removeScene(sceneId);
  }

  @Post(':projectFilmId/scenes/reorder')
  reorderScenes(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body() orderings: Array<{ id: number; order_index: number }>,
  ) {
    return this.service.reorderScenes(projectFilmId, orderings);
  }

  // ── Scene Recording Setup ─────────────────────────────────────────

  @Get('scenes/:sceneId/recording-setup')
  getSceneRecordingSetup(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.getSceneRecordingSetup(sceneId);
  }

  @Patch('scenes/:sceneId/recording-setup')
  upsertSceneRecordingSetup(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body() data: { audio_track_ids?: number[]; graphics_enabled?: boolean },
  ) {
    return this.service.upsertSceneRecordingSetup(sceneId, data);
  }

  @Delete('scenes/:sceneId/recording-setup')
  deleteSceneRecordingSetup(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.deleteSceneRecordingSetup(sceneId);
  }

  // ════════════════════════════════════════════════════════════════════
  // MOMENTS
  // ════════════════════════════════════════════════════════════════════

  @Post('scenes/:sceneId/moments')
  createMoment(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body() dto: CreateInstanceMomentDto,
  ) {
    dto.project_scene_id = sceneId;
    return this.service.createMoment(sceneId, dto);
  }

  @Get('scenes/:sceneId/moments')
  findAllMoments(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.findAllMoments(sceneId);
  }

  @Get('moments/:momentId')
  findOneMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.service.findOneMoment(momentId);
  }

  @Patch('moments/:momentId')
  updateMoment(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body() dto: UpdateInstanceMomentDto,
  ) {
    return this.service.updateMoment(momentId, dto);
  }

  @Delete('moments/:momentId')
  removeMoment(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.service.removeMoment(momentId);
  }

  @Post('scenes/:sceneId/moments/reorder')
  reorderMoments(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body() orderings: Array<{ id: number; order_index: number }>,
  ) {
    return this.service.reorderMoments(sceneId, orderings);
  }

  // ── Moment Recording Setup ────────────────────────────────────────

  @Get('moments/:momentId/recording-setup')
  getMomentRecordingSetup(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.service.getMomentRecordingSetup(momentId);
  }

  @Patch('moments/:momentId/recording-setup')
  upsertMomentRecordingSetup(
    @Param('momentId', ParseIntPipe) momentId: number,
    @Body()
    data: {
      camera_assignments?: Array<{
        track_id: number;
        subject_ids?: number[];
        shot_type?: ShotType | null;
      }>;
      audio_track_ids?: number[];
      graphics_enabled?: boolean;
      graphics_title?: string | null;
    },
  ) {
    return this.service.upsertMomentRecordingSetup(momentId, data);
  }

  @Delete('moments/:momentId/recording-setup')
  deleteMomentRecordingSetup(@Param('momentId', ParseIntPipe) momentId: number) {
    return this.service.deleteMomentRecordingSetup(momentId);
  }

  // ════════════════════════════════════════════════════════════════════
  // BEATS
  // ════════════════════════════════════════════════════════════════════

  @Post('scenes/:sceneId/beats')
  createBeat(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body() dto: CreateInstanceBeatDto,
  ) {
    dto.project_scene_id = sceneId;
    return this.service.createBeat(sceneId, dto);
  }

  @Get('scenes/:sceneId/beats')
  findAllBeats(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.findAllBeats(sceneId);
  }

  @Get('beats/:beatId')
  findOneBeat(@Param('beatId', ParseIntPipe) beatId: number) {
    return this.service.findOneBeat(beatId);
  }

  @Patch('beats/:beatId')
  updateBeat(
    @Param('beatId', ParseIntPipe) beatId: number,
    @Body() dto: UpdateInstanceBeatDto,
  ) {
    return this.service.updateBeat(beatId, dto);
  }

  @Delete('beats/:beatId')
  removeBeat(@Param('beatId', ParseIntPipe) beatId: number) {
    return this.service.removeBeat(beatId);
  }

  // ── Beat Recording Setup ──────────────────────────────────────────

  @Get('beats/:beatId/recording-setup')
  getBeatRecordingSetup(@Param('beatId', ParseIntPipe) beatId: number) {
    return this.service.getBeatRecordingSetup(beatId);
  }

  @Patch('beats/:beatId/recording-setup')
  upsertBeatRecordingSetup(
    @Param('beatId', ParseIntPipe) beatId: number,
    @Body() data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean },
  ) {
    return this.service.upsertBeatRecordingSetup(beatId, data);
  }

  @Delete('beats/:beatId/recording-setup')
  deleteBeatRecordingSetup(@Param('beatId', ParseIntPipe) beatId: number) {
    return this.service.deleteBeatRecordingSetup(beatId);
  }

  // ════════════════════════════════════════════════════════════════════
  // TRACKS
  // ════════════════════════════════════════════════════════════════════

  @Get(':projectFilmId/tracks')
  findAllTracks(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.findAllTracks(projectFilmId, activeOnly === 'true');
  }

  @Post(':projectFilmId/tracks')
  createTrack(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body() dto: CreateInstanceTrackDto,
  ) {
    return this.service.createTrack(projectFilmId, dto);
  }

  @Patch('tracks/:trackId')
  updateTrack(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Body() dto: UpdateInstanceTrackDto,
  ) {
    return this.service.updateTrack(trackId, dto);
  }

  @Delete('tracks/:trackId')
  removeTrack(@Param('trackId', ParseIntPipe) trackId: number) {
    return this.service.removeTrack(trackId);
  }

  // ════════════════════════════════════════════════════════════════════
  // SUBJECTS
  // ════════════════════════════════════════════════════════════════════

  @Get(':projectFilmId/subjects')
  findAllSubjects(@Param('projectFilmId', ParseIntPipe) projectFilmId: number) {
    return this.service.findAllSubjects(projectFilmId);
  }

  @Post(':projectFilmId/subjects')
  createSubject(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body() dto: CreateInstanceSubjectDto,
  ) {
    return this.service.createSubject(projectFilmId, dto);
  }

  @Patch('subjects/:subjectId')
  updateSubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Body() dto: UpdateInstanceSubjectDto,
  ) {
    return this.service.updateSubject(subjectId, dto);
  }

  @Delete('subjects/:subjectId')
  removeSubject(@Param('subjectId', ParseIntPipe) subjectId: number) {
    return this.service.removeSubject(subjectId);
  }

  // ── Scene Subjects ────────────────────────────────────────────────

  @Get('scenes/:sceneId/subjects')
  findSceneSubjects(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.findSceneSubjects(sceneId);
  }

  @Post('scenes/:sceneId/subjects')
  addSceneSubject(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body() data: { project_film_subject_id: number; priority?: number; notes?: string },
  ) {
    return this.service.addSceneSubject(sceneId, data);
  }

  @Delete('scene-subjects/:id')
  removeSceneSubject(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeSceneSubject(id);
  }

  // ════════════════════════════════════════════════════════════════════
  // LOCATIONS
  // ════════════════════════════════════════════════════════════════════

  @Get(':projectFilmId/locations')
  findAllLocations(@Param('projectFilmId', ParseIntPipe) projectFilmId: number) {
    return this.service.findAllLocations(projectFilmId);
  }

  @Post(':projectFilmId/locations')
  createLocation(
    @Param('projectFilmId', ParseIntPipe) projectFilmId: number,
    @Body() data: { location_id: number; notes?: string },
  ) {
    return this.service.createLocation(projectFilmId, data);
  }

  @Delete('locations/:locationId')
  removeLocation(@Param('locationId', ParseIntPipe) locationId: number) {
    return this.service.removeLocation(locationId);
  }

  // ── Scene Location ────────────────────────────────────────────────

  @Get('scenes/:sceneId/location')
  getSceneLocation(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.getSceneLocation(sceneId);
  }

  @Post('scenes/:sceneId/location')
  setSceneLocation(
    @Param('sceneId', ParseIntPipe) sceneId: number,
    @Body() data: { location_id: number },
  ) {
    return this.service.setSceneLocation(sceneId, data);
  }

  @Delete('scenes/:sceneId/location')
  removeSceneLocation(@Param('sceneId', ParseIntPipe) sceneId: number) {
    return this.service.removeSceneLocation(sceneId);
  }
}
