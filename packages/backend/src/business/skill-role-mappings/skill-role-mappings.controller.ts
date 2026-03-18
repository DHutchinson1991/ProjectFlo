import {
    Controller, Get, Post, Put, Delete, Body, Param, Query,
    ParseIntPipe, HttpCode, HttpStatus, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkillRoleMappingsService } from './skill-role-mappings.service';
import {
    CreateSkillRoleMappingDto,
    UpdateSkillRoleMappingDto,
    BulkCreateSkillRoleMappingDto,
    ResolveSkillRoleDto,
    SkillRoleMappingQueryDto,
} from './dto/skill-role-mapping.dto';

@Controller('skill-role-mappings')
@UseGuards(AuthGuard('jwt'))
export class SkillRoleMappingsController {
    constructor(private readonly service: SkillRoleMappingsService) { }

    // ─── CRUD ──────────────────────────────────────────────────

    @Get()
    findAll(@Query(ValidationPipe) query: SkillRoleMappingQueryDto) {
        return this.service.findAll(query);
    }

    @Get('summary')
    getSummary(@Query('brandId') brandId?: string) {
        return this.service.getMappingSummary(brandId ? parseInt(brandId, 10) : undefined);
    }

    @Get('skills')
    getAvailableSkills(@Query('brandId') brandId?: string) {
        return this.service.getAvailableSkills(brandId ? parseInt(brandId, 10) : undefined);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findById(id);
    }

    @Post()
    create(@Body(ValidationPipe) dto: CreateSkillRoleMappingDto) {
        return this.service.create(dto);
    }

    @Post('bulk')
    bulkCreate(@Body(ValidationPipe) dto: BulkCreateSkillRoleMappingDto) {
        return this.service.bulkCreate(dto);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) dto: UpdateSkillRoleMappingDto,
    ) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }

    // ─── Resolution ────────────────────────────────────────────

    /** Preview: resolve skills to a role & bracket without creating anything */
    @Post('resolve')
    resolve(@Body(ValidationPipe) dto: ResolveSkillRoleDto) {
        return this.service.resolveRoleAndBracket(
            dto.skills_needed,
            dto.brand_id,
        );
    }
}
