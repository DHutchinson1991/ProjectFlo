import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SpaceSlotBlockingEnvironmentService } from './space-slot-blocking-environment.service';

@Controller('api/space-slots/:slotId/blocking-environment')
@UseGuards(AuthGuard('jwt'))
export class SpaceSlotBlockingEnvironmentController {
    constructor(private readonly service: SpaceSlotBlockingEnvironmentService) {}

    @Get()
    findOne(
        @Param('slotId', ParseIntPipe) slotId: number,
        @Query('momentId') momentId?: string,
    ) {
        return this.service.buildContext(slotId, momentId ? parseInt(momentId, 10) : undefined);
    }

    @Get('resolved-facing')
    findResolvedFacing(@Param('slotId', ParseIntPipe) slotId: number) {
        return this.service.resolveAllFacing(slotId);
    }
}