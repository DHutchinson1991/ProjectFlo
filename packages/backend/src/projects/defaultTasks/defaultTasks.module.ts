import { Module } from "@nestjs/common";
import { DefaultTasksController } from "./defaultTasks.controller";
import { DefaultTasksService } from "./defaultTasks.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DefaultTasksController],
  providers: [DefaultTasksService],
  exports: [DefaultTasksService],
})
export class DefaultTasksModule {}
