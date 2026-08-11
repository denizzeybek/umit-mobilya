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

/**
 * Every field is optional: the update endpoint patches, it does not replace.
 * Anything omitted keeps the value already stored.
 *
 * `imageUrl` is deliberately absent. The schema still carries that column and
 * the Express handler still wrote to it, but no read path has used it since
 * URLs started being composed from `imageName` — so accepting it would only
 * let a caller write a value nothing reads.
 */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  readonly name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  readonly currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly sizes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  readonly description?: string;

  @IsOptional()
  @IsMongoId()
  readonly category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly quantity?: number;
}
