import { Module } from '@nestjs/common';
import { InquiryWizardController } from './inquiry-wizard.controller';
import { PublicInquiryWizardController } from './public-inquiry-wizard.controller';
import { InquiryWizardTemplateService } from './services/inquiry-wizard-template.service';
import { InquiryWizardSubmissionService } from './services/inquiry-wizard-submission.service';
import { InquiryWizardConflictService } from './services/inquiry-wizard-conflict.service';
import { InquiryWizardEstimateService } from './services/inquiry-wizard-estimate.service';
import { InquiryWizardPrefillService } from './services/inquiry-wizard-prefill.service';
import { InquiryWizardLinkService } from './services/inquiry-wizard-link.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { InquiriesModule } from '../inquiries/inquiries.module';
import { TasksModule } from '../tasks/tasks.module';
import { EstimatesModule } from '../../finance/estimates/estimates.module';
import { ProjectsModule } from '../projects/projects.module';
import { TaskLibraryModule } from '../task-library/task-library.module';
import { PaymentSchedulesModule } from '../../finance/payment-schedules/payment-schedules.module';
import { LocationsModule } from '../locations/locations.module';
import { BrandFinanceSettingsModule } from '../../finance/brand-finance-settings/brand-finance-settings.module';

@Module({
    imports: [
        PrismaModule,
        InquiriesModule,
        TasksModule,
        EstimatesModule,
        ProjectsModule,
        TaskLibraryModule,
        PaymentSchedulesModule,
        LocationsModule,
        BrandFinanceSettingsModule,
    ],
    controllers: [InquiryWizardController, PublicInquiryWizardController],
    providers: [
        InquiryWizardTemplateService,
        InquiryWizardSubmissionService,
        InquiryWizardConflictService,
        InquiryWizardEstimateService,
        InquiryWizardPrefillService,
        InquiryWizardLinkService,
    ],
    exports: [
        InquiryWizardTemplateService,
        InquiryWizardSubmissionService,
        InquiryWizardConflictService,
    ],
})
export class InquiryWizardModule {}
