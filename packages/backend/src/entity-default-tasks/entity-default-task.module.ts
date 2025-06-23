import { Module } from "@nestjs/common";
import { EntityDefaultTaskController } from "./entity-default-task.controller";
import { TaskTemplateController } from "../task-templates/task-template.controller";
import { EntityDefaultTaskService } from "./entity-default-task.service";
import { PrismaService } from "../prisma.service";

@Module({
  controllers: [EntityDefaultTaskController, TaskTemplateController],
  providers: [EntityDefaultTaskService, PrismaService],
  exports: [EntityDefaultTaskService],
})
export class EntityDefaultTaskModule {}
