-- Rename CONSULTATION to PROPOSAL_REVIEW in calendar_event_type enum
ALTER TYPE "calendar_event_type" RENAME VALUE 'CONSULTATION' TO 'PROPOSAL_REVIEW';
