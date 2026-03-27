import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSubjectRolesDto } from './dto/create-subject-role.dto';
import { UpdateSubjectRoleDto } from './dto/update-subject-role.dto';

@Injectable()
export class SubjectRolesService {
    constructor(private prisma: PrismaService) { }

    async getSubjectRoles(brandId: number) {
        return this.prisma.subjectRole.findMany({
            where: { brand_id: brandId },
            orderBy: [{ order_index: 'asc' }, { role_name: 'asc' }],
        });
    }

    async createSubjectRoles(brandId: number, dto: CreateSubjectRolesDto) {
        const brand = await this.prisma.brands.findUnique({ where: { id: brandId } });
        if (!brand) throw new NotFoundException(`Brand with ID ${brandId} not found`);

        const rolesToCreate = dto.roles?.length
            ? dto.roles
            : [{
                role_name: dto.role_name,
                description: dto.description,
                is_core: dto.is_core,
                is_group: dto.is_group,
                order_index: dto.order_index,
            }];

        const rolesCount = await this.prisma.subjectRole.count({ where: { brand_id: brandId } });

        const created: Array<{
            id: number;
            brand_id: number;
            role_name: string;
            description: string | null;
            is_core: boolean;
            is_group: boolean;
            never_group: boolean;
            order_index: number;
            created_at: Date;
            updated_at: Date;
        }> = [];

        for (let i = 0; i < rolesToCreate.length; i++) {
            const roleData = rolesToCreate[i];
            if (!roleData.role_name) throw new BadRequestException('role_name is required');

            const existing = await this.prisma.subjectRole.findFirst({
                where: { brand_id: brandId, role_name: roleData.role_name },
            });
            if (existing) throw new BadRequestException(`Role "${roleData.role_name}" already exists for this brand`);

            const role = await this.prisma.subjectRole.create({
                data: {
                    brand_id: brandId,
                    role_name: roleData.role_name,
                    description: roleData.description,
                    is_core: roleData.is_core ?? false,
                    is_group: roleData.is_group ?? false,
                    order_index: roleData.order_index ?? (rolesCount + i),
                },
            });
            created.push(role);
        }
        return created;
    }

    async updateSubjectRole(roleId: number, dto: UpdateSubjectRoleDto) {
        const role = await this.prisma.subjectRole.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException(`Subject role with ID ${roleId} not found`);
        return this.prisma.subjectRole.update({
            where: { id: roleId },
            data: {
                role_name: dto.role_name ?? role.role_name,
                description: dto.description ?? role.description,
                is_core: dto.is_core ?? role.is_core,
            },
        });
    }

    async deleteSubjectRole(roleId: number) {
        const role = await this.prisma.subjectRole.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException(`Subject role with ID ${roleId} not found`);
        await this.prisma.subjectRole.delete({ where: { id: roleId } });
        return { message: 'Subject role deleted successfully' };
    }
}
