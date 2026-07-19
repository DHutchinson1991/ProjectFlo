import {
    canAdvanceBuilderStep1,
    initBlueprintDayMappings,
    readBlueprintDayMappingsRecord,
    readBlueprintVersionId,
    readSelectedBlueprintActivityIds,
} from './builder-blueprint-responses';

describe('builder-blueprint-responses', () => {
    describe('readBlueprintVersionId', () => {
        it('accepts snake_case and camelCase keys', () => {
            expect(readBlueprintVersionId({ source_day_blueprint_version_id: 5 })).toBe(5);
            expect(readBlueprintVersionId({ sourceDayBlueprintVersionId: 6 })).toBe(6);
            expect(readBlueprintVersionId({ source_day_blueprint_version_id: 0 })).toBeNull();
        });
    });

    describe('readBlueprintDayMappingsRecord', () => {
        it('normalizes array mapping rows', () => {
            expect(
                readBlueprintDayMappingsRecord({
                    blueprint_day_mappings: [
                        { blueprintDayId: 10, eventTypeDayLinkId: 100 },
                        { blueprintDayId: 11, eventTypeDayLinkId: 101 },
                    ],
                }),
            ).toEqual({ 10: 100, 11: 101 });
        });

        it('normalizes object record keys to numbers', () => {
            expect(
                readBlueprintDayMappingsRecord({
                    blueprintDayMappings: { '10': '100', '11': '101' },
                }),
            ).toEqual({ 10: 100, 11: 101 });
        });
    });

    describe('initBlueprintDayMappings', () => {
        it('pairs blueprint and template days by order_index', () => {
            expect(
                initBlueprintDayMappings(
                    [
                        { id: 20, order_index: 1 },
                        { id: 10, order_index: 0 },
                    ],
                    [
                        { id: 200, order_index: 1 },
                        { id: 100, order_index: 0 },
                    ],
                ),
            ).toEqual({ 10: 100, 20: 200 });
        });
    });

    describe('canAdvanceBuilderStep1', () => {
        it('requires selected activities when a blueprint version is chosen', () => {
            expect(
                canAdvanceBuilderStep1({ source_day_blueprint_version_id: 5 }),
            ).toBe(false);
            expect(
                canAdvanceBuilderStep1({
                    source_day_blueprint_version_id: 5,
                    selected_day_blueprint_activity_ids: [1, 2],
                }),
            ).toBe(true);
        });

        it('allows advance when builder is not in blueprint mode', () => {
            expect(canAdvanceBuilderStep1({})).toBe(true);
        });
    });

    describe('readSelectedBlueprintActivityIds', () => {
        it('filters non-numeric entries', () => {
            expect(
                readSelectedBlueprintActivityIds({
                    selected_day_blueprint_activity_ids: [1, 'x', 2, null],
                }),
            ).toEqual([1, 2]);
        });
    });
});
