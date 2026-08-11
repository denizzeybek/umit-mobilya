import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User, UserSchema } from './schemas/user.schema';

/*
 * Global because JwtAuthGuard guards every other domain's mutating routes.
 * Without this each feature module would have to import AuthModule just to
 * resolve the guard, and forgetting that import fails at runtime rather than
 * at compile time.
 */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
