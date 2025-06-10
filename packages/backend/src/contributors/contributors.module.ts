import { Module } from "@nestjs/common";
import { ContributorsService } from "./contributors.service";
import { ContributorsController } from "./contributors.controller";
import { PrismaService } from "src/prisma.service"; // Your new import

@Module({
  controllers: [ContributorsController],
  providers: [ContributorsService, PrismaService], // Your change is here
})
export class ContributorsModule {}
