import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, UseGuards, Query, ValidationPipe } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsQueryDto } from './dto/contacts-query.dto';
import { AuthGuard } from '@nestjs/passport'; // Import AuthGuard
import { Roles } from '../../auth/decorators/roles.decorator'; // Import Roles decorator
import { RolesGuard } from '../../auth/guards/roles.guard'; // Import RolesGuard

@Controller('api/contacts')
@UseGuards(AuthGuard('jwt'))
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ValidationPipe({ transform: true })) createContactDto: CreateContactDto,
    @Query(new ValidationPipe({ transform: true })) query: ContactsQueryDto,
  ) {
    const parsedBrandId = query.brandId ?? null;
    return this.contactsService.create(createContactDto, parsedBrandId);
  }

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: ContactsQueryDto) {
    const parsedBrandId = query.brandId ?? null;
    return this.contactsService.findAll(parsedBrandId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { // Accessible to any authenticated user
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Global Admin') // Allow Admin or Global Admin roles to update
  @UseGuards(RolesGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe({ transform: true })) updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @Roles('Admin', 'Global Admin') // Allow Admin or Global Admin roles to delete
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.remove(id);
  }
}
