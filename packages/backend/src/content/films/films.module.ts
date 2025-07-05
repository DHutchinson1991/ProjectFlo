import { Module } from "@nestjs/common";
import { FilmsService } from "./films.service";
import { FilmsController } from "./films.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [FilmsController],
  providers: [FilmsService],
  exports: [FilmsService],
})
export class FilmsModule {}
