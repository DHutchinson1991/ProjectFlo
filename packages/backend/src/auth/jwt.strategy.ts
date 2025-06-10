// packages/backend/src/auth/jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // This method is called by Passport after it successfully validates the token.
  // The return value is what NestJS attaches to the `request.user` object.
  async validate(payload: { sub: number; email: string; role: string }) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
