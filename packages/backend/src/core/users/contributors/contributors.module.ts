import { Module } from "@nestjs/common";
import { ContributorsService } from "./contributors.service";
import { ContributorsController } from "./contributors.controller";
import { PrismaModule } from "../../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ContributorsController],
  providers: [ContributorsService],
})
export class ContributorsModule { }
