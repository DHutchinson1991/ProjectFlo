// packages/backend/src/contributors/contributors.service.ts
import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcrypt";
import { Prisma, contacts_type, contributors_type } from '@prisma/client';

const SALT_ROUNDS = 10;

@Injectable()
export class ContributorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContributorDto: CreateContributorDto) {
    const {
      email,
      password,
      first_name,
      last_name,
      role_id,
      contributor_type,
    } = createContributorDto;

    const existingContact = await this.prisma.contacts.findUnique({
      where: { email },
    });
    if (existingContact) {
      throw new ConflictException("A contact with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    return this.prisma.contacts.create({
      data: {
        email,
        first_name,
        last_name,
        type: contacts_type.Contributor,
        contributor: {
          create: {
            password_hash: hashedPassword,
            role_id: role_id, // Prisma allows setting FK directly on create within nested create
            contributor_type: contributor_type || contributors_type.Internal,
          },
        },
      },
      include: {
        contributor: {
          include: {
            role: true,
          }
        }
      }
    });
  }

  findAll() {
    return this.prisma.contributors.findMany({
      include: {
        contact: true,
        role: true,
      },
    });
  }

  async findOne(id: number) {
    const contributor = await this.prisma.contributors.findUnique({
      where: { id },
      include: { 
        contact: true, 
        role: true 
      },
    });
    if (!contributor) {
      throw new NotFoundException(`Contributor with ID ${id} not found`);
    }
    return contributor;
  }

  async update(id: number, updateContributorDto: UpdateContributorDto) {
    const { email, first_name, last_name, role_id, contributor_type, password } = updateContributorDto;

    const dataForContributorUpdate: Prisma.contributorsUpdateInput = {};

    if (password) {
      dataForContributorUpdate.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }
    
    // Correct way to update the role relationship
    if (role_id !== undefined) {
      dataForContributorUpdate.role = {
        connect: { id: role_id }
      };
    }

    if (contributor_type !== undefined) {
      dataForContributorUpdate.contributor_type = contributor_type;
    }

    const contactDataForUpdate: Prisma.contactsUpdateInput = {};
    let contactNeedsUpdate = false;

    if (email !== undefined) {
      contactDataForUpdate.email = email;
      contactNeedsUpdate = true;
    }
    if (first_name !== undefined) {
      contactDataForUpdate.first_name = first_name;
      contactNeedsUpdate = true;
    }
    if (last_name !== undefined) {
      contactDataForUpdate.last_name = last_name;
      contactNeedsUpdate = true;
    }

    if (contactNeedsUpdate) {
      dataForContributorUpdate.contact = {
        update: contactDataForUpdate,
      };
    }

    try {
      return await this.prisma.contributors.update({
        where: { id },
        data: dataForContributorUpdate,
        include: {
          contact: true,
          role: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Contributor with ID ${id} not found for update.`);
      }
      throw error; 
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.contributors.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Contributor with ID ${id} not found for deletion.`);
      }
      throw error;
    }
  }
}
