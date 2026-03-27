import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class ProjectQueryService {
    constructor(private readonly prisma: PrismaService) { }

    async getAllProjects(brandId?: number) {
        const where = brandId ? { brand_id: brandId } : {};

        return this.prisma.projects.findMany({
            where: {
                ...where,
                archived_at: null,
            },
            orderBy: {
                project_name: 'asc',
            },
            select: {
                id: true,
                project_name: true,
                wedding_date: true,
                booking_date: true,
                edit_start_date: true,
                phase: true,
                brand_id: true,
                client_id: true,
                workflow_template_id: true,
            },
        });
    }

    async getProjectById(id: number, brandId?: number) {
        const project = await this.prisma.projects.findFirst({
            where: { id, brand_id: brandId },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                        display_name: true,
                    },
                },
                client: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                phone_number: true,
                            },
                        },
                    },
                },
                workflow_template: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                proposals: {
                    orderBy: {
                        created_at: 'desc',
                    },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
                contracts: {
                    orderBy: {
                        id: 'desc',
                    },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        sent_at: true,
                        signed_date: true,
                    },
                },
                documents: {
                    orderBy: {
                        upload_date: 'desc',
                    },
                    select: {
                        id: true,
                        file_name: true,
                        file_path: true,
                        upload_date: true,
                        document_type: true,
                        status: true,
                    },
                },
                invoices: {
                    orderBy: {
                        issue_date: 'desc',
                    },
                    select: {
                        id: true,
                        invoice_number: true,
                        amount: true,
                        amount_paid: true,
                        status: true,
                        issue_date: true,
                        due_date: true,
                    },
                },
            },
        });

        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        return project;
    }
}
