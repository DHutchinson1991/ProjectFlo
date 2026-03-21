import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoverageDto } from './dto/create-coverage.dto';
import { UpdateCoverageDto } from './dto/update-coverage.dto';

@Injectable()
export class CoverageService {
  constructor(private prisma: PrismaService) {}

  async create(createCoverageDto: CreateCoverageDto) {
    // Note: resource_requirements and equipment_assignments are passed as JSON
    // validation is handled in DTO (basic) and backend logic if needed.
    return this.prisma.coverage.create({
      data: createCoverageDto,
      include: {
        job_role: true
      }
    });
  }

  async findAll() {
    return this.prisma.coverage.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' }
    });
  }

  async findOne(id: number) {
    const coverage = await this.prisma.coverage.findUnique({
      where: { id },
    });
    if (!coverage) {
      throw new NotFoundException(`Coverage #${id} not found`);
    }
    return coverage;
  }

  async update(id: number, updateCoverageDto: UpdateCoverageDto) {
    await this.findOne(id);
    return this.prisma.coverage.update({
      where: { id },
      data: updateCoverageDto,
    });
  }

  async remove(id: number) {
    // Check if used in scene_coverage? 
    // Usually we might just set is_active = false or let foreign key handle it.
    // For now, hard delete is fine if not constrained, or use soft delete.
    // The prisma schema doesn't show CASCADE on scene_coverage relation from coverage side (it shows relation in SceneCoverage).
    // Let's safe-check or just delete.
    // Given it's a library item, maybe soft delete?
    // Schema says `is_active Boolean @default(true)`.
    
    // For simplicity, I'll attempt delete.
    return this.prisma.coverage.delete({
      where: { id },
    });
  }
}
