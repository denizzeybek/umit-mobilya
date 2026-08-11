import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class FilterProductDto {
  /** Case-insensitive substring matched against the product name. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly name?: string;

  /** Category id to restrict the result to. */
  @IsOptional()
  @IsMongoId()
  readonly category?: string;
}
