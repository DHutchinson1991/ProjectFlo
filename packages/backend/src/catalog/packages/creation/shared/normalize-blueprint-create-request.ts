import { BadRequestException } from '@nestjs/common';
import type { BlueprintDayMappingDto } from '../dto/blueprint-day-mapping.dto';

export interface BlueprintSeedInfo {
  dayCount: number;
  dayIds: number[];
}

export interface BlueprintCreateRequestFields {
  sourceDayBlueprintVersionId?: number;
  selectedDayBlueprintActivityIds?: number[];
  blueprintDayMappings?: BlueprintDayMappingDto[];
}

export function validateBlueprintDayMappings(
  templateDayLinkIds: number[],
  blueprintSeed: BlueprintSeedInfo | null,
  mappings: BlueprintDayMappingDto[],
): void {
  if (!blueprintSeed) {
    throw new BadRequestException('blueprintDayMappings requires sourceDayBlueprintVersionId');
  }
  if (mappings.length === 0) {
    throw new BadRequestException('blueprintDayMappings must not be empty when provided');
  }

  const blueprintDayIds = mappings.map((m) => m.blueprintDayId);
  const linkIds = mappings.map((m) => m.eventTypeDayLinkId);
  if (blueprintDayIds.length !== blueprintSeed.dayIds.length) {
    throw new BadRequestException(
      `blueprintDayMappings must include all ${blueprintSeed.dayIds.length} blueprint day(s) on the selected version`,
    );
  }
  if (new Set(blueprintDayIds).size !== blueprintDayIds.length) {
    throw new BadRequestException('Each blueprint day may only appear once in blueprintDayMappings');
  }
  if (new Set(linkIds).size !== linkIds.length) {
    throw new BadRequestException('Each template day may only appear once in blueprintDayMappings');
  }

  const versionDayIds = new Set(blueprintSeed.dayIds);
  for (const bpDayId of blueprintDayIds) {
    if (!versionDayIds.has(bpDayId)) {
      throw new BadRequestException(
        `Blueprint day id ${bpDayId} is not on the selected blueprint version`,
      );
    }
  }

  const templateLinkIds = new Set(templateDayLinkIds);
  for (const linkId of linkIds) {
    if (!templateLinkIds.has(linkId)) {
      throw new BadRequestException(`Template day link ${linkId} is not on the selected template`);
    }
  }
}

export function blueprintConsumeParamsFromDto(dto: BlueprintCreateRequestFields): {
  blueprintVersionId: number;
  selectedActivityIds?: number[];
  blueprintDayMappings?: BlueprintDayMappingDto[];
} | null {
  if (!dto.sourceDayBlueprintVersionId) {
    return null;
  }
  return {
    blueprintVersionId: dto.sourceDayBlueprintVersionId,
    selectedActivityIds: dto.selectedDayBlueprintActivityIds,
    blueprintDayMappings: dto.blueprintDayMappings,
  };
}
