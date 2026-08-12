import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

/**
 * Every variable the service needs, checked once at boot.
 *
 * The failure this prevents is specific: a missing PUBLIC_BUCKET_URL does not
 * throw anywhere, it just yields image URLs like `/some-key.jpg` that look
 * almost right. See .claude/rules/07-config-and-secrets.md.
 */
export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  readonly MONGO_URI!: string;

  @IsString()
  @IsNotEmpty()
  readonly JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  readonly BUCKET_NAME!: string;

  @IsUrl({ require_tld: false })
  readonly S3_ENDPOINT!: string;

  @IsUrl({ require_tld: false })
  readonly PUBLIC_BUCKET_URL!: string;

  @IsString()
  @IsNotEmpty()
  readonly ACCESS_KEY!: string;

  @IsString()
  @IsNotEmpty()
  readonly SECRET_ACCESS_KEY!: string;

  @IsOptional()
  @IsString()
  readonly PORT?: string;

  @IsOptional()
  @IsString()
  readonly ALLOWED_ORIGINS?: string;

  /**
   * `1` ise hız sınırı uygulanmaz. Yalnızca testler için — canlıda
   * TANIMLANMAZ. Varsayılanın "sınır açık" olması bilinçli: unutulan bir
   * değişken korumayı kaldırmamalı.
   */
  @IsOptional()
  @IsString()
  readonly THROTTLE_SKIP?: string;
}

export function validateEnvironment(
  raw: Record<string, unknown>,
): EnvironmentVariables {
  const config = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: false,
    excludeExtraneousValues: false,
  });

  const errors = validateSync(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    const missing = errors.map((error) => error.property).join(', ');
    throw new Error(
      `Zorunlu ortam değişkenleri eksik veya geçersiz: ${missing}. ` +
        'Railway panelindeki değişkenlerle .env.example dosyasını karşılaştır.',
    );
  }

  return config;
}
