import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  ValidationPipe,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from "@nestjs/passport";
import { SignInDto } from "./dto/sign-in.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

interface JwtUser {
  id: number;
  userId: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

@Controller("api/auth")
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post("login")
  signIn(@Body(new ValidationPipe({ transform: true })) signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("profile")
  getProfile(@Request() req: { user: JwtUser }) {
    return req.user;
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Body(new ValidationPipe({ transform: true })) dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }
}
