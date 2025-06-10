import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Corrected path
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    return this.prisma.roles.create({ data: createRoleDto });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.roles.findMany();
  }

  async findOne(id: number): Promise<Role | null> {
    return this.prisma.roles.findUnique({ where: { id } });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role | null> {
    return this.prisma.roles.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async remove(id: number): Promise<Role | null> {
    return this.prisma.roles.delete({ where: { id } });
  }
}
