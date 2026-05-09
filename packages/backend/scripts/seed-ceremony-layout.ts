/**
 * One-off script: Populate space slot #22 (Ceremony Space) with a generic
 * ceremony layout (objects) plus camera and subject positions linked to
 * the crew slots and day subjects assigned to its activity.
 * Also seeds per-moment position overrides so subjects move realistically
 * through each ceremony moment (processional, vows, recessional, etc.).
 *
 * Run: npx tsx packages/backend/scripts/seed-ceremony-layout.ts
 */
import { PrismaClient, FloorPlanObjectType } from '@prisma/client';

const prisma = new PrismaClient();

// Canvas dimensions
const W = 1000;
const H = 800;

// ── Subject IDs (from reseed-ceremony-moments.ts) ──
const BRIDE = 111;
const GROOM = 112;
const BEST_MAN = 113;
const MAID_OF_HONOR = 114;
const FATHER_OF_BRIDE = 115;
const MOTHER_OF_BRIDE = 116;
const FATHER_OF_GROOM = 117;
const MOTHER_OF_GROOM = 118;
const BRIDESMAIDS = 119;
const GROOMSMEN = 120;
const FLOWER_GIRL = 121;
const RING_BEARER = 122;
const GUESTS = 123;

// Officiant subject (we'll look this up)
let OFFICIANT_ID: number | null = null;

// ── Moment IDs ──
const MOMENT = {
  GUEST_SEATING: 7,
  BRIDE_ARRIVAL: 8,
  OFFICIANT_WELCOME: 9,
  GROOM_TAKES_POSITION: 10,
  BRIDAL_PARTY_PROCESSIONAL: 11,
  BRIDE_ENTRANCE: 12,
  GIVING_AWAY: 13,
  OPENING_REMARKS: 14,
  READINGS: 15,
  VOWS_EXCHANGE: 16,
  RING_EXCHANGE: 17,
  UNITY_CEREMONY: 18,
  PRONOUNCEMENT: 19,
  FIRST_KISS: 20,
  RECESSIONAL: 21,
  CONFETTI: 22,
  RECEIVING_LINE: 23,
};

// Directions in degrees (0 = up/north, 90 = right, 180 = down/south, 270 = left)
const FACING = {
  NORTH: 0,    // toward altar
  SOUTH: 180,  // toward audience
  EAST: 90,
  WEST: 270,
  NE: 45,
  NW: 315,
  SE: 135,
  SW: 225,
};

