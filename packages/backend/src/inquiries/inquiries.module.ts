import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ScheduleModule } from '../content/schedule/schedule.module';

@Module({
    imports: [PrismaModule, ProjectsModule, ScheduleModule],
    controllers: [InquiriesController],
    providers: [InquiriesService],
    exports: [InquiriesService],
})
export class InquiriesModule { }
