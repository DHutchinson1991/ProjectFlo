import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowTemplateTasksService } from './services/workflow-template-tasks.service';
import { WorkflowsController } from './workflows.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowsController],
    providers: [WorkflowsService, WorkflowTemplateTasksService],
    exports: [WorkflowsService, WorkflowTemplateTasksService],
})
export class WorkflowsModule {}
