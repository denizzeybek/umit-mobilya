import { ApiProperty } from '@nestjs/swagger';

/**
 * Body of the gallery upload. Exists only to describe the multipart shape for
 * the OpenAPI schema — multer consumes the files before any DTO is built.
 *
 * Note the **singular** field name for a list of files. That is inherited from
 * `upload.array('image', 20)` and the frontend appends every file under it.
 */
export class UploadImagesDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'One or more gallery images, all under the field name `image`.',
  })
  readonly image!: unknown[];
}
