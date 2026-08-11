import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Model } from 'mongoose';

import type { LoginDto } from './dto/login.dto';
import type { SignupDto } from './dto/signup.dto';
import { User } from './schemas/user.schema';

/** Three days, in seconds. The cookie uses the same value in milliseconds. */
export const TOKEN_MAX_AGE_SECONDS = 3 * 24 * 60 * 60;

const DUPLICATE_KEY_ERROR = 11000;

export interface AuthResult {
  /** The new or existing user's id, as a bare string. */
  user: string;
  /** Signed JWT. Also set as an httpOnly `jwt` cookie by the controller. */
  token: string;
}

export interface PublicUser {
  _id: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResult> {
    try {
      const user = await this.userModel.create({
        email: dto.email,
        password: dto.password,
      });

      return this.resultFor(user.id as string);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: number }).code === DUPLICATE_KEY_ERROR
      ) {
        throw new BadRequestException('that email is already registered');
      }
      throw error;
    }
  }

  /**
   * 400 rather than 401 on failure, which is what the Express version
   * answered. The frontend's login form branches on the status, so moving it
   * to 401 would send the router guard down the session-expired path instead
   * of showing the message.
   */
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userModel.findOne({ email: dto.email }).exec();

    if (!user) {
      throw new BadRequestException('That email is not registered');
    }

    const matches = await bcrypt.compare(dto.password, user.password);

    if (!matches) {
      throw new BadRequestException('That password is incorrect');
    }

    return this.resultFor(user.id as string);
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.userModel.findById(id).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { _id: user.id as string, email: user.email };
  }

  private resultFor(userId: string): AuthResult {
    const token = jwt.sign(
      { id: userId },
      this.config.getOrThrow<string>('JWT_SECRET'),
      { expiresIn: TOKEN_MAX_AGE_SECONDS },
    );

    return { user: userId, token };
  }
}
