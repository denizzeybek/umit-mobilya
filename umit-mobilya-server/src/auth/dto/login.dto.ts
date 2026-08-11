import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  /** Registered login address. */
  @IsEmail({}, { message: 'Please enter a valid email' })
  readonly email!: string;

  /** Plain password, compared against the stored bcrypt hash. */
  @IsString()
  @IsNotEmpty({ message: 'Please enter a password' })
  readonly password!: string;
}
