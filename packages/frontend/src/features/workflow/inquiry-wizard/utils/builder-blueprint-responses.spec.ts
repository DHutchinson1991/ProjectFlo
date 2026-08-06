import {
    canAdvanceBuilderStep1,
    initBlueprintDayMappings,
    readBlueprintDayMappingsRecord,
    readBlueprintId,
    readBlueprintVersionId,
    readSelectedBlueprintActivityIds,
    writeBlueprintDayMappings,
} from './builder-blueprint-responses';

describe('builder blueprint response helpers', () => {
    it('reads blueprint ids from snake_case and camelCase keys', () => {
        expect(readBlueprintId({ source_day_blueprint_id: 10 })).toBe(10);
        expect(readBlueprintId({ sourceDayBlueprintId: 11 })).toBe(11);
        expect(readBlueprintId({ source_day_blueprint_id: 0 })).toBeNull();
    });

    it('reads blueprint version ids and rejects invalid values', () => {
        expect(readBlueprintVersionId({ source_day_blueprint_version_id: 20 })).toBe(20);
        expect(readBlueprintVersionId({ sourceDayBlueprintVersionId: 21 })).toBe(21);
        expect(readBlueprintVersionId({ source_day_blueprint_version_id: -1 })).toBeNull();
    });

    it('filters non-numeric activity ids', () => {
        expect(
            readSelectedBlueprintActivityIds({
                selected_day_blueprint_activity_ids: [1, 'x', 2, null],
            }),
        ).toEqual([1, 2]);
    });

    it('parses blueprint day mappings from array or record form', () => {
        expect(
            readBlueprintDayMappingsRecord({
                blueprint_day_mappings: [
                    { blueprintDayId: 1, eventTypeDayLinkId: 100 },
                    { blueprintDayId: 2, eventTypeDayLinkId: 101 },
                ],
            }),
        ).toEqual({ 1: 100, 2: 101 });

        expect(readBlueprintDayMappingsRecord({ blueprint_day_mappings: { '3': '200', '4': 201 } })).toEqual({
            3: 200,
            4: 201,
        });
    });

    it('initializes day mappings by order_index', () => {
        expect(
            initBlueprintDayMappings(
                [
                    { id: 10, order_index: 1 },
                    { id: 11, order_index: 0 },
                ],
                [
                    { id: 100, order_index: 0 },
                    { id: 101, order_index: 1 },
                ],
            ),
        ).toEqual({ 11: 100, 10: 101 });
    });

    it('blocks builder step 1 when blueprint version is set but no activities selected', () => {
        expect(canAdvanceBuilderStep1({ source_day_blueprint_version_id: 5 })).toBe(false);
        expect(
            canAdvanceBuilderStep1({
                source_day_blueprint_version_id: 5,
                selected_day_blueprint_activity_ids: [1],
            }),
        ).toBe(true);
        expect(canAdvanceBuilderStep1({})).toBe(true);
    });

    it('writes blueprint day mappings as normalized array rows', () => {
        const changes: Array<[string, unknown]> = [];
        writeBlueprintDayMappings((key, value) => changes.push([key, value]), { 1: 100, 2: 101 });

        expect(changes).toEqual([
            [
                'blueprint_day_mappings',
                [
                    { blueprintDayId: 1, eventTypeDayLinkId: 100 },
                    { blueprintDayId: 2, eventTypeDayLinkId: 101 },
                ],
            ],
        ]);
    });
});
