import { BadRequestException, Injectable } from '@nestjs/common';
import { FilmType, MontageStyle, Prisma } from '@prisma/client';
import { FilmsService } from '../../films/films.service';
import { FilmStructureTemplatesService } from '../../film-structure-templates/film-structure-templates.service';
import { ScenesCrudService } from '../../scenes/services/scenes-crud.service';
import { MomentsCrudService } from '../../moments/moments-crud.service';
import { BeatsService } from '../../beats/beats.service';
import { SceneAudioSourcesService } from '../../scene-audio-sources/scene-audio-sources.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreatePackageFilmContentDto } from '../dto/create-package-film-content.dto';
import { SchedulePackageActivityService } from './schedule-package-activity.service';
import { SchedulePackageService } from './schedule-package.service';
import { ContentCreationRunLogger } from './content-creation-run-logger';

interface PackageActivityMomentRecord {
  id: number;
  name: string;
  duration_seconds: number | null;
}

interface PackageActivityRecord {
  id: number;
  name: string;
  start_time: string | null;
  duration_minutes: number | null;
  package_event_day_id: number;
  moments: PackageActivityMomentRecord[];
}

interface SceneConfigRecord {
  mode: 'REALTIME' | 'MONTAGE';
  montageDurationSeconds?: number;
  montageStyle?: MontageStyle;
  montageBpm?: number;
}

interface SceneOrderRecord {
  id: string;
  label: string;
  mode: 'REALTIME' | 'MONTAGE';
  activityIds: number[];
  style?: MontageStyle;
  isCombined: boolean;
}

export interface CreatedContentResult {
  filmId: number;
  filmName: string;
  packageFilmId: number;
  scenesCreated: number;
  momentsPopulated: number;
  activityIds: number[];
  backgroundScenePrepStarted: number;
  backgroundScenePrepMode: 'async';
  runId: string;
}

