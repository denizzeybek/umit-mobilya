import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteImageDto {
  /** R2 object key of the gallery image to remove — a key, never a URL. */
  @IsString()
  @IsNotEmpty({ message: 'Silinecek görüntü adı belirtilmedi' })
  readonly imageName!: string;
}
