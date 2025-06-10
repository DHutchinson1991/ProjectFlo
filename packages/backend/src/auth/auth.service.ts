// packages/backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    // Step 1: Find the user by their unique email and include related data.
    const userContact = await this.prisma.contacts.findUnique({
      where: { email },
      include: {
        contributor: {
          include: {
            role: true, // We need the role for the JWT payload
          },
        },
      },
    });

    // Step 2: Check if the user exists and has a stored password hash.
    if (!userContact?.contributor?.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Step 3: Compare the provided password with the stored hash.
    const isMatch = await bcrypt.compare(
      pass,
      userContact.contributor.password_hash,
    );

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Step 4: If passwords match, create the JWT payload.
    const payload = {
      sub: userContact.contributor.id,
      email: userContact.email,
      role: userContact.contributor.role.name,
    };

    // Step 5: Sign the payload and return the access token.
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
