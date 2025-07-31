import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async getAllProjects(brandId?: number) {
        const where = brandId ? { brand_id: brandId } : {};

        return this.prisma.projects.findMany({
            where: {
                ...where,
                archived_at: null, // Only show non-archived projects
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

    async getProjectById(id: number) {
        const project = await this.prisma.projects.findUnique({
            where: { id },
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

    async createProject(createProjectDto: CreateProjectDto, brandId?: number) {
        // For simple project creation, we'll set a default wedding date if not provided
        const defaultWeddingDate = createProjectDto.wedding_date
            ? new Date(createProjectDto.wedding_date)
            : new Date(); // Use current date as default

        // Create a default client if client_id is not provided
        let clientId = createProjectDto.client_id;

        if (!clientId) {
            // Create a basic contact and client for standalone projects
            const defaultContact = await this.prisma.contacts.create({
                data: {
                    email: `project-${Date.now()}@placeholder.com`,
                    first_name: 'Project',
                    last_name: 'Client',
                    type: 'Client',
                    brand_id: brandId,
                },
            });

            const defaultClient = await this.prisma.clients.create({
                data: {
                    contact_id: defaultContact.id,
                },
            });

            clientId = defaultClient.id;
        }

        return this.prisma.projects.create({
            data: {
                project_name: createProjectDto.project_name,
                client_id: clientId,
                wedding_date: defaultWeddingDate,
                booking_date: createProjectDto.booking_date ? new Date(createProjectDto.booking_date) : null,
                edit_start_date: createProjectDto.edit_start_date ? new Date(createProjectDto.edit_start_date) : null,
                phase: createProjectDto.phase || 'Planning',
                brand_id: brandId,
                workflow_template_id: createProjectDto.workflow_template_id,
            },
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
            },
        });
    }

    async updateProject(id: number, updateProjectDto: UpdateProjectDto) {
        // Check if project exists
        const existingProject = await this.prisma.projects.findUnique({
            where: { id },
        });

        if (!existingProject) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        return this.prisma.projects.update({
            where: { id },
            data: {
                ...(updateProjectDto.project_name && { project_name: updateProjectDto.project_name }),
                ...(updateProjectDto.wedding_date && { wedding_date: new Date(updateProjectDto.wedding_date) }),
                ...(updateProjectDto.booking_date && { booking_date: new Date(updateProjectDto.booking_date) }),
                ...(updateProjectDto.edit_start_date && { edit_start_date: new Date(updateProjectDto.edit_start_date) }),
                ...(updateProjectDto.phase && { phase: updateProjectDto.phase }),
                ...(updateProjectDto.client_id && { client_id: updateProjectDto.client_id }),
                ...(updateProjectDto.workflow_template_id && { workflow_template_id: updateProjectDto.workflow_template_id }),
            },
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
            },
        });
    }

    async deleteProject(id: number) {
        // Check if project exists
        const existingProject = await this.prisma.projects.findUnique({
            where: { id },
        });

        if (!existingProject) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        // Soft delete by setting archived_at
        return this.prisma.projects.update({
            where: { id },
            data: {
                archived_at: new Date(),
            },
        });
    }
}
