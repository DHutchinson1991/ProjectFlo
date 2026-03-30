import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';

@Injectable()
export class WorkflowsService {
    constructor(private prisma: PrismaService) {}

    async findAll(
        query: { brandId?: number; is_active?: boolean; is_default?: boolean },
        userId: number,
    ) {
        const userBrands = await this.getUserBrands(userId);
        const accessibleBrandIds = userBrands.map(ub => ub.brand_id);

        const where: Record<string, unknown> = {};

        if (query.brandId) {
            const brandIdNum =
                typeof query.brandId === 'string'
                    ? parseInt(query.brandId as string, 10)
                    : query.brandId;
            if (!accessibleBrandIds.includes(brandIdNum)) {
                throw new ForbiddenException('Access denied to this brand');
            }
            where.brand_id = brandIdNum;
        } else {
            where.brand_id = { in: accessibleBrandIds };
        }

        if (query.is_active !== undefined) where.is_active = query.is_active;
        if (query.is_default !== undefined) where.is_default = query.is_default;

        return this.prisma.workflow_templates.findMany({
            where,
            include: {
                brand: { select: { id: true, name: true } },
                _count: {
                    select: {
                        projects: true,
                        service_packages: true,
                        workflow_template_tasks: true,
                    },
                },
            },
            orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
        });
    }

    async findOne(id: number, userId: number) {
        const template = await this.prisma.workflow_templates.findUnique({
            where: { id },
            include: {
                brand: { select: { id: true, name: true } },
                workflow_template_tasks: {
                    where: { is_active: true },
                    orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
                    include: {
                        task_library: {
                            include: { brand: { select: { id: true, name: true } } },
                        },
                    },
                },
                _count: {
                    select: {
                        projects: true,
                        service_packages: true,
                        workflow_template_tasks: true,
                    },
                },
            },
        });

        if (!template) {
            throw new NotFoundException(`Workflow template ${id} not found`);
        }

        if (template.brand_id) {
            await this.checkBrandAccess(template.brand_id, userId);
        }

        return template;
    }

    async create(data: CreateWorkflowTemplateDto, userId: number) {
        await this.checkBrandAccess(data.brand_id, userId);

        return this.prisma.workflow_templates.create({
            data: {
                brand_id: data.brand_id,
                name: data.name,
                description: data.description,
                is_default: data.is_default ?? false,
            },
            include: {
                brand: { select: { id: true, name: true } },
                _count: {
                    select: {
                        projects: true,
                        service_packages: true,
                        workflow_template_tasks: true,
                    },
                },
            },
        });
    }

    async update(id: number, data: UpdateWorkflowTemplateDto, userId: number) {
        const template = await this.findOne(id, userId);
        if (template.brand_id) {
            await this.checkBrandAccess(template.brand_id, userId);
        }

        return this.prisma.workflow_templates.update({
            where: { id },
            data,
            include: {
                brand: { select: { id: true, name: true } },
                _count: {
                    select: {
                        projects: true,
                        service_packages: true,
                        workflow_template_tasks: true,
                    },
                },
            },
        });
    }

    async remove(id: number, userId: number) {
        await this.findOne(id, userId);
        return this.prisma.workflow_templates.delete({ where: { id } });
    }

    async checkBrandAccess(brandId: number, userId: number) {
        const crew = await this.prisma.crew.findUnique({
            where: { id: userId },
            include: {
                contact: {
                    include: {
                        user_account: { include: { system_role: true } },
                    },
                },
            },
        });

        if (crew?.contact.user_account?.system_role?.name === 'Global Admin') return true;

        const userBrand = await this.prisma.brandMember.findFirst({
            where: { crew_id: userId, brand_id: brandId, is_active: true },
        });

        if (!userBrand) {
            throw new ForbiddenException('Access denied to this brand');
        }
        return userBrand;
    }

    private async getUserBrands(userId: number) {
        const crew = await this.prisma.crew.findUnique({
            where: { id: userId },
            include: {
                contact: {
                    include: {
                        user_account: { include: { system_role: true } },
                    },
                },
            },
        });

        if (crew?.contact.user_account?.system_role?.name === 'Global Admin') {
            const allBrands = await this.prisma.brands.findMany({
                where: { is_active: true },
                select: { id: true, name: true },
            });
            return allBrands.map(brand => ({
                user_id: userId,
                brand_id: brand.id,
                brand,
            }));
        }

        return this.prisma.brandMember.findMany({
            where: { crew_id: userId, is_active: true },
            include: { brand: { select: { id: true, name: true } } },
        });
    }
}
