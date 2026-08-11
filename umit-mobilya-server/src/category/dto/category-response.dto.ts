export class CategoryResponseDto {
  /** Mongo id, as a hex string. */
  _id!: string;

  /** Display name shown in the category list. */
  name!: string;

  /** ISO-8601 timestamp of when the category was added. */
  createdAt!: string;
}
