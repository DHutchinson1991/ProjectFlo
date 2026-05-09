import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDayBlueprintVersionDto {
  @IsOptional() @IsString() @MaxLength(500) change_summary?: string;
  @IsOptional() @IsInt() source_ai_run_id?: number;
}

export class PublishDayBlueprintVersionDto {
  @IsOptional() @IsString() @MaxLength(500) change_summary?: string;
}
