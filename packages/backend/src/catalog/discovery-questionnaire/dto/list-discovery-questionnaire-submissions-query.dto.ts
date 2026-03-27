import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ListDiscoveryQuestionnaireSubmissionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  inquiryId?: number;
}