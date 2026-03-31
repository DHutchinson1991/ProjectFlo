import type { OutputData } from '@editorjs/editorjs';

export type ProposalClientResponse = 'Accepted' | 'ChangesRequested';

export interface ProposalContactSummary {
  first_name: string;
  last_name: string;
  email: string;
}

export interface ProposalInquirySummary {
  id: number;
  contact: ProposalContactSummary;
}

export interface ProposalInquiryHeader {
  id: number;
  contact: ProposalContactSummary;
}

export interface ProposalProjectSummary {
  id: number;
  project_name?: string | null;
}

export interface ProposalSectionView {
  section_type: string;
  viewed_at: Date;
  duration_seconds: number;
}

export interface ProposalSectionNote {
  section_type: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalContractSignerSummary {
  status: string;
  viewed_at: Date | null;
  signed_at: Date | null;
}

export interface ProposalContractSummary {
  id: number;
  status: string;
  sent_at: Date | null;
  signed_date: Date | null;
  signers: ProposalContractSignerSummary[];
}

export interface Proposal {
  id: number;
  inquiry_id: number;
  project_id: number | null;
  title: string;
  content: OutputData | Record<string, unknown> | null;
  status: string;
  version: number;
  sent_at: Date | null;
  share_token: string | null;
  client_response: string | null;
  client_response_at: Date | null;
  client_response_message: string | null;
  viewed_at: Date | null;
  view_count: number;
  created_at: Date;
  updated_at: Date;
  inquiry?: ProposalInquirySummary;
  project?: ProposalProjectSummary | null;
  section_views?: ProposalSectionView[];
  section_notes?: ProposalSectionNote[];
  contract?: ProposalContractSummary | null;
}

export interface CreateProposalData {
  title?: string;
  content?: OutputData;
  status?: string;
  version?: number;
}

export interface UpdateProposalData {
  title?: string;
  content?: OutputData;
  status?: string;
  version?: number;
}

export interface ProposalApiResponse {
  id: number;
  inquiry_id: number;
  project_id: number | null;
  title: string;
  content: Record<string, unknown> | null;
  status: string;
  version: number;
  sent_at: string | null;
  share_token: string | null;
  client_response: string | null;
  client_response_at: string | null;
  client_response_message: string | null;
  viewed_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  inquiry?: {
    id: number;
    contact?: ProposalContactSummary;
    contracts?: Array<{
      id: number;
      status: string;
      sent_at: string | null;
      signed_date: string | null;
      signers: Array<{ status: string; viewed_at: string | null; signed_at: string | null }>;
    }>;
  };
  project?: ProposalProjectSummary | null;
  section_views?: Array<{ section_type: string; viewed_at: string; duration_seconds: number }>;
  section_notes?: Array<{ section_type: string; note: string; created_at: string; updated_at: string }>;
}

export interface PublicPackageItem {
  description: string;
  price: number;
  type?: string;
}

export interface PublicPackage {
  id: number;
  name: string;
  description: string | null;
  currency: string;
  contents?: {
    items?: PublicPackageItem[];
    [key: string]: unknown;
  } | null;
}

export interface PublicProposalInquiry {
  id: number;
  wedding_date: string | null;
  venue_details: string | null;
  venue_address: string | null;
  contact: ProposalContactSummary;
  estimates: PublicProposalEstimate[];
  selected_package: PublicPackage | null;
  schedule_event_days: PublicProposalEventDay[];
  schedule_films: PublicProposalFilm[];
}

export interface PublicProposal {
  id: number;
  title: string;
  status: string;
  content: PublicProposalContent | null;
  sent_at: string | null;
  client_response: string | null;
  client_response_at: string | null;
  client_response_message: string | null;
  inquiry: PublicProposalInquiry;
  brand: PublicProposalBrand | null;
  section_notes?: ProposalSectionNote[];
}

export interface ProposalShareTokenResponse {
  share_token: string;
}

export interface PublicProposalBrand {
  id: number;
  name: string;
  display_name: string | null;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  logo_url: string | null;
  currency?: string | null;
}

export interface PublicProposalSection {
  id: string;
  type: string;
  isVisible: boolean;
  data: Record<string, unknown>;
}

export interface PublicProposalContent {
  theme?: string;
  meta?: {
    personalVideoUrl?: string;
    expirationDate?: string;
    customCss?: string;
  };
  sections?: PublicProposalSection[];
}

export interface PublicProposalEstimateItem {
  id: number;
  category: string | null;
  description: string;
  quantity: string | number;
  unit: string | null;
  unit_price: string | number;
}

export interface PublicProposalEstimate {
  id: number;
  estimate_number: string;
  title: string | null;
  total_amount: string | number;
  tax_rate: string | number | null;
  deposit_required: string | number | null;
  notes: string | null;
  terms?: string | null;
  items: PublicProposalEstimateItem[];
}

export interface PublicProposalMoment {
  id: number;
  name: string;
  order_index: number;
  duration_seconds: number;
  is_required: boolean;
}

export interface PublicProposalCrewSlotEquipment {
  equipment: {
    id: number;
    item_name: string;
  };
}

export interface PublicProposalCrewSlot {
  id: number;
  order_index: number;
  label: string | null;
  crew_id: number | null;
  confirmed: boolean;
  crew: {
    contact: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
  job_role: {
    name: string;
    display_name: string | null;
    on_site: boolean;
    category: string | null;
  };
  equipment: PublicProposalCrewSlotEquipment[];
  activity_assignments: { project_activity_id: number }[];
}

export interface PublicProposalActivity {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  order_index: number;
  notes: string | null;
  moments: PublicProposalMoment[];
  location_assignments?: {
    project_location_slot: {
      name: string | null;
      location: { name: string; address_line1: string | null } | null;
    };
  }[];
}

export interface PublicProposalSubject {
  id: number;
  name: string;
  real_name: string | null;
  count: number | null;
  category: string;
  order_index: number;
}

export interface PublicProposalLocationSlot {
  id: number;
  name: string | null;
  address: string | null;
  order_index: number;
  location: {
    name: string;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
}

export interface PublicProposalEventDay {
  id: number;
  name: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  order_index: number;
  activities: PublicProposalActivity[];
  subjects: PublicProposalSubject[];
  location_slots: PublicProposalLocationSlot[];
  day_crew_slots?: PublicProposalCrewSlot[];
}

export interface PublicProposalFilm {
  id: number;
  order_index: number;
  film: {
    id: number;
    name: string;
    film_type: string;
    target_duration_min: number | null;
    target_duration_max: number | null;
    _count?: { scenes: number };
    scenes?: {
      id: number;
      name: string;
      order_index: number;
      duration_seconds: number | null;
      mode: string;
      moments?: { id: number; name: string; order_index: number; duration: number }[];
      location_assignment?: { location: { name: string; address_line1: string | null } } | null;
    }[];
    equipment_assignments?: {
      quantity: number;
      equipment: { item_name: string; category: string | null };
    }[];
  };
}