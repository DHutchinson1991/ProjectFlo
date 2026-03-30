import { Module } from "@nestjs/common";
import { UserAccountsService } from "./user-accounts.service";
import { UserAccountsController } from "./user-accounts.controller";
import { PrismaModule } from "../../../platform/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [UserAccountsController],
  providers: [UserAccountsService],
  exports: [UserAccountsService],
})
export class UserAccountsModule { }
