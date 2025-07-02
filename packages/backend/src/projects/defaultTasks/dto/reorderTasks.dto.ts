import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class TaskOrder {
  id: number;
  orderIndex: number;
}

export class ReorderTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskOrder)
  taskOrders: TaskOrder[];
}
