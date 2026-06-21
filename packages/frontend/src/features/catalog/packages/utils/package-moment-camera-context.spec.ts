import {
  buildPackageMomentCameraCards,
  cameraNumberFromLabel,
  findLinkedSceneMoment,
} from './package-moment-camera-context';

describe('cameraNumberFromLabel', () => {
  it('parses camera numbers from common labels', () => {
    expect(cameraNumberFromLabel('Camera 1')).toBe(1);
    expect(cameraNumberFromLabel('cam 2')).toBe(2);
    expect(cameraNumberFromLabel('Other')).toBeNull();
  });
});

describe('buildPackageMomentCameraCards', () => {
  const spaceSlot = {
    id: 1,
    label: 'Ceremony',
    package_id: 1,
    event_day_template_id: 1,
    camera_positions: [
      {
        id: 10,
        package_space_slot_id: 1,
        crew_slot_id: null,
        label: 'Camera 1',
        x: 0,
        y: 0,
        rotation: 0,
        focal_length_mm: null,
        fov_angle: 60,
        is_unmanned: false,
        facing_target_type: 'NONE',
        facing_target_id: null,
        order_index: 0,
        created_at: '',
        updated_at: '',
        moment_overrides: [],
      },
    ],
    subject_positions: [
      {
        id: 20,
        package_space_slot_id: 1,
        day_subject_id: 101,
        label: 'Groom',
        x: 1,
        y: 1,
        rotation: 0,
        bound_object_id: null,
        bound_offset_x: 0,
        bound_offset_y: 0,
        facing_target_type: 'NONE',
        facing_target_id: null,
        order_index: 0,
        created_at: '',
        updated_at: '',
        day_subject: { id: 101, name: 'Groom' },
        moment_overrides: [
          {
            id: 30,
            moment_id: 55,
            x: 1,
            y: 1,
            rotation: 0,
          },
        ],
      },
    ],
  };

  it('merges blocking plan targets with spatial cameras', () => {
    const cards = buildPackageMomentCameraCards({
      packageMomentId: 55,
      cameraSubjectPlan: { 'Camera 1': ['Groom'] },
      spaceSlot: spaceSlot as never,
      packageSubjects: [{ id: 101, name: 'Groom' }],
    });

    expect(cards).toHaveLength(1);
    expect(cards[0].label).toBe('Cam 1');
    expect(cards[0].targets).toBe('Groom');
    expect(cards[0].source).toBe('blocking');
  });

  it('maps editorial shot type onto matching camera label', () => {
    const cards = buildPackageMomentCameraCards({
      packageMomentId: 55,
      cameraSubjectPlan: { 'Camera 1': ['Groom'] },
      spaceSlot: spaceSlot as never,
      packageSubjects: [{ id: 101, name: 'Groom' }],
      editorialAssignments: [
        {
          track_id: 1,
          track_name: 'Camera 1',
          track_type: 'video',
          subject_ids: [101],
          shot_type: 'CLOSE_UP',
          director_notes: { compositionNotes: 'Hold on ring handoff' },
        },
      ],
    });

    expect(cards[0].shotLabel).toBe('Close Up');
    expect(cards[0].editorialNotes).toBe('Hold on ring handoff');
    expect(cards[0].source).toBe('both');
  });

  it('returns empty list when no camera data exists', () => {
    expect(buildPackageMomentCameraCards({
      packageMomentId: null,
      cameraSubjectPlan: null,
      spaceSlot: null,
    })).toEqual([]);
  });
});

describe('findLinkedSceneMoment', () => {
  it('prefers package_activity_moment_id and falls back to name/order', () => {
    const moments = [
      { id: 1, name: 'Ring exchange', order_index: 2, package_activity_moment_id: 99 },
      { id: 2, name: 'Ring exchange', order_index: 2 },
    ];

    expect(findLinkedSceneMoment(moments, 99, 'Ring exchange', 2)?.id).toBe(1);
    expect(findLinkedSceneMoment(moments, 77, 'Ring exchange', 2)?.id).toBe(2);
    expect(findLinkedSceneMoment(undefined, 77, 'Ring exchange', 2)).toBeNull();
  });
});
