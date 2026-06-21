import { IsInt } from 'class-validator';

/** Pairs a DayBlueprintDay with a PackageTemplateDay (wizard "Match days"). */
export class BlueprintDayMappingDto {
  @IsInt()
  blueprintDayId!: number;

  /** PackageTemplateDay.id from the selected package template. */
  @IsInt()
  eventTypeDayLinkId!: number;
}
