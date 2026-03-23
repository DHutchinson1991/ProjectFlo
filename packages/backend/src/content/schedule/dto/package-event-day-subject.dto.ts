import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';

enum SubjectCategory {
  PEOPLE = 'PEOPLE',
  OBJECTS = 'OBJECTS',
  LOCATIONS = 'LOCATIONS',
}

export class CreatePackageDaySubjectDto {
  @IsInt()
  event_day_template_id!: number;

  @IsOptional()
  @IsInt()
  role_template_id?: number;

  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(SubjectCategory)
  category?: SubjectCategory;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  count?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class UpdatePackageDaySubjectDto {
  @IsOptional()
  @IsInt()
  event_day_template_id?: number;

  @IsOptional()
  @IsInt()
  role_template_id?: number | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SubjectCategory)
  category?: SubjectCategory;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  count?: number | null;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
