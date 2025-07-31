import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/clients.dto';
import { $Enums } from '@prisma/client';

@Injectable()
export class ClientsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(brandId: number) {
        const clients = await this.prisma.clients.findMany({
            where: {
                archived_at: null,
                contact: {
                    brand_id: brandId,
                },
            },
            include: {
                contact: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                projects: {
                    where: {
                        archived_at: null,
                    },
                    select: {
                        project_name: true,
                        wedding_date: true,
                    },
                    orderBy: {
                        wedding_date: 'desc',
                    },
                    take: 1, // Get the most recent project
                },
            },
            orderBy: {
                id: 'desc',
            },
        });

        return clients.map((client) => {
            const latestProject = client.projects[0];
            return {
                id: client.id,
                contact: {
                    id: client.contact_id,
                    first_name: client.contact.first_name,
                    last_name: client.contact.last_name,
                    email: client.contact.email,
                    phone_number: client.contact.phone_number,
                },
                contact_id: client.contact_id,
                latest_project_name: latestProject?.project_name || null,
                latest_wedding_date: latestProject?.wedding_date || null,
            };
        });
    }

    async findOne(id: number, brandId: number) {
        const client = await this.prisma.clients.findFirst({
            where: {
                id,
                archived_at: null,
                contact: {
                    brand_id: brandId,
                },
            },
            include: {
                contact: true, // Include all contact fields
                projects: {   // Include all projects, not just the latest
                    where: { archived_at: null },
                    orderBy: { wedding_date: 'desc' },
                },
                inquiry: {      // **NEW**: Include the original inquiry details
                    include: {
                        contact: true // So we have inquiry-time contact info if needed
                    }
                }
            },
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found`);
        }

        // No need to map the data here; return the rich object directly.
        // The frontend mapper will handle it.
        return client;
    }

    async create(createClientDto: CreateClientDto, brandId: number) {
        const { email, ...contactData } = createClientDto;

        // Use upsert to handle cases where a contact with that email might already exist
        const contact = await this.prisma.contacts.upsert({
            where: { email },
            update: { ...contactData, type: $Enums.contacts_type.Client },
            create: {
                email,
                ...contactData,
                brand_id: brandId,
                type: $Enums.contacts_type.Client,
            },
        });

        const client = await this.prisma.clients.create({
            data: {
                contact_id: contact.id,
            },
            include: { contact: true }
        });

        return this.findOne(client.id, brandId); // Reuse findOne to return a consistent shape
    }

    async update(id: number, updateClientDto: UpdateClientDto, brandId: number) {
        const client = await this.prisma.clients.findFirst({
            where: { id, contact: { brand_id: brandId } },
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found.`);
        }

        await this.prisma.contacts.update({
            where: { id: client.contact_id },
            data: updateClientDto,
        });

        return this.findOne(id, brandId);
    }

    async remove(id: number, brandId: number) {
        const client = await this.prisma.clients.findFirst({
            where: { id, contact: { brand_id: brandId } },
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found.`);
        }

        await this.prisma.clients.update({
            where: { id },
            data: { archived_at: new Date() },
        });

        return { message: 'Client archived successfully' };
    }
}
