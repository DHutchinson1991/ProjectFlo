import { IsInt, IsString, IsOptional, Min } from 'class-validator';

/**
 * DTO for assigning equipment from the Equipment Library to a film
 */
export class AssignEquipmentDto {
  @IsInt()
  @Min(1)
  equipment_id: number;

  @IsInt()
  @Min(1)
  quantity: number = 1;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for updating an equipment assignment
 */
export class UpdateEquipmentAssignmentDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Response DTO for film equipment assignment
 */
export class FilmEquipmentResponseDto {
  id: number;
  film_id: number;
  equipment_id: number;
  quantity: number;
  notes?: string;
  assigned_at: Date;
  
  // Include equipment details
  equipment?: {
    id: number;
    name: string;
    type: string;
    category?: string;
    model?: string;
    status: string;
  };
}

/**
 * Summary of equipment assigned to a film (by type)
 */
export class EquipmentSummaryDto {
  cameras: number;
  audio: number;
  music: number;
  lighting: number;
  other: number;
}
