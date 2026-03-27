import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { TrackType, Prisma, FilmTimelineTrack } from '@prisma/client';
import { AssignEquipmentDto, UpdateEquipmentAssignmentDto, FilmEquipmentResponseDto, EquipmentSummaryDto } from '../dto/film-equipment-assignment.dto';

/**
 * Service for managing film equipment configuration
 * Creates/updates/deletes FilmTimelineTrack records based on equipment counts
 * 
 * Refactor v2: Uses FilmTimelineTrack model instead of legacy filmEquipment
 */
@Injectable()
export class FilmEquipmentService {
  private readonly logger = new Logger(FilmEquipmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Configure equipment for a film (creates tracks)
   * Auto-generates track names: Camera 1, Camera 2, Audio 1, etc.
   * Also creates Graphics and Music tracks automatically
   */
  async configureEquipment(
    filmId: number,
    numCameras: number = 0,
    numAudio: number = 0,
  ): Promise<void> {
    this.logger.log('Configuring equipment', { filmId, numCameras, numAudio });

    // Delete existing tracks (we'll recreate them)
    await this.prisma.filmTimelineTrack.deleteMany({
      where: { film_id: filmId },
    });

    const tracks: Array<{ name: string; type: TrackType; order_index: number }> = [];

    // Graphics track (always first)
    tracks.push({ name: 'Graphics', type: TrackType.GRAPHICS, order_index: 1 });

    // Video tracks (Camera 3, 2, 1 in that order)
    for (let i = numCameras; i >= 1; i--) {
      tracks.push({
        name: `Camera ${i}`,
        type: TrackType.VIDEO,
        order_index: tracks.length + 1,
      });
    }

    // Audio tracks (Audio 1, 2, ...)
    for (let i = 1; i <= numAudio; i++) {
      tracks.push({
        name: `Audio ${i}`,
        type: TrackType.AUDIO,
        order_index: tracks.length + 1,
      });
    }

    // Music track (always last)
    tracks.push({ name: 'Music', type: TrackType.MUSIC, order_index: tracks.length + 1 });

    // Create all tracks
    await this.prisma.filmTimelineTrack.createMany({
      data: tracks.map((track) => ({
        film_id: filmId,
        name: track.name,
        type: track.type,
        order_index: track.order_index,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    });

    this.logger.log('Equipment configured successfully', {
      filmId,
      tracksCreated: tracks.length,
      trackOrder: tracks.map((t) => `${t.order_index}:${t.name}`).join(', '),
    });
  }

  /**
   * Update equipment configuration (add/remove tracks)
   */
  async updateEquipment(
    filmId: number,
    numCameras?: number,
    numAudio?: number,
    allowRemoval: boolean = false,
  ): Promise<void> {
    const currentTracks = await this.prisma.filmTimelineTrack.findMany({
      where: { film_id: filmId },
    });

    const currentCameras = currentTracks.filter((t) => t.type === TrackType.VIDEO).length;
    const currentAudio = currentTracks.filter((t) => t.type === TrackType.AUDIO).length;

    const finalCameras = numCameras !== undefined ? numCameras : currentCameras;
    const finalAudio = numAudio !== undefined ? numAudio : currentAudio;

    const { camerasToRemove, audioToRemove } = this.identifyTracksToRemove(currentTracks, finalCameras, finalAudio);
    const isReducing = camerasToRemove.length > 0 || audioToRemove.length > 0;

    if (isReducing && !allowRemoval) {
      throw new BadRequestException('Reducing equipment will remove existing track assignments. Pass allow_removal=true to confirm.');
    }

    if (audioToRemove.length > 0) {
      await this.cleanupAudioTrackAssignments(filmId, audioToRemove.map(t => t.id));
    }

    if (isReducing) {
      await this.removeTracks(filmId, [...camerasToRemove, ...audioToRemove].map(t => t.id));
    }

    await this.ensureRequiredTracks(filmId, currentTracks, finalCameras, finalAudio);
    await this.reindexTracks(filmId);
  }

  private identifyTracksToRemove(currentTracks: FilmTimelineTrack[], finalCameras: number, finalAudio: number) {
    const parseTrackNumber = (name: string, prefix: string) => {
      const match = name.match(new RegExp(`^${prefix}\\s+(\\d+)$`, 'i'));
      return match ? Number(match[1]) : null;
    };

    const camerasToRemove = currentTracks.filter(t => t.type === TrackType.VIDEO && (parseTrackNumber(t.name, 'Camera') ?? 0) > finalCameras);
    const audioToRemove = currentTracks.filter(t => t.type === TrackType.AUDIO && (parseTrackNumber(t.name, 'Audio') ?? 0) > finalAudio);

    return { camerasToRemove, audioToRemove };
  }

  private async cleanupAudioTrackAssignments(filmId: number, audioTrackIdsToRemove: number[]) {
    const [sceneSetups, momentSetups] = await this.prisma.$transaction([
      this.prisma.sceneRecordingSetup.findMany({
        where: { scene: { film_id: filmId } },
        select: { id: true, audio_track_ids: true },
      }),
      this.prisma.momentRecordingSetup.findMany({
        where: { moment: { film_scene: { film_id: filmId } } },
        select: { id: true, audio_track_ids: true },
      }),
    ]);

    const audioIdSet = new Set(audioTrackIdsToRemove);
    const sceneUpdates = sceneSetups.flatMap(s => {
      const next = (s.audio_track_ids || []).filter(id => !audioIdSet.has(id));
      return next.length === (s.audio_track_ids || []).length ? [] : [this.prisma.sceneRecordingSetup.update({ where: { id: s.id }, data: { audio_track_ids: next } })];
    });

    const momentUpdates = momentSetups.flatMap(s => {
      const next = (s.audio_track_ids || []).filter(id => !audioIdSet.has(id));
      return next.length === (s.audio_track_ids || []).length ? [] : [this.prisma.momentRecordingSetup.update({ where: { id: s.id }, data: { audio_track_ids: next } })];
    });

    if (sceneUpdates.length || momentUpdates.length) {
      await this.prisma.$transaction([...sceneUpdates, ...momentUpdates]);
    }
  }

  private async removeTracks(filmId: number, trackIds: number[]) {
    await this.prisma.filmTimelineTrack.deleteMany({
      where: { film_id: filmId, id: { in: trackIds } },
    });
  }

  private async ensureRequiredTracks(filmId: number, currentTracks: FilmTimelineTrack[], finalCameras: number, finalAudio: number) {
    const ensure = async (type: TrackType, name: string) => {
      const existing = currentTracks.find(t => t.type === type && t.name === name);
      if (existing) return;
      await this.prisma.filmTimelineTrack.create({
        data: { film_id: filmId, name, type, order_index: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
      });
    };

    const parseTrackNumber = (name: string, prefix: string) => {
      const match = name.match(new RegExp(`^${prefix}\\s+(\\d+)$`, 'i'));
      return match ? Number(match[1]) : null;
    };

    await ensure(TrackType.GRAPHICS, 'Graphics');
    await ensure(TrackType.MUSIC, 'Music');

    const hasCam = new Set(currentTracks.filter(t => t.type === TrackType.VIDEO).map(t => parseTrackNumber(t.name, 'Camera')));
    for (let i = 1; i <= finalCameras; i++) { if (!hasCam.has(i)) await ensure(TrackType.VIDEO, `Camera ${i}`); }

    const hasAud = new Set(currentTracks.filter(t => t.type === TrackType.AUDIO).map(t => parseTrackNumber(t.name, 'Audio')));
    for (let i = 1; i <= finalAudio; i++) { if (!hasAud.has(i)) await ensure(TrackType.AUDIO, `Audio ${i}`); }
  }

  private async reindexTracks(filmId: number) {
    const updatedTracks = await this.prisma.filmTimelineTrack.findMany({
      where: { film_id: filmId },
    });

    const parseTrackNumber = (name: string, prefix: string) => {
      const match = name.match(new RegExp(`^${prefix}\\s+(\\d+)$`, 'i'));
      return match ? Number(match[1]) : null;
    };

    const graphicsTracks = updatedTracks.filter((track) => track.type === TrackType.GRAPHICS);
    const musicTracks = updatedTracks.filter((track) => track.type === TrackType.MUSIC);
    const cameraTracks = updatedTracks
      .filter((track) => track.type === TrackType.VIDEO)
      .map((track) => ({ track, number: parseTrackNumber(track.name, 'Camera') ?? 0 }))
      .sort((a, b) => b.number - a.number)
      .map(({ track }) => track);
    const audioTracks = updatedTracks
      .filter((track) => track.type === TrackType.AUDIO)
      .map((track) => ({ track, number: parseTrackNumber(track.name, 'Audio') ?? 0 }))
      .sort((a, b) => a.number - b.number)
      .map(({ track }) => track);

    const orderedTracks = [
      ...graphicsTracks,
      ...cameraTracks,
      ...audioTracks,
      ...musicTracks,
    ];

    await this.prisma.$transaction(
      orderedTracks.map((track, index) =>
        this.prisma.filmTimelineTrack.update({
          where: { id: track.id },
          data: { order_index: index + 1 },
        })
      )
    );
  }

  /**
   * Get equipment counts for a film
   */
  async getEquipmentCounts(filmId: number): Promise<{ cameras: number; audio: number }> {
    const tracks = await this.prisma.filmTimelineTrack.findMany({
      where: { film_id: filmId },
    });

    return {
      cameras: tracks.filter((t) => t.type === TrackType.VIDEO).length,
      audio: tracks.filter((t) => t.type === TrackType.AUDIO).length,
    };
  }

  // ============================================================================
  // Equipment Assignment Methods (Film <-> Equipment Library)
  // ============================================================================

  /**
   * Get all equipment assigned to a film
   */
  async getFilmEquipment(filmId: number): Promise<FilmEquipmentResponseDto[]> {
    const assignments = await this.prisma.filmEquipmentAssignment.findMany({
      where: { film_id: filmId },
      include: {
        equipment: true,
      },
      orderBy: { assigned_at: 'asc' },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      film_id: assignment.film_id,
      equipment_id: assignment.equipment_id,
      quantity: assignment.quantity,
      notes: assignment.notes ?? undefined,
      assigned_at: assignment.assigned_at,
      equipment: {
        id: assignment.equipment.id,
        name: assignment.equipment.item_name,
        type: assignment.equipment.type,
        category: assignment.equipment.category,
        model: assignment.equipment.model ?? undefined,
        status: assignment.equipment.availability_status,
      },
    }));
  }

  /**
   * Get equipment summary (counts by type)
   */
  async getEquipmentSummary(filmId: number): Promise<EquipmentSummaryDto> {
    const equipment = await this.prisma.filmEquipmentAssignment.findMany({
      where: { film_id: filmId },
      include: { equipment: true },
    });

    const summary = {
      cameras: 0,
      audio: 0,
      music: 0,
      lighting: 0,
      other: 0,
    };

    equipment.forEach((item) => {
      const category = item.equipment.category.toLowerCase();
      const quantity = item.quantity;

      if (category === 'camera') summary.cameras += quantity;
      else if (category === 'audio') summary.audio += quantity;
      else if (category === 'lighting') summary.lighting += quantity;
      else summary.other += quantity;
    });

    return summary;
  }

  /**
   * Assign equipment to a film
   */
  async assignEquipment(
    filmId: number,
    dto: AssignEquipmentDto,
  ): Promise<FilmEquipmentResponseDto> {
    // Verify film exists
    const film = await this.prisma.film.findUnique({
      where: { id: filmId },
    });
    if (!film) {
      throw new NotFoundException(`Film with ID ${filmId} not found`);
    }

    // Verify equipment exists and is available
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipment_id },
    });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${dto.equipment_id} not found`);
    }
    if (equipment.availability_status !== 'AVAILABLE') {
      throw new BadRequestException(`Equipment "${equipment.item_name}" is not available (status: ${equipment.availability_status})`);
    }

    // Check if already assigned
    const existing = await this.prisma.filmEquipmentAssignment.findUnique({
      where: {
        film_id_equipment_id: {
          film_id: filmId,
          equipment_id: dto.equipment_id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Equipment "${equipment.item_name}" is already assigned to this film`);
    }

