import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query,
    ParseIntPipe, HttpCode, HttpStatus, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkillRoleMappingsService } from './skill-role-mappings.service';
import { SkillRoleMappingsResolverService } from './services/skill-role-mappings-resolver.service';
import { SkillRoleMappingsQueryService } from './services/skill-role-mappings-query.service';
import { CreateSkillRoleMappingDto } from './dto/create-skill-role-mapping.dto';
import { UpdateSkillRoleMappingDto } from './dto/update-skill-role-mapping.dto';
import { BulkCreateSkillRoleMappingDto } from './dto/bulk-create-skill-role-mapping.dto';
import { ResolveSkillRoleDto } from './dto/resolve-skill-role.dto';
import { SkillRoleMappingQueryDto } from './dto/skill-role-mapping-query.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/skill-role-mappings')
@UseGuards(AuthGuard('jwt'))
export class SkillRoleMappingsController {
    constructor(
        private readonly service: SkillRoleMappingsService,
        private readonly resolver: SkillRoleMappingsResolverService,
        private readonly queryService: SkillRoleMappingsQueryService,
    ) { }

    // ─── CRUD ──────────────────────────────────────────────────

    @Get()
    findAll(@Query(new ValidationPipe({ transform: true })) query: SkillRoleMappingQueryDto, @BrandId() brandId?: number) {
        return this.service.findAll(query, brandId);
    }

    @Get('summary')
    getSummary(@BrandId() brandId?: number) {
        return this.queryService.getMappingSummary(brandId);
    }

    @Get('skills')
    getAvailableSkills(@BrandId() brandId?: number) {
        return this.queryService.getAvailableSkills(brandId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findById(id);
    }

    @Post()
    create(@Body(new ValidationPipe({ transform: true })) dto: CreateSkillRoleMappingDto) {
        return this.service.create(dto);
    }

    @Post('bulk')
    bulkCreate(@Body(new ValidationPipe({ transform: true })) dto: BulkCreateSkillRoleMappingDto) {
        return this.service.bulkCreate(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: UpdateSkillRoleMappingDto,
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
    resolve(@Body(new ValidationPipe({ transform: true })) dto: ResolveSkillRoleDto, @BrandId() brandId?: number) {
        return this.resolver.resolveRoleAndBracket(
            dto.skills_needed,
            dto.brand_id ?? brandId,
        );
    }
}
