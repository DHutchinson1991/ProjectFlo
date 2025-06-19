import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCoverageSceneDto } from './dto/create-coverage-scene.dto';
import { UpdateCoverageSceneDto } from './dto/update-coverage-scene.dto';
import { coverage_scenes } from '@prisma/client';

@Injectable()
export class CoverageScenes {
  constructor(private prisma: PrismaService) {}

  async create(createCoverageSceneDto: CreateCoverageSceneDto): Promise<coverage_scenes> {
    try {
      return await this.prisma.coverage_scenes.create({
        data: createCoverageSceneDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Coverage scene with this name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<coverage_scenes[]> {
    return this.prisma.coverage_scenes.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number): Promise<coverage_scenes> {
    const coverageScene = await this.prisma.coverage_scenes.findUnique({
      where: { id },
    });

    if (!coverageScene) {
      throw new NotFoundException(`Coverage scene with ID ${id} not found`);
    }

    return coverageScene;
  }

  async update(id: number, updateCoverageSceneDto: UpdateCoverageSceneDto): Promise<coverage_scenes> {
    try {
      return await this.prisma.coverage_scenes.update({
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
      await this.prisma.coverage_scenes.delete({
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