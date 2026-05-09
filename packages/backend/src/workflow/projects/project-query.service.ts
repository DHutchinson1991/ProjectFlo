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
                created_at: 'desc',
            },
            select: {
                id: true,
                project_name: true,
                wedding_date: true,
                booking_date: true,
                edit_start_date: true,
                delivery_date: true,
                phase: true,
                status: true,
                brand_id: true,
                client_id: true,
                contact_id: true,
                inquiry_id: true,
                guest_count: true,
                created_at: true,
                contact: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                source_package: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
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
                contact: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
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
                source_package: {
                    select: {
                        id: true,
                        name: true,
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
                estimates: {
                    orderBy: {
                        created_at: 'desc',
                    },
                    select: {
                        id: true,
                        estimate_number: true,
                        title: true,
                        status: true,
                        total_amount: true,
                        issue_date: true,
                        expiry_date: true,
                        is_primary: true,
                    },
                },
                quotes: {
                    orderBy: {
                        created_at: 'desc',
                    },
                    select: {
                        id: true,
                        quote_number: true,
                        title: true,
                        status: true,
                        total_amount: true,
                        issue_date: true,
                        expiry_date: true,
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
                        title: true,
                        amount: true,
                        amount_paid: true,
                        status: true,
                        issue_date: true,
                        due_date: true,
                    },
                },
                inquiry_tasks: {
                    orderBy: [
                        { order_index: 'asc' },
                    ],
                    include: {
                        subtasks: {
                            orderBy: { order_index: 'asc' },
                        },
                        assigned_to: {
                            select: {
                                id: true,
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                        job_role: {
                            select: {
                                id: true,
                                name: true,
                                display_name: true,
                            },
                        },
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
