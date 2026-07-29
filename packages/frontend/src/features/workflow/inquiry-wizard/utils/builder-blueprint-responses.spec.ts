import {
    canAdvanceBuilderStep1,
    initBlueprintDayMappings,
    readBlueprintDayMappingsRecord,
    readBlueprintId,
    readBlueprintName,
    readBlueprintVersionId,
    readSelectedBlueprintActivityIds,
} from './builder-blueprint-responses';

describe('builder-blueprint-responses', () => {
    describe('readBlueprintVersionId', () => {
        it('reads snake_case and camelCase positive ids', () => {
            expect(readBlueprintVersionId({ source_day_blueprint_version_id: 12 })).toBe(12);
            expect(readBlueprintVersionId({ sourceDayBlueprintVersionId: 15 })).toBe(15);
        });

        it('returns null for missing or invalid ids', () => {
            expect(readBlueprintVersionId({})).toBeNull();
            expect(readBlueprintVersionId({ source_day_blueprint_version_id: 0 })).toBeNull();
            expect(readBlueprintVersionId({ source_day_blueprint_version_id: '12' })).toBeNull();
        });
    });

    describe('readBlueprintId and readBlueprintName', () => {
        it('reads blueprint id from either casing', () => {
            expect(readBlueprintId({ source_day_blueprint_id: 7 })).toBe(7);
            expect(readBlueprintId({ sourceDayBlueprintId: 9 })).toBe(9);
        });

        it('trims blueprint display name', () => {
            expect(readBlueprintName({ source_day_blueprint_name: '  Classic Day  ' })).toBe('Classic Day');
            expect(readBlueprintName({ source_day_blueprint_name: '   ' })).toBeUndefined();
        });
    });

    describe('readSelectedBlueprintActivityIds', () => {
        it('filters to numeric activity ids only', () => {
            expect(
                readSelectedBlueprintActivityIds({
                    selected_day_blueprint_activity_ids: [1, '2', 3, null],
                }),
            ).toEqual([1, 3]);
        });
    });

    describe('readBlueprintDayMappingsRecord', () => {
        it('parses array-of-pairs format', () => {
            expect(
                readBlueprintDayMappingsRecord({
                    blueprint_day_mappings: [
                        { blueprintDayId: 10, eventTypeDayLinkId: 100 },
                        { blueprintDayId: 11, eventTypeDayLinkId: 101 },
                    ],
                }),
            ).toEqual({ 10: 100, 11: 101 });
        });

        it('parses record format with numeric coercion', () => {
            expect(
                readBlueprintDayMappingsRecord({
                    blueprintDayMappings: { '10': '100', '11': '101' },
                }),
            ).toEqual({ 10: 100, 11: 101 });
        });

        it('returns empty object for invalid shapes', () => {
            expect(readBlueprintDayMappingsRecord({ blueprint_day_mappings: 'bad' })).toEqual({});
            expect(readBlueprintDayMappingsRecord({})).toEqual({});
        });
    });

    describe('initBlueprintDayMappings', () => {
        it('maps blueprint days to template days by order_index', () => {
            expect(
                initBlueprintDayMappings(
                    [
                        { id: 1, order_index: 2 },
                        { id: 2, order_index: 0 },
                    ],
                    [
                        { id: 100, order_index: 0 },
                        { id: 101, order_index: 1 },
                    ],
                ),
            ).toEqual({ 2: 100, 1: 101 });
        });
    });

    describe('canAdvanceBuilderStep1', () => {
        it('allows advance when blueprint mode is not selected', () => {
            expect(canAdvanceBuilderStep1({})).toBe(true);
        });

        it('blocks advance when blueprint version is set but no activities selected', () => {
            expect(
                canAdvanceBuilderStep1({
                    source_day_blueprint_version_id: 5,
                    selected_day_blueprint_activity_ids: [],
                }),
            ).toBe(false);
        });

        it('allows advance when blueprint version and activities are present', () => {
            expect(
                canAdvanceBuilderStep1({
                    source_day_blueprint_version_id: 5,
                    selected_day_blueprint_activity_ids: [1, 2],
                }),
            ).toBe(true);
        });
    });
});
