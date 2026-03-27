import { Module } from '@nestjs/common';
import { CalendarModule } from './calendar/calendar.module';
import { ClientsModule } from './clients/clients.module';
import { CrewModule } from './crew/crew.module';
import { EquipmentModule } from './equipment/equipment.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { InquiryWizardModule } from './inquiry-wizard/inquiry-wizard.module';
import { LocationsModule } from './locations/locations.module';
import { CrewSlotsModule } from './crew-slots/crew-slots.module';
import { ProjectsModule } from './projects/projects.module';
import { ProposalsModule } from './proposals/proposals.module';
import { TaskLibraryModule } from './task-library/task-library.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
    imports: [
        CalendarModule,
        ClientsModule,
        CrewModule,
        EquipmentModule,
        InquiriesModule,
        InquiryWizardModule,
        LocationsModule,
        CrewSlotsModule,
        ProjectsModule,
        ProposalsModule,
        TaskLibraryModule,
        TasksModule,
    ],
    exports: [
        CalendarModule,
        ClientsModule,
        CrewModule,
        EquipmentModule,
        InquiriesModule,
        InquiryWizardModule,
        LocationsModule,
        CrewSlotsModule,
        ProjectsModule,
        ProposalsModule,
        TaskLibraryModule,
        TasksModule,
    ],
})
export class WorkflowModule {}
