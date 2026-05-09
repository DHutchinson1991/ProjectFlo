import { IsString, IsBoolean } from 'class-validator';

export class CustomMomentDto {
  @IsString()
  name!: string;

  @IsBoolean()
  isKeyMoment!: boolean;
}
