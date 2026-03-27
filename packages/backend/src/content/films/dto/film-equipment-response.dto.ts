export class FilmEquipmentResponseDto {
  id: number;
  film_id: number;
  equipment_id: number;
  quantity: number;
  notes?: string;
  assigned_at: Date;

  equipment?: {
    id: number;
    name: string;
    type: string;
    category?: string;
    model?: string;
    status: string;
  };
}
