import { IsArray, IsNumber, ArrayMinSize } from "class-validator";

export class FilmPricingDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  filmIds: number[];
}
