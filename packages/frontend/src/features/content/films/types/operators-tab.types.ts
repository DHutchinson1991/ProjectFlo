export interface EquipmentRecord {
  id: number;
  equipment_id: number;
  is_primary: boolean;
  equipment?: {
    id: number;
    item_name: string;
    model?: string | null;
    type?: string;
    category?: string;
  };
}

export interface PackageCrewSlot {
  id: number;
  package_id: number;
  event_day_template_id: number;
  crew_member_id?: number | null;
  label?: string | null;
  job_role_id?: number | null;
  hours: number;
  order_index: number;
  crew_member?: {
    id: number;
    crew_color?: string | null;
    contact: { id: number; first_name?: string | null; last_name?: string | null; email: string };
  } | null;
  job_role?: { id: number; name: string; display_name?: string | null } | null;
  equipment: EquipmentRecord[];
  event_day?: { id: number; name: string };
}

export interface TrackRecord {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  crew_member_id: number | null;
  crew_member: { id: number; crew_color?: string | null; contact: { first_name?: string | null; last_name?: string | null } } | null;
}

export interface FilmOperatorsTabProps {
  filmId: number;
  packageId?: number | null;
}
