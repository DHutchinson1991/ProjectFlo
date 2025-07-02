import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) { }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    return this.prisma.roles.create({ data: createRoleDto });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.roles.findMany();
  }

  async findOne(id: number): Promise<Role | null> {
    const role = await this.prisma.roles.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role | null> {
    try {
      return await this.prisma.roles.update({
        where: { id },
        data: updateRoleDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Role with ID ${id} not found for update.`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<Role | null> {
    try {
      return await this.prisma.roles.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Role with ID ${id} not found for deletion.`);
      }
      throw error;
    }
  }
}
