import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../../workflow/tasks/tasks.module';
import { ScenePreparationModule } from '../scene-preparation/scene-preparation.module';
import { ActivityPlanningModule } from '../activity-planning/activity-planning.module';
import { FilmsModule } from '../films/films.module';
import { FilmStructureTemplatesModule } from '../film-structure-templates/film-structure-templates.module';
import { ScenesModule } from '../scenes/scenes.module';
import { MomentsModule } from '../moments/moments.module';
import { BeatsModule } from '../beats/beats.module';
import { SceneAudioSourcesModule } from '../scene-audio-sources/scene-audio-sources.module';

// Legacy monolithic controller (frontend still calls these routes; to be removed once frontend migrates)
import { ScheduleController } from './schedule.controller';

// Split services (bounded responsibility)
import {
  SchedulePresetService,
  ScheduleFilmService,
  SchedulePackageService,
  SchedulePackageActivityService,
  SchedulePackageResourceService,
  ScheduleProjectService,
  ScheduleInstanceService,
  ScheduleInstanceResourceService,
  ScheduleInstanceCrewSlotsService,
  ScheduleDiffService,
  MomentKnowledgeService,
  SchedulePackageContentCreationService,
} from './services';

// Split controllers (api/ prefixed, guarded)
import {
  SchedulePresetController,
  SchedulePackageController,
  SchedulePackageResourceController,
  ScheduleProjectController,
  ScheduleInstanceController,
  ScheduleInstanceResourceController,
} from './controllers';

@Module({
  imports: [
    PrismaModule,
    TasksModule,
    forwardRef(() => ScenePreparationModule),
    forwardRef(() => ActivityPlanningModule),
    FilmsModule,
    FilmStructureTemplatesModule,
    ScenesModule,
    MomentsModule,
    BeatsModule,
    SceneAudioSourcesModule,
  ],
  controllers: [
    ScheduleController,
    SchedulePresetController,
    SchedulePackageController,
    SchedulePackageResourceController,
    ScheduleProjectController,
    ScheduleInstanceController,
    ScheduleInstanceResourceController,
  ],
  providers: [
    SchedulePresetService,
    ScheduleFilmService,
    SchedulePackageService,
    SchedulePackageActivityService,
    SchedulePackageResourceService,
    ScheduleProjectService,
    ScheduleInstanceService,
    ScheduleInstanceResourceService,
    ScheduleInstanceCrewSlotsService,
    ScheduleDiffService,
    MomentKnowledgeService,
    SchedulePackageContentCreationService,
  ],
  exports: [
    ScheduleDiffService,
    ScheduleProjectService,
    ScheduleInstanceService,
    ScheduleInstanceCrewSlotsService,
    MomentKnowledgeService,
  ],
})
export class ScheduleModule {}