    // Create assignment
    const assignment = await this.prisma.filmEquipmentAssignment.create({
      data: {
        film_id: filmId,
        equipment_id: dto.equipment_id,
        quantity: dto.quantity,
        notes: dto.notes,
      },
      include: { equipment: true },
    });

    this.logger.log('Equipment assigned to film', {
      filmId,
      equipmentId: dto.equipment_id,
      equipmentName: equipment.item_name,
      quantity: dto.quantity,
    });

    return {
      id: assignment.id,
      film_id: assignment.film_id,
      equipment_id: assignment.equipment_id,
      quantity: assignment.quantity,
      notes: assignment.notes ?? undefined,
      assigned_at: assignment.assigned_at,
      equipment: {
        id: assignment.equipment.id,
        name: assignment.equipment.item_name,
        type: assignment.equipment.type,
        category: assignment.equipment.category,
        model: assignment.equipment.model ?? undefined,
        status: assignment.equipment.availability_status,
      },
    };
  }

  /**
   * Update equipment assignment
   */
  async updateEquipmentAssignment(
    filmId: number,
    equipmentId: number,
    dto: UpdateEquipmentAssignmentDto,
  ): Promise<FilmEquipmentResponseDto> {
    // Verify assignment exists
    const existing = await this.prisma.filmEquipmentAssignment.findUnique({
      where: {
        film_id_equipment_id: {
          film_id: filmId,
          equipment_id: equipmentId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Equipment assignment not found`);
    }

    // Update assignment
    const updated = await this.prisma.filmEquipmentAssignment.update({
      where: {
        film_id_equipment_id: {
          film_id: filmId,
          equipment_id: equipmentId,
        },
      },
      data: {
        quantity: dto.quantity ?? existing.quantity,
        notes: dto.notes ?? existing.notes,
      },
      include: { equipment: true },
    });

    this.logger.log('Equipment assignment updated', {
      filmId,
      equipmentId,
      changes: dto,
    });

    return {
      id: updated.id,
      film_id: updated.film_id,
      equipment_id: updated.equipment_id,
      quantity: updated.quantity,
      notes: updated.notes ?? undefined,
      assigned_at: updated.assigned_at,
      equipment: {
        id: updated.equipment.id,
        name: updated.equipment.item_name,
        type: updated.equipment.type,
        category: updated.equipment.category,
        model: updated.equipment.model ?? undefined,
        status: updated.equipment.availability_status,
      },
    };
  }

  /**
   * Remove equipment assignment
   */
  async removeEquipmentAssignment(filmId: number, equipmentId: number): Promise<void> {
    const assignment = await this.prisma.filmEquipmentAssignment.findUnique({
      where: {
        film_id_equipment_id: {
          film_id: filmId,
          equipment_id: equipmentId,
        },
      },
      include: { equipment: true },
    });

    if (!assignment) {
      throw new NotFoundException(`Equipment assignment not found`);
    }

    await this.prisma.filmEquipmentAssignment.delete({
      where: {
        film_id_equipment_id: {
          film_id: filmId,
          equipment_id: equipmentId,
        },
      },
    });

    this.logger.log('Equipment assignment removed', {
      filmId,
      equipmentId,
      equipmentName: assignment.equipment.item_name,
    });
  }
}

