import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { TrackType, SubjectPriority } from '@prisma/client';
import { CreateInstanceTrackDto } from '../dto/create-instance-track.dto';
import { UpdateInstanceTrackDto } from '../dto/update-instance-track.dto';
import { CreateInstanceSubjectDto } from '../dto/create-instance-subject.dto';
import { UpdateInstanceSubjectDto } from '../dto/update-instance-subject.dto';

@Injectable()
export class InstanceStructureService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tracks ────────────────────────────────────────────────────────

  async findAllTracks(projectFilmId: number, activeOnly = false) {
    await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmTimelineTrack.findMany({
      where: {
        project_film_id: projectFilmId,
        ...(activeOnly ? { is_active: true } : {}),
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createTrack(projectFilmId: number, dto: CreateInstanceTrackDto) {
    const pf = await this.assertProjectFilmExists(projectFilmId);

    const orderIndex =
      dto.order_index ??
      (await this.prisma.projectFilmTimelineTrack.count({
        where: { project_film_id: projectFilmId },
      }));

    return this.prisma.projectFilmTimelineTrack.create({
      data: {
        project_film_id: projectFilmId,
        project_id: pf.project_id,
        inquiry_id: pf.inquiry_id,
        name: dto.name,
        type: dto.type as TrackType,
        order_index: orderIndex,
        is_active: dto.is_active ?? true,
        is_unmanned: dto.is_unmanned ?? false,
        crew_member_id: dto.crew_member_id ?? null,
      },
    });
  }

  async updateTrack(trackId: number, dto: UpdateInstanceTrackDto) {
    const track = await this.prisma.projectFilmTimelineTrack.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException(`Instance track ${trackId} not found`);

    return this.prisma.projectFilmTimelineTrack.update({
      where: { id: trackId },
      data: {
        name: dto.name,
        type: dto.type as TrackType | undefined,
        order_index: dto.order_index,
        is_active: dto.is_active,
        is_unmanned: dto.is_unmanned,
        crew_member_id: dto.crew_member_id,
      },
    });
  }

  async removeTrack(trackId: number) {
    const track = await this.prisma.projectFilmTimelineTrack.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException(`Instance track ${trackId} not found`);
    await this.prisma.projectFilmTimelineTrack.delete({ where: { id: trackId } });
    return { deleted: true };
  }

  // ── Subjects ──────────────────────────────────────────────────────

  async findAllSubjects(projectFilmId: number) {
    await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmSubject.findMany({
      where: { project_film_id: projectFilmId },
      include: { role_template: true },
      orderBy: { id: 'asc' },
    });
  }

  async createSubject(projectFilmId: number, dto: CreateInstanceSubjectDto) {
    const pf = await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmSubject.create({
      data: {
        project_film_id: projectFilmId,
        project_id: pf.project_id,
        inquiry_id: pf.inquiry_id,
        name: dto.name,
        role_template_id: dto.role_template_id,
      },
      include: { role_template: true },
    });
  }

  async updateSubject(subjectId: number, dto: UpdateInstanceSubjectDto) {
    const subject = await this.prisma.projectFilmSubject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException(`Instance subject ${subjectId} not found`);

    return this.prisma.projectFilmSubject.update({
      where: { id: subjectId },
      data: {
        name: dto.name,
        role_template_id: dto.role_template_id,
      },
      include: { role_template: true },
    });
  }

  async removeSubject(subjectId: number) {
    const subject = await this.prisma.projectFilmSubject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException(`Instance subject ${subjectId} not found`);
    await this.prisma.projectFilmSubject.delete({ where: { id: subjectId } });
    return { deleted: true };
  }

  // ── Locations ─────────────────────────────────────────────────────

  async findAllLocations(projectFilmId: number) {
    await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmLocation.findMany({
      where: { project_film_id: projectFilmId },
      include: { location: true },
      orderBy: { id: 'asc' },
    });
  }

  async createLocation(projectFilmId: number, data: { location_id: number; notes?: string }) {
    const pf = await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmLocation.create({
      data: {
        project_film_id: projectFilmId,
        project_id: pf.project_id,
        inquiry_id: pf.inquiry_id,
        location_id: data.location_id,
        notes: data.notes ?? null,
      },
      include: { location: true },
    });
  }

  async removeLocation(locationId: number) {
    const loc = await this.prisma.projectFilmLocation.findUnique({ where: { id: locationId } });
    if (!loc) throw new NotFoundException(`Instance film location ${locationId} not found`);
    await this.prisma.projectFilmLocation.delete({ where: { id: locationId } });
    return { deleted: true };
  }

  // ── Scene Subjects ────────────────────────────────────────────────

  async findSceneSubjects(sceneId: number) {
    await this.assertSceneExists(sceneId);

    return this.prisma.projectFilmSceneSubject.findMany({
      where: { project_scene_id: sceneId },
      include: { project_subject: { include: { role_template: true } } },
    });
  }

  async addSceneSubject(
    sceneId: number,
    data: { project_film_subject_id: number; priority?: number; notes?: string },
  ) {
    await this.assertSceneExists(sceneId);

    return this.prisma.projectFilmSceneSubject.create({
      data: {
        project_scene_id: sceneId,
        project_film_subject_id: data.project_film_subject_id,
        priority: (data.priority as unknown as SubjectPriority) ?? SubjectPriority.BACKGROUND,
        notes: data.notes ?? null,
      },
      include: { project_subject: { include: { role_template: true } } },
    });
  }

  async removeSceneSubject(id: number) {
    const ss = await this.prisma.projectFilmSceneSubject.findUnique({ where: { id } });
    if (!ss) throw new NotFoundException(`Instance scene subject ${id} not found`);
    await this.prisma.projectFilmSceneSubject.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Scene Locations ───────────────────────────────────────────────

  async getSceneLocation(sceneId: number) {
    await this.assertSceneExists(sceneId);
    return this.prisma.projectFilmSceneLocation.findUnique({
      where: { project_scene_id: sceneId },
    });
  }

  async setSceneLocation(sceneId: number, data: { location_id: number }) {
    await this.assertSceneExists(sceneId);

    const existing = await this.prisma.projectFilmSceneLocation.findUnique({
      where: { project_scene_id: sceneId },
    });

    return existing
      ? this.prisma.projectFilmSceneLocation.update({
          where: { project_scene_id: sceneId },
          data: { location_id: data.location_id },
        })
      : this.prisma.projectFilmSceneLocation.create({
          data: { project_scene_id: sceneId, location_id: data.location_id },
        });
  }

  async removeSceneLocation(sceneId: number) {
    const existing = await this.prisma.projectFilmSceneLocation.findUnique({
      where: { project_scene_id: sceneId },
    });
    if (existing) {
      await this.prisma.projectFilmSceneLocation.delete({
        where: { project_scene_id: sceneId },
      });
    }
    return { deleted: true };
  }

  private async assertProjectFilmExists(id: number) {
    const pf = await this.prisma.projectFilm.findUnique({ where: { id } });
    if (!pf) throw new NotFoundException(`ProjectFilm ${id} not found`);
    return pf;
  }

  private async assertSceneExists(id: number) {
    const scene = await this.prisma.projectFilmScene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundException(`Instance scene ${id} not found`);
    return scene;
  }
}
