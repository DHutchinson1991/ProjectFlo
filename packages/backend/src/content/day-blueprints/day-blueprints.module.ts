import { Module } from '@nestjs/common';
import { GemmaModule } from '../../ai/gemma/gemma.module';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { DayBlueprintsController } from './day-blueprints.controller';
import { DayBlueprintDiffApplier } from './diff';
import {
  DayBlueprintAiGeneratorService,
  DayBlueprintAiRefinerService,
  DayBlueprintSpatialGeneratorService,
  DayBlueprintCompletenessService,
  DayBlueprintAiEventsService,
  DayBlueprintAiRunsService,
  DayBlueprintAiRunLoggerFactory,
  DayBlueprintAiService,
  DayBlueprintAuthoringService,
  DayBlueprintDefaultsService,
  DayBlueprintGuardrailsService,
  DayBlueprintLocationRolesService,
  DayBlueprintSandboxLayoutService,
  DayBlueprintSnapshotService,
  DayBlueprintVersionsService,
  DayBlueprintsService,
} from './services';

/**
 * Day Designer module. Owns authoring of canonical day structures
 * (DayBlueprint) and the snapshot routine that materializes a
 * published version into package-scope rows. `DayBlueprintSnapshotService`
 * is exported so `catalog/packages` can consume a blueprint during
 * package creation.
 */
@Module({
  imports: [PrismaModule, GemmaModule],
  controllers: [DayBlueprintsController],
  providers: [
    DayBlueprintsService,
    DayBlueprintVersionsService,
    DayBlueprintAuthoringService,
    DayBlueprintDefaultsService,
    DayBlueprintLocationRolesService,
    DayBlueprintGuardrailsService,
    DayBlueprintSandboxLayoutService,
    DayBlueprintSnapshotService,
    DayBlueprintAiService,
    DayBlueprintAiRunsService,
    DayBlueprintAiGeneratorService,
    DayBlueprintAiRefinerService,
    DayBlueprintSpatialGeneratorService,
    DayBlueprintCompletenessService,
    DayBlueprintAiEventsService,
    DayBlueprintAiRunLoggerFactory,
    DayBlueprintDiffApplier,
  ],
  exports: [DayBlueprintSnapshotService, DayBlueprintsService, DayBlueprintVersionsService],
})
export class DayBlueprintsModule {}
