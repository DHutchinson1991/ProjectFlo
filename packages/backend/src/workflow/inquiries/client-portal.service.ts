import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientPortalDataService } from './services/client-portal-data.service';
import { ClientPortalActionsService } from './services/client-portal-actions.service';

@Injectable()
export class ClientPortalService {
    constructor(
        private readonly dataService: ClientPortalDataService,
        private readonly actionsService: ClientPortalActionsService,
    ) {}

    getOrCreatePortalToken(inquiryId: number, brandId: number): Promise<string> {
        return this.actionsService.getOrCreatePortalToken(inquiryId, brandId);
    }

    getPortalByToken(token: string) {
        return this.dataService.getPortalByToken(token);
    }

    getPackageOptions(token: string) {
        return this.actionsService.getPackageOptions(token);
    }

    submitPackageRequest(
        token: string,
        data: { selected_package_id?: number; customisations?: Prisma.InputJsonValue; notes?: string },
    ) {
        return this.actionsService.submitPackageRequest(token, data);
    }

    respondToProposalByPortalToken(token: string, response: string, message?: string) {
        return this.actionsService.respondToProposalByPortalToken(token, response, message);
    }

    getPaymentsData(token: string, preview = false) {
        return this.dataService.getPaymentsDataByToken(token, preview);
    }

    saveSectionNote(token: string, sectionType: string, note: string) {
        return this.dataService.saveSectionNote(token, sectionType, note);
    }

    getPaymentScheduleOptions(token: string) {
        return this.dataService.getPaymentScheduleOptions(token);
    }
}
