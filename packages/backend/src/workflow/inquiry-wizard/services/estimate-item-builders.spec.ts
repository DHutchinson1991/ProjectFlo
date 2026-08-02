import {
  buildEquipmentItems,
  buildItemsFromCrewSlots,
  type CrewSlotRecord,
} from './estimate-item-builders';

function makeCrewSlot(overrides: Partial<CrewSlotRecord> = {}): CrewSlotRecord {
  return {
    crew_id: 1,
    job_role_id: 10,
    hours: 8,
    job_role: {
      name: 'videographer',
      display_name: 'Lead Videographer',
      category: 'coverage',
    },
    crew: {
      contact: { first_name: 'Jane', last_name: 'Doe' },
      job_role_assignments: [
        {
          job_role_id: 10,
          is_primary: true,
          payment_bracket: {
            hourly_rate: 100,
            day_rate: 0,
            half_day_rate: 0,
            overtime_rate: 0,
          },
        },
      ],
    },
    equipment: [],
    ...overrides,
  };
}

describe('buildEquipmentItems', () => {
  it('deduplicates equipment by id across crew slots', () => {
    const sharedEquipment = {
      equipment_id: 5,
      equipment: {
        id: 5,
        item_name: 'C300',
        model: 'Mk III',
        rental_price_per_day: 75.5,
      },
    };

    const items = buildEquipmentItems([
      makeCrewSlot({ equipment: [sharedEquipment] }),
      makeCrewSlot({ crew_id: 2, equipment: [sharedEquipment] }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      description: 'C300 Mk III',
      category: 'Equipment',
      quantity: 1,
      unit: 'Day',
      unit_price: 75.5,
    });
  });

  it('falls back to equipment id when name fields are missing', () => {
    const items = buildEquipmentItems([
      makeCrewSlot({
        equipment: [{ equipment_id: 99, equipment: { id: 99, rental_price_per_day: 40 } }],
      }),
    ]);

    expect(items[0].description).toBe('Equipment #99');
    expect(items[0].unit_price).toBe(40);
  });
});

describe('buildItemsFromCrewSlots', () => {
  it('buckets crew into planning, coverage, and post-production categories', () => {
    const items = buildItemsFromCrewSlots([
      makeCrewSlot({
        job_role_id: 11,
        job_role: { name: 'producer', display_name: 'Producer', category: 'production' },
        crew: {
          contact: { first_name: 'Alex', last_name: 'Lee' },
          job_role_assignments: [
            {
              job_role_id: 11,
              payment_bracket: { hourly_rate: 80, day_rate: 0 },
            },
          ],
        },
      }),
      makeCrewSlot(),
      makeCrewSlot({
        crew_id: 3,
        job_role_id: 12,
        job_role: { name: 'editor', display_name: 'Editor', category: 'post-production' },
        crew: {
          contact: { first_name: 'Sam', last_name: 'Ray' },
          job_role_assignments: [
            {
              job_role_id: 12,
              payment_bracket: { hourly_rate: 60, day_rate: 0 },
            },
          ],
        },
      }),
    ]);

    expect(items.map((i) => i.category)).toEqual(['Planning', 'Coverage', 'Post-Production']);
  });

  it('accumulates hours and days for the same crew member and role', () => {
    const slot = makeCrewSlot();
    const items = buildItemsFromCrewSlots([slot, { ...slot, hours: 4 }]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      description: 'Jane Doe - Lead Videographer',
      category: 'Coverage',
      quantity: 12,
      unit: 'Hours',
      unit_price: 100,
    });
  });

  it('uses day rate billing when bracket is day-rate only', () => {
    const items = buildItemsFromCrewSlots([
      makeCrewSlot({
        crew: {
          contact: { first_name: 'Jane', last_name: 'Doe' },
          job_role_assignments: [
            {
              job_role_id: 10,
              payment_bracket: { hourly_rate: 0, day_rate: 650 },
            },
          ],
        },
      }),
      makeCrewSlot({
        crew: {
          contact: { first_name: 'Jane', last_name: 'Doe' },
          job_role_assignments: [
            {
              job_role_id: 10,
              payment_bracket: { hourly_rate: 0, day_rate: 650 },
            },
          ],
        },
      }),
    ]);

    expect(items[0]).toMatchObject({
      quantity: 2,
      unit: 'Days',
      unit_price: 650,
    });
  });

  it('skips slots without crew or role identifiers', () => {
    const items = buildItemsFromCrewSlots([
      makeCrewSlot({ crew_id: null, job_role_id: null }),
    ]);

    expect(items).toHaveLength(0);
  });
});
