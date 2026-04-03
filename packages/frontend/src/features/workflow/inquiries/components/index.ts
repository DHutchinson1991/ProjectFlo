// Detail/workflow components
export { default as CommandCenterHeader } from './command-center-header';
export { EstimatesCard } from '@/features/finance/estimates/components/EstimatesCard';
export { ProposalsCard } from './proposals-card';
export { QuotesCard } from '@/features/finance/quotes/components/QuotesCard';
export { ContractsCard } from '@/features/finance/contracts/components/ContractsCard';
export { InvoicesCard } from '@/features/finance/invoices/components/InvoicesCard';
export { DiscoveryCallCard } from './discovery-call-card';
export { ClientApprovalCard } from './client-approval-card';

export { DiscoveryQuestionnaireCard, DiscoveryQuestionnaireFormDialog } from './discovery-questionnaire-card';

export { default as QualifyCard } from './qualify-card';
export { default as PaymentTermsCard } from '@/features/finance/payment-schedules/components/PaymentTermsCard';

// Inquiry sub-components (from [id]/components/)
export { default as AvailabilityCard } from './availability-card';
export { default as CrewAvailabilityRequestDialog } from './crew-availability-request-dialog';
export { default as EquipmentReservationDialog } from './equipment-reservation-dialog';
export { EventDetailsCard } from './event-details-card';
export { ActionDialog } from '@/shared/ui/ActionDialog';
export { ScheduleTab } from './tabs';
export { default as MeetingScheduler } from './meeting-scheduler';
export { default as PackageScopeCard } from './package-scope-card';
export { InquirySubjectsCard } from './inquiry-subjects-card';
export { WelcomeEmailDialog } from './welcome-email-dialog';
export type { WelcomeEmailDraft } from './welcome-email-dialog';
