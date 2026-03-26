// Feature-owned type re-exports.
// ActiveTask is defined in lib/types (shared); re-exported here for feature ownership.
// TODO: Move ActiveTask definition here once all consumers are migrated.
export type { ActiveTask } from '@/lib/types';
export type { TaskGroupData } from '../utils/group-tasks';
