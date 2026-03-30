import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { CreateFilmDto, UpdateEquipmentDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";
import { FilmResponseDto } from "./dto/film-response.dto";
import { FilmEquipmentService } from "./services/film-equipment.service";
import { FilmType } from "@prisma/client";
import { FilmWithDetails } from "./types/film-payload.type";

/**
 * Main Films Service (refactor v2)
 * Coordinates all film-related operations using Film model
 */
@Injectable()
export class FilmsService {
  private readonly logger = new Logger(FilmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: FilmEquipmentService,
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
        film_type: (createDto.film_type as FilmType) ?? FilmType.FEATURE,
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
          include: {
            crew: {
              select: {
                id: true,
                crew_color: true,
                contact: { select: { first_name: true, last_name: true } },
              },
            },
          },
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
      },
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
          include: {
            crew: {
              select: {
                id: true,
                crew_color: true,
                contact: { select: { first_name: true, last_name: true } },
              },
            },
          },
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
      },
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
  async generateTracks(id: number) {
    this.logger.log('Regenerating tracks', { filmId: id });

    const equipment = await this.equipmentService.getEquipmentSummary(id);
    await this.equipmentService.configureEquipment(id, equipment.cameras, equipment.audio);

    return this.prisma.filmTimelineTrack.findMany({
      where: { film_id: id },
      orderBy: { order_index: 'asc' },
      include: {
        crew: {
          select: {
            id: true,
            crew_color: true,
            contact: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });
  }

  async delete(id: number): Promise<{ message: string }> {
    this.logger.log('Deleting film', { filmId: id });
    await this.prisma.film.delete({ where: { id } });
    return { message: "Film deleted successfully" };
  }

  /**
   * Map Prisma result to FilmResponseDto
   */
  private mapToResponseDto(film: FilmWithDetails): FilmResponseDto {
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
      tracks: film.tracks.map((track) => ({
        ...track,
      })),
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
        shot_count: scene.shot_count ?? null,
        duration_seconds: scene.duration_seconds ?? null,
        order_index: scene.order_index,
        created_at: scene.created_at,
        updated_at: scene.updated_at,
        location_assignment: scene.location_assignment
          ? {
              id: scene.location_assignment.id,
              scene_id: scene.location_assignment.scene_id,
              location_id: scene.location_assignment.location_id,
              created_at: scene.location_assignment.created_at,
              updated_at: scene.location_assignment.updated_at,
              location: scene.location_assignment.location,
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
          subjects: (moment.subjects || []).map((assignment) => ({
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
          })),
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
                  shot_type: a.shot_type ?? undefined,
                })),
              }
            : null,
          moment_music: moment.moment_music
            ? {
                id: moment.moment_music.id,
                moment_id: moment.moment_music.moment_id,
                music_name: moment.moment_music.music_name,
                artist: moment.moment_music.artist,
                duration: moment.moment_music.duration,
                music_type: moment.moment_music.music_type,
                overrides_scene_music: moment.moment_music.overrides_scene_music,
                created_at: moment.moment_music.created_at,
                updated_at: moment.moment_music.updated_at,
              }
            : null,
        })),
        beats: (scene.beats || []).map((beat) => ({
          id: beat.id,
          film_scene_id: beat.film_scene_id,
          name: beat.name,
          order_index: beat.order_index,
          shot_count: beat.shot_count ?? null,
          duration_seconds: beat.duration_seconds,
          source_activity_id: beat.source_activity_id ?? null,
          source_moment_id: beat.source_moment_id ?? null,
          source_scene_id: beat.source_scene_id ?? null,
          recording_setup: beat.recording_setup
            ? {
                id: beat.recording_setup.id,
                camera_track_ids: beat.recording_setup.camera_track_ids,
                audio_track_ids: beat.recording_setup.audio_track_ids,
                graphics_enabled: beat.recording_setup.graphics_enabled,
                created_at: beat.recording_setup.created_at,
                updated_at: beat.recording_setup.updated_at,
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
        scene_music: scene.scene_music
          ? {
              id: scene.scene_music.id,
              film_scene_id: scene.scene_music.film_scene_id,
              music_name: scene.scene_music.music_name,
              artist: scene.scene_music.artist,
              duration: scene.scene_music.duration,
              music_type: scene.scene_music.music_type,
              created_at: scene.scene_music.created_at,
              updated_at: scene.scene_music.updated_at,
            }
          : null,
        audio_sources: (scene.audio_sources || []).map((src) => ({
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
}
