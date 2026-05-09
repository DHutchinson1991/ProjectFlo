import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { GemmaModule } from '../../ai/gemma/gemma.module';
import { BlockingModule } from '../../ai/blocking/blocking.module';
import { FloorPlansModule } from '../../workflow/locations/modules/floor-plans/floor-plans.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { ActivityPlannerService } from './services/activity-planner.service';
import { ActivityPlanningMaintenanceService } from './services/activity-planning-maintenance.service';
import { ActivityPlanningStatusService } from './services/activity-planning-status.service';
import { PackageBlockingPlannerService } from './services/package-blocking-planner.service';
import { PackageContextService } from './services/package-context.service';
import { PackagePlanningOrchestratorService } from './services/package-planning-orchestrator.service';
import { PackagePlanningProgressService } from './services/package-planning-progress.service';
import { PackagePlanningStepsService } from './services/package-planning-steps.service';
import { PlanningEventsService } from './services/planning-events.service';
import { SingleActivityPlannerService } from './services/single-activity-planner.service';
import { ActivityCastingStep } from './steps/activity-casting.step';
import { ActivityActionsStep } from './steps/activity-actions.step';
import { ActivityDirectorStep } from './steps/activity-director.step';
import { ActivitySubjectAssignmentStep } from './steps/activity-subject-assignment.step';
import { ActivityTimingStep } from './steps/activity-timing.step';
import { ActivityDescriptionStep } from './steps/activity-description.step';
import { CameraCoverageStep } from './steps/camera-coverage.step';
import { MomentGenerationStep } from './steps/moment-generation.step';

@Module({
  imports: [PrismaModule, GemmaModule, BlockingModule, FloorPlansModule, forwardRef(() => ScheduleModule)],
  providers: [
    PackageContextService,
    ActivityPlanningStatusService,
    PackagePlanningProgressService,
    PackagePlanningStepsService,
    SingleActivityPlannerService,
    PackagePlanningOrchestratorService,
    ActivityPlanningMaintenanceService,
    ActivityPlannerService,
    PackageBlockingPlannerService,
    PlanningEventsService,
    ActivityCastingStep,
    ActivityActionsStep,
    ActivityDirectorStep,
    ActivitySubjectAssignmentStep,
    ActivityTimingStep,
    ActivityDescriptionStep,
    CameraCoverageStep,
    MomentGenerationStep,
  ],
  exports: [
    PackageContextService,
    ActivityPlannerService,
    PackageBlockingPlannerService,
    PlanningEventsService,
    ActivityCastingStep,
    ActivityActionsStep,
    ActivityDirectorStep,
    CameraCoverageStep,
    MomentGenerationStep,
  ],
})
export class ActivityPlanningModule {}
