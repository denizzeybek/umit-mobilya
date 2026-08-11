import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  /** Display name shown in the category list, e.g. "Koltuk Takımı". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  readonly name!: string;
}
