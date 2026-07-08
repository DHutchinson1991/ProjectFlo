import {
    buildEquipmentItems,
    buildItemsFromCrewSlots,
    type CrewSlotRecord,
} from './estimate-item-builders';

describe('estimate-item-builders', () => {
    describe('buildEquipmentItems', () => {
        it('deduplicates equipment across crew slots and uses rental day pricing', () => {
            const crewSlots: CrewSlotRecord[] = [
                {
                    equipment: [
                        {
                            equipment_id: 1,
                            equipment: {
                                item_name: 'Sony FX3',
                                model: 'Body',
                                rental_price_per_day: 150,
                            },
                        },
                    ],
                },
                {
                    equipment: [
                        {
                            equipment_id: 1,
                            equipment: {
                                item_name: 'Sony FX3',
                                model: 'Body',
                                rental_price_per_day: 150,
                            },
                        },
                        {
                            equipment_id: 2,
                            equipment: {
                                item_name: 'G Master',
                                model: '24-70',
                                rental_price_per_day: 75.5,
                            },
                        },
                    ],
                },
            ];

            const items = buildEquipmentItems(crewSlots);

            expect(items).toHaveLength(2);
            expect(items[0]).toEqual({
                description: 'Sony FX3 Body',
                category: 'Equipment',
                quantity: 1,
                unit: 'Day',
                unit_price: 150,
            });
            expect(items[1].unit_price).toBe(75.5);
        });
    });

    describe('buildItemsFromCrewSlots', () => {
        it('groups crew into planning, coverage, and post-production buckets', () => {
            const crewSlots: CrewSlotRecord[] = [
                {
                    crew_id: 1,
                    job_role_id: 10,
                    hours: 2,
                    crew: { contact: { first_name: 'Pat', last_name: 'Planner' } },
                    job_role: { name: 'producer', display_name: 'Producer', category: 'production' },
                },
                {
                    crew_id: 2,
                    job_role_id: 20,
                    hours: 8,
                    crew: { contact: { first_name: 'Vid', last_name: 'Grapher' } },
                    job_role: { name: 'videographer', display_name: 'Videographer', category: 'coverage' },
                },
                {
                    crew_id: 3,
                    job_role_id: 30,
                    hours: 12,
                    crew: { contact: { first_name: 'Ed', last_name: 'Itor' } },
                    job_role: { name: 'editor', display_name: 'Editor', category: 'post-production' },
                },
            ];

            const items = buildItemsFromCrewSlots(crewSlots);

            expect(items.map((item) => item.category)).toEqual([
                'Planning',
                'Coverage',
                'Post-Production',
            ]);
            expect(items[0].description).toBe('Pat Planner - Producer');
            expect(items[1].description).toBe('Vid Grapher - Videographer');
            expect(items[2].description).toBe('Ed Itor - Editor');
        });

        it('accumulates hours and days for the same crew and role key', () => {
            const crewSlots: CrewSlotRecord[] = [
                {
                    crew_id: 2,
                    job_role_id: 20,
                    hours: 4,
                    crew: { contact: { first_name: 'Vid', last_name: 'Grapher' } },
                    job_role: { name: 'videographer', display_name: 'Videographer', category: 'coverage' },
                },
                {
                    crew_id: 2,
                    job_role_id: 20,
                    hours: 6,
                    crew: { contact: { first_name: 'Vid', last_name: 'Grapher' } },
                    job_role: { name: 'videographer', display_name: 'Videographer', category: 'coverage' },
                },
            ];

            const [item] = buildItemsFromCrewSlots(crewSlots);

            expect(item.quantity).toBe(10);
            expect(item.unit).toBe('Hours');
        });
    });
});
