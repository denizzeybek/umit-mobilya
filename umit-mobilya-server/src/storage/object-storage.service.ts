import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

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
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('BUCKET_NAME');
    this.publicBase = config
      .getOrThrow<string>('PUBLIC_BUCKET_URL')
      .replace(/\/+$/, '');

    /* R2 requires region 'auto' and its own endpoint; an AWS region is rejected. */
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.getOrThrow<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('ACCESS_KEY'),
        secretAccessKey: config.getOrThrow<string>('SECRET_ACCESS_KEY'),
      },
    });
  }

  publicUrl(key: string | undefined | null): string | null {
    return key ? `${this.publicBase}/${encodeURIComponent(key)}` : null;
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

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: resized,
        ContentType: contentType,
      }),
    );
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

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: resized,
        ContentType: contentType,
      }),
    );
  }

  /**
   * Failures are logged and swallowed on purpose — see the spec. A storage
   * outage must not be able to block a database delete.
   */
  async remove(key: string | undefined | null): Promise<void> {
    if (!key) {
      return;
    }

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
