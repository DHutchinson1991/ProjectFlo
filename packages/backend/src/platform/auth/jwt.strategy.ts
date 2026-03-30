// packages/backend/src/platform/auth/jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../platform/prisma/prisma.service";

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
    const crew = await this.prisma.crew.findUnique({
      where: { id: payload.sub },
      include: {
        contact: {
          include: {
            user_account: { include: { system_role: true } },
          },
        },
      },
    });

    if (!crew) {
      return null;
    }

    return {
      id: crew.id,
      userId: crew.id,
      email: crew.contact.email,
      first_name: crew.contact.first_name,
      last_name: crew.contact.last_name,
      roles: [crew.contact.user_account?.system_role?.name || "User"],
    };
  }
}
