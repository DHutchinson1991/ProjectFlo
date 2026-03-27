import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { TrackType } from '@prisma/client';

/**
 * Manages film timeline track configuration.
 * Creates / removes FilmTimelineTrack records when equipment counts change.
 * Split from FilmEquipmentService to keep each service within size limits.
 */
@Injectable()
export class FilmTracksConfigService {
  private readonly logger = new Logger(FilmTracksConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * (Re)create all tracks for a film based on camera and audio counts.
   * Always adds Graphics and Music tracks automatically.
   */
  async configureEquipment(
    filmId: number,
    numCameras: number = 0,
    numAudio: number = 0,
  ): Promise<void> {
    this.logger.log('Configuring equipment', { filmId, numCameras, numAudio });

    await this.prisma.filmTimelineTrack.deleteMany({ where: { film_id: filmId } });

    const tracks: Array<{ name: string; type: TrackType; order_index: number }> = [];
    tracks.push({ name: 'Graphics', type: TrackType.GRAPHICS, order_index: 1 });

    for (let i = numCameras; i >= 1; i--) {
      tracks.push({ name: `Camera ${i}`, type: TrackType.VIDEO, order_index: tracks.length + 1 });
    }
    for (let i = 1; i <= numAudio; i++) {
      tracks.push({ name: `Audio ${i}`, type: TrackType.AUDIO, order_index: tracks.length + 1 });
    }
    tracks.push({ name: 'Music', type: TrackType.MUSIC, order_index: tracks.length + 1 });

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
    });
  }

  /**
   * Incrementally add or remove camera/audio tracks without rebuilding everything.
   * Throws if reducing track counts would orphan recordings unless allowRemoval is true.
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

    this.logger.log('Updating equipment', {
      filmId,
      from: { cameras: currentCameras, audio: currentAudio },
      to: { cameras: finalCameras, audio: finalAudio },
    });

    const parseTrackNumber = (name: string, prefix: string) => {
      const match = name.match(new RegExp(`^${prefix}\\s+(\\d+)$`, 'i'));
      return match ? Number(match[1]) : null;
    };

    const cameraTracksToRemove = currentTracks.filter((t) => {
      if (t.type !== TrackType.VIDEO) return false;
      const n = parseTrackNumber(t.name, 'Camera');
      return n !== null && n > finalCameras;
    });
    const audioTracksToRemove = currentTracks.filter((t) => {
      if (t.type !== TrackType.AUDIO) return false;
      const n = parseTrackNumber(t.name, 'Audio');
      return n !== null && n > finalAudio;
    });

    const isReducing = cameraTracksToRemove.length > 0 || audioTracksToRemove.length > 0;
    if (isReducing && !allowRemoval) {
      throw new BadRequestException(
        'Reducing equipment will remove existing track assignments. Pass allow_removal=true to confirm.',
      );
    }

    const audioIdSet = new Set(audioTracksToRemove.map((t) => t.id));
    if (audioIdSet.size > 0) {
      await this.cleanAudioTrackReferences(filmId, audioIdSet);
    }

    if (isReducing) {
      const idsToRemove = [
        ...cameraTracksToRemove.map((t) => t.id),
        ...audioTracksToRemove.map((t) => t.id),
      ];
      await this.prisma.filmTimelineTrack.deleteMany({
        where: { film_id: filmId, id: { in: idsToRemove } },
      });
    }

    const ensureTrack = async (type: TrackType, name: string) => {
      const existing = currentTracks.find((t) => t.type === type && t.name === name);
      if (existing) return;
      await this.prisma.filmTimelineTrack.create({
        data: { film_id: filmId, name, type, order_index: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
      });
    };

    await ensureTrack(TrackType.GRAPHICS, 'Graphics');
    await ensureTrack(TrackType.MUSIC, 'Music');

    const existingCameraNumbers = new Set(
      currentTracks
        .filter((t) => t.type === TrackType.VIDEO)
        .map((t) => parseTrackNumber(t.name, 'Camera'))
        .filter((v): v is number => v !== null),
    );
    for (let i = 1; i <= finalCameras; i++) {
      if (!existingCameraNumbers.has(i)) await ensureTrack(TrackType.VIDEO, `Camera ${i}`);
    }

    const existingAudioNumbers = new Set(
      currentTracks
        .filter((t) => t.type === TrackType.AUDIO)
        .map((t) => parseTrackNumber(t.name, 'Audio'))
        .filter((v): v is number => v !== null),
    );
    for (let i = 1; i <= finalAudio; i++) {
      if (!existingAudioNumbers.has(i)) await ensureTrack(TrackType.AUDIO, `Audio ${i}`);
    }

    await this.reorderTracks(filmId, parseTrackNumber);
  }

  async getEquipmentCounts(filmId: number): Promise<{ cameras: number; audio: number }> {
    const tracks = await this.prisma.filmTimelineTrack.findMany({ where: { film_id: filmId } });
    return {
      cameras: tracks.filter((t) => t.type === TrackType.VIDEO).length,
      audio: tracks.filter((t) => t.type === TrackType.AUDIO).length,
    };
  }

  private async cleanAudioTrackReferences(filmId: number, audioIdSet: Set<number>): Promise<void> {
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

    const sceneUpdates = sceneSetups
      .filter((s) => (s.audio_track_ids || []).some((id) => audioIdSet.has(id)))
      .map((s) =>
        this.prisma.sceneRecordingSetup.update({
          where: { id: s.id },
          data: { audio_track_ids: (s.audio_track_ids || []).filter((id) => !audioIdSet.has(id)) },
        }),
      );

    const momentUpdates = momentSetups
      .filter((s) => (s.audio_track_ids || []).some((id) => audioIdSet.has(id)))
      .map((s) =>
        this.prisma.momentRecordingSetup.update({
          where: { id: s.id },
          data: { audio_track_ids: (s.audio_track_ids || []).filter((id) => !audioIdSet.has(id)) },
        }),
      );

    if (sceneUpdates.length || momentUpdates.length) {
      await this.prisma.$transaction([...sceneUpdates, ...momentUpdates]);
    }
  }

  private async reorderTracks(
    filmId: number,
    parseTrackNumber: (name: string, prefix: string) => number | null,
  ): Promise<void> {
    const tracks = await this.prisma.filmTimelineTrack.findMany({ where: { film_id: filmId } });
    const graphics = tracks.filter((t) => t.type === TrackType.GRAPHICS);
    const cameras = tracks
      .filter((t) => t.type === TrackType.VIDEO)
      .sort((a, b) => (parseTrackNumber(b.name, 'Camera') ?? 0) - (parseTrackNumber(a.name, 'Camera') ?? 0));
    const audio = tracks
      .filter((t) => t.type === TrackType.AUDIO)
      .sort((a, b) => (parseTrackNumber(a.name, 'Audio') ?? 0) - (parseTrackNumber(b.name, 'Audio') ?? 0));
    const music = tracks.filter((t) => t.type === TrackType.MUSIC);

    const ordered = [...graphics, ...cameras, ...audio, ...music];
    await this.prisma.$transaction(
      ordered.map((track, index) =>
        this.prisma.filmTimelineTrack.update({
          where: { id: track.id },
          data: { order_index: index + 1 },
        }),
      ),
    );
  }
}
