import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum ContractStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    SIGNED = 'Signed',
}

export class CreateContractDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsObject()
    content?: Record<string, unknown>; // JSON content for Editor.js

    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus = ContractStatus.DRAFT;

    @IsOptional()
    project_id?: number;
}

export class SignerDto {
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsOptional()
    @IsString()
    role?: string;
}

export class SendContractDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SignerDto)
    signers!: SignerDto[];
}

export class ComposeContractDto {
    @IsNumber()
    template_id!: number;

    @IsOptional()
    @IsString()
    title?: string;
}

export class SubmitSignatureDto {
    @IsString()
    signature_text!: string;
}
