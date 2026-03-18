// packages/backend/src/core/auth/auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async signIn(
    email: string,
    pass: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: { id: number; email: string; roles: string[] };
  }> {
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
      role: userContact.contributor.role?.name || "User",
    };

    // Create user profile object matching frontend expectations
    const user = {
      id: userContact.contributor.id,
      email: userContact.email,
      roles: [userContact.contributor.role?.name || "User"], // Array of roles as expected by frontend
    };

    // Step 5: Sign the payload and return the access token, refresh token, and user profile.
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d', // Refresh token expires in 7 days
    });

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // Fetch the user to ensure they still exist
      const contributor = await this.prisma.contributors.findUnique({
        where: { id: payload.sub },
        include: {
          contact: true,
          role: true,
        },
      });

      if (!contributor) {
        throw new UnauthorizedException('User not found');
      }

      // Create new tokens
      const newPayload = {
        sub: contributor.id,
        email: contributor.contact.email,
        role: contributor.role?.name || "User",
      };

      const access_token = await this.jwtService.signAsync(newPayload);
      const new_refresh_token = await this.jwtService.signAsync(newPayload, {
        expiresIn: '7d',
      });

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
