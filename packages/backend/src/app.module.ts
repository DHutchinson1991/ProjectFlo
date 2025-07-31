import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
// Core Domain
import { AuthModule } from "./core/auth/auth.module";
import { ContributorsModule } from "./core/users/contributors/contributors.module";
import { RolesModule } from "./core/users/roles/roles.module";
import { ContactsModule } from "./core/users/contacts/contacts.module";
// Film Domain
import { ScenesModule } from "./content/scenes/scenes.module";
import { FilmsModule } from "./content/films/films.module";
// Projects Domain
import { TimelineModule } from "./projects/timeline/timeline.module";
// Business Domain
import { AuditModule } from "./business/audit/audit.module";
import { BrandsModule } from "./business/brands/brands.module";
import { TaskLibraryModule } from "./business/task-library/task-library.module";
// Equipment Domain
import { EquipmentModule } from "./equipment/equipment.module";
// Calendar Domain
import { CalendarModule } from "./calendar/calendar.module";
// Projects Management
import { ProjectsModule } from "./projects/projects.module";
// Lead Management
import { InquiriesModule } from "./inquiries/inquiries.module";
import { ClientsModule } from "./clients/clients.module";
import { ProposalsModule } from "./proposals/proposals.module";
import { ActivityLogsModule } from "./activity-logs/activity-logs.module";
// Shared Services
import { PrismaModule } from "./prisma/prisma.module";
import { ContractsModule } from './contracts/contracts.module';
import { InvoicesModule } from './invoices/invoices.module';
import { EstimatesModule } from './estimates/estimates.module';
import { QuotesModule } from './quotes/quotes.module';
import { JobRolesModule } from './job-roles/job-roles.module';
import { CoverageModule } from './coverage/coverage.module';
import { MomentsModule } from './moments/moments.module';
import { MusicModule } from './music/music.module';
import { SubjectsModule } from './content/subjects/subjects.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    ContributorsModule,
    AuthModule,
    RolesModule,
    ContactsModule,
    FilmsModule,
    ScenesModule,
    AuditModule,
    BrandsModule,
    TaskLibraryModule,
    EquipmentModule,
    CalendarModule,
    TimelineModule,
    ProjectsModule,
    InquiriesModule,
    ClientsModule,
    ProposalsModule,
    ActivityLogsModule,
    ContractsModule,
    InvoicesModule,
    EstimatesModule,
    QuotesModule,
    JobRolesModule,
    CoverageModule,
    MomentsModule,
    MusicModule,
    SubjectsModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