async function main() {
  const SLOT_ID = 22;

  const slot = await prisma.packageSpaceSlot.findUnique({
    where: { id: SLOT_ID },
    include: { activity_assignments: true },
  });
  if (!slot) { console.error(`Space slot ${SLOT_ID} not found`); process.exit(1); }
  console.log(`Found space slot: "${slot.label}" (package ${slot.package_id})`);

  const activityId = slot.activity_assignments?.[0]?.package_activity_id;
  if (!activityId) { console.error('No activity assignment found'); process.exit(1); }

  // Look up Officiant subject
  const officiant = await prisma.packageDaySubject.findFirst({
    where: { name: 'Officiant', package_id: slot.package_id },
  });
  OFFICIANT_ID = officiant?.id ?? null;
  console.log(`Officiant subject ID: ${OFFICIANT_ID}`);

  // Find crew slots assigned to this activity (cameras only — videographer role)
  const crewSlotAssignments = await prisma.packageCrewSlotActivity.findMany({
    where: { package_activity_id: activityId },
    include: { package_crew_slot: { include: { job_role: true } } },
  });
  const crewSlots = crewSlotAssignments
    .map((a) => a.package_crew_slot)
    .filter((cs) => cs.job_role?.name === 'videographer');
  console.log(`Found ${crewSlots.length} camera crew slot(s)`);

  // Find subjects assigned to this activity
  const subjectAssignments = await prisma.packageDaySubjectActivity.findMany({
    where: { package_activity_id: activityId },
    include: { package_day_subject: true },
  });
  const subjects = subjectAssignments.map((a) => a.package_day_subject);
  console.log(`Found ${subjects.length} subject(s)`);

  // ── Clear existing data ──
  // First clear moment overrides (they reference cameras/subjects)
  await prisma.spaceSlotMomentCamera.deleteMany({
    where: { camera_position: { package_space_slot_id: SLOT_ID } },
  });
  await prisma.spaceSlotMomentSubject.deleteMany({
    where: { subject_position: { package_space_slot_id: SLOT_ID } },
  });
  await prisma.spaceSlotAnchor.deleteMany({ where: { package_space_slot_id: SLOT_ID } });
  await prisma.spaceSlotZone.deleteMany({ where: { package_space_slot_id: SLOT_ID } });
  await prisma.spaceSlotObject.deleteMany({ where: { package_space_slot_id: SLOT_ID } });
  await prisma.spaceSlotCameraPosition.deleteMany({ where: { package_space_slot_id: SLOT_ID } });
  await prisma.spaceSlotSubjectPosition.deleteMany({ where: { package_space_slot_id: SLOT_ID } });
  console.log('Cleared existing data');

  // Set canvas dimensions
  await prisma.packageSpaceSlot.update({
    where: { id: SLOT_ID },
    data: { canvas_width: W, canvas_height: H },
  });

  // ══════════════════════════════════════════════════════
  // ZONES — named spatial regions for AI reasoning
  // ══════════════════════════════════════════════════════
  const zoneRecords: Record<string, number> = {};
  const zones = [
    {
      name: 'altar_area',
      label: 'Altar Area',
      description: 'Raised platform where officiant and couple stand during the ceremony',
      color: '#E8E0D4',
      polygon: [{ x: 300, y: 10 }, { x: 700, y: 10 }, { x: 700, y: 130 }, { x: 300, y: 130 }],
      order_index: 0,
    },
    {
      name: 'aisle',
      label: 'Aisle',
      description: 'Central walkway between seating rows, used for processional and recessional',
      color: '#E8E4DE',
      polygon: [{ x: 460, y: 130 }, { x: 540, y: 130 }, { x: 540, y: 700 }, { x: 460, y: 700 }],
      order_index: 1,
    },
    {
      name: 'left_seating',
      label: 'Left Seating (Bride)',
      description: 'Guest seating on the left (bride side), 6 rows of chairs',
      color: '#E3EDE8',
      polygon: [{ x: 60, y: 140 }, { x: 420, y: 140 }, { x: 420, y: 560 }, { x: 60, y: 560 }],
      order_index: 2,
    },
    {
      name: 'right_seating',
      label: 'Right Seating (Groom)',
      description: 'Guest seating on the right (groom side), 6 rows of chairs',
      color: '#E3EDE8',
      polygon: [{ x: 580, y: 140 }, { x: 940, y: 140 }, { x: 940, y: 560 }, { x: 580, y: 560 }],
      order_index: 3,
    },
    {
      name: 'entrance',
      label: 'Entrance',
      description: 'Entry area at the back of the venue where processional begins',
      color: '#EDE8E3',
      polygon: [{ x: 350, y: 650 }, { x: 650, y: 650 }, { x: 650, y: 800 }, { x: 350, y: 800 }],
      order_index: 4,
    },
    {
      name: 'staging_left',
      label: 'Staging Left',
      description: 'Off-stage area to the left for bridal party prep and positioning',
      color: '#F0EDE8',
      polygon: [{ x: 0, y: 560 }, { x: 350, y: 560 }, { x: 350, y: 800 }, { x: 0, y: 800 }],
      order_index: 5,
    },
    {
      name: 'staging_right',
      label: 'Staging Right',
      description: 'Off-stage area to the right for groomsmen prep and positioning',
      color: '#F0EDE8',
      polygon: [{ x: 650, y: 560 }, { x: 1000, y: 560 }, { x: 1000, y: 800 }, { x: 650, y: 800 }],
      order_index: 6,
    },
  ];

  for (const zone of zones) {
    const rec = await prisma.spaceSlotZone.create({
      data: { package_space_slot_id: SLOT_ID, ...zone, polygon: zone.polygon },
    });
    zoneRecords[zone.name] = rec.id;
    console.log(`  Zone: ${zone.label} (${zone.name})`);
  }
  console.log(`Created ${zones.length} zones`);

  // ══════════════════════════════════════════════════════
  // ANCHORS — named reference points for facing targets
  // ══════════════════════════════════════════════════════
  const anchorRecords: Record<string, number> = {};
  const anchors = [
    { name: 'altar_center', label: 'Altar Center', x: W / 2, y: 65, zone: 'altar_area' },
    { name: 'arch_center', label: 'Arch Center', x: W / 2, y: 30, zone: 'altar_area' },
    { name: 'couple_position', label: 'Couple Position', x: W / 2, y: 130, zone: 'altar_area' },
    { name: 'aisle_start', label: 'Aisle Start (Entrance)', x: W / 2, y: 700, zone: 'aisle' },
    { name: 'aisle_end', label: 'Aisle End (Altar)', x: W / 2, y: 130, zone: 'aisle' },
    { name: 'aisle_midpoint', label: 'Aisle Midpoint', x: W / 2, y: 400, zone: 'aisle' },
    { name: 'front_row_left', label: 'Front Row Left', x: 240, y: 170, zone: 'left_seating' },
    { name: 'front_row_right', label: 'Front Row Right', x: 760, y: 170, zone: 'right_seating' },
    { name: 'venue_entrance', label: 'Venue Entrance', x: W / 2, y: 760, zone: 'entrance' },
  ];

  for (const anchor of anchors) {
    const rec = await prisma.spaceSlotAnchor.create({
      data: {
        package_space_slot_id: SLOT_ID,
        name: anchor.name,
        label: anchor.label,
        x: anchor.x,
        y: anchor.y,
        zone_id: zoneRecords[anchor.zone] ?? null,
      },
    });
    anchorRecords[anchor.name] = rec.id;
    console.log(`  Anchor: ${anchor.label} at (${anchor.x}, ${anchor.y})`);
  }
  console.log(`Created ${anchors.length} anchors`);

  // ══════════════════════════════════════════════════════
  // OBJECTS (ceremony layout — static furniture)
  // ══════════════════════════════════════════════════════
  const objects: Array<{
    object_type: FloorPlanObjectType; label?: string;
    x: number; y: number; width: number; height: number; rotation?: number; order_index: number;
  }> = [
    { object_type: 'STAGE', label: 'Altar Platform', x: W / 2 - 120, y: 30, width: 240, height: 90, order_index: 0 },
    { object_type: 'ALTAR', label: 'Altar', x: W / 2 - 40, y: 50, width: 80, height: 40, order_index: 1 },
    { object_type: 'ARCH', label: 'Archway', x: W / 2 - 50, y: 15, width: 100, height: 30, order_index: 2 },
    { object_type: 'AISLE', label: 'Aisle', x: W / 2 - 40, y: 130, width: 80, height: 500, order_index: 3 },
    // Left seating (6 rows)
    { object_type: 'CHAIR_ROW', label: 'Row 1L', x: 80, y: 160, width: 320, height: 30, order_index: 10 },
    { object_type: 'CHAIR_ROW', label: 'Row 2L', x: 80, y: 230, width: 320, height: 30, order_index: 11 },
    { object_type: 'CHAIR_ROW', label: 'Row 3L', x: 80, y: 300, width: 320, height: 30, order_index: 12 },
    { object_type: 'CHAIR_ROW', label: 'Row 4L', x: 80, y: 370, width: 320, height: 30, order_index: 13 },
    { object_type: 'CHAIR_ROW', label: 'Row 5L', x: 80, y: 440, width: 320, height: 30, order_index: 14 },
    { object_type: 'CHAIR_ROW', label: 'Row 6L', x: 80, y: 510, width: 320, height: 30, order_index: 15 },
    // Right seating (6 rows)
    { object_type: 'CHAIR_ROW', label: 'Row 1R', x: W - 80 - 320, y: 160, width: 320, height: 30, order_index: 20 },
    { object_type: 'CHAIR_ROW', label: 'Row 2R', x: W - 80 - 320, y: 230, width: 320, height: 30, order_index: 21 },
    { object_type: 'CHAIR_ROW', label: 'Row 3R', x: W - 80 - 320, y: 300, width: 320, height: 30, order_index: 22 },
    { object_type: 'CHAIR_ROW', label: 'Row 4R', x: W - 80 - 320, y: 370, width: 320, height: 30, order_index: 23 },
    { object_type: 'CHAIR_ROW', label: 'Row 5R', x: W - 80 - 320, y: 440, width: 320, height: 30, order_index: 24 },
    { object_type: 'CHAIR_ROW', label: 'Row 6R', x: W - 80 - 320, y: 510, width: 320, height: 30, order_index: 25 },
  ];

  const objectRecords: Record<string, number> = {};
  for (const obj of objects) {
    const rec = await prisma.spaceSlotObject.create({
      data: { package_space_slot_id: SLOT_ID, ...obj, rotation: obj.rotation ?? 0 },
    });
    objectRecords[obj.label] = rec.id;
  }
  console.log(`Created ${objects.length} objects`);

  // ══════════════════════════════════════════════════════
  // CAMERAS — base/default positions (Guest Seating moment)
  // FOV angles: WS ≈ 65° (wide lens), CU ≈ 28° (telephoto)
  // Facing targets point cameras at the altar anchor
  // ══════════════════════════════════════════════════════
  const cameraDefaults = [
    { x: W / 2, y: H - 60, rotation: 0, label: 'CAM1 - WS', fov_angle: 65,
      facing_target_type: 'ANCHOR' as const, facing_target_ref: 'altar_center' },    // Back center, wide shot → altar
    { x: 120, y: 100, rotation: 135, label: 'CAM2 - CU', fov_angle: 28,
      facing_target_type: 'ANCHOR' as const, facing_target_ref: 'couple_position' }, // Front-left, close-up → couple
  ];

  const cameraRecords: Array<{ id: number; crew_slot_id: number | null }> = [];
  for (let i = 0; i < cameraDefaults.length; i++) {
    const cs = crewSlots[i] ?? null;
    const def = cameraDefaults[i];
    const facingTargetId = def.facing_target_ref ? anchorRecords[def.facing_target_ref] ?? null : null;
    const rec = await prisma.spaceSlotCameraPosition.create({
      data: {
        package_space_slot_id: SLOT_ID,
        crew_slot_id: cs?.id ?? null,
        label: def.label,
        x: def.x, y: def.y, rotation: def.rotation,
        order_index: i,
        fov_angle: def.fov_angle,
        facing_target_type: def.facing_target_type,
        facing_target_id: facingTargetId,
      },
    });
    cameraRecords.push({ id: rec.id, crew_slot_id: cs?.id ?? null });
    console.log(`  Camera: ${def.label} (FOV ${def.fov_angle}°, facing → ${def.facing_target_ref})${cs ? ` → crew slot ${cs.id}` : ' (no crew slot)'}`);
  }

  // ══════════════════════════════════════════════════════
  // SUBJECTS — base/default positions (Guest Seating moment)
  // Everyone is seated or standing off to the side pre-ceremony
  // ══════════════════════════════════════════════════════
  type SubjDef = {
    name: string; daySubjectId: number; x: number; y: number; rotation: number;
    facing_target_type?: 'ANGLE' | 'ANCHOR' | 'SUBJECT' | 'OBJECT';
    facing_target_ref?: string;  // anchor name or subject name (resolved later)
    bound_object_ref?: string;   // object label for binding
    bound_offset_x?: number;
    bound_offset_y?: number;
  };
  const subjectDefaults: SubjDef[] = [
    // Officiant at altar, facing toward couple position anchor
    ...(OFFICIANT_ID ? [{
      name: 'Officiant', daySubjectId: OFFICIANT_ID, x: W / 2, y: 65, rotation: FACING.SOUTH,
      facing_target_type: 'ANCHOR' as const, facing_target_ref: 'couple_position',
    }] : []),
    // Groom + best man near altar
    { name: 'Groom', daySubjectId: GROOM, x: W / 2 + 70, y: 130, rotation: FACING.SW },
    { name: 'Best Man', daySubjectId: BEST_MAN, x: W / 2 + 140, y: 100, rotation: FACING.SOUTH },
    // Groomsmen at entrance
    { name: 'Groomsmen', daySubjectId: GROOMSMEN, x: 620, y: 690, rotation: FACING.SOUTH },
    // Bride + bridal party offstage
    { name: 'Bride', daySubjectId: BRIDE, x: W / 2, y: H - 20, rotation: FACING.NORTH },
    { name: 'Maid of Honor', daySubjectId: MAID_OF_HONOR, x: W / 2 - 60, y: H - 20, rotation: FACING.NORTH },
    { name: 'Bridesmaids', daySubjectId: BRIDESMAIDS, x: W / 2 - 120, y: H - 20, rotation: FACING.NORTH },
    { name: 'Flower Girl', daySubjectId: FLOWER_GIRL, x: W / 2 + 60, y: H - 20, rotation: FACING.NORTH },
    // Ring Bearer with groomsmen at entrance
    { name: 'Ring Bearer', daySubjectId: RING_BEARER, x: 650, y: 690, rotation: FACING.SOUTH },
    // Father of Bride at entrance greeting guests
    { name: 'Father of Bride', daySubjectId: FATHER_OF_BRIDE, x: 430, y: 680, rotation: FACING.SOUTH },
    // Mothers bound to front-row seating
    { name: 'Mother of Bride', daySubjectId: MOTHER_OF_BRIDE, x: 200, y: 170, rotation: FACING.NORTH,
      bound_object_ref: 'Row 1L', bound_offset_x: 120, bound_offset_y: 10 },
    { name: 'Mother of Groom', daySubjectId: MOTHER_OF_GROOM, x: W - 180, y: 170, rotation: FACING.NORTH,
      bound_object_ref: 'Row 1R', bound_offset_x: 120, bound_offset_y: 10 },
    // Father of Groom at entrance welcoming guests
    { name: 'Father of Groom', daySubjectId: FATHER_OF_GROOM, x: 570, y: 680, rotation: FACING.SOUTH },
    // Guests in seats
    { name: 'Guests', daySubjectId: GUESTS, x: W / 2, y: 350, rotation: FACING.NORTH,
      bound_object_ref: 'Row 3L', bound_offset_x: 160, bound_offset_y: 0 },
  ];

  // Only create subjects that are actually assigned to this activity
  const assignedSubjectIds = new Set(subjects.map((s) => s.id));
  const subjectRecords: Array<{ id: number; daySubjectId: number; name: string }> = [];

  for (let i = 0; i < subjectDefaults.length; i++) {
    const def = subjectDefaults[i];
    if (!assignedSubjectIds.has(def.daySubjectId)) {
      console.log(`  Skipping ${def.name} (not assigned to activity)`);
      continue;
    }
    const rec = await prisma.spaceSlotSubjectPosition.create({
      data: {
        package_space_slot_id: SLOT_ID,
        day_subject_id: def.daySubjectId,
        label: def.name,
        x: def.x, y: def.y,
        rotation: def.rotation,
        order_index: i,
        // Facing targets
        ...(def.facing_target_type && def.facing_target_ref ? {
          facing_target_type: def.facing_target_type,
          facing_target_id: anchorRecords[def.facing_target_ref] ?? null,
        } : {}),
        // Object-subject binding
        ...(def.bound_object_ref ? {
          bound_object_id: objectRecords[def.bound_object_ref] ?? null,
          bound_offset_x: def.bound_offset_x ?? 0,
          bound_offset_y: def.bound_offset_y ?? 0,
        } : {}),
      },
    });
    subjectRecords.push({ id: rec.id, daySubjectId: def.daySubjectId, name: def.name });
    console.log(`  Subject: ${def.name} at (${def.x}, ${def.y}) facing ${def.rotation}°`);
  }

  // ══════════════════════════════════════════════════════
  // PER-MOMENT OVERRIDES
  // Only store positions that differ from the base (keyframe approach)
  // ══════════════════════════════════════════════════════
  const findCam = (index: number) => cameraRecords[index]?.id;
  const findSubj = (daySubjectId: number) => subjectRecords.find(s => s.daySubjectId === daySubjectId)?.id;

  type CamOverride = { cameraPositionId: number; momentId: number; x: number; y: number; rotation: number };
  type SubjOverride = { subjectPositionId: number; momentId: number; x: number; y: number; rotation: number };

  const camOverrides: CamOverride[] = [];
  const subjOverrides: SubjOverride[] = [];

  const addCam = (camIdx: number, momentId: number, x: number, y: number, rotation: number) => {
    const id = findCam(camIdx);
    if (id) camOverrides.push({ cameraPositionId: id, momentId, x, y, rotation });
  };
  const addSubj = (daySubjectId: number, momentId: number, x: number, y: number, rotation: number) => {
    const id = findSubj(daySubjectId);
    if (id) subjOverrides.push({ subjectPositionId: id, momentId, x, y, rotation });
  };

  // ── Guest Seating (moment 7) ──
  // Only Officiant + Guests are present — everyone else is offstage
  if (OFFICIANT_ID) addSubj(OFFICIANT_ID, MOMENT.GUEST_SEATING, W / 2, 65, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.GUEST_SEATING, W / 2, 350, FACING.NORTH);
  addSubj(MOTHER_OF_BRIDE, MOMENT.GUEST_SEATING, 200, 170, FACING.NORTH);
  addSubj(MOTHER_OF_GROOM, MOMENT.GUEST_SEATING, W - 180, 170, FACING.NORTH);
  addSubj(GROOM, MOMENT.GUEST_SEATING, W / 2 + 70, 130, FACING.SW);
  addSubj(BEST_MAN, MOMENT.GUEST_SEATING, W / 2 + 140, 100, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.GUEST_SEATING, 620, 690, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.GUEST_SEATING, 430, 680, FACING.SOUTH);
  addSubj(FATHER_OF_GROOM, MOMENT.GUEST_SEATING, 570, 680, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.GUEST_SEATING, 650, 690, FACING.SOUTH);
  addCam(0, MOMENT.GUEST_SEATING, W / 2, H - 60, 0);
  addCam(1, MOMENT.GUEST_SEATING, 120, 100, 135);

  // ── Bride Arrival (moment 8) ──
  // Bride at venue entrance, groom at altar, everyone turning to look
  addSubj(BRIDE, MOMENT.BRIDE_ARRIVAL, 500, 760, FACING.NORTH);
  addSubj(MAID_OF_HONOR, MOMENT.BRIDE_ARRIVAL, 440, 760, FACING.NORTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.BRIDE_ARRIVAL, 540, 760, FACING.NORTH);
  addSubj(BRIDESMAIDS, MOMENT.BRIDE_ARRIVAL, 500, 670, FACING.NORTH);
  addSubj(GROOM, MOMENT.BRIDE_ARRIVAL, 540, 120, FACING.SOUTH);
  addSubj(BEST_MAN, MOMENT.BRIDE_ARRIVAL, 590, 120, FACING.SOUTH);
  addSubj(MOTHER_OF_BRIDE, MOMENT.BRIDE_ARRIVAL, 200, 170, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.BRIDE_ARRIVAL, 500, 350, FACING.SOUTH);
  addCam(0, MOMENT.BRIDE_ARRIVAL, 500, 740, 0);
  addCam(1, MOMENT.BRIDE_ARRIVAL, 160, 100, 150);

  // ── Officiant Welcome (moment 9) ──
  // Everyone in ceremony positions, officiant addressing congregation
  addSubj(BRIDE, MOMENT.OFFICIANT_WELCOME, 470, 135, FACING.NORTH);
  addSubj(GROOM, MOMENT.OFFICIANT_WELCOME, 530, 135, FACING.NORTH);
  addSubj(BEST_MAN, MOMENT.OFFICIANT_WELCOME, 620, 110, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.OFFICIANT_WELCOME, 380, 110, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.OFFICIANT_WELCOME, 240, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.OFFICIANT_WELCOME, 770, 170, FACING.NORTH);
  addSubj(BRIDESMAIDS, MOMENT.OFFICIANT_WELCOME, 330, 140, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.OFFICIANT_WELCOME, 670, 140, FACING.SOUTH);
  addSubj(FLOWER_GIRL, MOMENT.OFFICIANT_WELCOME, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.OFFICIANT_WELCOME, 580, 150, FACING.SOUTH);
  addCam(1, MOMENT.OFFICIANT_WELCOME, 150, 100, 145);

  // ── Groom Takes Position (moment 10) ──
  // Groom + best man walking to altar, groomsmen filing into position
  addSubj(GROOM, MOMENT.GROOM_TAKES_POSITION, 540, 300, FACING.NORTH);
  addSubj(BEST_MAN, MOMENT.GROOM_TAKES_POSITION, 575, 310, FACING.NORTH);
  addSubj(GROOMSMEN, MOMENT.GROOM_TAKES_POSITION, 660, 250, FACING.NORTH);
  addCam(0, MOMENT.GROOM_TAKES_POSITION, 500, 740, 0);
  addCam(1, MOMENT.GROOM_TAKES_POSITION, 150, 110, 120);

  // ── Bridal Party Processional (moment 11) ──
  // Order: flower girl (first) → ring bearer → bridesmaids → maid of honor (last)
  addSubj(FLOWER_GIRL, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 500, 280, FACING.NORTH);
  addSubj(RING_BEARER, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 500, 340, FACING.NORTH);
  addSubj(BRIDESMAIDS, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 500, 440, FACING.NORTH);
  addSubj(MAID_OF_HONOR, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 500, 550, FACING.NORTH);
  addSubj(GROOM, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 540, 120, FACING.SOUTH);
  addSubj(BEST_MAN, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 590, 110, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 660, 130, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 500, 350, FACING.SOUTH);
  addCam(0, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 500, 740, 0);
  addCam(1, MOMENT.BRIDAL_PARTY_PROCESSIONAL, 70, 300, 85);

  // ── Bride Entrance (moment 12) ──
  // Bride walking down aisle arm-in-arm with father, bridal party at altar
  addSubj(BRIDE, MOMENT.BRIDE_ENTRANCE, 475, 480, FACING.NORTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.BRIDE_ENTRANCE, 525, 480, FACING.NORTH);
  addSubj(GROOM, MOMENT.BRIDE_ENTRANCE, 540, 120, FACING.SOUTH);
  addSubj(BEST_MAN, MOMENT.BRIDE_ENTRANCE, 590, 110, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.BRIDE_ENTRANCE, 380, 110, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.BRIDE_ENTRANCE, 330, 140, FACING.SOUTH);
  addSubj(FLOWER_GIRL, MOMENT.BRIDE_ENTRANCE, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.BRIDE_ENTRANCE, 580, 150, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.BRIDE_ENTRANCE, 660, 130, FACING.SOUTH);
  addSubj(MOTHER_OF_BRIDE, MOMENT.BRIDE_ENTRANCE, 200, 170, FACING.SOUTH);
  addSubj(MOTHER_OF_GROOM, MOMENT.BRIDE_ENTRANCE, 820, 170, FACING.SOUTH);
  addSubj(FATHER_OF_GROOM, MOMENT.BRIDE_ENTRANCE, 770, 170, FACING.NORTH);
  addSubj(GUESTS, MOMENT.BRIDE_ENTRANCE, 500, 350, FACING.SOUTH);
  addCam(0, MOMENT.BRIDE_ENTRANCE, 500, 740, 0);
  addCam(1, MOMENT.BRIDE_ENTRANCE, 160, 100, 150);

  // ── Giving Away (moment 13) ──
  // Father lifts bride's veil, places her hand in groom's
  addSubj(BRIDE, MOMENT.GIVING_AWAY, 470, 140, FACING.NE);
  addSubj(GROOM, MOMENT.GIVING_AWAY, 530, 140, FACING.NW);
  addSubj(FATHER_OF_BRIDE, MOMENT.GIVING_AWAY, 430, 150, FACING.EAST);
  addSubj(BEST_MAN, MOMENT.GIVING_AWAY, 590, 110, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.GIVING_AWAY, 380, 110, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.GIVING_AWAY, 330, 140, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.GIVING_AWAY, 660, 130, FACING.SOUTH);
  addSubj(FLOWER_GIRL, MOMENT.GIVING_AWAY, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.GIVING_AWAY, 580, 150, FACING.SOUTH);
  addSubj(FATHER_OF_GROOM, MOMENT.GIVING_AWAY, 770, 170, FACING.NORTH);
  addSubj(GUESTS, MOMENT.GIVING_AWAY, 500, 350, FACING.NORTH);
  addCam(1, MOMENT.GIVING_AWAY, 130, 90, 150);

  // ── Opening Remarks (moment 14) ──
  // Couple at altar facing officiant, everyone seated
  addSubj(BRIDE, MOMENT.OPENING_REMARKS, 470, 135, FACING.NORTH);
  addSubj(GROOM, MOMENT.OPENING_REMARKS, 530, 135, FACING.NORTH);
  addSubj(BEST_MAN, MOMENT.OPENING_REMARKS, 620, 110, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.OPENING_REMARKS, 380, 110, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.OPENING_REMARKS, 240, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.OPENING_REMARKS, 770, 170, FACING.NORTH);
  addSubj(BRIDESMAIDS, MOMENT.OPENING_REMARKS, 330, 140, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.OPENING_REMARKS, 670, 140, FACING.SOUTH);
  addSubj(FLOWER_GIRL, MOMENT.OPENING_REMARKS, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.OPENING_REMARKS, 580, 150, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.OPENING_REMARKS, 500, 350, FACING.NORTH);

  // ── Readings (moment 15) ──
  // Best Man at lectern reading, Maid of Honor nearby, Officiant seated to side
  addSubj(BRIDE, MOMENT.READINGS, 470, 135, FACING.NORTH);
  addSubj(GROOM, MOMENT.READINGS, 530, 135, FACING.NORTH);
  addSubj(BEST_MAN, MOMENT.READINGS, 420, 70, FACING.SOUTH); // at lectern
  addSubj(MAID_OF_HONOR, MOMENT.READINGS, 360, 95, FACING.SE); // near lectern
  if (OFFICIANT_ID) addSubj(OFFICIANT_ID, MOMENT.READINGS, 560, 70, FACING.SOUTH); // seated to side
  addSubj(FATHER_OF_BRIDE, MOMENT.READINGS, 240, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.READINGS, 770, 170, FACING.NORTH);
  addSubj(BRIDESMAIDS, MOMENT.READINGS, 330, 140, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.READINGS, 670, 140, FACING.SOUTH);
  addSubj(FLOWER_GIRL, MOMENT.READINGS, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.READINGS, 580, 150, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.READINGS, 500, 350, FACING.NORTH);
  addCam(1, MOMENT.READINGS, 150, 110, 130);

  // ── Vows Exchange (moment 16) ──
  // Couple facing each other at altar
  addSubj(BRIDE, MOMENT.VOWS_EXCHANGE, 470, 130, FACING.EAST);
  addSubj(GROOM, MOMENT.VOWS_EXCHANGE, 530, 130, FACING.WEST);
  addSubj(BEST_MAN, MOMENT.VOWS_EXCHANGE, 620, 110, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.VOWS_EXCHANGE, 380, 110, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.VOWS_EXCHANGE, 320, 140, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.VOWS_EXCHANGE, 680, 140, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.VOWS_EXCHANGE, 230, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.VOWS_EXCHANGE, 770, 170, FACING.NORTH);
  addSubj(FLOWER_GIRL, MOMENT.VOWS_EXCHANGE, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.VOWS_EXCHANGE, 580, 150, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.VOWS_EXCHANGE, 500, 350, FACING.NORTH);
  addCam(0, MOMENT.VOWS_EXCHANGE, 500, 740, 0);
  addCam(1, MOMENT.VOWS_EXCHANGE, 120, 100, 140);

  // ── Ring Exchange (moment 17) ──
  // Best Man steps forward with rings, Ring Bearer nearby after presenting cushion
  addSubj(BRIDE, MOMENT.RING_EXCHANGE, 475, 130, FACING.EAST);
  addSubj(GROOM, MOMENT.RING_EXCHANGE, 525, 130, FACING.WEST);
  addSubj(BEST_MAN, MOMENT.RING_EXCHANGE, 560, 120, FACING.SW); // stepping forward
  addSubj(RING_BEARER, MOMENT.RING_EXCHANGE, 570, 145, FACING.SOUTH); // nearby
  addSubj(MAID_OF_HONOR, MOMENT.RING_EXCHANGE, 380, 110, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.RING_EXCHANGE, 320, 140, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.RING_EXCHANGE, 680, 140, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.RING_EXCHANGE, 230, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.RING_EXCHANGE, 770, 170, FACING.NORTH);
  addSubj(FLOWER_GIRL, MOMENT.RING_EXCHANGE, 350, 155, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.RING_EXCHANGE, 500, 350, FACING.NORTH);
  addCam(1, MOMENT.RING_EXCHANGE, 420, 110, 100);

  // ── Unity Ceremony (moment 18) ──
  // Couple side by side at altar table
  addSubj(BRIDE, MOMENT.UNITY_CEREMONY, 480, 90, FACING.NORTH);
  addSubj(GROOM, MOMENT.UNITY_CEREMONY, 520, 90, FACING.NORTH);
  addSubj(BEST_MAN, MOMENT.UNITY_CEREMONY, 620, 110, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.UNITY_CEREMONY, 380, 110, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.UNITY_CEREMONY, 320, 140, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.UNITY_CEREMONY, 680, 140, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.UNITY_CEREMONY, 230, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.UNITY_CEREMONY, 770, 170, FACING.NORTH);
  addSubj(FLOWER_GIRL, MOMENT.UNITY_CEREMONY, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.UNITY_CEREMONY, 580, 150, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.UNITY_CEREMONY, 500, 350, FACING.NORTH);
  addCam(1, MOMENT.UNITY_CEREMONY, 130, 80, 110);

  // ── Pronouncement (moment 19) ──
  // "I now pronounce you..." — couple facing each other, anticipation
  addSubj(BRIDE, MOMENT.PRONOUNCEMENT, 475, 130, FACING.EAST);
  addSubj(GROOM, MOMENT.PRONOUNCEMENT, 525, 130, FACING.WEST);
  addSubj(BEST_MAN, MOMENT.PRONOUNCEMENT, 620, 110, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.PRONOUNCEMENT, 380, 110, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.PRONOUNCEMENT, 320, 135, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.PRONOUNCEMENT, 680, 135, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.PRONOUNCEMENT, 230, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.PRONOUNCEMENT, 770, 170, FACING.NORTH);
  addSubj(FLOWER_GIRL, MOMENT.PRONOUNCEMENT, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.PRONOUNCEMENT, 580, 150, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.PRONOUNCEMENT, 500, 340, FACING.NORTH);

  // ── First Kiss (moment 20) ──
  // Couple very close, everyone applauding
  addSubj(BRIDE, MOMENT.FIRST_KISS, 490, 130, FACING.EAST);
  addSubj(GROOM, MOMENT.FIRST_KISS, 510, 130, FACING.WEST);
  addSubj(BEST_MAN, MOMENT.FIRST_KISS, 620, 110, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.FIRST_KISS, 380, 110, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.FIRST_KISS, 320, 140, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.FIRST_KISS, 680, 140, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.FIRST_KISS, 230, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.FIRST_KISS, 770, 165, FACING.NORTH);
  addSubj(MOTHER_OF_GROOM, MOMENT.FIRST_KISS, 810, 165, FACING.NORTH);
  addSubj(FLOWER_GIRL, MOMENT.FIRST_KISS, 350, 155, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.FIRST_KISS, 580, 150, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.FIRST_KISS, 500, 340, FACING.NORTH);
  addCam(0, MOMENT.FIRST_KISS, 500, 740, 0);
  addCam(1, MOMENT.FIRST_KISS, 100, 90, 140);

  // ── Recessional (moment 21) ──
  // Couple leading, bridal party following in pairs down the aisle
  addSubj(BRIDE, MOMENT.RECESSIONAL, 475, 450, FACING.SOUTH);
  addSubj(GROOM, MOMENT.RECESSIONAL, 525, 450, FACING.SOUTH);
  addSubj(BEST_MAN, MOMENT.RECESSIONAL, 540, 300, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.RECESSIONAL, 460, 300, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.RECESSIONAL, 470, 200, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.RECESSIONAL, 530, 200, FACING.SOUTH);
  addSubj(FLOWER_GIRL, MOMENT.RECESSIONAL, 490, 250, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.RECESSIONAL, 510, 250, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.RECESSIONAL, 230, 170, FACING.NORTH);
  addSubj(FATHER_OF_GROOM, MOMENT.RECESSIONAL, 770, 170, FACING.NORTH);
  addSubj(GUESTS, MOMENT.RECESSIONAL, 500, 350, FACING.SOUTH);
  addCam(0, MOMENT.RECESSIONAL, 500, 740, 0);
  addCam(1, MOMENT.RECESSIONAL, 150, 400, 90);

  // ── Confetti & Celebration (moment 22) ──
  // Everyone near the exit, throwing confetti at the couple
  addSubj(BRIDE, MOMENT.CONFETTI, 480, 700, FACING.SOUTH);
  addSubj(GROOM, MOMENT.CONFETTI, 520, 700, FACING.SOUTH);
  addSubj(BEST_MAN, MOMENT.CONFETTI, 440, 620, FACING.SOUTH);
  addSubj(MAID_OF_HONOR, MOMENT.CONFETTI, 560, 620, FACING.SOUTH);
  addSubj(BRIDESMAIDS, MOMENT.CONFETTI, 370, 640, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.CONFETTI, 630, 640, FACING.SOUTH);
  addSubj(FATHER_OF_BRIDE, MOMENT.CONFETTI, 340, 660, FACING.SOUTH);
  addSubj(MOTHER_OF_BRIDE, MOMENT.CONFETTI, 300, 660, FACING.SOUTH);
  addSubj(FATHER_OF_GROOM, MOMENT.CONFETTI, 700, 660, FACING.SOUTH);
  addSubj(MOTHER_OF_GROOM, MOMENT.CONFETTI, 740, 660, FACING.SOUTH);
  addSubj(FLOWER_GIRL, MOMENT.CONFETTI, 460, 660, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.CONFETTI, 600, 650, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.CONFETTI, 500, 620, FACING.SOUTH);
  addCam(0, MOMENT.CONFETTI, 500, 780, 0);
  addCam(1, MOMENT.CONFETTI, 650, 710, 270);

  // ── Receiving Line (moment 23) ──
  // Bridal party + parents lined up, greeting guests one by one
  addSubj(BRIDE, MOMENT.RECEIVING_LINE, 200, 700, FACING.EAST);
  addSubj(GROOM, MOMENT.RECEIVING_LINE, 230, 700, FACING.EAST);
  addSubj(BEST_MAN, MOMENT.RECEIVING_LINE, 260, 700, FACING.EAST);
  addSubj(MAID_OF_HONOR, MOMENT.RECEIVING_LINE, 290, 700, FACING.EAST);
  addSubj(FATHER_OF_BRIDE, MOMENT.RECEIVING_LINE, 320, 700, FACING.EAST);
  addSubj(MOTHER_OF_BRIDE, MOMENT.RECEIVING_LINE, 350, 700, FACING.EAST);
  addSubj(FATHER_OF_GROOM, MOMENT.RECEIVING_LINE, 380, 700, FACING.EAST);
  addSubj(MOTHER_OF_GROOM, MOMENT.RECEIVING_LINE, 410, 700, FACING.EAST);
  addSubj(BRIDESMAIDS, MOMENT.RECEIVING_LINE, 450, 650, FACING.SOUTH);
  addSubj(GROOMSMEN, MOMENT.RECEIVING_LINE, 550, 650, FACING.SOUTH);
  addSubj(FLOWER_GIRL, MOMENT.RECEIVING_LINE, 380, 650, FACING.SOUTH);
  addSubj(RING_BEARER, MOMENT.RECEIVING_LINE, 500, 650, FACING.SOUTH);
  addSubj(GUESTS, MOMENT.RECEIVING_LINE, 550, 700, FACING.WEST);
  addCam(0, MOMENT.RECEIVING_LINE, 100, 650, 90);
  addCam(1, MOMENT.RECEIVING_LINE, 250, 640, 180);

  // ── Write overrides to DB ──
  console.log(`\nCreating ${camOverrides.length} camera moment overrides...`);
  for (const o of camOverrides) {
    await prisma.spaceSlotMomentCamera.create({
      data: {
        camera_position_id: o.cameraPositionId,
        moment_id: o.momentId,
        x: o.x, y: o.y, rotation: o.rotation,
      },
    });
  }

  console.log(`Creating ${subjOverrides.length} subject moment overrides...`);
  for (const o of subjOverrides) {
    await prisma.spaceSlotMomentSubject.create({
      data: {
        subject_position_id: o.subjectPositionId,
        moment_id: o.momentId,
        x: o.x, y: o.y, rotation: o.rotation,
      },
    });
  }

  console.log('\nDone! Ceremony layout + moment overrides seeded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
