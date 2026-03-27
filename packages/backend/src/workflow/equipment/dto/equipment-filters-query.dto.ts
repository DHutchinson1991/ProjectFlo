import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  EquipmentAvailability,
  EquipmentCategory,
  EquipmentCondition,
  EquipmentType,
} from '@prisma/client';

export class EquipmentFiltersQueryDto {
  @IsOptional()
  @IsEnum(EquipmentCategory)
  category?: EquipmentCategory;

  @IsOptional()
  @IsEnum(EquipmentType)
  type?: EquipmentType;

  @IsOptional()
  @IsEnum(EquipmentAvailability)
  availability?: EquipmentAvailability;

  @IsOptional()
  @IsEnum(EquipmentCondition)
  condition?: EquipmentCondition;

  @IsOptional()
  @IsString()
  search?: string;
}
