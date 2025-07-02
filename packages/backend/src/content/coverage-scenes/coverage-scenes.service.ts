import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCoverageSceneDto } from './dto/create-coverage-scene.dto';
import { UpdateCoverageSceneDto } from './dto/update-coverage-scene.dto';

@Injectable()
export class CoverageScenes {
  constructor(private prisma: PrismaService) { }

  async create(createCoverageSceneDto: CreateCoverageSceneDto) {
    try {
      return await (this.prisma as any).coverage.create({
        data: createCoverageSceneDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Coverage scene with this name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return (this.prisma as any).coverage.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const coverageScene = await (this.prisma as any).coverage.findUnique({
      where: { id },
    });

    if (!coverageScene) {
      throw new NotFoundException(`Coverage scene with ID ${id} not found`);
    }

    return coverageScene;
  }

  async update(id: number, updateCoverageSceneDto: UpdateCoverageSceneDto) {
    try {
      return await (this.prisma as any).coverage.update({
        where: { id },
        data: updateCoverageSceneDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Coverage scene with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Coverage scene with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await (this.prisma as any).coverage.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Coverage scene with ID ${id} not found`);
      }
      if (error.code === 'P2003') {
        throw new ConflictException('Cannot delete coverage scene as it is referenced by other records');
      }
      throw error;
    }
  }
}