import { Module } from '@nestjs/common';
import { BeatsModule } from './beats/beats.module';
import { CoverageModule } from './coverage/coverage.module';
import { DayBlueprintsModule } from './day-blueprints/day-blueprints.module';
import { FilmLocationsModule } from './film-locations/film-locations.module';
import { FilmStructureTemplatesModule } from './film-structure-templates/film-structure-templates.module';
import { FilmsModule } from './films/films.module';
import { InstanceFilmsModule } from './instance-films/instance-films.module';
import { MomentsModule } from './moments/moments.module';
import { MontagePresetsModule } from './montage-presets/montage-presets.module';
import { MusicModule } from './music/music.module';
import { SceneAudioSourcesModule } from './scene-audio-sources/scene-audio-sources.module';
import { ScenesModule } from './scenes/scenes.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ActivityPlanningModule } from './activity-planning/activity-planning.module';
import { ScenePreparationModule } from './scene-preparation/scene-preparation.module';
import { FrameRenderingModule } from './frame-rendering/frame-rendering.module';
import { SpatialEngineModule } from './spatial-engine/spatial-engine.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AuditModule } from './audit/audit.module';

@Module({
    imports: [
        ActivityPlanningModule,
        AuditModule,
        BeatsModule,
        CoverageModule,
        DayBlueprintsModule,
        FilmLocationsModule,
        FilmStructureTemplatesModule,
        FilmsModule,
        FrameRenderingModule,
        InstanceFilmsModule,
        MomentsModule,
        MontagePresetsModule,
        MusicModule,
        SceneAudioSourcesModule,
        ScenesModule,
        ScenePreparationModule,
        ScheduleModule,
        SpatialEngineModule,
        SubjectsModule,
    ],
})
export class ContentModule {}
