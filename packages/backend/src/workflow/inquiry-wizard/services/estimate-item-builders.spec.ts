import {
  buildEquipmentItems,
  buildItemsFromCrewSlots,
  type CrewSlotRecord,
} from './estimate-item-builders';

function crewSlot(overrides: Partial<CrewSlotRecord> & { crew_id?: number; job_role_id?: number }): CrewSlotRecord {
  return {
    crew_id: overrides.crew_id ?? 1,
    job_role_id: overrides.job_role_id ?? 10,
    hours: overrides.hours ?? 8,
    crew: overrides.crew ?? {
      contact: { first_name: 'Alex', last_name: 'Rivera' },
      job_role_assignments: [
        {
          job_role_id: overrides.job_role_id ?? 10,
          is_primary: true,
          payment_bracket: { hourly_rate: 75, day_rate: 0 },
        },
      ],
    },
    job_role: overrides.job_role ?? {
      name: 'lead_videographer',
      display_name: 'Lead Videographer',
      category: 'creative',
    },
    equipment: overrides.equipment,
  };
}

describe('buildEquipmentItems', () => {
  it('deduplicates equipment shared across multiple crew slots', () => {
    const sharedEquipment = {
      equipment_id: 42,
      equipment: {
        id: 42,
        item_name: 'C300',
        model: 'Mark III',
        rental_price_per_day: 150.5,
      },
    };

    const items = buildEquipmentItems([
      crewSlot({ equipment: [sharedEquipment] }),
      crewSlot({ crew_id: 2, equipment: [sharedEquipment] }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      description: 'C300 Mark III',
      category: 'Equipment',
      quantity: 1,
      unit: 'Day',
      unit_price: 150.5,
    });
  });

  it('falls back to equipment id when name fields are missing', () => {
    const items = buildEquipmentItems([
      crewSlot({
        equipment: [{ equipment_id: 7, equipment: { id: 7, rental_price_per_day: 25 } }],
      }),
    ]);

    expect(items[0].description).toBe('Equipment #7');
    expect(items[0].unit_price).toBe(25);
  });
});

describe('buildItemsFromCrewSlots', () => {
  it('buckets crew into planning, coverage, and post-production categories', () => {
    const items = buildItemsFromCrewSlots([
      crewSlot({
        crew_id: 1,
        job_role_id: 10,
        hours: 4,
        job_role: { name: 'producer', display_name: 'Producer', category: 'production' },
        crew: {
          contact: { first_name: 'Sam', last_name: 'Lee' },
          job_role_assignments: [{ job_role_id: 10, payment_bracket: { hourly_rate: 60, day_rate: 0 } }],
        },
      }),
      crewSlot({
        crew_id: 2,
        job_role_id: 20,
        hours: 10,
        job_role: { name: 'videographer', display_name: 'Videographer', category: 'coverage' },
        crew: {
          contact: { first_name: 'Jamie', last_name: 'Fox' },
          job_role_assignments: [{ job_role_id: 20, payment_bracket: { hourly_rate: 80, day_rate: 0 } }],
        },
      }),
      crewSlot({
        crew_id: 3,
        job_role_id: 30,
        hours: 6,
        job_role: { name: 'editor', display_name: 'Editor', category: 'post-production' },
        crew: {
          contact: { first_name: 'Riley', last_name: 'Ng' },
          job_role_assignments: [{ job_role_id: 30, payment_bracket: { hourly_rate: 55, day_rate: 0 } }],
        },
      }),
    ]);

    expect(items.map((item) => item.category)).toEqual(['Planning', 'Coverage', 'Post-Production']);
    expect(items.find((item) => item.category === 'Planning')).toMatchObject({
      description: 'Sam Lee - Producer',
      quantity: 4,
      unit: 'Hours',
      unit_price: 60,
    });
    expect(items.find((item) => item.category === 'Coverage')).toMatchObject({
      description: 'Jamie Fox - Videographer',
      quantity: 10,
      unit_price: 80,
    });
  });

  it('accumulates hours for the same crew member and role across slots', () => {
    const base = crewSlot({
      crew_id: 5,
      job_role_id: 50,
      hours: 3,
      job_role: { name: 'videographer', display_name: 'Videographer', category: 'coverage' },
      crew: {
        contact: { first_name: 'Casey', last_name: 'Morgan' },
        job_role_assignments: [{ job_role_id: 50, payment_bracket: { hourly_rate: 90, day_rate: 0 } }],
      },
    });

    const items = buildItemsFromCrewSlots([
      base,
      { ...base, hours: 5 },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      category: 'Coverage',
      quantity: 8,
      unit: 'Hours',
      unit_price: 90,
    });
  });

  it('uses day rate billing when the payment bracket is day-rate only', () => {
    const items = buildItemsFromCrewSlots([
      crewSlot({
        crew_id: 8,
        job_role_id: 80,
        hours: 12,
        job_role: { name: 'drone_op', display_name: 'Drone Operator', category: 'coverage' },
        crew: {
          contact: { first_name: 'Taylor', last_name: 'Reed' },
          job_role_assignments: [{ job_role_id: 80, payment_bracket: { hourly_rate: 0, day_rate: 450 } }],
        },
      }),
    ]);

    expect(items[0]).toMatchObject({
      quantity: 1,
      unit: 'Days',
      unit_price: 450,
    });
  });

  it('skips slots without crew or job role identifiers', () => {
    const items = buildItemsFromCrewSlots([
      { hours: 8, job_role: { name: 'ghost', category: 'coverage' } },
    ]);

    expect(items).toEqual([]);
  });
});
