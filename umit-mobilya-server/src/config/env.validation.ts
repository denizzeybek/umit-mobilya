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

  /*
   * Depolama beşlisi OPSİYONEL — ama ya hepsi ya hiçbiri (aşağıdaki kontrol).
   *
   * Zorunluyken tek bir eksik değişken bütün API'yi kaldırıyordu: ürün listesi,
   * konfigüratör, teklif ve fiyat kitabı kovaya hiç dokunmadığı hâlde ölüyordu.
   * Kovası olmayan bir geliştirici hiçbir şey çalıştıramıyordu.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly BUCKET_NAME?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  readonly S3_ENDPOINT?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  readonly PUBLIC_BUCKET_URL?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly SECRET_ACCESS_KEY?: string;

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

  assertStorageIsAllOrNothing(config);

  return config;
}

/**
 * Depolama ya tamamen yapılandırılır ya hiç.
 *
 * Yarısı tanımlı bir kova, yapılandırılmamış bir kovadan KÖTÜ: uygulama açılır,
 * yükleme uçları canlı görünür, ve istekler kimlik bilgisi eksikliğinden ya da
 * yanlış adrese gitmekten sessizce düşer. `PUBLIC_BUCKET_URL` eksikken üretilen
 * `/anahtar.jpg` gibi göreli adresler ise "neredeyse doğru" görünüp saatlerce
 * frontend'de aranır — Rule 07'nin var oluş sebebi tam olarak bu.
 */
const STORAGE_KEYS = [
  'BUCKET_NAME',
  'S3_ENDPOINT',
  'PUBLIC_BUCKET_URL',
  'ACCESS_KEY',
  'SECRET_ACCESS_KEY',
] as const;

function assertStorageIsAllOrNothing(config: EnvironmentVariables): void {
  const missing = STORAGE_KEYS.filter((key) => !config[key]);

  if (missing.length === 0 || missing.length === STORAGE_KEYS.length) return;

  throw new Error(
    `Depolama yarım yapılandırılmış. Eksik: ${missing.join(', ')}. ` +
      'Ya beşini birden tanımlayın ya hiçbirini — yarısı tanımlı bir kova, ' +
      'görsel yüklemeyi sessizce bozar.',
  );
}
