import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ContributorsModule } from "./contributors/contributors.module";
import { AuthModule } from "./auth/auth.module";
import { RolesModule } from "./roles/roles.module";
import { ContactsModule } from "./contacts/contacts.module";
import { CoverageScenesModule } from "./coverage-scenes/coverage-scenes.module";
import { DeliverablesModule } from "./deliverables/deliverables.module";
import { EditingStylesModule } from "./editing-styles/editing-styles.module";
import { ComponentsModule } from "./components/components.module";
import { MusicModule } from "./music/music.module";
import { PricingModule } from "./pricing/pricing.module";
import { AuditModule } from "./audit/audit.module";
import { CategoriesModule } from "./categories/categories.module";
import { TimelineModule } from "./timeline/timeline.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { TaskTemplatesModule } from "./task-templates/task-templates.module";
import { TasksModule } from "./tasks/tasks.module";
import { WorkflowsModule } from "./workflows/workflows.module";
import { EntityDefaultTaskModule } from "./entity-default-tasks/entity-default-task.module";
import { PrismaService } from "./prisma.service";

@Module({
  imports: [
    ContributorsModule,
    AuthModule,
    RolesModule,
    ContactsModule,
    CoverageScenesModule,
    DeliverablesModule,
    EditingStylesModule,
    ComponentsModule,
    MusicModule,
    PricingModule,
    AuditModule,
    CategoriesModule,
    TimelineModule,
    AnalyticsModule,
    TaskTemplatesModule,
    TasksModule,
    WorkflowsModule,
    EntityDefaultTaskModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
