import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  AssignEquipmentDto,
  UpdateEquipmentAssignmentDto,
  FilmEquipmentResponseDto,
  EquipmentSummaryDto,
} from '../dto/film-equipment-assignment.dto';

/**
 * Manages film ↔ equipment-library assignments (FilmEquipmentAssignment records).
 * Split from FilmEquipmentService to keep each service within size limits.
 */
@Injectable()
export class FilmEquipmentAssignmentsService {
  private readonly logger = new Logger(FilmEquipmentAssignmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFilmEquipment(filmId: number): Promise<FilmEquipmentResponseDto[]> {
    const assignments = await this.prisma.filmEquipmentAssignment.findMany({
      where: { film_id: filmId },
      include: { equipment: true },
      orderBy: { assigned_at: 'asc' },
    });
    return assignments.map((a) => this.mapAssignment(a));
  }

  async getEquipmentSummary(filmId: number): Promise<EquipmentSummaryDto> {
    const equipment = await this.prisma.filmEquipmentAssignment.findMany({
      where: { film_id: filmId },
      include: { equipment: true },
    });

    const summary = { cameras: 0, audio: 0, music: 0, lighting: 0, other: 0 };
    for (const item of equipment) {
      const category = item.equipment.category.toLowerCase();
      const qty = item.quantity;
      if (category === 'camera') summary.cameras += qty;
      else if (category === 'audio') summary.audio += qty;
      else if (category === 'lighting') summary.lighting += qty;
      else summary.other += qty;
    }
    return summary;
  }

  async assignEquipment(filmId: number, dto: AssignEquipmentDto): Promise<FilmEquipmentResponseDto> {
    const film = await this.prisma.film.findUnique({ where: { id: filmId } });
    if (!film) throw new NotFoundException(`Film with ID ${filmId} not found`);

    const equipment = await this.prisma.equipment.findUnique({ where: { id: dto.equipment_id } });
    if (!equipment) throw new NotFoundException(`Equipment with ID ${dto.equipment_id} not found`);
    if (equipment.availability_status !== 'AVAILABLE') {
      throw new BadRequestException(
        `Equipment "${equipment.item_name}" is not available (status: ${equipment.availability_status})`,
      );
    }

    const existing = await this.prisma.filmEquipmentAssignment.findUnique({
      where: { film_id_equipment_id: { film_id: filmId, equipment_id: dto.equipment_id } },
    });
    if (existing) {
      throw new BadRequestException(
        `Equipment "${equipment.item_name}" is already assigned to this film`,
      );
    }

    const assignment = await this.prisma.filmEquipmentAssignment.create({
      data: { film_id: filmId, equipment_id: dto.equipment_id, quantity: dto.quantity, notes: dto.notes },
      include: { equipment: true },
    });

    this.logger.log('Equipment assigned to film', {
      filmId,
      equipmentId: dto.equipment_id,
      equipmentName: equipment.item_name,
    });

    return this.mapAssignment(assignment);
  }

  async updateEquipmentAssignment(
    filmId: number,
    equipmentId: number,
    dto: UpdateEquipmentAssignmentDto,
  ): Promise<FilmEquipmentResponseDto> {
    const existing = await this.prisma.filmEquipmentAssignment.findUnique({
      where: { film_id_equipment_id: { film_id: filmId, equipment_id: equipmentId } },
    });
    if (!existing) throw new NotFoundException('Equipment assignment not found');

    const updated = await this.prisma.filmEquipmentAssignment.update({
      where: { film_id_equipment_id: { film_id: filmId, equipment_id: equipmentId } },
      data: { quantity: dto.quantity ?? existing.quantity, notes: dto.notes ?? existing.notes },
      include: { equipment: true },
    });

    this.logger.log('Equipment assignment updated', { filmId, equipmentId, changes: dto });
    return this.mapAssignment(updated);
  }

  async removeEquipmentAssignment(filmId: number, equipmentId: number): Promise<void> {
    const assignment = await this.prisma.filmEquipmentAssignment.findUnique({
      where: { film_id_equipment_id: { film_id: filmId, equipment_id: equipmentId } },
      include: { equipment: true },
    });
    if (!assignment) throw new NotFoundException('Equipment assignment not found');

    await this.prisma.filmEquipmentAssignment.delete({
      where: { film_id_equipment_id: { film_id: filmId, equipment_id: equipmentId } },
    });

    this.logger.log('Equipment assignment removed', {
      filmId,
      equipmentId,
      equipmentName: assignment.equipment.item_name,
    });
  }

  private mapAssignment(
    assignment: Prisma.FilmEquipmentAssignmentGetPayload<{ include: { equipment: true } }>,
  ): FilmEquipmentResponseDto {
    return {
      id: assignment.id,
      film_id: assignment.film_id,
      equipment_id: assignment.equipment_id,
      quantity: assignment.quantity,
      notes: assignment.notes ?? undefined,
      assigned_at: assignment.assigned_at,
      equipment: {
        id: assignment.equipment.id,
        name: assignment.equipment.item_name,
        type: assignment.equipment.type,
        category: assignment.equipment.category,
        model: assignment.equipment.model ?? undefined,
        status: assignment.equipment.availability_status,
      },
    };
  }
}
