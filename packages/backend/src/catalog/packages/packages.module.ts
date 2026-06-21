import { Module, forwardRef } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackageVersionsService } from './services/package-versions.service';
import { PackageBlueprintResyncService } from './services/package-blueprint-resync.service';
import { PackagesController } from './packages.controller';
import { PackagesPlanningController } from './packages-planning.controller';
import { PackageAiRunsService } from './services/package-ai-runs.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';
import { ActivityPlanningModule } from '../../content/activity-planning/activity-planning.module';
import { PackageCreationModule } from './creation/package-creation.module';
import { DayBlueprintsModule } from '../../content/day-blueprints/day-blueprints.module';
import { FloorPlansModule } from '../../workflow/locations/modules/floor-plans/floor-plans.module';
import { PackageBlueprintSpatialService } from './services/package-blueprint-spatial.service';

@Module({
  imports: [
    PrismaModule,
    PricingModule,
    ActivityPlanningModule,
    DayBlueprintsModule,
    FloorPlansModule,
    forwardRef(() => PackageCreationModule),
  ],
  controllers: [PackagesController, PackagesPlanningController],
  providers: [
    PackagesService,
    PackageVersionsService,
    PackageBlueprintResyncService,
    PackageBlueprintSpatialService,
    PackageAiRunsService,
  ],
  exports: [PackagesService],
})
export class PackagesModule {}
