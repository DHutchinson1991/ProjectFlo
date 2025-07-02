import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateBuildDeliverableDto {
  @IsNumber()
  @IsNotEmpty()
  buildId: number;

  @IsNumber()
  @IsNotEmpty()
  deliverableId: number;
}
