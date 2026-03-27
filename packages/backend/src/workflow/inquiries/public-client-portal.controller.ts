import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    ValidationPipe,
} from '@nestjs/common';
import { ClientPortalService } from './client-portal.service';

@Controller('api/client-portal')
export class PublicClientPortalController {
    constructor(private readonly clientPortalService: ClientPortalService) {}

    @Get(':token')
    async getPortal(@Param('token') token: string) {
        return this.clientPortalService.getPortalByToken(token);
    }

    @Get(':token/packages')
    async getPackages(@Param('token') token: string) {
        return this.clientPortalService.getPackageOptions(token);
    }

    @Post(':token/package-request')
    async submitPackageRequest(
        @Param('token') token: string,
        @Body(new ValidationPipe({ transform: true })) body: { selected_package_id?: number; customisations?: import('@prisma/client').Prisma.InputJsonValue; notes?: string },
    ) {
        return this.clientPortalService.submitPackageRequest(token, body);
    }

    @Post(':token/proposal-respond')
    async respondToProposal(
        @Param('token') token: string,
        @Body(new ValidationPipe({ transform: true })) body: { response: string; message?: string },
    ) {
        return this.clientPortalService.respondToProposalByPortalToken(token, body.response, body.message);
    }
}
