/**
 * New Refactored FloorPlanEditorModal
 * 
 * This is the new modular version that replaces the 2,311-line monolithic component.
 * It uses a clean architecture with separated concerns:
 * - UI Components in components/ folder
 * - Business logic in hooks/ and services/
 * - Configuration in constants/
 * - Type definitions in types/
 */

import { FloorPlanEditor } from './components/Editor/FloorPlanEditor';

// Re-export the types for backward compatibility
export type { VenueFloorPlan, FloorPlanEditorProps } from '../../types/floor-plan/editor';

// Re-export the main component with the same interface as the original
export const FloorPlanEditorModal = FloorPlanEditor;

// Default export for backward compatibility
export default FloorPlanEditorModal;
