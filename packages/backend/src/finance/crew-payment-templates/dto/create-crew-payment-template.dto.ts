import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsIn, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCrewPaymentRuleDto } from './create-crew-payment-rule.dto';

export class CreateCrewPaymentTemplateDto {
  @IsOptional() @IsInt()
  brand_id!: number;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsIn(['on_site', 'off_site'])
  role_type!: 'on_site' | 'off_site';

  @IsOptional() @IsIn(['DUE_ON_RECEIPT', 'NET_7', 'NET_14', 'NET_30', 'NET_60'])
  payment_terms?: 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_14' | 'NET_30' | 'NET_60';

  @IsOptional() @IsBoolean()
  is_default?: boolean;

  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCrewPaymentRuleDto)
  rules!: CreateCrewPaymentRuleDto[];
}