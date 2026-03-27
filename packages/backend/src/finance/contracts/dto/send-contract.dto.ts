import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { SignerDto } from './signer.dto';

export class SendContractDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SignerDto)
    signers!: SignerDto[];
}