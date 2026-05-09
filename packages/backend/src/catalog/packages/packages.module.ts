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

@Module({
  imports: [
    PrismaModule,
    PricingModule,
    ActivityPlanningModule,
    DayBlueprintsModule,
    forwardRef(() => PackageCreationModule),
  ],
  controllers: [PackagesController, PackagesPlanningController],
  providers: [PackagesService, PackageVersionsService, PackageBlueprintResyncService, PackageAiRunsService],
  exports: [PackagesService],
})
export class PackagesModule {}
