import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { AuthGuard } from '@nestjs/passport'; // Import AuthGuard
import { Roles } from '../auth/decorators/roles.decorator'; // Import Roles decorator
import { RolesGuard } from '../auth/guards/roles.guard'; // Import RolesGuard

@Controller('contacts')
@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createContactDto: CreateContactDto) { // Accessible to any authenticated user
    return this.contactsService.create(createContactDto);
  }

  @Get()
  findAll() { // Accessible to any authenticated user
    return this.contactsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { // Accessible to any authenticated user
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin') // Only users with the 'Admin' role can update
  @UseGuards(RolesGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @Roles('Admin') // Only users with the 'Admin' role can delete
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.remove(id);
  }
}
