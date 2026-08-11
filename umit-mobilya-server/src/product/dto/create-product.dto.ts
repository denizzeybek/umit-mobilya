import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/*
 * This DTO arrives as multipart/form-data, so every field reaches the pipe as
 * a string. `@Type(() => Number)` is what turns "1000" back into 1000 — the
 * Express version did it by hand with `Number(price)`.
 */
export class CreateProductDto {
  /** Display name in the catalogue. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  readonly name!: string;

  /** Base price, before modules are added. */
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly price!: number;

  /** ISO currency code. Defaults to TRY when omitted. */
  @IsOptional()
  @IsString()
  @MaxLength(8)
  readonly currency?: string;

  /** Free-text dimensions, e.g. "200x90x75". */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly sizes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  readonly description?: string;

  /** Id of an existing category. The request is rejected if it does not exist. */
  @IsMongoId()
  readonly category!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly quantity?: number;

}

/**
 * The multipart body as the OpenAPI schema describes it — used only by
 * `@ApiBody`, never as a `@Body()` parameter.
 *
 * It has to be a separate class. `image` carries no class-validator decorator
 * (multer takes the file off the body long before validation runs), and with
 * `target: ES2022` a declared field is materialised on every instance as
 * `undefined`. Put it on the validated DTO and `forbidNonWhitelisted` rejects
 * every create with "property image should not exist" — a 400 on a request
 * that is perfectly correct.
 */
export class CreateProductBodyDto extends CreateProductDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Main product image. Resized to fit 900x600 before upload.',
  })
  readonly image!: unknown;
}
