import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ScheduleModule } from '../content/schedule/schedule.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';

@Module({
    imports: [PrismaModule, ProjectsModule, ScheduleModule, InquiryTasksModule],
    controllers: [InquiriesController],
    providers: [InquiriesService],
    exports: [InquiriesService],
})
export class InquiriesModule { }
