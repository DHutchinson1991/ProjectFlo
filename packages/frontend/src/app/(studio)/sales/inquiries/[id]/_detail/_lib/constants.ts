import {
    Assignment,
    AttachMoney,
    Phone,
    Description,
    CalendarToday,
    Gavel,
    CheckCircle,
} from '@mui/icons-material';
import type { WorkflowPhase, NaCategory } from './types';

// ─── Workflow phases ─────────────────────────────────────────────────

export const WORKFLOW_PHASES: WorkflowPhase[] = [
    {
        id: 'needs-assessment',
        name: 'Needs Assessment',
        icon: Assignment,
        color: '#3b82f6',
        description: 'Initial requirements gathering',
        tasks: ['Review Inquiry', 'Initial Contact', 'Assess Requirements'],
        sectionId: 'needs-assessment-section',
    },
    {
        id: 'estimates',
        name: 'Estimates',
        icon: AttachMoney,
        color: '#10b981',
        description: 'Financial estimation',
        tasks: ['Draft Estimate', 'Internal Review', 'Send Estimate'],
        sectionId: 'estimates-section',
    },
    {
        id: 'calls',
        name: 'Discovery Calls',
        icon: Phone,
        color: '#f59e0b',
        description: 'Client meetings and discovery',
        tasks: ['Schedule Call', 'Conduct Discovery Call', 'Log Meeting Notes'],
        sectionId: 'calls-section',
    },
    {
        id: 'proposals',
        name: 'Proposals',
        icon: Description,
        color: '#8b5cf6',
        description: 'Project proposal creation',
        tasks: ['Draft Proposal', 'Select Assets', 'Send Proposal'],
        sectionId: 'proposals-section',
    },
    {
        id: 'consultation',
        name: 'Consultation',
        icon: CalendarToday,
        color: '#ec4899',
        description: 'In-depth consultation',
        tasks: ['Prepare Agenda', 'Consultation Meeting', 'Post-Consultation Summary'],
        sectionId: 'consultation-section',
    },
    {
        id: 'quotes',
        name: 'Quotes',
        icon: AttachMoney,
        color: '#ef4444',
        description: 'Detailed quoting',
        tasks: ['Generate Quote', 'Review Terms', 'Send for Approval'],
        sectionId: 'quotes-section',
    },
    {
        id: 'contracts',
        name: 'Contracts',
        icon: Gavel,
        color: '#6366f1',
        description: 'Legal agreements',
        tasks: ['Draft Contract', 'Legal Check', 'Send for Signature'],
        sectionId: 'contracts-section',
    },
    {
        id: 'approval',
        name: 'Client Approval',
        icon: CheckCircle,
        color: '#14b8a6',
        description: 'Final sign-off',
        tasks: ['Verify Signature', 'Process Deposit', 'Project Kickoff'],
        sectionId: 'approval-section',
    },
];

// ─── Needs assessment grouping categories ────────────────────────────

export const NA_CATEGORIES: NaCategory[] = [
    { label: 'Contact', keys: ['contact_first_name', 'contact_last_name', 'contact_email', 'contact_phone'] },
    { label: 'Event', keys: ['wedding_date', 'venue_details', 'event_type', 'stakeholders'] },
    { label: 'Coverage', keys: ['coverage_hours', 'deliverables', 'add_ons', 'selected_package'] },
    { label: 'Budget', keys: ['budget_range', 'budget_flexible', 'priority_level'] },
    { label: 'Timeline', keys: ['decision_timeline', 'booking_date'] },
    { label: 'Communication', keys: ['preferred_contact_method', 'preferred_contact_time', 'lead_source'] },
    { label: 'Discovery Call', keys: ['discovery_call_method', 'discovery_call_date', 'discovery_call_time'] },
    { label: 'Notes', keys: ['notes', 'additional_notes', 'special_requests'] },
];
