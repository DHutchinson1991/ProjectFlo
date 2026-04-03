import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { ClientPortalService } from './client-portal.service';
import { ClientPortalDataService } from './services/client-portal-data.service';
import { ClientPortalSectionsService } from './services/client-portal-sections.service';
import { ClientPortalJourneyService } from './services/client-portal-journey.service';
import { ClientPortalActionsService } from './services/client-portal-actions.service';
import { PublicClientPortalController } from './public-client-portal.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ScheduleModule } from '../../content/schedule/schedule.module';
import { TasksModule } from '../tasks/tasks.module';
import { InquiryAvailabilityService } from './inquiry-availability.service';
import { InquiryAvailabilityController } from './inquiry-availability.controller';

import { ProposalsModule } from '../proposals/proposals.module';
import { InquiryCrewAvailabilityService } from './services/inquiry-crew-availability.service';

import { InquiryEquipmentAvailabilityService } from './services/inquiry-equipment-availability.service';
import { InquiryEquipmentReservationsService } from './services/inquiry-equipment-reservations.service';
import { InquiryQueryService } from './services/inquiry-query.service';
import { InquiryCrudService } from './services/inquiry-crud.service';
import { InquiryPackageService } from './services/inquiry-package.service';
import { InquiryScheduleSnapshotService } from './services/inquiry-schedule-snapshot.service';
import { InquiryLifecycleService } from './services/inquiry-lifecycle.service';

@Module({
    imports: [PrismaModule, ProjectsModule, ScheduleModule, TasksModule, ProposalsModule],
    controllers: [InquiriesController, InquiryAvailabilityController, PublicClientPortalController],
    providers: [
        ClientPortalService,
        ClientPortalDataService,
        ClientPortalSectionsService,
        ClientPortalJourneyService,
        ClientPortalActionsService,
        InquiryAvailabilityService,
        InquiryCrewAvailabilityService,
        InquiryEquipmentAvailabilityService,
        InquiryEquipmentReservationsService,
        InquiryQueryService,
        InquiryCrudService,
        InquiryPackageService,
        InquiryScheduleSnapshotService,
        InquiryLifecycleService,
    ],
    exports: [
        InquiryCrudService,
        InquiryPackageService,
        InquiryScheduleSnapshotService,
        InquiryQueryService,
        InquiryLifecycleService,
        ClientPortalService,
        InquiryAvailabilityService,
    ],
})
export class InquiriesModule { }

