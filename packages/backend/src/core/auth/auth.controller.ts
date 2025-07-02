// packages/backend/src/auth/auth.controller.ts
// Add Get, UseGuards, and Request to the imports from @nestjs/common
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from "@nestjs/passport"; // Import the AuthGuard

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  signIn(@Body() signInDto: { email: string; password: string }) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  // --- ADD THIS NEW METHOD ---
  @UseGuards(AuthGuard("jwt")) // This is the magic!
  @Get("profile")
  getProfile(@Request() req) {
    // The `req.user` object is populated by our JwtStrategy's `validate` method.
    return req.user;
  }
}
