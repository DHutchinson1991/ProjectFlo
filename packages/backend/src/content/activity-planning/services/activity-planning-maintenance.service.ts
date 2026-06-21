import { Injectable, Logger } from '@nestjs/common';
import { CeremonySeatLayoutMode } from '@projectflo/shared';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  DayBlueprintPlacementSeedService,
  type BlueprintPlacementSeedOptions,
} from '../../day-blueprints/services';
import { MomentKnowledgeService } from '../../schedule/services/moment-knowledge.service';
import { PackagePlanningOrchestratorService } from './package-planning-orchestrator.service';
import { PackageBlockingPlannerService } from './package-blocking-planner.service';
import { PackageCreationRunLogger } from '../../../catalog/packages/creation/run/package-creation-run-logger';

@Injectable()
export class ActivityPlanningMaintenanceService {
  private readonly logger = new Logger(ActivityPlanningMaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly momentKnowledge: MomentKnowledgeService,
    private readonly packagePlanningOrchestrator: PackagePlanningOrchestratorService,
    private readonly packageBlockingPlanner: PackageBlockingPlannerService,
    private readonly placementSeed: DayBlueprintPlacementSeedService,
  ) {}

  async replanPackageActivities(packageId: number): Promise<void> {
    const activities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId },
      select: { id: true },
    });
    const activityIds = activities.map((activity) => activity.id);

    if (activityIds.length > 0) {
      await this.prisma.packageDaySubjectActivity.deleteMany({
        where: { package_activity_id: { in: activityIds } },
      });
      await this.prisma.packageActivityMoment.deleteMany({
        where: { package_activity_id: { in: activityIds } },
      });
    }

    await this.packagePlanningOrchestrator.planPackageActivities(packageId);

    // Moments were recreated above, which discards every camera_subject_plan
    // and per-moment position override. Re-run blocking so the new moments get
    // fresh plans instead of leaving the floor plan / conflict panel stale.
    await this.rerunPackageBlocking(packageId, 'replan');
  }

  /**
   * Re-runs the package blocking planner after a structural change
   * (replan / blueprint resync). Never throws — blocking failure must not
   * undo the structural operation that succeeded.
   */
  async rerunPackageBlocking(
    packageId: number,
    reason: string,
    options?: BlueprintPlacementSeedOptions & { skipPlacementSeed?: boolean },
  ): Promise<void> {
    try {
      const pkg = await this.prisma.service_packages.findUnique({
        where: { id: packageId },
        select: { name: true, brand_id: true, source_day_blueprint_version_id: true },
      });
      const runLogger = new PackageCreationRunLogger({
        brandId: pkg?.brand_id ?? 0,
        source: 'catalog',
        route: `maintenance/${reason}`,
        packageName: pkg?.name ?? `package-${packageId}`,
      });
      runLogger.attachPackage(packageId, pkg?.name ?? `package-${packageId}`);

      if (pkg?.source_day_blueprint_version_id && !options?.skipPlacementSeed) {
        try {
          const seedResult = await this.placementSeed.seedPackagePlacementsFromBlueprint(packageId, {
            seatLayout: options?.seatLayout ?? CeremonySeatLayoutMode.FLUID,
          });
          runLogger.log('BUILDER', 'Re-seeded blueprint placements before blocking rerun', {
            packageId,
            ...seedResult,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `rerunPackageBlocking(${reason}): placement seed failed for package ${packageId} — ${message}`,
          );
        }
      }

      await this.packageBlockingPlanner.planPackageBlocking(packageId, runLogger, undefined, undefined, {
        skipPlacementSeed: options?.skipPlacementSeed ?? false,
        seatLayout: options?.seatLayout ?? CeremonySeatLayoutMode.FLUID,
      });
      runLogger.complete();
      this.logger.log(`rerunPackageBlocking(${reason}): blocking re-planned for package ${packageId}`);
    } catch (err) {
      this.logger.error(
        `rerunPackageBlocking(${reason}): failed for package ${packageId} — ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async resyncScheduledScenes(packageId: number): Promise<number[]> {
    const activities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId },
      select: { id: true },
    });

    const scenes = await this.prisma.filmScene.findMany({
      where: { source_activity_id: { in: activities.map((activity) => activity.id) } },
      select: { id: true, source_activity_id: true },
    });

    const resyncedIds: number[] = [];
    for (const scene of scenes) {
      await this.prisma.sceneMoment.deleteMany({ where: { film_scene_id: scene.id } });
      await this.momentKnowledge.ensureSceneMomentsForActivity(scene.id, scene.source_activity_id);
      resyncedIds.push(scene.id);
    }

    this.logger.log(`resyncScheduledScenes: resynced ${resyncedIds.length} scenes for package ${packageId}`);
    return resyncedIds;
  }
}