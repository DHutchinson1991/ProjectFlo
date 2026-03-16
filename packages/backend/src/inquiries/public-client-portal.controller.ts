import {
    Controller,
    Get,
    Param,
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
}
