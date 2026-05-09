import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { MomentKnowledgeService } from '../../schedule/services/moment-knowledge.service';
import { PackagePlanningOrchestratorService } from './package-planning-orchestrator.service';

@Injectable()
export class ActivityPlanningMaintenanceService {
  private readonly logger = new Logger(ActivityPlanningMaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly momentKnowledge: MomentKnowledgeService,
    private readonly packagePlanningOrchestrator: PackagePlanningOrchestratorService,
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