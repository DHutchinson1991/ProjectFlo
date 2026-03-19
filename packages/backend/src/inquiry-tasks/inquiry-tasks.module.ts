import { Module } from '@nestjs/common';
import { InquiryTasksController } from './inquiry-tasks.controller';
import { InquirySubtasksController } from './inquiry-subtasks.controller';
import { InquiryTasksService } from './inquiry-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [InquiryTasksController, InquirySubtasksController],
    providers: [InquiryTasksService],
    exports: [InquiryTasksService],
})
export class InquiryTasksModule {}
