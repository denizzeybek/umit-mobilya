import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  /** New display name for the category. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  readonly name!: string;
}
