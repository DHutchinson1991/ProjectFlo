import { Module } from '@nestjs/common';
import { SkillRoleMappingsController } from './skill-role-mappings.controller';
import { SkillRoleMappingsService } from './skill-role-mappings.service';
import { SkillRoleMappingsResolverService } from './services/skill-role-mappings-resolver.service';
import { SkillRoleMappingsQueryService } from './services/skill-role-mappings-query.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SkillRoleMappingsController],
    providers: [SkillRoleMappingsService, SkillRoleMappingsResolverService, SkillRoleMappingsQueryService],
    exports: [SkillRoleMappingsService, SkillRoleMappingsResolverService, SkillRoleMappingsQueryService],
})
export class SkillRoleMappingsModule { }
