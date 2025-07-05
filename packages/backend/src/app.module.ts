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
import { DefaultTasksModule } from "./projects/defaultTasks/defaultTasks.module";
// Business Domain
import { AuditModule } from "./business/audit/audit.module";
// Shared Services
import { PrismaModule } from "./prisma/prisma.module";

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
    TimelineModule,
    DefaultTasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
