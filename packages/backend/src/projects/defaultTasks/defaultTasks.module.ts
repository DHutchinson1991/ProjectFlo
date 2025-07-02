import { Module } from "@nestjs/common";
import { DefaultTasksController } from "./defaultTasks.controller";
import { DefaultTasksService } from "./defaultTasks.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { TaskTemplatesModule } from "../taskTemplates/taskTemplates.module";

@Module({
  imports: [PrismaModule, TaskTemplatesModule],
  controllers: [DefaultTasksController],
  providers: [DefaultTasksService],
  exports: [DefaultTasksService],
})
export class DefaultTasksModule { }
