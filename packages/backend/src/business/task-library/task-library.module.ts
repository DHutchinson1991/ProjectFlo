import { Module } from '@nestjs/common';
import { TaskLibraryService } from './task-library.service';
import { TaskLibraryController } from './task-library.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { SkillRoleMappingsModule } from '../skill-role-mappings/skill-role-mappings.module';

@Module({
    imports: [PrismaModule, SkillRoleMappingsModule],
    controllers: [TaskLibraryController],
    providers: [TaskLibraryService],
    exports: [TaskLibraryService],
})
export class TaskLibraryModule { }
