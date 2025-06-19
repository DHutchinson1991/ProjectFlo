import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';

export class ComponentPricingDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  componentIds: number[];
}
