import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { ClientPortalService } from './client-portal.service';
import { PublicClientPortalController } from './public-client-portal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ScheduleModule } from '../content/schedule/schedule.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';

@Module({
    imports: [PrismaModule, ProjectsModule, ScheduleModule, InquiryTasksModule],
    controllers: [InquiriesController, PublicClientPortalController],
    providers: [InquiriesService, ClientPortalService],
    exports: [InquiriesService, ClientPortalService],
})
export class InquiriesModule { }
