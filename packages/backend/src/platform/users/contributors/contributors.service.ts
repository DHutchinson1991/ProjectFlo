import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";
import { PrismaService } from "../../../platform/prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { Prisma, contacts_type } from '@prisma/client';

const SALT_ROUNDS = 10;

@Injectable()
export class ContributorsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createContributorDto: CreateContributorDto) {
    const {
      email,
      password,
      first_name,
      last_name,
      role_id,
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
        crew_member: {
          create: {
            password_hash: hashedPassword,
            role_id: role_id, // Prisma allows setting FK directly on create within nested create
          },
        },
      },
      include: {
        crew_member: {
          include: {
            role: true,
          }
        }
      }
    });
  }

  findAll(brandId?: number) {
    const whereClause = brandId ? {
      OR: [
        {
          contact: {
            brand_id: brandId
          }
        },
        {
          contact: {
            brand_id: null // Include Global Admins (no brand restriction)
          }
        }
      ]
    } : {};

    return this.prisma.crewMember.findMany({
      where: whereClause,
      include: {
        contact: true,
        role: true,
        job_role_assignments: {
          include: {
            job_role: true,
            payment_bracket: true
          }
        }
      },
    });
  }

  async findOne(id: number) {
    const contributor = await this.prisma.crewMember.findUnique({
      where: { id },
      include: {
        contact: true,
        role: true,
        job_role_assignments: {
          include: {
            job_role: true,
            payment_bracket: true
          }
        }
      },
    });
    if (!contributor) {
      throw new NotFoundException(`Contributor with ID ${id} not found`);
    }
    return contributor;
  }

  async update(id: number, updateContributorDto: UpdateContributorDto) {
    const { email, first_name, last_name, role_id, password } = updateContributorDto;

    const dataForContributorUpdate: Prisma.CrewMemberUpdateInput = {};

    if (password) {
      dataForContributorUpdate.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Correct way to update the role relationship
    if (role_id !== undefined) {
      dataForContributorUpdate.role = {
        connect: { id: role_id }
      };
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
      return await this.prisma.crewMember.update({
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
      return await this.prisma.crewMember.delete({
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
