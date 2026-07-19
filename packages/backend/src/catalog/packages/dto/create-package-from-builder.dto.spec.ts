import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePackageFromBuilderDto } from './create-package-from-builder.dto';

function toDto(payload: Record<string, unknown>) {
  return plainToInstance(CreatePackageFromBuilderDto, payload);
}

describe('CreatePackageFromBuilderDto', () => {
  const base = {
    packageTemplateId: 1,
    crewCount: 1,
    filmPreferences: [{ type: 'FEATURE' }],
  };

  it('requires at least one preset when no blueprint is selected', async () => {
    const dto = toDto({ ...base, selectedActivityPresetIds: [] });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'selectedActivityPresetIds')).toBe(true);
  });

  it('allows empty preset list when a blueprint version is selected', async () => {
    const dto = toDto({
      ...base,
      selectedActivityPresetIds: [],
      sourceDayBlueprintVersionId: 42,
      selectedDayBlueprintActivityIds: [7],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
