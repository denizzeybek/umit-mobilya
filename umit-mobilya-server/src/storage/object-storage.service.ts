import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import sharp from 'sharp';

import { LocalDiskStorage } from './local-disk.storage';

import type { IStoredObject } from './local-disk.storage';

const RANDOM_SUFFIX_BYTES = 32;
const MAX_WIDTH = 900;
const MAX_HEIGHT = 600;

/** Tiled textures must be power-of-two; see `uploadTexture`. */
const TEXTURE_SIZE = 1024;

/**
 * Cloudflare R2, reached through the S3-compatible SDK.
 *
 * The bucket is public, so nothing here signs anything: a URL is the public
 * base joined to the object key, it never expires, and it may be cached freely.
 * MongoDB stores the **key**, never the URL — which is what keeps the rows
 * portable if the public domain or the bucket ever changes.
 */
@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly client: S3Client | null = null;
  private readonly local: LocalDiskStorage | null = null;
  private readonly bucket: string;
  private readonly publicBase: string;

  /**
   * Depolama YAPILANDIRILMAMIŞ olabilir ve bu geçerli bir durum.
   *
   * Kova yokken boot'un düşmesi, tek bir eksik değişkenin bütün API'yi
   * kaldırması demekti: ürün listesi, konfigüratör, teklif ve fiyat kitabı
   * kovaya hiç dokunmadığı hâlde ölüyordu. Kovaya ihtiyaç duyan tek şey görsel
   * yükleme; kapalı olması gereken de yalnızca o.
   *
   * Yarım yapılandırma AYRI bir mesele ve orada boot düşüyor
   * (`config/env.validation.ts`): eksik bir kimlik bilgisiyle çalışan bir
   * yükleme, sessizce başarısız olan bir yüklemedir.
   */
  constructor(config: ConfigService) {
    this.bucket = config.get<string>('BUCKET_NAME') ?? '';
    this.publicBase = (config.get<string>('PUBLIC_BUCKET_URL') ?? '').replace(
      /\/+$/,
      '',
    );

    const endpoint = config.get<string>('S3_ENDPOINT');
    const accessKeyId = config.get<string>('ACCESS_KEY');
    const secretAccessKey = config.get<string>('SECRET_ACCESS_KEY');

    if (!this.bucket || !this.publicBase || !endpoint || !accessKeyId || !secretAccessKey) {
      /*
       * Kova yok. Geliştirmede diske düşülüyor ki kaplama deseni gibi bir
       * özellik R2 hesabı olmadan geliştirilebilsin; production'da DÜŞÜLMÜYOR,
       * çünkü Railway'in dosya sistemi geçici — orada "çalışan" bir yükleme,
       * ilk deploy'da sessizce kaybolan bir yükleme demek.
       */
      if (config.get<string>('NODE_ENV') === 'production') {
        this.logger.warn(
          'Depolama yapılandırılmamış (BUCKET_NAME / S3_ENDPOINT / ' +
            'PUBLIC_BUCKET_URL / ACCESS_KEY / SECRET_ACCESS_KEY). Görsel ' +
            'yükleme KAPALI; geri kalan her şey çalışıyor.',
        );
        return;
      }

      const root =
        config.get<string>('LOCAL_STORAGE_DIR') ??
        join(process.cwd(), '.local-storage');

      const port = config.get<string>('PORT') ?? '5000';
      this.publicBase =
        config.get<string>('LOCAL_STORAGE_URL') ??
        `http://localhost:${port}/api/storage`;

      this.local = new LocalDiskStorage(root);
      this.logger.warn(
        `R2 yapılandırılmamış — görseller YEREL DİSKE yazılıyor (${root}). ` +
          'Yalnızca geliştirme içindir; canlıda R2 değişkenleri gerekir.',
      );
      return;
    }

    /* R2 requires region 'auto' and its own endpoint; an AWS region is rejected. */
    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  /** Yükleme mümkün mü — R2 ya da yerel disk. */
  get isConfigured(): boolean {
    return this.client !== null || this.local !== null;
  }

  /**
   * Yerel diskteki nesneyi okur; `GET /api/storage/:key` bunu servis ediyor.
   * R2 modunda `null` döner — orada okuma kovanın kendi public adresinden.
   */
  async readLocal(key: string): Promise<IStoredObject | null> {
    return this.local ? this.local.read(key) : null;
  }

  publicUrl(key: string | undefined | null): string | null {
    if (!key || !this.isConfigured) return null;

    return `${this.publicBase}/${encodeURIComponent(key)}`;
  }

  private async store(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<void> {
    if (this.local) {
      await this.local.put(key, buffer);
      return;
    }

    if (!this.client) {
      throw new ServiceUnavailableException(
        'Depolama yapılandırılmamış: görsel yükleme şu an kapalı.',
      );
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  /**
   * Turns an uploaded filename into an object key.
   *
   * The key ends up inside a public URL, so the stem is slugified down to
   * `[\w.-]` and lowercased. Uniqueness comes from the random suffix, not from
   * the name, so collapsing two different names to the same slug is harmless.
   */
  buildKey(originalName = ''): string {
    const stem = (originalName.split('.')[0] ?? '')
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    return `${stem || 'image'}-${randomBytes(RANDOM_SUFFIX_BYTES).toString('hex')}`;
  }

  async upload(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<void> {
    const resized = await sharp(buffer)
      .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside' })
      .toBuffer();

    await this.store(resized, key, contentType);
  }

  /**
   * A finish texture, which is a different job from a product photo.
   *
   * Square and power-of-two on purpose: the texture is **tiled** across a
   * panel, and a non-power-of-two image with `RepeatWrapping` renders black
   * under WebGL 1 — which is exactly the fallback path old machines take. It
   * would look right on the developer's machine and be broken on a customer's.
   *
   * `cover` rather than `inside`: letterboxing a texture puts the background
   * colour into the tile and produces a visible grid on the panel.
   */
  async uploadTexture(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<void> {
    const resized = await sharp(buffer)
      .resize({ width: TEXTURE_SIZE, height: TEXTURE_SIZE, fit: 'cover' })
      .toBuffer();

    await this.store(resized, key, contentType);
  }

  /**
   * Failures are logged and swallowed on purpose — see the spec. A storage
   * outage must not be able to block a database delete.
   */
  async remove(key: string | undefined | null): Promise<void> {
    if (!key) return;

    if (this.local) {
      await this.local.remove(key);
      return;
    }

    if (!this.client) return;

    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error: unknown) {
      this.logger.error(
        `R2 objesi silinemedi: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async removeMany(keys: (string | undefined | null)[]): Promise<void> {
    await Promise.all(keys.map((key) => this.remove(key)));
  }
}
