import { Module } from '@nestjs/common';
import { DiscoveryQuestionnaireModule } from './discovery-questionnaire/discovery-questionnaire.module';
import { EventSubtypesModule } from './event-subtypes/event-subtypes.module';
import { EventTypesModule } from './event-types/event-types.module';
import { JobRolesModule } from './job-roles/job-roles.module';
import { PackageSetsModule } from './package-sets/package-sets.module';
import { PricingModule } from './pricing/pricing.module';
import { ServicePackageCategoriesModule } from './service-package-categories/service-package-categories.module';
import { ServicePackagesModule } from './service-packages/service-packages.module';
import { SkillRoleMappingsModule } from './skill-role-mappings/skill-role-mappings.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [
    DiscoveryQuestionnaireModule,
    EventSubtypesModule,
    EventTypesModule,
    JobRolesModule,
    PackageSetsModule,
    PricingModule,
    ServicePackageCategoriesModule,
    ServicePackagesModule,
    SkillRoleMappingsModule,
    WorkflowsModule,
  ],
  exports: [
    DiscoveryQuestionnaireModule,
    EventSubtypesModule,
    EventTypesModule,
    JobRolesModule,
    PackageSetsModule,
    PricingModule,
    ServicePackageCategoriesModule,
    ServicePackagesModule,
    SkillRoleMappingsModule,
    WorkflowsModule,
  ],
})
export class CatalogModule {}
