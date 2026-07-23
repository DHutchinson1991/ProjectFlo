import { BadRequestException } from '@nestjs/common';
import { validateBlueprintDayMappings } from './normalize-blueprint-create-request';

describe('validateBlueprintDayMappings', () => {
  const seed = { dayCount: 2, dayIds: [10, 11] };
  const templateDayLinkIds = [100, 101];

  it('rejects mappings without blueprint seed', () => {
    expect(() =>
      validateBlueprintDayMappings(templateDayLinkIds, null, [
        { blueprintDayId: 10, eventTypeDayLinkId: 100 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects empty mappings array', () => {
    expect(() => validateBlueprintDayMappings(templateDayLinkIds, seed, [])).toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicate blueprint day ids', () => {
    expect(() =>
      validateBlueprintDayMappings(templateDayLinkIds, seed, [
        { blueprintDayId: 10, eventTypeDayLinkId: 100 },
        { blueprintDayId: 10, eventTypeDayLinkId: 101 },
      ]),
    ).toThrow(/blueprint day may only appear once/);
  });

  it('rejects partial mappings that omit blueprint days', () => {
    expect(() =>
      validateBlueprintDayMappings(templateDayLinkIds, seed, [
        { blueprintDayId: 10, eventTypeDayLinkId: 100 },
      ]),
    ).toThrow(/must include all 2 blueprint day/);
  });

  it('rejects blueprint day not on version', () => {
    expect(() =>
      validateBlueprintDayMappings(templateDayLinkIds, seed, [
        { blueprintDayId: 99, eventTypeDayLinkId: 100 },
        { blueprintDayId: 11, eventTypeDayLinkId: 101 },
      ]),
    ).toThrow(/not on the selected blueprint version/);
  });

  it('rejects template day link not on template', () => {
    expect(() =>
      validateBlueprintDayMappings(templateDayLinkIds, seed, [
        { blueprintDayId: 10, eventTypeDayLinkId: 999 },
        { blueprintDayId: 11, eventTypeDayLinkId: 101 },
      ]),
    ).toThrow(/not on the selected template/);
  });

  it('accepts valid mappings', () => {
    expect(() =>
      validateBlueprintDayMappings(templateDayLinkIds, seed, [
        { blueprintDayId: 10, eventTypeDayLinkId: 100 },
        { blueprintDayId: 11, eventTypeDayLinkId: 101 },
      ]),
    ).not.toThrow();
  });
});
