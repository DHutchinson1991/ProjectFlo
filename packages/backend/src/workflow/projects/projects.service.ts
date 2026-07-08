import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { project_phase } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
    private readonly logger = new Logger(ProjectsService.name);

    constructor(private prisma: PrismaService) { }

    async createProject(createProjectDto: CreateProjectDto, brandId: number) {
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
                phase: (createProjectDto.phase as project_phase) || 'Booking',
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

    async updateProject(id: number, updateProjectDto: UpdateProjectDto, brandId: number) {
        // Check if project exists
        const existingProject = await this.prisma.projects.findFirst({
            where: { id, brand_id: brandId },
        });

        if (!existingProject) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        return this.prisma.projects.update({
            where: { id },
            data: {
                ...(updateProjectDto.project_name !== undefined && { project_name: updateProjectDto.project_name }),
                ...(updateProjectDto.wedding_date && { wedding_date: new Date(updateProjectDto.wedding_date) }),
                ...(updateProjectDto.booking_date && { booking_date: new Date(updateProjectDto.booking_date) }),
                ...(updateProjectDto.edit_start_date && { edit_start_date: new Date(updateProjectDto.edit_start_date) }),
                ...(updateProjectDto.delivery_date && { delivery_date: new Date(updateProjectDto.delivery_date) }),
                ...(updateProjectDto.phase && { phase: updateProjectDto.phase }),
                ...(updateProjectDto.status && { status: updateProjectDto.status }),
                ...(updateProjectDto.notes !== undefined && { notes: updateProjectDto.notes }),
                ...(updateProjectDto.guest_count !== undefined && { guest_count: updateProjectDto.guest_count }),
                ...(updateProjectDto.event_type_id !== undefined && { event_type_id: updateProjectDto.event_type_id }),
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

    async deleteProject(id: number, brandId: number) {
        // Check if project exists
        const existingProject = await this.prisma.projects.findFirst({
            where: { id, brand_id: brandId },
        });

        if (!existingProject) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        return this.prisma.$transaction(async (tx) => {
            // Remove generated task rows tied to this project before archiving it.
            await tx.project_tasks.deleteMany({
                where: { project_id: id },
            });

            // Soft delete by setting archived_at.
            return tx.projects.update({
                where: { id },
                data: {
                    archived_at: new Date(),
                },
            });
        });
    }

    /**
     * DEV/TESTING: Revert a project back to its source inquiry.
     * Reverses the convertInquiryToProject flow.
     */
    async revertToInquiry(projectId: number, brandId: number) {
        return this.prisma.$transaction(async (tx) => {
            const project = await tx.projects.findFirst({
                where: { id: projectId, brand_id: brandId },
            });
            if (!project) throw new NotFoundException(`Project ${projectId} not found`);
            if (!project.inquiry_id) throw new NotFoundException('No source inquiry linked to this project');

            const inquiryId = project.inquiry_id;

            // Move financial/workflow records back to inquiry-only (clear project_id)
            await tx.proposals.updateMany({ where: { project_id: projectId }, data: { project_id: null } });
            await tx.estimates.updateMany({ where: { project_id: projectId }, data: { project_id: null } });
            await tx.quotes.updateMany({ where: { project_id: projectId }, data: { project_id: null } });
            await tx.invoices.updateMany({ where: { project_id: projectId }, data: { project_id: null } });
            await tx.contracts.updateMany({ where: { project_id: projectId }, data: { project_id: null } });
            await tx.inquiry_tasks.updateMany({ where: { project_id: projectId }, data: { project_id: null } });

            // Transfer schedule ownership back to inquiry
            await tx.projectEventDay.updateMany({ where: { project_id: projectId }, data: { project_id: null, inquiry_id: inquiryId } });
            await tx.projectFilm.updateMany({ where: { project_id: projectId }, data: { project_id: null, inquiry_id: inquiryId } });

            // Delete project-generated tasks
            await tx.project_tasks.deleteMany({ where: { project_id: projectId } });

            // Delete the client record that was created during conversion
            if (project.client_id) {
                await tx.clients.deleteMany({ where: { id: project.client_id, inquiry_id: inquiryId } });
            }

            // Restore inquiry: un-archive, restore status and portal_token
            await tx.inquiries.update({
                where: { id: inquiryId },
                data: {
                    status: 'New',
                    archived_at: null,
                    portal_token: project.portal_token,
                },
            });

            // Downgrade contact back to Client_Lead
            if (project.contact_id) {
                await tx.contacts.update({ where: { id: project.contact_id }, data: { type: 'Client_Lead' } });
            }

            // Delete the project
            await tx.projects.delete({ where: { id: projectId } });

            this.logger.log(`Reverted project ${projectId} → inquiry ${inquiryId}`);
            return { inquiryId };
        });
    }
}
