import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { CreateUserAccountDto } from "./dto/create-user-account.dto";
import { UpdateUserAccountDto } from "./dto/update-user-account.dto";
import { PrismaService } from "../../../platform/prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { Prisma, contacts_type } from '@prisma/client';

const SALT_ROUNDS = 10;

@Injectable()
export class UserAccountsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUserAccountDto: CreateUserAccountDto) {
    const { email, password, first_name, last_name, role_id } = createUserAccountDto;

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
        type: contacts_type.Crew,
        user_account: {
          create: {
            password_hash: hashedPassword,
            system_role_id: role_id,
          },
        },
        crew: {
          create: {},
        },
      },
      include: {
        user_account: {
          include: { system_role: true },
        },
        crew: true,
      },
    });
  }

  findAll(brandId?: number) {
    const whereClause = brandId ? {
      OR: [
        { contact: { brand_id: brandId } },
        { contact: { brand_id: null } },
      ],
    } : {};

    return this.prisma.crew.findMany({
      where: whereClause,
      include: {
        contact: {
          include: {
            user_account: { include: { system_role: true } },
          },
        },
        job_role_assignments: {
          include: {
            job_role: true,
            payment_bracket: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const account = await this.prisma.crew.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            user_account: { include: { system_role: true } },
          },
        },
        job_role_assignments: {
          include: {
            job_role: true,
            payment_bracket: true,
          },
        },
      },
    });
    if (!account) {
      throw new NotFoundException(`User account with ID ${id} not found`);
    }
    return account;
  }

  async update(id: number, updateUserAccountDto: UpdateUserAccountDto) {
    const { email, first_name, last_name, role_id, password } = updateUserAccountDto;

    const crewRecord = await this.prisma.crew.findUnique({
      where: { id },
      include: { contact: { include: { user_account: true } } },
    });
    if (!crewRecord) {
      throw new NotFoundException(`User account with ID ${id} not found`);
    }

    const userAccountUpdate: Prisma.UserAccountUpdateInput = {};
    if (password) {
      userAccountUpdate.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }
    if (role_id !== undefined) {
      userAccountUpdate.system_role = { connect: { id: role_id } };
    }

    const contactUpdate: Prisma.contactsUpdateInput = {};
    if (email !== undefined) contactUpdate.email = email;
    if (first_name !== undefined) contactUpdate.first_name = first_name;
    if (last_name !== undefined) contactUpdate.last_name = last_name;

    const hasContactChanges = Object.keys(contactUpdate).length > 0;
    const hasAccountChanges = Object.keys(userAccountUpdate).length > 0;

    await this.prisma.$transaction(async (tx) => {
      if (hasContactChanges) {
        await tx.contacts.update({ where: { id: crewRecord.contact_id }, data: contactUpdate });
      }
      if (hasAccountChanges && crewRecord.contact.user_account) {
        await tx.userAccount.update({
          where: { id: crewRecord.contact.user_account.id },
          data: userAccountUpdate,
        });
      }
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const crewRecord = await this.prisma.crew.findUnique({ where: { id } });
    if (!crewRecord) {
      throw new NotFoundException(`User account with ID ${id} not found`);
    }
    return this.prisma.contacts.delete({ where: { id: crewRecord.contact_id } });
  }
}
