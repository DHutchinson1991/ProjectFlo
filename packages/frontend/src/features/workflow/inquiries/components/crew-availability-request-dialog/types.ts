import type { InquiryCrewAvailabilityRow } from '@/features/workflow/inquiries/types';
import type { TaskAutoGenerationPreviewTask } from '@/features/catalog/task-library/types';

export type RequestStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';

export interface CrewAvailabilityRequestDialogProps {
  open: boolean;
  onClose: () => void;
  crewName: string;
  crewEmail?: string | null;
  rows: InquiryCrewAvailabilityRow[];
  requestStatus?: RequestStatus | null;
  emailSubject: string;
  emailBody: string;
  onEmailSubjectChange: (value: string) => void;
  onEmailBodyChange: (value: string) => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
  previewTasks?: TaskAutoGenerationPreviewTask[];
  eventDate?: Date | string | null;
  venueDetails?: string | null;
  eventType?: string | null;
  clientName?: string;
  brandName?: string;
}

export interface TaskSummary {
  before: number;
  onday: number;
  after: number;
  totalCost: number;
}

export const ADMIN_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);

export const PHASE_TO_GROUP: Partial<Record<string, 'before' | 'onday' | 'after'>> = {
  Creative_Development: 'before',
  Pre_Production: 'before',
  Production: 'onday',
  Post_Production: 'after',
  Delivery: 'after',
};
