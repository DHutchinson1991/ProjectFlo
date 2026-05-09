import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../../platform/prisma/prisma.module';
import { ActivityPlanningModule } from '../../../content/activity-planning/activity-planning.module';
import { DayBlueprintsModule } from '../../../content/day-blueprints/day-blueprints.module';
import { FloorPlansModule } from '../../../workflow/locations/modules/floor-plans/floor-plans.module';
import { PackageTemplatesModule } from '../templates/package-templates.module';
import { PackageCreationPipelineService } from './package-creation-pipeline.service';
import { PackageCreationService } from './package-creation.service';
import { CatalogPackageCreator } from './sources/catalog-package-creator.service';
import { InquiryPackageCreator } from './sources/inquiry-package-creator.service';
import { BrandCurrencyResolver } from './shared/brand-currency.resolver';
import { SandboxLayoutService } from './shared/sandbox-layout.service';
import { CrewBuilder } from './builders/crew.builder';
import { DayContentBuilder } from './builders/day-content.builder';

/**
 * Home of package creation. Owns `PackageCreationService` (the facade),
 * the two level-scoped creators (catalog / inquiry), the deterministic
 * package-structure builders, and small shared primitives used by both
 * creators. Controllers inject `PackageCreationService` only.
 */
@Module({
  imports: [
    PrismaModule,
    ActivityPlanningModule,
    DayBlueprintsModule,
    FloorPlansModule,
    forwardRef(() => PackageTemplatesModule),
  ],
  providers: [
    PackageCreationService,
    PackageCreationPipelineService,
    CatalogPackageCreator,
    InquiryPackageCreator,
    BrandCurrencyResolver,
    SandboxLayoutService,
    CrewBuilder,
    DayContentBuilder,
  ],
  exports: [PackageCreationService],
})
export class PackageCreationModule {}
