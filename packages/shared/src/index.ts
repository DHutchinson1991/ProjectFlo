export {
  roundMoney,
  computeLineTotal,
  computeItemsTotal,
  computeTaxBreakdown,
  computeEquipmentBreakdown,
  computeTaskCostBreakdown,
  computeCrewCost,
  computePackagePricing,
} from './pricing';
export type {
  Numeric,
  PricingEquipmentRel,
  PricingCrewSlotForEquipment,
  EquipmentBreakdown,
  PricingTaskRow,
  TaskCostBreakdown,
  PricingCrewSlotForDayRate,
  PackagePricingSummary,
} from './pricing';

export {
  getCurrencySymbol,
  formatCurrency,
  DEFAULT_CURRENCY,
} from './formatting';

export {
  resolveHourlyRate,
  resolveDayRate,
  usesDayRate,
  NON_DELIVERY_PHASES,
  PLANNING_CATEGORIES,
  POST_PRODUCTION_CATEGORIES,
} from './rates';
export type { RateResolvable, CrewAccum } from './rates';

export {
  sumEffortHours,
  sumEstimatedHours,
  sumTotalHours,
} from './hours';

export { resolveTemplate, hasTemplatePlaceholders } from './templates';

export {
  isPreCeremonyFloorActivity,
  normalizeActivityNameForPreCeremonyCheck,
} from './pre-ceremony-floor-activity';

export type { FloorPlanChairObject } from './floor-plan-object.types';

export {
  normalizeCeremonyRoleLabel,
  classifyCeremonySeatTier,
  inferParentSeatSidePreference,
  assignCeremonySyntheticSeats,
  computeCeremonyGuestSeatCapacity,
  parsePlacementSeatToken,
  formatCeremonySeatLabel,
  findNearestChairSeatMeta,
  resolveChairSeatCoordinates,
  computeSeatCentersForChairRow,
  CeremonySeatLayoutMode,
} from './ceremony-seat-layout';
export type {
  CeremonySeatTier,
  ChairRowSeat,
  CeremonyRoleInstanceInput,
  CeremonySeatAssignmentResult,
  CeremonyRoleLinkRef,
  CeremonySeatAssignmentOptions,
} from './ceremony-seat-layout';

export type { SandboxSpaceKind } from './blueprint-sandbox-space-kind';
export { resolveSandboxSpaceKind } from './blueprint-sandbox-space-kind';

export {
  BLUEPRINT_CANVAS_WIDTH,
  BLUEPRINT_CANVAS_HEIGHT,
  coordinatesFromBlueprintPlacement,
} from './blueprint-placement-coordinates';
export type {
  BlueprintPlacementInput,
  BlueprintPlacementResolveOptions,
  BlueprintPlacementAnchor,
  PlacementCoordinates,
} from './blueprint-placement-coordinates';

export {
  buildCeremonyMotionTextForRole,
  ceremonyHardExemptFromSeating,
  ceremonyMotionExemptFromMomentText,
  inferCeremonyMomentSeated,
  shouldSkipCeremonySeatSnap,
} from './ceremony-motion-seating';

export {
  buildBlueprintSubjectRoleInstances,
  buildCeremonyBlueprintSubjectRoleInstances,
  effectiveCeremonyTypicalCount,
  floorPlanSubjectLabel,
  isGuestLikeRoleLabel,
  subjectRoleInstanceCount,
} from './blueprint-subject-instances';
export type {
  BlueprintSubjectRoleInstance,
  BlueprintSubjectRoleInstanceInput,
} from './blueprint-subject-instances';

export {
  buildSandboxRoomLayout,
  deriveSandboxAnchors,
  deriveSandboxZones,
} from './sandbox-room-layout';
export type {
  SandboxRoomLayoutSpec,
  SandboxRoomObjectSpec,
  SandboxRoomZoneSpec,
  SandboxRoomAnchorSpec,
  SandboxAnchorSourceObject,
  SandboxRoomObjectType,
  SandboxRoomSpaceTypeTag,
} from './sandbox-room-layout';

export {
  resolveSpatialCollisions,
  pointInPolygon,
  nearestPointInPolygon,
  polygonCentroid,
  distanceToPolygonBBox,
  SUBJECT_MIN_SEPARATION,
  SOLID_OBJECT_TYPES,
} from './spatial-collision';
export type {
  CollisionSubjectPoint,
  CollisionObjectRect,
  ResolveSpatialCollisionsOptions,
  ResolveSpatialCollisionsResult,
  PolygonPoint,
} from './spatial-collision';

export {
  SHOT_TYPE_DISTANCE_THRESHOLDS,
  SHOT_TYPE_SUBJECT_CAPS,
  DEFAULT_CAMERA_FOV_DEGREES,
  WIDE_SHOT_EDITORIAL_SUBJECT_CAP,
  EDITORIAL_SHOT_TYPE_SUBJECT_CAPS,
  DEFAULT_EDITORIAL_SUBJECT_CAP,
  GEOMETRIC_EDITORIAL_SHOT_TYPES,
  SHOT_TYPE_HYSTERESIS_BANDS,
  effectiveFramingDistance,
  inferShotTypeFromDistances,
  inferShotTypeWithHysteresis,
  focalDistanceRingRadii,
  subjectCapForDistances,
  subjectCapForEditorialShotType,
  capSubjectIds,
  editorialSubjectCapLabel,
  isEditorialShotType,
  isGeometricEditorialShot,
  resolveShotCoupling,
  normalizeShotCoupling,
  isGuestLikeSubjectName,
  canvasDistance,
  angleToPointDeg,
  rotationTowardPointsDeg,
  subjectsFitInFov,
  resolveFocalSubjectIds,
  inferShotTypeFromFocalSubjects,
  subjectsInCameraFov,
  computeFraming,
  shotTypeAbbrev,
} from './shot-framing';
export type {
  InferredShotType,
  EditorialShotType,
  CapSubjectIdsOptions,
  ShotCoupling,
  FramingSubject,
  FramingCamera,
  ComputeFramingInput,
  ComputeFramingResult,
} from './shot-framing';

export type {
  FloorPlanSceneViewModel,
  FloorPlanSceneObject,
  FloorPlanSceneZone,
  FloorPlanSceneSubject,
  FloorPlanSceneCamera,
  FloorPlanSceneCanvasSize,
} from './floor-plan-scene.types';
