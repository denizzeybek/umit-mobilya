import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FilterCategoryDto {
  /**
   * Case-insensitive substring to match against the category name. Omit it to
   * get every category back.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  readonly name?: string;
}
