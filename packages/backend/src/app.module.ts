import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RequestLoggerMiddleware } from "./common/logging/request-logger.middleware";
// Core Domain
import { AuthModule } from "./core/auth/auth.module";
import { ContributorsModule } from "./core/users/contributors/contributors.module";
import { RolesModule } from "./core/users/roles/roles.module";
import { ContactsModule } from "./core/users/contacts/contacts.module";
// Film Domain
import { ScenesModule } from "./content/scenes/scenes.module";
import { CoverageModule } from "./content/coverage/coverage.module";
import { FilmsModule } from "./content/films/films.module";
// Business Domain
import { AuditModule } from "./business/audit/audit.module";
import { BrandsModule } from "./business/brands/brands.module";
import { TaskLibraryModule } from "./business/task-library/task-library.module";
import { SkillRoleMappingsModule } from "./business/skill-role-mappings/skill-role-mappings.module";
// Equipment Domain
import { EquipmentModule } from "./equipment/equipment.module";
// Operators Domain
import { OperatorsModule } from "./operators/operators.module";
// Crew Domain
import { CrewModule } from "./crew/crew.module";
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
import { PaymentBracketsModule } from './payment-brackets/payment-brackets.module';
import { MomentsModule } from './content/moments/moments.module';
import { BeatsModule } from './content/beats/beats.module';
import { MusicModule } from './content/music/music.module';
import { SubjectsModule } from './content/subjects/subjects.module';
import { FilmLocationsModule } from './content/film-locations/film-locations.module';
import { LocationsModule } from './locations/locations.module';
import { ServicePackagesModule } from './business/service-packages/service-packages.module';
import { ServicePackageCategoriesModule } from './business/service-package-categories/service-package-categories.module';
import { PackageSetsModule } from './business/package-sets/package-sets.module';
import { WeddingTypesModule } from './business/wedding-types/wedding-types.module';
import { EventTypesModule } from './business/event-types/event-types.module';
import { WorkflowsModule } from './business/workflows/workflows.module';
import { NeedsAssessmentsModule } from './needs-assessments/needs-assessments.module';
import { ScheduleModule } from './content/schedule/schedule.module';

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
    CoverageModule,
    AuditModule,
    BrandsModule,
    TaskLibraryModule,
    SkillRoleMappingsModule,
    EquipmentModule,
    OperatorsModule,
    CrewModule,
    CalendarModule,
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
    PaymentBracketsModule,
    MomentsModule,
    BeatsModule,
    MusicModule,
    SubjectsModule,
    FilmLocationsModule,
    LocationsModule,
    ServicePackagesModule,
    ServicePackageCategoriesModule,
    PackageSetsModule,
    WeddingTypesModule,
    EventTypesModule,
    WorkflowsModule,
    NeedsAssessmentsModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
