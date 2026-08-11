import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  /** Login address. Stored lowercased and unique across users. */
  @IsEmail({}, { message: 'Please enter a valid email' })
  readonly email!: string;

  /** Plain password, at least six characters. Never stored as given. */
  @IsString()
  @MinLength(6, { message: 'Minimum password length is 6 characters' })
  readonly password!: string;
}
