import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ContributorsModule } from "./contributors/contributors.module";
import { AuthModule } from "./auth/auth.module";
import { RolesModule } from './roles/roles.module';
import { ContactsModule } from './contacts/contacts.module';
import { PrismaService } from "./prisma.service";

@Module({
  imports: [
    ContributorsModule,
    AuthModule,
    RolesModule,
    ContactsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
