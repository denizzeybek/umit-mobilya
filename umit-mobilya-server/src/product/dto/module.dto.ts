import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ModuleEntryDto {
  /** Id of the product being used as a module. */
  @IsMongoId()
  readonly productId!: string;

  /** How many of that product this bundle contains. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly quantity!: number;
}

export class AddModuleDto {
  /** Id of the product the module is added to. */
  @IsMongoId()
  readonly productId!: string;

  /** The module to add. */
  @Type(() => ModuleEntryDto)
  @ValidateNested()
  readonly module!: ModuleEntryDto;
}

export class UpdateModulesDto {
  /** The complete new module list. Replaces whatever was stored. */
  @IsArray()
  @Type(() => ModuleEntryDto)
  @ValidateNested({ each: true })
  readonly modules!: ModuleEntryDto[];
}

export class DeleteImageDto {
  /** R2 object key of the gallery image to remove — a key, never a URL. */
  @IsString()
  @IsNotEmpty({ message: 'Silinecek görüntü adı belirtilmedi' })
  readonly imageName!: string;
}
