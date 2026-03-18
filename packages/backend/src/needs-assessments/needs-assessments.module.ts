import { Module } from '@nestjs/common';
import { NeedsAssessmentsController } from './needs-assessments.controller';
import { PublicNeedsAssessmentsController } from './public-needs-assessments.controller';
import { NeedsAssessmentsService } from './needs-assessments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InquiriesModule } from '../inquiries/inquiries.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';
import { EstimatesModule } from '../estimates/estimates.module';
import { ProjectsModule } from '../projects/projects.module';
import { TaskLibraryModule } from '../business/task-library/task-library.module';
import { PaymentSchedulesModule } from '../payment-schedules/payment-schedules.module';

@Module({
    imports: [
        PrismaModule,
        InquiriesModule,
        InquiryTasksModule,
        EstimatesModule,
        ProjectsModule,
        TaskLibraryModule,
        PaymentSchedulesModule,
    ],
    controllers: [NeedsAssessmentsController, PublicNeedsAssessmentsController],
    providers: [NeedsAssessmentsService],
    exports: [NeedsAssessmentsService],
})
export class NeedsAssessmentsModule {}
