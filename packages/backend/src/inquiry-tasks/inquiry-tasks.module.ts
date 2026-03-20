import { Module, forwardRef } from '@nestjs/common';
import { InquiryTasksController } from './inquiry-tasks.controller';
import { InquirySubtasksController } from './inquiry-subtasks.controller';
import { InquiryTasksService } from './inquiry-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
    imports: [PrismaModule, forwardRef(() => ContractsModule)],
    controllers: [InquiryTasksController, InquirySubtasksController],
    providers: [InquiryTasksService],
    exports: [InquiryTasksService],
})
export class InquiryTasksModule {}
