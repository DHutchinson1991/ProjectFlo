import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Prisma, contacts } from '@prisma/client'; // Import Prisma namespace and the Prisma-generated 'contacts' type

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto): Promise<contacts> {
    return this.prisma.contacts.create({
      data: createContactDto,
    });
  }

  async findAll(): Promise<contacts[]> {
    return this.prisma.contacts.findMany();
  }

  async findOne(id: number): Promise<contacts | null> {
    const contact = await this.prisma.contacts.findUnique({
      where: { id },
    });
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
    return contact;
  }

  async update(id: number, updateContactDto: UpdateContactDto): Promise<contacts> {
    try {
      return await this.prisma.contacts.update({
        where: { id },
        data: updateContactDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Contact with ID ${id} not found for update.`);
      }
      throw error; // Re-throw other errors
    }
  }

  async remove(id: number): Promise<contacts> {
    try {
      return await this.prisma.contacts.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Contact with ID ${id} not found for deletion.`);
      }
      throw error; // Re-throw other errors
    }
  }
}
