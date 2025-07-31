import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityLogDto, UpdateActivityLogDto } from './activity-log.entity';

@Injectable()
export class ActivityLogsService {
    constructor(private prisma: PrismaService) { }

    async create(createActivityLogDto: CreateActivityLogDto) {
        return this.prisma.activity_logs.create({
            data: createActivityLogDto,
        });
    }

    async findAll() {
        return this.prisma.activity_logs.findMany({
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findByInquiry(inquiryId: number) {
        return this.prisma.activity_logs.findMany({
            where: {
                inquiry_id: inquiryId,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.activity_logs.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateActivityLogDto: UpdateActivityLogDto) {
        return this.prisma.activity_logs.update({
            where: { id },
            data: updateActivityLogDto,
        });
    }

    async remove(id: number) {
        return this.prisma.activity_logs.delete({
            where: { id },
        });
    }

    // Helper method to log common activity types
    async logStatusChange(inquiryId: number, oldStatus: string, newStatus: string) {
        return this.create({
            inquiry_id: inquiryId,
            type: 'StatusChange',
            description: `Status changed from ${oldStatus} to ${newStatus}`,
        });
    }

    async logDocumentSent(inquiryId: number, documentType: string, documentId: number) {
        return this.create({
            inquiry_id: inquiryId,
            type: 'DocumentSent',
            description: `${documentType} #${documentId} sent to client`,
        });
    }

    async logNote(inquiryId: number, note: string) {
        return this.create({
            inquiry_id: inquiryId,
            type: 'Note',
            description: note,
        });
    }

    async logCall(inquiryId: number, duration: string, notes?: string) {
        const description = notes
            ? `Call logged (${duration}): ${notes}`
            : `Call logged (${duration})`;

        return this.create({
            inquiry_id: inquiryId,
            type: 'CallLogged',
            description,
        });
    }
}
