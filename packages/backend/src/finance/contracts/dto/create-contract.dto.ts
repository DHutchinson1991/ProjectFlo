import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

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
    content?: Record<string, unknown>;

    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus = ContractStatus.DRAFT;

    @IsOptional()
    project_id?: number;
}
