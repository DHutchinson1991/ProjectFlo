import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { SkillRoleMappingsModule } from '../../catalog/skill-role-mappings/skill-role-mappings.module';
import { TaskLibraryController } from './task-library.controller';
import { TaskLibraryService } from './task-library.service';
import { TaskLibraryAccessService } from './services/task-library-access.service';
import { TaskLibraryCrudService } from './services/task-library-crud.service';
import { TaskLibraryExecuteService } from './services/task-library-execute.service';
import { TaskLibraryPreviewService } from './services/task-library-preview.service';

@Module({
    imports: [PrismaModule, SkillRoleMappingsModule],
    controllers: [TaskLibraryController],
    providers: [
        TaskLibraryService,
        TaskLibraryAccessService,
        TaskLibraryCrudService,
        TaskLibraryExecuteService,
        TaskLibraryPreviewService,
    ],
    exports: [TaskLibraryService],
})
export class TaskLibraryModule {}
