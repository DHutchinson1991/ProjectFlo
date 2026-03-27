import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class PaymentBracketsByJobRoleQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  include_inactive?: boolean;
}