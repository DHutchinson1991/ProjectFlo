import { Module } from '@nestjs/common';
import { GemmaModule } from '../../ai/gemma/gemma.module';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { FloorPlansModule } from '../../workflow/locations/modules/floor-plans/floor-plans.module';
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
  DayBlueprintAuthoringMomentDetailsService,
  DayBlueprintDefaultsService,
  DayBlueprintGuardrailsService,
  DayBlueprintLocationRolesService,
  DayBlueprintSandboxLayoutService,
  DayBlueprintSnapshotService,
  DayBlueprintPlacementSeedService,
  DayBlueprintVersionsService,
  DayBlueprintVersionCopyService,
  DayBlueprintsService,
  DayDesignerDensityService,
} from './services';

/**
 * Day Designer module. Owns authoring of canonical day structures
 * (DayBlueprint) and the snapshot routine that materializes a
 * published version into package-scope rows. `DayBlueprintSnapshotService`
 * is exported so `catalog/packages` can consume a blueprint during
 * package creation.
 */
@Module({
  imports: [PrismaModule, GemmaModule, FloorPlansModule],
  controllers: [DayBlueprintsController],
  providers: [
    DayBlueprintsService,
    DayBlueprintVersionCopyService,
    DayBlueprintVersionsService,
    DayBlueprintAuthoringService,
    DayBlueprintAuthoringMomentDetailsService,
    DayBlueprintDefaultsService,
    DayBlueprintLocationRolesService,
    DayBlueprintGuardrailsService,
    DayBlueprintSandboxLayoutService,
    DayBlueprintSnapshotService,
    DayBlueprintPlacementSeedService,
    DayBlueprintAiService,
    DayBlueprintAiRunsService,
    DayBlueprintAiGeneratorService,
    DayBlueprintAiRefinerService,
    DayBlueprintSpatialGeneratorService,
    DayBlueprintCompletenessService,
    DayBlueprintAiEventsService,
    DayBlueprintAiRunLoggerFactory,
    DayBlueprintDiffApplier,
    DayDesignerDensityService,
  ],
  exports: [
    DayBlueprintSnapshotService,
    DayBlueprintPlacementSeedService,
    DayBlueprintsService,
    DayBlueprintVersionsService,
    DayDesignerDensityService,
  ],
})
export class DayBlueprintsModule {}
