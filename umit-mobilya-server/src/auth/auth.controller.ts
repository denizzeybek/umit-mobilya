import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';

import { AuthService, TOKEN_MAX_AGE_SECONDS } from './auth.service';
import type { AuthResult, PublicUser } from './auth.service';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  AuthResponseDto,
  MeResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayload } from './guards/jwt-auth.guard';

const COOKIE_NAME = 'jwt';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  maxAge: TOKEN_MAX_AGE_SECONDS * 1000,
};

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Registers a user and signs them in straight away. */
  @Post('signup')
  @ApiCreatedResponse({ type: AuthResponseDto })
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResult> {
    const result = await this.authService.signup(dto);
    response.cookie(COOKIE_NAME, result.token, cookieOptions);
    return result;
  }

  /** Signs an existing user in. */
  @Post('login')
  @ApiOkResponse({ type: AuthResponseDto })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResult> {
    const result = await this.authService.login(dto);
    response.cookie(COOKIE_NAME, result.token, cookieOptions);
    return result;
  }

  /** Expires the session cookie. The body token is dropped by the client. */
  @Get('logout')
  @ApiOkResponse({ type: MessageResponseDto })
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    response.cookie(COOKIE_NAME, '', { maxAge: 1 });
    return { message: 'Çıkış yapıldı.' };
  }

  /** The user behind the supplied Bearer token. Never includes the password. */
  @Get('me')
  @ApiOkResponse({ type: MeResponseDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(
    @CurrentUser() payload: JwtPayload,
  ): Promise<{ message: string; user: PublicUser }> {
    const user = await this.authService.findById(payload.id);
    return { message: 'Token is valid', user };
  }
}
