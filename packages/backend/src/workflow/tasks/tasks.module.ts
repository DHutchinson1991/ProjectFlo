import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { ContractsModule } from '../../finance/contracts/contracts.module';
import { InquiryTasksController } from './inquiry/inquiry-tasks.controller';
import { InquirySubtasksController } from './inquiry/inquiry-subtasks.controller';
import { InquiryTaskLifecycleService } from './inquiry/services/inquiry-task-lifecycle.service';
import { InquiryTaskGeneratorService } from './inquiry/services/inquiry-task-generator.service';
import { InquiryTaskStatusService } from './inquiry/services/inquiry-task-status.service';
import { InquiryTasksService } from './inquiry/services/inquiry-tasks.service';
import { ActiveTasksController } from './active-tasks.controller';
import { ActiveTasksService } from './services/active-tasks.service';
import { LeadTaskService } from './inquiry/services/lead-task.service';

@Module({
    imports: [PrismaModule, forwardRef(() => ContractsModule)],
    controllers: [InquiryTasksController, InquirySubtasksController, ActiveTasksController],
    providers: [
        InquiryTaskLifecycleService,
        InquiryTaskGeneratorService,
        InquiryTaskStatusService,
        InquiryTasksService,
        ActiveTasksService,
        LeadTaskService,
    ],
    exports: [InquiryTasksService, InquiryTaskLifecycleService, ActiveTasksService, LeadTaskService],
})
export class TasksModule {}