@Injectable()
export class SchedulePackageContentCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filmsService: FilmsService,
    private readonly templateService: FilmStructureTemplatesService,
    private readonly scenesService: ScenesCrudService,
    private readonly momentsService: MomentsCrudService,
    private readonly beatsService: BeatsService,
    private readonly audioSourcesService: SceneAudioSourcesService,
    private readonly packageActivityService: SchedulePackageActivityService,
    private readonly packageService: SchedulePackageService,
  ) {}

  async createForPackage(
    packageId: number,
    brandId: number,
    dto: CreatePackageFilmContentDto,
  ): Promise<CreatedContentResult> {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
      include: {
        package_crew_slots: {
          include: {
            equipment: {
              include: { equipment: { select: { id: true, category: true } } },
            },
          },
        },
      },
    });
    if (!pkg) {
      throw new BadRequestException('Package not found for current brand context');
    }

    const runLogger = new ContentCreationRunLogger({
      brandId,
      packageId,
      packageName: pkg.name,
      route: 'POST /api/schedule/packages/:packageId/films/create-content',
    });
    runLogger.writeRequest(dto);

    try {
      const selectedActivities = await this.resolveActivities(packageId, dto.selected_activity_ids);
      const sceneConfigMap = new Map<number, SceneConfigRecord>(
        dto.scene_configs.map((config) => [
          config.activity_id,
          {
            mode: config.mode,
            montageDurationSeconds: config.montage_duration_seconds,
            montageStyle: config.montage_style,
            montageBpm: config.montage_bpm,
          },
        ]),
      );
      const durationOverrideMap = new Map<number, number>(
        dto.duration_overrides.map((item) => [item.scene_index, item.duration_seconds]),
      );

      runLogger.section('Resolved Package Context', {
        packageId,
        packageName: pkg.name,
        selectedActivityIds: dto.selected_activity_ids,
        selectedActivityNames: selectedActivities.map((activity) => activity.name),
      });

      const equipmentCounts = this.resolveEquipmentCounts(pkg);
      const filmName =
        dto.film_name?.trim() ||
        this.buildDefaultFilmName(dto.film_type, pkg.name, selectedActivities);

      runLogger.section('Create Film Input', {
        filmName,
        filmType: dto.film_type,
        montagePresetId: dto.montage_preset_id,
        equipmentCounts,
      });

      const createdFilm = await this.filmsService.create({
        name: filmName,
        brand_id: brandId,
        film_type: dto.film_type,
        montage_preset_id: dto.montage_preset_id,
        num_cameras: equipmentCounts.cameras,
        num_audio: equipmentCounts.audio,
      });

      const packageFilm = await this.packageService.createPackageFilm(packageId, {
        film_id: createdFilm.id,
        order_index: 0,
      });
      runLogger.attachFilm(createdFilm.id, filmName, packageFilm.id);

      const templateScenes = dto.structure_template_id
        ? await this.resolveTemplateScenes(dto.structure_template_id, brandId)
        : [];
      const sceneOrder = dto.scene_order.length > 0
        ? dto.scene_order.map((entry) => ({
            id: entry.id,
            label: entry.label,
            mode: entry.mode,
            activityIds: entry.activity_ids,
            style: entry.style,
            isCombined: entry.is_combined,
          }))
        : this.buildDefaultSceneOrder(selectedActivities, sceneConfigMap, dto.combine_montage, dto.combined_montage_style, dto.combined_montage_duration);

      const creationStats = await this.createScenes({
        dto,
        filmId: createdFilm.id,
        packageFilmId: packageFilm.id,
        selectedActivities,
        templateScenes,
        sceneConfigMap,
        durationOverrideMap,
        sceneOrder,
        runLogger,
      });

      if (creationStats.backgroundScenePrepStarted > 0) {
        runLogger.section('Background Scene Prep', {
          startedSceneCount: creationStats.backgroundScenePrepStarted,
          mode: 'async',
          note: 'Film and scene creation completed for this run. Activity-linked scene preparation continues asynchronously in backend logs after this response returns.',
        });
      }

      const result: CreatedContentResult = {
        filmId: createdFilm.id,
        filmName,
        packageFilmId: packageFilm.id,
        scenesCreated: creationStats.scenesCreated,
        momentsPopulated: creationStats.momentsPopulated,
        activityIds: selectedActivities.map((activity) => activity.id),
        backgroundScenePrepStarted: creationStats.backgroundScenePrepStarted,
        backgroundScenePrepMode: 'async',
        runId: runLogger.getRunId(),
      };
      runLogger.writeResult(result);
      runLogger.complete(result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      runLogger.fail('Content creation failed', { error: message, stack });
      throw error;
    }
  }

  private async resolveActivities(packageId: number, selectedActivityIds: number[]): Promise<PackageActivityRecord[]> {
    const activities = (await this.packageActivityService.getPackageActivities(packageId)) as Array<PackageActivityRecord & {
      package_event_day?: { event_day?: { name?: string } };
    }>;
    const selected = activities
      .filter((activity) => selectedActivityIds.includes(activity.id))
      .sort((left, right) => {
        if (left.package_event_day_id !== right.package_event_day_id) {
          return left.package_event_day_id - right.package_event_day_id;
        }
        if (left.start_time && right.start_time) {
          return left.start_time.localeCompare(right.start_time);
        }
        return left.name.localeCompare(right.name);
      });

    if (selected.length !== selectedActivityIds.length) {
      const selectedSet = new Set(selected.map((activity) => activity.id));
      const missing = selectedActivityIds.filter((id) => !selectedSet.has(id));
      throw new BadRequestException(`Some selected activities were not found: ${missing.join(', ')}`);
    }

    return selected;
  }

  private async resolveTemplateScenes(templateId: number, brandId: number) {
    const template = await this.templateService.findOne(templateId);
    if (template.brand_id != null && template.brand_id !== brandId) {
      throw new BadRequestException('Film structure template does not belong to the current brand');
    }
    return [...(template.scenes ?? [])].sort((left, right) => left.order_index - right.order_index);
  }

  private resolveEquipmentCounts(pkg: Prisma.service_packagesGetPayload<{
    include: {
      package_crew_slots: {
        include: {
          equipment: {
            include: { equipment: { select: { id: true; category: true } } };
          };
        };
      };
    };
  }>): { cameras: number; audio: number } {
    const cameraIds = new Set<number>();
    const audioIds = new Set<number>();

    for (const slot of pkg.package_crew_slots) {
      for (const equipmentLink of slot.equipment) {
        if (equipmentLink.equipment.category === 'CAMERA') {
          cameraIds.add(equipmentLink.equipment.id);
        }
        if (equipmentLink.equipment.category === 'AUDIO') {
          audioIds.add(equipmentLink.equipment.id);
        }
      }
    }

    const contents = (pkg.contents ?? {}) as Record<string, unknown>;
    const dayEquipment = contents.day_equipment as Record<string, unknown[]> | undefined;
    if (dayEquipment) {
      for (const items of Object.values(dayEquipment)) {
        for (const item of items ?? []) {
          if (!item || typeof item !== 'object') {
            continue;
          }
          const row = item as Record<string, unknown>;
          const equipmentId = typeof row.equipment_id === 'number' ? row.equipment_id : undefined;
          if (!equipmentId) {
            continue;
          }
          if (row.slot_type === 'CAMERA') {
            cameraIds.add(equipmentId);
          }
          if (row.slot_type === 'AUDIO') {
            audioIds.add(equipmentId);
          }
        }
      }
    }

    return { cameras: cameraIds.size, audio: audioIds.size };
  }

  private buildDefaultFilmName(
    filmType: FilmType,
    packageName: string | null | undefined,
    selectedActivities: PackageActivityRecord[],
  ): string {
    const pkgLabel = packageName?.trim() || 'Package';

    if (filmType === FilmType.ACTIVITY) {
      const activity = selectedActivities[0];
      const activityPart = activity ? `${activity.name} Film` : 'Activity Film';
      return `${activityPart}, ${pkgLabel}`;
    }

    const typeLabel =
      filmType === FilmType.FEATURE ? 'Feature Film' : 'Montage Film';
    return `${pkgLabel} ${typeLabel}`;
  }

  private buildDefaultSceneOrder(
    activities: PackageActivityRecord[],
    sceneConfigMap: Map<number, SceneConfigRecord>,
    combineMontage: boolean,
    combinedMontageStyle?: MontageStyle,
    combinedMontageDuration?: number,
  ): SceneOrderRecord[] {
    const entries: SceneOrderRecord[] = [];
    const montageActivities = activities.filter(
      (activity) => (sceneConfigMap.get(activity.id)?.mode ?? 'REALTIME') === 'MONTAGE',
    );
    const shouldCombine = combineMontage && montageActivities.length >= 2;
    let combinedInserted = false;

    for (const activity of activities) {
      const config = sceneConfigMap.get(activity.id) ?? { mode: 'REALTIME' as const };
      if (config.mode === 'REALTIME') {
        entries.push({
          id: `activity-${activity.id}`,
          label: activity.name,
          mode: 'REALTIME',
          activityIds: [activity.id],
          isCombined: false,
        });
        continue;
      }

      if (shouldCombine) {
        if (!combinedInserted) {
          entries.push({
            id: 'combined-montage',
            label: montageActivities.length <= 3 ? montageActivities.map((activity) => activity.name).join(' + ') : 'Combined Montage',
            mode: 'MONTAGE',
            activityIds: montageActivities.map((activity) => activity.id),
            style: combinedMontageStyle,
            isCombined: true,
          });
          combinedInserted = true;
        }
        continue;
      }

      entries.push({
        id: `activity-${activity.id}`,
        label: activity.name,
        mode: 'MONTAGE',
        activityIds: [activity.id],
        style: config.montageStyle,
        isCombined: false,
      });
    }

    return entries;
  }

  private async createScenes(args: {
    dto: CreatePackageFilmContentDto;
    filmId: number;
    packageFilmId: number;
    selectedActivities: PackageActivityRecord[];
    templateScenes: Array<{ id: number; name: string; mode: string; suggested_duration_seconds?: number | null }>;
    sceneConfigMap: Map<number, SceneConfigRecord>;
    durationOverrideMap: Map<number, number>;
    sceneOrder: SceneOrderRecord[];
    runLogger: ContentCreationRunLogger;
  }): Promise<{ scenesCreated: number; momentsPopulated: number; backgroundScenePrepStarted: number }> {
    const { dto, filmId, packageFilmId, selectedActivities, templateScenes, sceneConfigMap, durationOverrideMap, sceneOrder, runLogger } = args;
    const activityMap = new Map(selectedActivities.map((activity) => [activity.id, activity]));
    let scenesCreated = 0;
    let momentsPopulated = 0;
    let backgroundScenePrepStarted = 0;

    runLogger.section('Scene Creation Plan', {
      filmType: dto.film_type,
      templateSceneCount: templateScenes.length,
      sceneOrder,
    });

    if (dto.film_type === FilmType.MONTAGE && templateScenes.length > 0) {
      for (let index = 0; index < templateScenes.length; index += 1) {
        const templateScene = templateScenes[index];
        const durationSeconds = durationOverrideMap.get(index) ?? templateScene.suggested_duration_seconds ?? undefined;
        const scene = await this.scenesService.create({
          film_id: filmId,
          name: templateScene.name,
          order_index: index,
          mode: templateScene.mode === 'MONTAGE' ? 'MONTAGE' : 'MOMENTS',
          duration_seconds: durationSeconds ?? undefined,
        });

        const assignment = dto.scene_assignments.find((item) => item.scene_index === index);
        let beatIndex = 0;
        for (const activityId of assignment?.activity_ids ?? []) {
          const activity = activityMap.get(activityId);
          const momentIds = assignment?.moment_ids_by_activity.find((item) => item.activity_id === activityId)?.moment_ids ?? [];
          if (momentIds.length > 0) {
            for (const momentId of momentIds) {
              const moment = activity?.moments.find((item) => item.id === momentId);
              await this.beatsService.create({
                film_scene_id: scene.id,
                name: moment?.name || `Beat ${beatIndex + 1}`,
                duration_seconds: moment?.duration_seconds || 10,
                order_index: beatIndex,
              });
              beatIndex += 1;
            }
          } else {
            await this.beatsService.create({
              film_scene_id: scene.id,
              name: activity?.name || `Beat ${beatIndex + 1}`,
              duration_seconds: 30,
              order_index: beatIndex,
            });
            beatIndex += 1;
          }
        }

        const audioConfig = dto.audio_configs.find((item) => item.scene_index === index && item.source_type);
        if (audioConfig?.source_type) {
          await this.audioSourcesService.create({
            scene_id: scene.id,
            source_type: audioConfig.source_type,
            source_activity_id: audioConfig.source_activity_id,
            source_moment_id: audioConfig.source_moment_id,
            track_type: audioConfig.track_type,
            order_index: 0,
            notes: audioConfig.notes,
          });
        }

        runLogger.log('SCENES', 'Created montage template scene', {
          sceneId: scene.id,
          sceneName: scene.name,
          beatCount: beatIndex,
          audioSource: audioConfig?.source_type ?? null,
        });
        scenesCreated += 1;
      }

      return { scenesCreated, momentsPopulated, backgroundScenePrepStarted };
    }

    if (dto.film_type === FilmType.FEATURE) {
      for (let sceneIndex = 0; sceneIndex < sceneOrder.length; sceneIndex += 1) {
        const entry = sceneOrder[sceneIndex];

        if (entry.isCombined) {
          const scene = await this.scenesService.create({
            film_id: filmId,
            name: entry.label,
            order_index: sceneIndex,
            mode: 'MONTAGE',
            duration_seconds: dto.combined_montage_duration ?? 120,
            montage_style: dto.combined_montage_style ?? MontageStyle.HIGHLIGHTS,
            montage_bpm: dto.combined_montage_style === MontageStyle.RHYTHMIC ? 120 : undefined,
          });
          await this.packageService.upsertPackageFilmSceneSchedule(packageFilmId, {
            scene_id: scene.id,
            package_activity_id: null,
            order_index: sceneIndex,
          });

          const sourceMoments = entry.activityIds.flatMap((activityId) => {
            const activity = activityMap.get(activityId);
            if (!activity) {
              return [];
            }
            return activity.moments.length > 0
              ? activity.moments.map((moment) => ({ name: moment.name, duration_seconds: moment.duration_seconds ?? 60, activityId }))
              : [{ name: activity.name, duration_seconds: 60, activityId }];
          });
          const scaledMoments = this.scaleMoments(sourceMoments, dto.combined_montage_duration ?? 120);
          for (const moment of scaledMoments) {
            await this.momentsService.create({
              film_scene_id: scene.id,
              name: moment.name,
              duration: moment.duration,
              order_index: moment.order_index,
              source_activity_id: moment.activityId,
            });
          }

          runLogger.log('SCENES', 'Created combined feature montage scene', {
            sceneId: scene.id,
            sceneName: scene.name,
            sourceActivityIds: entry.activityIds,
            momentsCreated: scaledMoments.length,
          });
          scenesCreated += 1;
          momentsPopulated += scaledMoments.length;
          continue;
        }

        const activity = activityMap.get(entry.activityIds[0]);
        if (!activity) {
          continue;
        }

        if (entry.mode === 'REALTIME') {
          const scene = await this.scenesService.create({
            film_id: filmId,
            name: activity.name,
            order_index: sceneIndex,
            mode: 'MOMENTS',
            duration_seconds: activity.duration_minutes ? activity.duration_minutes * 60 : undefined,
          });
          await this.packageService.upsertPackageFilmSceneSchedule(packageFilmId, {
            scene_id: scene.id,
            package_activity_id: activity.id,
            order_index: sceneIndex,
            scheduled_start_time: activity.start_time || undefined,
            scheduled_duration_minutes: activity.duration_minutes || undefined,
          });
          backgroundScenePrepStarted += 1;

          runLogger.log('SCENES', 'Created feature realtime scene', {
            sceneId: scene.id,
            sceneName: scene.name,
            packageActivityId: activity.id,
            expectedMomentCount: activity.moments.length,
          });
          scenesCreated += 1;
          momentsPopulated += activity.moments.length;
          continue;
        }

        const config = sceneConfigMap.get(activity.id) ?? { mode: 'MONTAGE' as const };
        const targetDuration = config.montageDurationSeconds ?? 60;
        const scene = await this.scenesService.create({
          film_id: filmId,
          name: activity.name,
          order_index: sceneIndex,
          mode: 'MONTAGE',
          duration_seconds: targetDuration,
          montage_style: config.montageStyle ?? MontageStyle.HIGHLIGHTS,
          montage_bpm: config.montageStyle === MontageStyle.RHYTHMIC ? 120 : config.montageBpm,
        });
        await this.packageService.upsertPackageFilmSceneSchedule(packageFilmId, {
          scene_id: scene.id,
          package_activity_id: activity.id,
          order_index: sceneIndex,
          scheduled_start_time: activity.start_time || undefined,
          scheduled_duration_minutes: activity.duration_minutes || undefined,
        });
        backgroundScenePrepStarted += 1;

        const sourceMoments = activity.moments.length > 0
          ? activity.moments.map((moment) => ({ name: moment.name, duration_seconds: moment.duration_seconds ?? 60, activityId: activity.id }))
          : [{ name: activity.name, duration_seconds: 60, activityId: activity.id }];
        const scaledMoments = this.scaleMoments(sourceMoments, targetDuration);
        for (const moment of scaledMoments) {
          await this.momentsService.create({
            film_scene_id: scene.id,
            name: moment.name,
            duration: moment.duration,
            order_index: moment.order_index,
            source_activity_id: moment.activityId,
          });
        }

        runLogger.log('SCENES', 'Created feature montage scene', {
          sceneId: scene.id,
          sceneName: scene.name,
          packageActivityId: activity.id,
          momentsCreated: scaledMoments.length,
        });
        scenesCreated += 1;
        momentsPopulated += scaledMoments.length;
      }

      return { scenesCreated, momentsPopulated, backgroundScenePrepStarted };
    }

    for (let index = 0; index < selectedActivities.length; index += 1) {
      const activity = selectedActivities[index];
      const scene = await this.scenesService.create({
        film_id: filmId,
        name: activity.name,
        order_index: index,
        mode: 'MOMENTS',
        duration_seconds: activity.duration_minutes ? activity.duration_minutes * 60 : undefined,
      });
      await this.packageService.upsertPackageFilmSceneSchedule(packageFilmId, {
        scene_id: scene.id,
        package_activity_id: activity.id,
        order_index: index,
        scheduled_start_time: activity.start_time || undefined,
        scheduled_duration_minutes: activity.duration_minutes || undefined,
      });
      backgroundScenePrepStarted += 1;

      runLogger.log('SCENES', 'Created activity scene', {
        sceneId: scene.id,
        sceneName: scene.name,
        packageActivityId: activity.id,
        expectedMomentCount: activity.moments.length,
      });
      scenesCreated += 1;
      momentsPopulated += activity.moments.length;
    }

    return { scenesCreated, momentsPopulated, backgroundScenePrepStarted };
  }

  private scaleMoments(
    sourceMoments: Array<{ name: string; duration_seconds: number; activityId: number }>,
    targetDuration: number,
  ): Array<{ name: string; duration: number; order_index: number; activityId: number }> {
    const minimumDuration = 3;
    if (sourceMoments.length === 0) {
      return [];
    }

    const totalOriginal = sourceMoments.reduce((sum, moment) => sum + (moment.duration_seconds || 60), 0);
    const rawDurations = sourceMoments.map(
      (moment) => ((moment.duration_seconds || 60) / totalOriginal) * targetDuration,
    );
    const finalDurations = [...rawDurations];
    let deficit = 0;
    const aboveMinIndices: number[] = [];

    for (let index = 0; index < finalDurations.length; index += 1) {
      if (finalDurations[index] < minimumDuration) {
        deficit += minimumDuration - finalDurations[index];
        finalDurations[index] = minimumDuration;
      } else {
        aboveMinIndices.push(index);
      }
    }

    if (deficit > 0 && aboveMinIndices.length > 0) {
      const aboveMinTotal = aboveMinIndices.reduce((sum, index) => sum + finalDurations[index], 0);
      for (const index of aboveMinIndices) {
        finalDurations[index] -= (finalDurations[index] / aboveMinTotal) * deficit;
        if (finalDurations[index] < minimumDuration) {
          finalDurations[index] = minimumDuration;
        }
      }
    }

    const roundedDurations = finalDurations.map((duration) => Math.max(minimumDuration, Math.round(duration)));
    const roundedTotal = roundedDurations.reduce((sum, duration) => sum + duration, 0);
    const diff = targetDuration - roundedTotal;
    if (diff !== 0 && roundedDurations.length > 0) {
      roundedDurations[roundedDurations.length - 1] = Math.max(
        minimumDuration,
        roundedDurations[roundedDurations.length - 1] + diff,
      );
    }

    const result = sourceMoments.map((moment, index) => ({
      name: moment.name,
      duration: roundedDurations[index],
      order_index: index,
      activityId: moment.activityId,
    }));
    let totalDuration = result.reduce((sum, moment) => sum + moment.duration, 0);
    while (totalDuration > targetDuration && result.length > 1) {
      result.pop();
      totalDuration = result.reduce((sum, moment) => sum + moment.duration, 0);
      if (result.length > 0) {
        const remainingDuration = targetDuration - result.slice(0, -1).reduce((sum, moment) => sum + moment.duration, 0);
        result[result.length - 1].duration = Math.max(minimumDuration, remainingDuration);
      }
    }

    return result;
  }
}