// packages/backend/src/core/auth/jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // This method is called by Passport after it successfully validates the token.
  // The return value is what NestJS attaches to the `request.user` object.
  async validate(payload: { sub: number; email: string; role: string }) {
    // Fetch the full user information from the database
    const contributor = await this.prisma.contributors.findUnique({
      where: { id: payload.sub },
      include: {
        contact: true,
        role: true,
      },
    });

    if (!contributor) {
      return null;
    }

    return {
      id: contributor.id,
      userId: contributor.id, // Keep for backward compatibility
      email: contributor.contact.email,
      first_name: contributor.contact.first_name,
      last_name: contributor.contact.last_name,
      roles: [contributor.role?.name || "User"],
    };
  }
}
