import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

import { ObjectStorageService } from './object-storage.service';

const sent: { type: string; input: Record<string, unknown> }[] = [];
let sendShouldThrow = false;

jest.mock('@aws-sdk/client-s3', () => {
  class FakeCommand {
    constructor(public readonly input: Record<string, unknown>) {}
  }
  return {
    S3Client: class {
      send(command: {
        constructor: { name: string };
        input: Record<string, unknown>;
      }) {
        if (sendShouldThrow) {
          return Promise.reject(new Error('R2 down'));
        }
        sent.push({ type: command.constructor.name, input: command.input });
        return Promise.resolve({});
      }
    },
    PutObjectCommand: class extends FakeCommand {},
    DeleteObjectCommand: class extends FakeCommand {},
  };
});

const config = {
  getOrThrow: (key: string) =>
    ({
      BUCKET_NAME: 'test-bucket',
      S3_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
      PUBLIC_BUCKET_URL: 'https://img.test/',
      ACCESS_KEY: 'access',
      SECRET_ACCESS_KEY: 'secret',
    })[key] as string,
} as unknown as ConfigService;

describe('ObjectStorageService', () => {
  let service: ObjectStorageService;

  beforeEach(() => {
    sent.length = 0;
    sendShouldThrow = false;
    service = new ObjectStorageService(config);
  });

  describe('publicUrl', () => {
    it('joins the public base with the key', () => {
      expect(service.publicUrl('some-key')).toBe('https://img.test/some-key');
    });

    it('does not double the slash when the configured base ends in one', () => {
      expect(service.publicUrl('k')).not.toContain('//k');
    });

    it('encodes characters that are unsafe in a URL', () => {
      expect(service.publicUrl('a b+c')).toBe('https://img.test/a%20b%2Bc');
    });

    it('returns null for a missing key rather than a dangling base url', () => {
      expect(service.publicUrl(undefined)).toBeNull();
      expect(service.publicUrl('')).toBeNull();
    });
  });

  describe('buildKey', () => {
    it('slugifies the filename stem and appends 32 random bytes of hex', () => {
      expect(service.buildKey('Living Room Sofa.JPG')).toMatch(
        /^living-room-sofa-[0-9a-f]{64}$/,
      );
    });

    it('never produces a key that needs escaping in a URL', () => {
      expect(service.buildKey('Üçlü Koltuk .jpg')).toMatch(/^[a-z0-9.-]+$/);
    });

    it('falls back to "image" when the stem slugifies away to nothing', () => {
      expect(service.buildKey('!!!.png')).toMatch(/^image-[0-9a-f]{64}$/);
    });

    it('gives two calls with the same filename different keys', () => {
      expect(service.buildKey('a.jpg')).not.toBe(service.buildKey('a.jpg'));
    });
  });

  describe('upload', () => {
    const jpegOf = async (width: number, height: number): Promise<Buffer> =>
      sharp({
        create: { width, height, channels: 3, background: { r: 1, g: 2, b: 3 } },
      })
        .jpeg()
        .toBuffer();

    it('sends the object to the configured bucket under the given key', async () => {
      await service.upload(await jpegOf(20, 20), 'my-key', 'image/jpeg');

      expect(sent).toHaveLength(1);
      expect(sent[0]?.input).toEqual(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'my-key',
          ContentType: 'image/jpeg',
        }),
      );
    });

    it('resizes down to fit inside 900x600 before uploading', async () => {
      await service.upload(await jpegOf(1800, 1200), 'k', 'image/jpeg');

      const body = sent[0]?.input['Body'] as Buffer;
      const { width, height } = await sharp(body).metadata();

      expect(width).toBe(900);
      expect(height).toBe(600);
    });

    /*
     * `fit: 'inside'` scales UP as well as down, so a small upload is enlarged
     * to touch the box — a 100x80 thumbnail is stored as 750x600, bigger than
     * what was sent. This is what the Express version did and it is preserved
     * deliberately, so the port stays a port. Adding `withoutEnlargement: true`
     * would be an improvement, but it is a separate decision from this
     * migration.
     */
    it('enlarges an image that is smaller than the box, matching the old behaviour', async () => {
      await service.upload(await jpegOf(100, 80), 'k', 'image/jpeg');

      const body = sent[0]?.input['Body'] as Buffer;
      const { width, height } = await sharp(body).metadata();

      expect(width).toBe(750);
      expect(height).toBe(600);
    });
  });

  describe('remove', () => {
    it('deletes the object from the configured bucket', async () => {
      await service.remove('doomed-key');

      expect(sent[0]).toEqual({
        type: 'DeleteObjectCommand',
        input: { Bucket: 'test-bucket', Key: 'doomed-key' },
      });
    });

    /*
     * Deliberate: a storage outage must not block a database delete, or a
     * product becomes undeletable whenever R2 has a bad day. The trade is an
     * orphaned object, which is recoverable; a stuck record is not.
     */
    it('swallows a storage failure instead of propagating it', async () => {
      sendShouldThrow = true;

      await expect(service.remove('doomed-key')).resolves.toBeUndefined();
    });

    it('ignores an empty key instead of sending a malformed command', async () => {
      await service.remove('');

      expect(sent).toHaveLength(0);
    });
  });
});
