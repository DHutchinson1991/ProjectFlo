import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
// Core Domain
import { AuthModule } from "./core/auth/auth.module";
import { ContributorsModule } from "./core/users/contributors/contributors.module";
import { RolesModule } from "./core/users/roles/roles.module";
import { ContactsModule } from "./core/users/contacts/contacts.module";
// Content Domain
import { ComponentsModule } from "./content/components/components.module";
import { CoverageScenesModule } from "./content/coverage-scenes/coverage-scenes.module";
import { CategoriesModule } from "./content/categories/categories.module";
import { ContentServiceModule } from "./content/content-management/content.module";
// Projects Domain
import { WorkflowsModule } from "./projects/workflows/workflows.module";
import { TaskTemplatesModule } from "./projects/taskTemplates/taskTemplates.module";
import { TimelineModule } from "./projects/timeline/timeline.module";
import { DefaultTasksModule } from "./projects/defaultTasks/defaultTasks.module";
// Business Domain
import { PricingModule } from "./business/pricing/pricing.module";
import { AuditModule } from "./business/audit/audit.module";
// Shared Services
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    ContributorsModule,
    AuthModule,
    RolesModule,
    ContactsModule,
    CoverageScenesModule,
    ContentServiceModule,
    ComponentsModule,
    PricingModule,
    AuditModule,
    CategoriesModule,
    TimelineModule,
    TaskTemplatesModule,
    WorkflowsModule,
    DefaultTasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
