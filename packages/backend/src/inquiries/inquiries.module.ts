import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { ClientPortalService } from './client-portal.service';
import { PublicClientPortalController } from './public-client-portal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ScheduleModule } from '../content/schedule/schedule.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';
import { InquiryAvailabilityService } from './inquiry-availability.service';
import { EstimatesModule } from '../estimates/estimates.module';
import { ProposalsModule } from '../proposals/proposals.module';

@Module({
    imports: [PrismaModule, ProjectsModule, ScheduleModule, InquiryTasksModule, EstimatesModule, ProposalsModule],
    controllers: [InquiriesController, PublicClientPortalController],
    providers: [InquiriesService, ClientPortalService, InquiryAvailabilityService],
    exports: [InquiriesService, ClientPortalService, InquiryAvailabilityService],
})
export class InquiriesModule { }
