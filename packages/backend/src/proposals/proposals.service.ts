import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposals.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProposalsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAllByInquiry(inquiryId: number, brandId: number) {
        // First verify the inquiry belongs to the brand
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                contact: {
                    brand_id: brandId,
                },
            },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);
        }

        return this.prisma.proposals.findMany({
            where: {
                inquiry_id: inquiryId,
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                brand_id: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findOne(id: number, inquiryId: number, brandId: number) {
        // First verify the inquiry belongs to the brand
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                contact: {
                    brand_id: brandId,
                },
            },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);
        }

        const proposal = await this.prisma.proposals.findFirst({
            where: {
                id,
                inquiry_id: inquiryId,
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                brand_id: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });

        if (!proposal) {
            throw new NotFoundException(`Proposal with ID ${id} not found`);
        }

        return proposal;
    }

    async create(inquiryId: number, createProposalDto: CreateProposalDto, brandId: number) {
        // First verify the inquiry belongs to the brand
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                contact: {
                    brand_id: brandId,
                },
            },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);
        }

        return this.prisma.proposals.create({
            data: {
                inquiry_id: inquiryId,
                title: createProposalDto.title || 'New Proposal',
                content: createProposalDto.content as Prisma.InputJsonValue,
                status: createProposalDto.status || 'Draft',
                version: createProposalDto.version || 1,
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });
    }

    async update(id: number, inquiryId: number, updateProposalDto: UpdateProposalDto, brandId: number) {
        // First verify the inquiry belongs to the brand and the proposal exists
        const existingProposal = await this.findOne(id, inquiryId, brandId);

        if (!existingProposal) {
            throw new NotFoundException(`Proposal with ID ${id} not found`);
        }

        return this.prisma.proposals.update({
            where: { id },
            data: {
                ...updateProposalDto,
                content: updateProposalDto.content as Prisma.InputJsonValue,
                updated_at: new Date(),
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });
    }

    async remove(id: number, inquiryId: number, brandId: number) {
        // First verify the inquiry belongs to the brand and the proposal exists
        const existingProposal = await this.findOne(id, inquiryId, brandId);

        if (!existingProposal) {
            throw new NotFoundException(`Proposal with ID ${id} not found`);
        }

        await this.prisma.proposals.delete({
            where: { id },
        });

        return { message: 'Proposal deleted successfully' };
    }

    async sendProposal(id: number, inquiryId: number, brandId: number) {
        // First verify the proposal exists and belongs to the inquiry/brand
        const proposal = await this.findOne(id, inquiryId, brandId);

        if (proposal.status === 'Sent') {
            throw new ForbiddenException('Proposal has already been sent');
        }

        return this.prisma.proposals.update({
            where: { id },
            data: {
                status: 'Sent',
                sent_at: new Date(),
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });
    }
}
