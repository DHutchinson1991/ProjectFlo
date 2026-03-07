import { Module } from '@nestjs/common';
import { SkillRoleMappingsController } from './skill-role-mappings.controller';
import { SkillRoleMappingsService } from './skill-role-mappings.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SkillRoleMappingsController],
    providers: [SkillRoleMappingsService],
    exports: [SkillRoleMappingsService],
})
export class SkillRoleMappingsModule { }
