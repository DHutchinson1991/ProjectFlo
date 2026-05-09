import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { GemmaModule } from '../../ai/gemma/gemma.module';
import { SpatialEngineModule } from '../spatial-engine/spatial-engine.module';
import { ActivityPlanningModule } from '../activity-planning/activity-planning.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { ScenePreparationService } from './services/scene-preparation.service';
import { ShotDirectorService } from './services/shot-director.service';
import { ShotPromptBuilder } from './services/shot-prompt-builder';
import { FilmPrepEventsService } from './services/film-prep-events.service';
import { ShotDecisionService } from './services/shot-decision.service';
import { ScenePreparationController } from './scene-preparation.controller';

@Module({
  imports: [
    PrismaModule,
    GemmaModule,
    SpatialEngineModule,
    ActivityPlanningModule,
    forwardRef(() => ScheduleModule),
  ],
  controllers: [ScenePreparationController],
  providers: [
    ScenePreparationService,
    ShotDirectorService,
    ShotPromptBuilder,
    FilmPrepEventsService,
    ShotDecisionService,
  ],
  exports: [
    ScenePreparationService,
    ShotPromptBuilder,
    FilmPrepEventsService,
  ],
})
export class ScenePreparationModule {}
