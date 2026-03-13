import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFilmDto, UpdateEquipmentDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";
import { FilmResponseDto } from "./dto/film-response.dto";
import { FilmEquipmentService } from "./services/film-equipment.service";
import { FilmScenesManagementService } from "./services/film-scenes-management.service";
import { LoggerService } from "../../common/logging/logger.service";
import { Prisma, FilmTimelineTrack, FilmType } from "@prisma/client";
import {
  AssignEquipmentDto,
  UpdateEquipmentAssignmentDto,
  FilmEquipmentResponseDto,
  EquipmentSummaryDto,
} from "./dto/film-equipment-assignment.dto";

/**
 * Main Films Service (refactor v2)
 * Coordinates all film-related operations using Film model
 */
@Injectable()
export class FilmsService {
  private readonly logger = new LoggerService(FilmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: FilmEquipmentService,
    private readonly scenesService: FilmScenesManagementService,
  ) {}

  /**
   * Create a new film with equipment configuration
   */
  async create(createDto: CreateFilmDto): Promise<FilmResponseDto> {
    this.logger.log('Creating film', { name: createDto.name, brand_id: createDto.brand_id });

    // If montage_preset_id provided, auto-set target durations from preset
    let targetMin = createDto.target_duration_min ?? null;
    let targetMax = createDto.target_duration_max ?? null;
    if (createDto.montage_preset_id && (targetMin === null || targetMax === null)) {
      const preset = await this.prisma.montagePreset.findUnique({
        where: { id: createDto.montage_preset_id },
      });
      if (preset) {
        targetMin = targetMin ?? preset.min_duration_seconds;
        targetMax = targetMax ?? preset.max_duration_seconds;
      }
    }

    // Create film
    const film = await this.prisma.film.create({
      data: {
        name: createDto.name,
        brand_id: createDto.brand_id,
        film_type: (createDto.film_type as any) ?? 'FEATURE',
        montage_preset_id: createDto.montage_preset_id ?? null,
        target_duration_min: targetMin,
        target_duration_max: targetMax,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Configure equipment (creates tracks)
    await this.equipmentService.configureEquipment(
      film.id,
      createDto.num_cameras || 0,
      createDto.num_audio || 0,
    );

    this.logger.log('Film created successfully', { filmId: film.id });

    return this.findOne(film.id);
  }

  /**
   * Find all films, optionally filtered by brand
   */
  async findAll(brandId?: number): Promise<FilmResponseDto[]> {
    const films = await this.prisma.film.findMany({
      where: brandId ? { brand_id: brandId } : {},
      include: {
        montage_preset: true,
        tracks: {
          orderBy: { order_index: 'asc' },
        },
        subjects: true,
        locations: {
          include: { location: true },
        },
        scenes: {
          include: {
            moments: {
              orderBy: { order_index: 'asc' },
              include: {
                subjects: {
                  include: {
                    subject: {
                      include: {
                        role_template: true,
                      },
                    },
                  },
                },
                recording_setup: {
                  include: {
                    camera_assignments: {
                      include: {
                        track: true,
                      },
                    },
                  },
                },
                moment_music: true,
              },
            },
            beats: {
              orderBy: { order_index: 'asc' },
              include: { recording_setup: true },
            },
            recording_setup: {
              include: {
                camera_assignments: {
                  include: {
                    track: true,
                  },
                },
              },
            },
            scene_music: true,
            audio_sources: {
              orderBy: { order_index: 'asc' },
            },
            location_assignment: {
              include: { location: true },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      } as any,
      orderBy: { created_at: 'desc' },
    });

    return films.map((film) => this.mapToResponseDto(film));
  }

  /**
   * Find a specific film by ID with all nested data
   */
  async findOne(id: number): Promise<FilmResponseDto> {
    const film = await this.prisma.film.findUnique({
      where: { id },
      include: {
        montage_preset: true,
        tracks: {
          orderBy: { order_index: 'asc' },
        },
        subjects: true,
        locations: {
          include: { location: true },
        },
        scenes: {
          include: {
            moments: {
              orderBy: { order_index: 'asc' },
              include: {
                subjects: {
                  include: {
                    subject: {
                      include: {
                        role_template: true,
                      },
                    },
                  },
                },
                recording_setup: {
                  include: {
                    camera_assignments: {
                      include: {
                        track: true,
                      },
                    },
                  },
                },
                moment_music: true,
              },
            },
            beats: {
              orderBy: { order_index: 'asc' },
              include: { recording_setup: true },
            },
            recording_setup: {
              include: {
                camera_assignments: {
                  include: {
                    track: true,
                  },
                },
              },
            },
            scene_music: true,
            audio_sources: {
              orderBy: { order_index: 'asc' },
            },
            location_assignment: {
              include: { location: true },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      } as any,
    });

    if (!film) {
      throw new NotFoundException(`Film with ID ${id} not found`);
    }

    return this.mapToResponseDto(film);
  }

  /**
   * Update film details
   */
  async update(id: number, updateData: UpdateFilmDto): Promise<FilmResponseDto> {
    this.logger.log('Updating film', { filmId: id, updates: updateData });

    const { film_type, ...rest } = updateData;
    await this.prisma.film.update({
      where: { id },
      data: {
        ...rest,
        ...(film_type !== undefined && { film_type: film_type as FilmType }),
        updated_at: new Date(),
      },
    });

    return this.findOne(id);
  }

  /**
   * Update equipment configuration (add/remove tracks)
   */
  async updateEquipment(id: number, equipmentDto: UpdateEquipmentDto): Promise<FilmResponseDto> {
    this.logger.log('Updating equipment', { filmId: id, equipment: equipmentDto });

    await this.equipmentService.updateEquipment(
      id,
      equipmentDto.num_cameras,
      equipmentDto.num_audio,
      equipmentDto.allow_removal,
    );

    return this.findOne(id);
  }

  /**
   * Regenerate tracks based on current equipment configuration
   */
  async generateTracks(id: number): Promise<FilmTimelineTrack[]> {
    this.logger.log('Regenerating tracks', { filmId: id });

    // Get current equipment counts
    const equipment = await this.equipmentService.getEquipmentSummary(id);
    const numCameras = equipment.cameras;
    const numAudio = equipment.audio;

    await this.equipmentService.configureEquipment(id, numCameras, numAudio);

    // Return the new tracks
    return this.getTracks(id, false);
  }
  async delete(id: number): Promise<{ message: string }> {
    this.logger.log('Deleting film', { filmId: id });

    await this.prisma.film.delete({
      where: { id },
    });

    this.logger.log('Film deleted successfully', { filmId: id });

    return { message: "Film deleted successfully" };
  }

  /**
   * Get all timeline layers (for track organization)
   */
  async getTimelineLayers() {
    this.logger.log('Fetching timeline layers');

    return this.prisma.timelineLayer.findMany({
      where: { is_active: true },
      orderBy: { order_index: 'asc' },
    });
  }

  /**
   * Create a new timeline layer
   */
  async createTimelineLayer(createDto: { name: string; order_index: number; color_hex: string; description?: string }) {
    this.logger.log('Creating timeline layer', { name: createDto.name });

    return this.prisma.timelineLayer.create({
      data: {
        name: createDto.name,
        order_index: createDto.order_index,
        color_hex: createDto.color_hex,
        description: createDto.description,
        is_active: true,
      },
    });
  }

  /**
   * Update a timeline layer
   */
  async updateTimelineLayer(
    id: number,
    updateDto: { name?: string; order_index?: number; color_hex?: string; description?: string; is_active?: boolean }
  ) {
    this.logger.log('Updating timeline layer', { layerId: id });

    const layer = await this.prisma.timelineLayer.findUnique({ where: { id } });
    if (!layer) {
      throw new NotFoundException(`Timeline layer with ID ${id} not found`);
    }

    return this.prisma.timelineLayer.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Delete a timeline layer
   */
  async deleteTimelineLayer(id: number): Promise<{ message: string }> {
    this.logger.log('Deleting timeline layer', { layerId: id });

    const layer = await this.prisma.timelineLayer.findUnique({ where: { id } });
    if (!layer) {
      throw new NotFoundException(`Timeline layer with ID ${id} not found`);
    }

    await this.prisma.timelineLayer.delete({
      where: { id },
    });

    this.logger.log('Timeline layer deleted successfully', { layerId: id });

    return { message: "Timeline layer deleted successfully" };
  }

  /**
   * Map Prisma result to FilmResponseDto
   */
  private mapToResponseDto(film: any): FilmResponseDto {
    return {
      id: film.id,
      name: film.name,
      brand_id: film.brand_id,
      film_type: film.film_type ?? 'FEATURE',
      montage_preset_id: film.montage_preset_id ?? null,
      target_duration_min: film.target_duration_min ?? null,
      target_duration_max: film.target_duration_max ?? null,
      created_at: film.created_at,
      updated_at: film.updated_at,
      montage_preset: film.montage_preset
        ? {
            id: film.montage_preset.id,
            name: film.montage_preset.name,
            min_duration_seconds: film.montage_preset.min_duration_seconds,
            max_duration_seconds: film.montage_preset.max_duration_seconds,
          }
        : null,
      tracks: film.tracks || [],
      subjects: film.subjects || [],
      locations: (film.locations || []).map((assignment) => ({
        id: assignment.id,
        film_id: assignment.film_id,
        location_id: assignment.location_id,
        notes: assignment.notes ?? null,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        location: assignment.location,
      })),
      scenes: (film.scenes || []).map((scene) => ({
        id: scene.id,
        film_id: scene.film_id,
        scene_template_id: scene.scene_template_id,
        name: scene.name,
        mode: scene.mode || 'MOMENTS',
        shot_count: (scene as any).shot_count ?? null,
        duration_seconds: (scene as any).duration_seconds ?? null,
        order_index: scene.order_index,
        created_at: scene.created_at,
        updated_at: scene.updated_at,
        location_assignment: (scene as any).location_assignment
          ? {
              id: (scene as any).location_assignment.id,
              scene_id: (scene as any).location_assignment.scene_id,
              location_id: (scene as any).location_assignment.location_id,
              created_at: (scene as any).location_assignment.created_at,
              updated_at: (scene as any).location_assignment.updated_at,
              location: (scene as any).location_assignment.location,
            }
          : null,
        moments: (scene.moments || []).map((moment) => ({
          id: moment.id,
          film_scene_id: moment.film_scene_id,
          name: moment.name,
          order_index: moment.order_index,
          duration: moment.duration,
          created_at: moment.created_at,
          updated_at: moment.updated_at,
          subjects: (moment as any).subjects
            ? (moment as any).subjects.map((assignment: any) => ({
                id: assignment.id,
                moment_id: assignment.moment_id,
                subject_id: assignment.subject_id,
                priority: assignment.priority,
                notes: assignment.notes ?? null,
                created_at: assignment.created_at,
                updated_at: assignment.updated_at,
                subject: assignment.subject
                  ? {
                      ...assignment.subject,
                      role: assignment.subject.role_template
                        ? {
                            id: assignment.subject.role_template.id,
                            role_name: assignment.subject.role_template.role_name,
                            description: assignment.subject.role_template.description,
                            is_core: assignment.subject.role_template.is_core,
                          }
                        : null,
                    }
                  : null,
              }))
            : [],
          has_recording_setup: !!moment.recording_setup,
          recording_setup: moment.recording_setup
            ? {
                id: moment.recording_setup.id,
                audio_track_ids: moment.recording_setup.audio_track_ids,
                graphics_enabled: moment.recording_setup.graphics_enabled,
                graphics_title: moment.recording_setup.graphics_title ?? null,
                camera_assignments: moment.recording_setup.camera_assignments.map((a) => ({
                  track_id: a.track_id,
                  track_name: a.track?.name || String(a.track_id),
                  track_type: a.track?.type ? String(a.track.type) : undefined,
                  subject_ids: a.subject_ids,
                  shot_type: (a as any).shot_type ?? undefined,
                })),
              }
            : null,
          moment_music: (moment as any).moment_music
            ? {
                id: (moment as any).moment_music.id,
                moment_id: (moment as any).moment_music.moment_id,
                music_name: (moment as any).moment_music.music_name,
                artist: (moment as any).moment_music.artist,
                duration: (moment as any).moment_music.duration,
                music_type: (moment as any).moment_music.music_type,
                overrides_scene_music: (moment as any).moment_music.overrides_scene_music,
                created_at: (moment as any).moment_music.created_at,
                updated_at: (moment as any).moment_music.updated_at,
              }
            : null,
        })),
        beats: (scene.beats || []).map((beat) => ({
          id: beat.id,
          film_scene_id: beat.film_scene_id,
          name: beat.name,
          order_index: beat.order_index,
          shot_count: (beat as any).shot_count ?? null,
          duration_seconds: beat.duration_seconds,
          source_activity_id: (beat as any).source_activity_id ?? null,
          source_moment_id: (beat as any).source_moment_id ?? null,
          source_scene_id: (beat as any).source_scene_id ?? null,
          recording_setup: (beat as any).recording_setup
            ? {
                id: (beat as any).recording_setup.id,
                camera_track_ids: (beat as any).recording_setup.camera_track_ids,
                audio_track_ids: (beat as any).recording_setup.audio_track_ids,
                graphics_enabled: (beat as any).recording_setup.graphics_enabled,
                created_at: (beat as any).recording_setup.created_at,
                updated_at: (beat as any).recording_setup.updated_at,
              }
            : null,
          created_at: beat.created_at,
          updated_at: beat.updated_at,
        })),
        recording_setup: scene.recording_setup
          ? {
              id: scene.recording_setup.id,
              audio_track_ids: scene.recording_setup.audio_track_ids,
              graphics_enabled: scene.recording_setup.graphics_enabled,
              camera_assignments: scene.recording_setup.camera_assignments.map((a) => ({
                track_id: a.track_id,
                track_name: a.track?.name || String(a.track_id),
                track_type: a.track?.type ? String(a.track.type) : undefined,
                subject_ids: a.subject_ids,
              })),
            }
          : null,
        scene_music: (scene as any).scene_music
          ? {
              id: (scene as any).scene_music.id,
              film_scene_id: (scene as any).scene_music.film_scene_id,
              music_name: (scene as any).scene_music.music_name,
              artist: (scene as any).scene_music.artist,
              duration: (scene as any).scene_music.duration,
              music_type: (scene as any).scene_music.music_type,
              created_at: (scene as any).scene_music.created_at,
              updated_at: (scene as any).scene_music.updated_at,
            }
          : null,
        audio_sources: ((scene as any).audio_sources || []).map((src: any) => ({
          id: src.id,
          scene_id: src.scene_id,
          source_type: src.source_type,
          source_activity_id: src.source_activity_id,
          source_moment_id: src.source_moment_id,
          source_scene_id: src.source_scene_id,
          track_type: src.track_type,
          start_offset_seconds: src.start_offset_seconds,
          duration_seconds: src.duration_seconds,
          order_index: src.order_index,
          notes: src.notes,
          created_at: src.created_at,
          updated_at: src.updated_at,
        })),
      })),
    };
  }

  /**
   * Get timeline tracks for a film, including operator assignments
   */
  async getTracks(filmId: number, activeOnly: boolean = false) {
    const whereClause: Prisma.FilmTimelineTrackWhereInput = { film_id: filmId };
    if (activeOnly) {
      whereClause.is_active = true;
    }

    return this.prisma.filmTimelineTrack.findMany({
      where: whereClause,
      orderBy: { order_index: 'asc' },
      include: {
        contributor: {
          select: {
            id: true,
            crew_color: true,
            contact: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });
  }

  /**
   * Update a specific track (name, active status, crew assignment)
   */
  async updateTrack(
    filmId: number,
    trackId: number,
    data: { name?: string; is_active?: boolean; contributor_id?: number | null; is_unmanned?: boolean },
  ) {
    // Verify track belongs to this film
    const track = await this.prisma.filmTimelineTrack.findFirst({
      where: { id: trackId, film_id: filmId },
    });
    if (!track) {
      throw new NotFoundException(
        `Track ${trackId} not found for film ${filmId}`,
      );
    }

    return this.prisma.filmTimelineTrack.update({
      where: { id: trackId },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        contributor: {
          select: {
            id: true,
            crew_color: true,
            contact: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });
  }

  // ============================================================================
  // Equipment Assignment Methods (delegated to FilmEquipmentService)
  // ============================================================================

  /**
   * Get all equipment assigned to a film
   */
  async getFilmEquipment(filmId: number): Promise<FilmEquipmentResponseDto[]> {
    return this.equipmentService.getFilmEquipment(filmId);
  }

  /**
   * Get equipment summary for a film
   */
  async getEquipmentSummary(filmId: number): Promise<EquipmentSummaryDto> {
    return this.equipmentService.getEquipmentSummary(filmId);
  }

  /**
   * Assign equipment to a film
   */
  async assignEquipment(
    filmId: number,
    dto: AssignEquipmentDto,
  ): Promise<FilmEquipmentResponseDto> {
    return this.equipmentService.assignEquipment(filmId, dto);
  }

  /**
   * Update equipment assignment
   */
  async updateEquipmentAssignment(
    filmId: number,
    equipmentId: number,
    dto: UpdateEquipmentAssignmentDto,
  ): Promise<FilmEquipmentResponseDto> {
    return this.equipmentService.updateEquipmentAssignment(filmId, equipmentId, dto);
  }

  /**
   * Remove equipment assignment
   */
  async removeEquipmentAssignment(filmId: number, equipmentId: number): Promise<void> {
    return this.equipmentService.removeEquipmentAssignment(filmId, equipmentId);
  }
}
