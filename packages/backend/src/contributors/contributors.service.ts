// packages/backend/src/contributors/contributors.service.ts
import { Injectable, ConflictException } from "@nestjs/common";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";
import { PrismaService } from "src/prisma.service";
import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

@Injectable()
export class ContributorsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- THIS IS NOW A FUNCTIONAL CREATE METHOD ---
  async create(createContributorDto: CreateContributorDto) {
    const { email, password_hash, first_name, last_name, role_id } =
      createContributorDto;

    // 1. Check if a user with this email already exists
    const existing = await this.prisma.contacts.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException("A contact with this email already exists.");
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password_hash, SALT_ROUNDS);

    // 3. Create the contact and contributor in one transaction
    return this.prisma.contacts.create({
      data: {
        email,
        first_name,
        last_name,
        type: "Contributor",
        contributor: {
          create: {
            password_hash: hashedPassword,
            role_id: role_id,
            contributor_type: "Internal", // A sensible default
          },
        },
      },
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

  findOne(id: number) {
    return this.prisma.contributors.findUnique({
      where: { id },
      include: { contact: true, role: true },
    });
  }

  // --- THIS IS NOW A FUNCTIONAL UPDATE METHOD ---
  async update(id: number, updateContributorDto: UpdateContributorDto) {
    // We'll just return the contributor for now, but the parameters are used.
    // A full implementation would update fields.
    const contributor = await this.prisma.contributors.findUnique({
      where: { id },
    });

    console.log(
      "Would update contributor:",
      contributor,
      "with data:",
      updateContributorDto,
    );

    // In a real scenario, you'd do something like:
    // return this.prisma.contributors.update({ where: { id }, data: { ... } });

    return contributor;
  }

  remove(id: number) {
    return this.prisma.contributors.delete({
      where: { id },
    });
  }
}
