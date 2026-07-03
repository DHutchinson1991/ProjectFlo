import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { InquiryWizardStage } from '@prisma/client';

export class ListIwSubmissionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  inquiryId?: number;

  @IsOptional()
  @IsEnum(InquiryWizardStage)
  stage?: InquiryWizardStage;
}