import type { InquiryEquipmentAvailabilityRow } from '@/features/workflow/inquiries/types';

export interface EquipmentReservationDialogProps {
  open: boolean;
  onClose: () => void;
  rows: InquiryEquipmentAvailabilityRow[];
  ownerName: string;
  reservationStatuses?: Map<number, { status: 'reserved' | 'cancelled' }>;
  emailSubject: string;
  emailBody: string;
  onEmailSubjectChange: (value: string) => void;
  onEmailBodyChange: (value: string) => void;
  onConfirm: () => void;
  onCancelReservation?: () => void;
  loading?: boolean;
  error?: string | null;
}
