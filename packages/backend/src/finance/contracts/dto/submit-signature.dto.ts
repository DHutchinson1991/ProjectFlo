import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitSignatureDto {
    @IsString()
    signature_text!: string;
}