import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ComposeContractDto {
    @IsNumber()
    template_id!: number;

    @IsOptional()
    @IsString()
    title?: string;
}