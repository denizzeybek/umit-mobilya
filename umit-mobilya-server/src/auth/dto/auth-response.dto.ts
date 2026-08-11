export class AuthResponseDto {
  /** The signed-in user's id, as a bare hex string — not an object. */
  user!: string;

  /**
   * Signed JWT, valid for three days. Also set as an httpOnly `jwt` cookie on
   * the same response; the frontend stores this copy in localStorage.
   */
  token!: string;
}

export class PublicUserDto {
  _id!: string;

  /** Login address, always lowercased. The password hash is never included. */
  email!: string;
}

export class MeResponseDto {
  /** Always "Token is valid". Kept because the frontend store reads the envelope. */
  message!: string;

  user!: PublicUserDto;
}
