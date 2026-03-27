import { IsNumber } from 'class-validator';

export class AssignPackageToSlotDto {
  @IsNumber()
  service_package_id: number;
}