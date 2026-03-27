import { Module } from "@nestjs/common";
import { ContributorsService } from "./contributors.service";
import { ContributorsController } from "./contributors.controller";
import { ContributorJobRolesService } from "./services/contributor-job-roles.service";
import { PrismaModule } from "../../../platform/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ContributorsController],
  providers: [ContributorsService, ContributorJobRolesService],
  exports: [ContributorsService],
})
export class ContributorsModule { }
