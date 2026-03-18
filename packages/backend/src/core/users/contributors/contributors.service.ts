// packages/backend/src/contributors/contributors.service.ts
import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";
import { PrismaService } from "../../../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { Prisma, contacts_type, contributors_type } from '@prisma/client';

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

    return this.prisma.contributors.findMany({
      where: whereClause,
      include: {
        contact: true,
        role: true,
        contributor_job_roles: {
          include: {
            job_role: true,
            payment_bracket: true
          }
        }
      },
    });
  }

  async findOne(id: number) {
    const contributor = await this.prisma.contributors.findUnique({
      where: { id },
      include: {
        contact: true,
        role: true,
        contributor_job_roles: {
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
    const { email, first_name, last_name, role_id, contributor_type, password, default_hourly_rate } = updateContributorDto;

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

    if (default_hourly_rate !== undefined) {
      dataForContributorUpdate.default_hourly_rate = default_hourly_rate;
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

  async addJobRole(contributorId: number, jobRoleId: number) {
    // Check if contributor exists
    const contributor = await this.prisma.contributors.findUnique({
      where: { id: contributorId },
    });
    if (!contributor) {
      throw new NotFoundException(`Contributor with ID ${contributorId} not found`);
    }

    // Check if job role exists
    const jobRole = await this.prisma.job_roles.findUnique({
      where: { id: jobRoleId },
    });
    if (!jobRole) {
      throw new NotFoundException(`Job role with ID ${jobRoleId} not found`);
    }

    // Check if already assigned
    const existing = await this.prisma.contributor_job_roles.findUnique({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(`Job role is already assigned to this contributor`);
    }

    // Add the job role
    await this.prisma.contributor_job_roles.create({
      data: {
        contributor_id: contributorId,
        job_role_id: jobRoleId,
        is_primary: false, // New roles default to non-primary
      },
    });

    // Return updated contributor
    return this.findOne(contributorId);
  }

  async removeJobRole(contributorId: number, jobRoleId: number) {
    // Check if contributor exists
    const contributor = await this.prisma.contributors.findUnique({
      where: { id: contributorId },
    });
    if (!contributor) {
      throw new NotFoundException(`Contributor with ID ${contributorId} not found`);
    }

    // Check if the assignment exists
    const assignment = await this.prisma.contributor_job_roles.findUnique({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });
    if (!assignment) {
      throw new NotFoundException(`Job role is not assigned to this contributor`);
    }

    // If this is the primary role, we need to unset it
    if (assignment.is_primary) {
      await this.prisma.contributor_job_roles.update({
        where: {
          contributor_id_job_role_id: {
            contributor_id: contributorId,
            job_role_id: jobRoleId,
          },
        },
        data: { is_primary: false },
      });
    }

    // Delete the assignment
    await this.prisma.contributor_job_roles.delete({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });

    // Return updated contributor
    return this.findOne(contributorId);
  }

  async setPrimaryJobRole(contributorId: number, jobRoleId: number) {
    // Check if contributor exists
    const contributor = await this.prisma.contributors.findUnique({
      where: { id: contributorId },
    });
    if (!contributor) {
      throw new NotFoundException(`Contributor with ID ${contributorId} not found`);
    }

    // Check if the assignment exists
    const assignment = await this.prisma.contributor_job_roles.findUnique({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });
    if (!assignment) {
      throw new NotFoundException(`Job role is not assigned to this contributor`);
    }

    // Unset primary on all other roles for this contributor
    await this.prisma.contributor_job_roles.updateMany({
      where: {
        contributor_id: contributorId,
      },
      data: { is_primary: false },
    });

    // Set this role as primary
    await this.prisma.contributor_job_roles.update({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
      data: { is_primary: true },
    });

    // Return updated contributor
    return this.findOne(contributorId);
  }
}
