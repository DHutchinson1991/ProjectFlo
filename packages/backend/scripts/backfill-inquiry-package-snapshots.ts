import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InquiriesService } from '../src/inquiries/inquiries.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    try {
        const prisma = app.get(PrismaService);
        const inquiriesService = app.get(InquiriesService);

        const brokenInquiries = await prisma.inquiries.findMany({
            where: {
                selected_package_id: { not: null },
                source_package_id: null,
            },
            select: {
                id: true,
                selected_package_id: true,
            },
            orderBy: { id: 'asc' },
        });

        if (brokenInquiries.length === 0) {
            console.log('No legacy inquiries need package snapshot backfill.');
            return;
        }

        for (const inquiry of brokenInquiries) {
            if (!inquiry.selected_package_id) continue;

            console.log(`Backfilling inquiry ${inquiry.id} from package ${inquiry.selected_package_id}...`);
            await inquiriesService.handlePackageSelection(inquiry.id, inquiry.selected_package_id, 0);
        }

        console.log(`Backfilled ${brokenInquiries.length} inquiry package snapshot(s).`);
    } finally {
        await app.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});