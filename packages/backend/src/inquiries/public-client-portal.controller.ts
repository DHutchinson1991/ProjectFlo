import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    NotFoundException,
} from '@nestjs/common';
import { ClientPortalService } from './client-portal.service';

@Controller('api/client-portal')
export class PublicClientPortalController {
    constructor(private readonly clientPortalService: ClientPortalService) {}

    @Get(':token')
    async getPortal(@Param('token') token: string) {
        if (!token || token.length < 10) {
            throw new NotFoundException('Invalid portal token');
        }
        return this.clientPortalService.getPortalByToken(token);
    }

    @Get(':token/packages')
    async getPackages(@Param('token') token: string) {
        if (!token || token.length < 10) {
            throw new NotFoundException('Invalid portal token');
        }
        return this.clientPortalService.getPackageOptions(token);
    }

    @Post(':token/package-request')
    async submitPackageRequest(
        @Param('token') token: string,
        @Body() body: { selected_package_id?: number; customisations?: any; notes?: string },
    ) {
        if (!token || token.length < 10) {
            throw new NotFoundException('Invalid portal token');
        }
        return this.clientPortalService.submitPackageRequest(token, body);
    }

    @Post(':token/proposal-respond')
    async respondToProposal(
        @Param('token') token: string,
        @Body() body: { response: string; message?: string },
    ) {
        if (!token || token.length < 10) {
            throw new NotFoundException('Invalid portal token');
        }
        return this.clientPortalService.respondToProposalByPortalToken(token, body.response, body.message);
    }
}
