import {
    buildEquipmentItems,
    buildItemsFromCrewSlots,
    type CrewSlotRecord,
} from './estimate-item-builders';

describe('estimate-item-builders', () => {
    describe('buildEquipmentItems', () => {
        it('deduplicates equipment across crew slots and rounds prices', () => {
            const slots: CrewSlotRecord[] = [
                {
                    equipment: [
                        {
                            equipment_id: 1,
                            equipment: { item_name: 'Camera', model: 'A7S', rental_price_per_day: 99.996 },
                        },
                    ],
                },
                {
                    equipment: [
                        {
                            equipment_id: 1,
                            equipment: { item_name: 'Camera', model: 'A7S', rental_price_per_day: 99.996 },
                        },
                        {
                            equipment_id: 2,
                            equipment: { item_name: 'Lens', rental_price_per_day: 45 },
                        },
                    ],
                },
            ];

            const items = buildEquipmentItems(slots);

            expect(items).toHaveLength(2);
            expect(items[0]).toMatchObject({
                description: 'Camera A7S',
                category: 'Equipment',
                quantity: 1,
                unit: 'Day',
                unit_price: 100,
            });
            expect(items[1].description).toBe('Lens');
        });
    });

    describe('buildItemsFromCrewSlots', () => {
        it('buckets crew into planning, coverage, and post-production categories', () => {
            const slots: CrewSlotRecord[] = [
                {
                    crew_id: 1,
                    job_role_id: 10,
                    hours: 2,
                    crew: { contact: { first_name: 'Sam', last_name: 'Planner' } },
                    job_role: { display_name: 'Producer', category: 'production' },
                },
                {
                    crew_id: 2,
                    job_role_id: 20,
                    hours: 8,
                    crew: { contact: { first_name: 'Jamie', last_name: 'Cam' } },
                    job_role: { display_name: 'Videographer', category: 'coverage' },
                },
                {
                    crew_id: 3,
                    job_role_id: 30,
                    hours: 4,
                    crew: { contact: { first_name: 'Riley', last_name: 'Edit' } },
                    job_role: { display_name: 'Editor', category: 'post-production' },
                },
            ];

            const items = buildItemsFromCrewSlots(slots);
            const categories = items.map((i) => i.category);

            expect(categories).toContain('Planning');
            expect(categories).toContain('Coverage');
            expect(categories).toContain('Post-Production');
            expect(items.find((i) => i.category === 'Planning')?.description).toContain('Sam Planner');
        });

        it('accumulates hours for the same crew and role key', () => {
            const slots: CrewSlotRecord[] = [
                {
                    crew_id: 5,
                    job_role_id: 50,
                    hours: 3,
                    crew: { contact: { first_name: 'Casey', last_name: 'Lee' } },
                    job_role: { display_name: 'Videographer', category: 'coverage' },
                },
                {
                    crew_id: 5,
                    job_role_id: 50,
                    hours: 5,
                    crew: { contact: { first_name: 'Casey', last_name: 'Lee' } },
                    job_role: { display_name: 'Videographer', category: 'coverage' },
                },
            ];

            const items = buildItemsFromCrewSlots(slots);
            const coverage = items.find((i) => i.category === 'Coverage');

            expect(coverage?.quantity).toBe(8);
        });
    });
});
