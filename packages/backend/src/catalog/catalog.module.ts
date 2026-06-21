import { Module } from '@nestjs/common';
import { CrewPresetsModule } from './crew-presets/crew-presets.module';
import { EquipmentPresetsModule } from './equipment-presets/equipment-presets.module';
import { DiscoveryQuestionnaireModule } from './discovery-questionnaire/discovery-questionnaire.module';
import { JobRolesModule } from './job-roles/job-roles.module';
import { PackageSetsModule } from './packages/sets/package-sets.module';
import { PackageTemplatesModule } from './packages/templates/package-templates.module';
import { PricingModule } from './pricing/pricing.module';
import { PackagesModule } from './packages/packages.module';
import { SkillRoleMappingsModule } from './skill-role-mappings/skill-role-mappings.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { PackageCreationModule } from './packages/creation/package-creation.module';

@Module({
  imports: [
    CrewPresetsModule,
    EquipmentPresetsModule,
    DiscoveryQuestionnaireModule,
    JobRolesModule,
    PackageCreationModule,
    PackageSetsModule,
    PackageTemplatesModule,
    PricingModule,
    PackagesModule,
    SkillRoleMappingsModule,
    WorkflowsModule,
  ],
  exports: [
    CrewPresetsModule,
    EquipmentPresetsModule,
    DiscoveryQuestionnaireModule,
    JobRolesModule,
    PackageCreationModule,
    PackageSetsModule,
    PackageTemplatesModule,
    PricingModule,
    PackagesModule,
    SkillRoleMappingsModule,
    WorkflowsModule,
  ],
})
export class CatalogModule {}
